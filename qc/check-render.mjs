import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkOutput } from './check-output.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const viewports = [
  { width: 390, height: 1280 },
  { width: 1280, height: 1280 },
];

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function commandWorks(candidate) {
  const result = spawnSync(candidate, ['--version'], { stdio: 'ignore' });
  return !result.error && result.status === 0;
}

export function findChromium() {
  if (process.env.CHROME_BIN) {
    if (!commandWorks(process.env.CHROME_BIN)) throw new Error(`CHROME_BIN is not executable: ${process.env.CHROME_BIN}`);
    return process.env.CHROME_BIN;
  }
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    'google-chrome',
    'chromium',
    'chromium-browser',
  ];
  for (const candidate of candidates) if (commandWorks(candidate)) return candidate;
  throw new Error('No Chromium executable found. Set CHROME_BIN to a Chromium or Chrome executable.');
}

function readJson(url, timeout = 4000) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, { timeout }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on('timeout', () => request.destroy(new Error('CDP request timed out')));
    request.on('error', reject);
  });
}

async function waitForPageTarget(port) {
  const deadline = Date.now() + 30_000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const targets = await readJson(`http://127.0.0.1:${port}/json/list`);
      const target = targets.find((item) => item.type === 'page');
      if (target?.webSocketDebuggerUrl) return target;
      lastError = new Error('Chromium supplied no page target');
    } catch (error) {
      lastError = error;
    }
    await wait(150);
  }
  throw new Error(`Chromium DevTools target did not become ready within 30 seconds${lastError ? `: ${lastError.message}` : ''}`);
}

async function waitForDevTools(profile) {
  const activePort = path.join(profile, 'DevToolsActivePort');
  for (let attempt = 0; attempt < 300; attempt += 1) {
    if (fs.existsSync(activePort)) {
      const [port] = fs.readFileSync(activePort, 'utf8').trim().split('\n');
      if (port) return port;
    }
    await wait(100);
  }
  throw new Error('Chromium did not open its DevTools endpoint');
}

async function removeProfile(profile) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      fs.rmSync(profile, { recursive: true, force: true });
      return;
    } catch (error) {
      if (!['EBUSY', 'ENOTEMPTY', 'EPERM'].includes(error.code)) throw error;
      await wait(100);
    }
  }
}

async function openCdp(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  const pending = new Map();
  const events = new Map();
  let nextId = 1;
  const closed = new Promise((resolve) => socket.addEventListener('close', resolve));
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', () => reject(new Error('Cannot connect to Chromium DevTools')), { once: true });
  });
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id) {
      const entry = pending.get(message.id);
      if (!entry) return;
      pending.delete(message.id);
      if (message.error) entry.reject(new Error(message.error.message));
      else entry.resolve(message.result || {});
      return;
    }
    for (const listener of events.get(message.method) || []) listener(message.params || {});
  });
  return {
    send(method, params = {}) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    on(method, listener) {
      const listeners = events.get(method) || [];
      listeners.push(listener);
      events.set(method, listeners);
    },
    async close() {
      socket.close();
      await Promise.race([closed, wait(1000)]);
    },
  };
}

async function renderFile(browser, pagePath, viewport) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ea-ai-uplift-chrome-'));
  const child = spawn(browser, [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-sync',
    '--disable-features=MediaRouter,OptimizationHints,Translate,AutofillServerCommunication',
    '--force-color-profile=srgb',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr = `${stderr}${chunk}`.slice(-3000); });
  let cdp;
  try {
    const port = await waitForDevTools(profile);
    const target = await waitForPageTarget(port);
    cdp = await openCdp(target.webSocketDebuggerUrl);
    const remoteResponses = [];
    cdp.on('Network.responseReceived', ({ response }) => {
      if (/^https?:/iu.test(response.url)) remoteResponses.push(response.url);
    });
    cdp.on('Fetch.requestPaused', ({ requestId }) => {
      cdp.send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' }).catch(() => {});
    });
    await cdp.send('Page.enable');
    await cdp.send('Network.enable');
    await cdp.send('Fetch.enable', { patterns: [{ urlPattern: 'http://*' }, { urlPattern: 'https://*' }] });
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: false,
      screenWidth: viewport.width,
      screenHeight: viewport.height,
    });
    await cdp.send('Page.navigate', { url: pathToFileURL(pagePath).href });
    await wait(500);
    const state = await cdp.send('Runtime.evaluate', {
      expression: '(async()=>{const invalidImages=[];for(const image of document.images){try{await image.decode();const bitmap=await createImageBitmap(image);if(bitmap.width===0||bitmap.height===0)invalidImages.push(image.src);bitmap.close()}catch{invalidImages.push(image.src)}}return {width:document.documentElement.scrollWidth,viewport:window.innerWidth,ready:document.readyState,text:document.body.innerText.length,invalidImages}})()',
      awaitPromise: true,
      returnByValue: true,
    });
    const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const image = Buffer.from(screenshot.data, 'base64');
    const width = image.readUInt32BE(16);
    const height = image.readUInt32BE(20);
    if (remoteResponses.length) throw new Error(`HTTP(S) response reached the renderer: ${remoteResponses.join(', ')}`);
    if (state.result.value.viewport !== viewport.width || state.result.value.width > viewport.width || state.result.value.ready !== 'complete' || state.result.value.text < 20) throw new Error(`invalid ${viewport.width}x${viewport.height} render state`);
    if (state.result.value.invalidImages.length) throw new Error(`images failed to decode: ${state.result.value.invalidImages.join(', ')}`);
    if (width !== viewport.width || height !== viewport.height) throw new Error(`screenshot is ${width}x${height}, not ${viewport.width}x${viewport.height}`);
    return { pagePath, width, height };
  } catch (error) {
    throw new Error(`${error.message}${stderr ? ` (${stderr.trim()})` : ''}`);
  } finally {
    if (cdp) await cdp.close();
    if (!child.killed) child.kill('SIGTERM');
    if (child.exitCode === null) await Promise.race([new Promise((resolve) => child.once('exit', resolve)), wait(5000)]);
    if (child.exitCode === null) {
      child.kill('SIGKILL');
      await Promise.race([new Promise((resolve) => child.once('exit', resolve)), wait(1000)]);
    }
    await removeProfile(profile);
  }
}

export async function checkRender(projectRoot = root) {
  const output = checkOutput(projectRoot);
  const browser = findChromium();
  const pages = [path.join(output.dist, 'index.html')];
  for (const name of fs.readdirSync(path.join(output.dist, 'people')).sort()) pages.push(path.join(output.dist, 'people', name, 'index.html'));
  const results = [];
  for (const page of pages) for (const viewport of viewports) results.push(await renderFile(browser, page, viewport));
  return { browser, results };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const result = await checkRender();
    console.log(`check-render: ${result.results.length} renders at 390x1280 and 1280x1280 with ${result.browser}`);
  } catch (error) {
    console.error(`check-render: ${error.message}`);
    process.exitCode = 1;
  }
}
