import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findChromium, renderFile } from './check-render.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const viewport = { width: 390, height: 844 };
const resultCases = [
  { mode: 'individual', query: '?s=1111111&c=111', strong: 'None yet', edge: '7 tied:', action: '../guides/first-useful-task/', contains: 'No score meets the strength threshold' },
  { mode: 'individual', query: '?s=0000000&c=000', strong: 'None yet', edge: 'None identified', action: '../guides/first-useful-task/', contains: 'Unknown means unfamiliar', absent: 'many pain points' },
  { mode: 'individual', query: '?s=1524353&c=515', strong: '2 tied: Context, Judgement', edge: 'Chat', action: '../guides/practitioner-pathway/' },
  { mode: 'individual', query: '?s=5555555&c=515', strong: '7 tied:', edge: 'None identified', action: '../guides/practitioner-pathway/', contains: 'No single area ranks above the rest' },
  { mode: 'org', query: '?s=1111111&c=111', strong: 'None yet', edge: '7 tied:', action: '../../people/' },
  { mode: 'org', query: '?s=0000000&c=000', strong: 'None yet', edge: 'None identified', action: '../../people/', contains: 'Unknown means that the answer needs exploration', absent: 'weak condition' },
  { mode: 'org', query: '?s=4532451&c=315', strong: '2 tied: Reach, Rules', edge: 'Ownership', action: '../../people/' },
  { mode: 'org', query: '?s=5555555&c=515', strong: '7 tied:', edge: 'None identified', action: '../../guides/practitioner-pathway/' },
  { mode: 'org', query: '?s=3334333&c=112', action: '../../people/', contains: 'Limited sight of staff practice' },
  { mode: 'org', query: '?s=3333333&c=155', action: '../../asks/', contains: 'Ask for help with one process' },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function decodeSnapshotValue(url) {
  const value = new URL(url).searchParams.get('r') || '';
  const padded = value.replace(/-/gu, '+').replace(/_/gu, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
}

function inspection(expression) {
  return `(async()=>{
    const deadline=Date.now()+6000;
    while(Date.now()<deadline){
      const result=document.getElementById('result');
      if(result&&!result.classList.contains('hidden')&&result.dataset.place)break;
      await new Promise(resolve=>setTimeout(resolve,50));
    }
    ${expression}
  })()`;
}

async function checkResults(browser, projectRoot) {
  const results = [];
  for (const test of resultCases) {
    const page = path.join(projectRoot, 'dist', 'assess', ...(test.mode === 'org' ? ['org', 'index.html'] : ['index.html']));
    const rendered = await renderFile(browser, page, viewport, {
      query: test.query,
      expression: inspection(`
        const result=document.getElementById('result');
        return {
          place:result&&result.dataset.place,
          gap:result&&result.dataset.gap,
          focus:result&&result.dataset.focus,
          text:result&&result.textContent,
          visibleText:result&&result.innerText,
          strong:(result&&result.querySelector('h2.strong')||{}).textContent||'',
          edge:(result&&result.querySelector('h2.edge')||{}).textContent||'',
          action:(result&&result.querySelector('#primary-action')||{}).getAttribute&&result.querySelector('#primary-action').getAttribute('href'),
          primaryCount:result&&result.querySelectorAll('.result-primary').length,
          analysisOpen:result&&result.querySelector('.result-analysis').open,
          emailLinks:result&&result.querySelectorAll('a[href*="tally"],a[href^="mailto:"]').length,
          hollowDots:document.querySelectorAll('#chart .hollow-dot').length,
          hollowAxes:document.querySelectorAll('#chart .axis.hollow').length,
          chartKey:(document.getElementById('chart-key')||{}).textContent||'',
          share:(document.getElementById('share')||{}).value||'',
          version:(document.querySelector('.result-meta')||{}).textContent||''
        };
      `),
    });
    const value = rendered.value || {};
    if (test.strong) assert((value.strong || '').includes(test.strong), `${test.mode} ${test.query}: expected strength "${test.strong}", got "${value.strong || 'missing'}"`);
    if (test.edge) assert((value.edge || '').includes(test.edge), `${test.mode} ${test.query}: expected edge "${test.edge}", got "${value.edge || 'missing'}"`);
    assert(value.action === test.action, `${test.mode} ${test.query}: expected primary route ${test.action}, got ${value.action || 'missing'}`);
    assert(value.primaryCount === 1 && value.analysisOpen === false, `${test.mode} ${test.query}: primary action or secondary analysis hierarchy is wrong`);
    assert(value.emailLinks === 0 && !/email me|results are counted/iu.test(value.text || ''), `${test.mode} ${test.query}: an email or automatic collection promise remains`);
    assert((value.share || '').includes(`${test.query}&r=`), `${test.mode} ${test.query}: share URL did not preserve the old scores before the snapshot`);
    assert((value.version || '').includes('assessment version 0.2'), `${test.mode} ${test.query}: result version is missing`);
    if (test.contains) assert((value.text || '').includes(test.contains), `${test.mode} ${test.query}: result is missing "${test.contains}"`);
    if (test.absent) assert(!(value.text || '').toLowerCase().includes(test.absent), `${test.mode} ${test.query}: result must omit "${test.absent}"`);
    if (test.query.includes('s=0000000')) {
      assert(value.hollowDots === 7 && value.hollowAxes === 7, `${test.query}: expected seven hollow dots and axes, got ${value.hollowDots} and ${value.hollowAxes}`);
      assert(test.mode === 'org' ? value.chartKey.includes('Not known') : value.chartKey.includes('have not met'), `${test.mode} ${test.query}: chart key does not explain unknown scores`);
    }
    results.push(`${test.mode}${test.query}`);
  }
  return results;
}

async function checkInteraction(browser, page) {
  const answers = [5, 3, 5, 4, 3, 2, 3, 3, 5, 2];
  const rendered = await renderFile(browser, page, viewport, {
    query: '?t=orchard-2026',
    beforeLoad: `
      try {
        Object.defineProperty(navigator,'clipboard',{value:{writeText:function(value){window.__copied=value;return Promise.resolve();}},configurable:true});
      } catch (error) {}
      window.__savedBlobs=[];
      URL.createObjectURL=function(blob){window.__savedBlobs.push(blob);return 'blob:assessment-test';};
      URL.revokeObjectURL=function(){};
      HTMLAnchorElement.prototype.click=function(){window.__downloadName=this.download;};
    `,
    expression: `(async()=>{
      const answerValues=${JSON.stringify(answers)};
      const waitFor=async predicate=>{const deadline=Date.now()+6000;while(Date.now()<deadline){const value=predicate();if(value)return value;await new Promise(resolve=>setTimeout(resolve,40));}throw new Error('timed out waiting for assessment client');};
      const clickAnswer=async value=>{
        const before=(document.getElementById('qcount')||{}).textContent;
        const button=[...document.querySelectorAll('#answers button.ans')].find(item=>item.dataset.value===String(value));
        if(!button)throw new Error('answer '+value+' is missing at '+before);
        button.click();
        await waitFor(()=>document.getElementById('qcount').textContent!==before||!document.getElementById('result').classList.contains('hidden'));
      };
      const intro=document.body.innerText;
      const data=JSON.parse(document.getElementById('assess-data').textContent);
      const seen=[];
      for(let index=0;index<data.questions.length;index+=1){
        await waitFor(()=>document.getElementById('qstatement').textContent.includes(data.questions[index].statement));
        const labels=[...document.querySelectorAll('#answers button.ans')].map(button=>button.textContent.replace(/^\\s*\\d+\\s*·?\\s*/u,'').trim());
        const expected=data.questions[index].answers.slice();
        if(data.questions[index].notSureFirst)expected.sort((a,b)=>a[0]===0?-1:b[0]===0?1:0);
        const expectedLabels=expected.map(answer=>answer[1]);
        if(JSON.stringify(labels)!==JSON.stringify(expectedLabels))throw new Error('question '+(index+1)+' answer labels differ from embedded data: '+JSON.stringify(labels));
        if((labels[0]==='Not sure')!==(index===3))throw new Error('Not sure ordering is wrong on question '+(index+1));
        const help=(document.getElementById('tie-rule')||{}).textContent||'';
        if(data.questions[index].answerKind==='document'&&!help.toLowerCase().includes('lowest rung'))throw new Error('document tie rule is missing on question '+(index+1));
        if(data.questions[index].answerKind==='staged'&&!help.toLowerCase().includes('highest rung'))throw new Error('staged tie rule is missing on question '+(index+1));
        if(index===6&&(document.getElementById('question-note')||{}).textContent!=='If there are two such people, answer for the one whose role is closer to it.')throw new Error('Q7 two-person instruction is missing');
        const renderedStatement=document.getElementById('qstatement').textContent;
        if(renderedStatement!==data.questions[index].statement)throw new Error('question '+(index+1)+' adds punctuation around its statement');
        const context=document.getElementById('context-input');
        if(!context||context.maxLength!==240)throw new Error('question '+(index+1)+' is missing its optional context input');
        if(index===3||index===8){
          context.value=index===3?'Observed in staff survey':'grant reporting';
          context.dispatchEvent(new Event('input',{bubbles:true}));
        }
        seen.push({statement:renderedStatement,labels});
        await clickAnswer(answerValues[index]);
      }
      await waitFor(()=>!document.getElementById('result').classList.contains('hidden'));
      const share=document.getElementById('share');
      const copy=document.getElementById('copy');
      copy.click();
      await waitFor(()=>copy.textContent.includes('Copied'));
      const initialHref=location.href;
      const initialShare=share&&share.value;
      const initialCopied=window.__copied;
      const initialResultText=document.getElementById('result').innerText;
      const initialNotesText=(document.getElementById('local-notes')||{}).textContent||'';
      document.getElementById('save-result').click();
      await waitFor(()=>window.__savedBlobs.length===1);
      const withoutNotes=await window.__savedBlobs[0].text();
      document.getElementById('include-notes').click();
      document.getElementById('save-result').click();
      await waitFor(()=>window.__savedBlobs.length===2);
      const withNotes=await window.__savedBlobs[1].text();
      const teamInput=document.getElementById('team-code');
      if(teamInput){
        teamInput.value='orchard_2026!!abcdefghijklmnopqrstuvwxyz';
        teamInput.dispatchEvent(new Event('input',{bubbles:true}));
      }
      return {
        intro,
        seen,
        href:initialHref,
        share:initialShare,
        copied:initialCopied,
        resultText:initialResultText,
        notesText:initialNotesText,
        withoutNotes,
        withNotes,
        downloadName:window.__downloadName,
        primary:(document.getElementById('primary-action')||{}).getAttribute&&document.getElementById('primary-action').getAttribute('href'),
        teamLink:(document.getElementById('team-link')||{}).value||(document.getElementById('team-link')||{}).textContent||'',
        teamCode:(document.getElementById('team-code')||{}).value||''
      };
    })()`,
  });
  const value = rendered.value || {};
  for (const phrase of [
    'paid staff and long-term contractors',
    'not volunteers or trustees',
    'not touched in the last twelve months',
    'regular or power users',
    'occasional users use it less often',
  ]) assert((value.intro || '').toLowerCase().includes(phrase), `intro definition is missing: ${phrase}`);
  assert(value.seen?.[0]?.statement?.includes('separate paid AI plan'), 'Q1 no longer excludes bundled office-suite AI');
  assert(value.seen?.[1]?.statement?.includes('outside Google Workspace or Microsoft 365'), 'Q2 no longer excludes built-in office-suite AI');
  assert(JSON.stringify(value.seen?.[0]?.labels)===JSON.stringify(['0%','1–33%','34–66%','67–99%','100%','Not sure']), 'Q1 percentage labels are wrong');
  assert(value.seen?.[3]?.labels?.[1]?.startsWith('None:'), 'Q4 staff-mix ladder is wrong');
  assert(value.seen?.[9]?.labels?.[0]==='Mostly a guess based on the most visible users', 'Q10 confidence ladder is wrong');
  assert(value.seen?.length === 10, `interaction exercised ${value.seen?.length || 0} questions, not 10`);
  assert((value.href || '').includes('?s=5354323&c=352&t=orchard-2026'), `result URL has the wrong scores: ${value.href || 'missing'}`);
  assert(value.share === value.href, 'share field does not match the result URL');
  assert(value.copied === value.share, 'Copy link did not copy the share URL');
  assert((value.notesText || '').includes('Observed in staff survey'), 'Q4 context is missing from the local result');
  assert((value.notesText || '').includes('grant reporting'), 'Q9 context is missing from the local result');
  for (const field of [value.href, value.share]) {
    assert(!decodeURIComponent(field || '').includes('grant reporting'), 'optional context escaped into a URL or email link');
    assert(!decodeURIComponent(field || '').includes('Observed in staff survey'), 'optional context escaped into a URL or email link');
  }
  const withoutNotes = JSON.parse(value.withoutNotes || '{}');
  const withNotes = JSON.parse(value.withNotes || '{}');
  assert(withoutNotes.scores?.spokes === '5354323' && withoutNotes.scores?.connectives === '352', 'saved file has the wrong scores');
  assert(withoutNotes.answers?.length === 10 && withoutNotes.answers.every((answer) => answer.label), 'saved file is missing answer labels');
  assert(/^\d{4}-\d{2}-\d{2}$/u.test(withoutNotes.date || '') && withoutNotes.version === '0.2', 'saved file is missing the date or version');
  assert(withoutNotes.nextAction?.label && withoutNotes.nextAction?.href === '../../people/', 'saved file has the wrong next action');
  assert(!('notes' in withoutNotes), 'saved file included notes without explicit selection');
  assert(withNotes.notes?.length === 2 && withNotes.notes.some((item) => item.note === 'grant reporting'), 'selected notes are missing from the saved file');
  assert((value.downloadName || '').startsWith('ea-ai-uplift-organisation-assessment-'), 'saved file name is wrong');
  assert(value.primary === '../../people/', `mixed organisation result has the wrong primary action: ${value.primary || 'missing'}`);
  assert(value.teamCode.length === 24 && /^[A-Za-z0-9-]+$/u.test(value.teamCode), `team code was not sanitised to 24 safe characters: ${value.teamCode || 'missing'}`);
  assert(value.teamLink === `https://eaaiuplift.com/assess/?t=${value.teamCode}`, `team link does not contain the sanitised code: ${value.teamLink || 'missing'}`);
  assert((value.resultText || '').includes('does not collect or combine their results'), 'team-code local-only line is missing');
  assert(!/email me|results are counted/iu.test(value.resultText || ''), 'team result contains an unverified fulfilment claim');
  return value;
}

async function checkRoundTrip(browser, page) {
  const rendered = await renderFile(browser, page, viewport, {
    query: '?s=5354323&c=352&t=orchard-2026',
    expression: inspection(`
      return {
        share:(document.getElementById('share')||{}).value||'',
        notesText:(document.getElementById('local-notes')||{}).textContent||'',
        resultText:(document.getElementById('result')||{}).textContent||'',
        primary:(document.getElementById('primary-action')||{}).getAttribute&&document.getElementById('primary-action').getAttribute('href'),
        meta:(document.querySelector('.result-meta')||{}).textContent||''
      };
    `),
  });
  const value = rendered.value || {};
  assert(value.share.includes('?s=5354323&c=352&t=orchard-2026'), 'round-trip share URL changed the scores or team code');
  const snapshot = decodeSnapshotValue(value.share);
  assert(snapshot.scores.spokes === '5354323' && snapshot.scores.connectives === '352', 'share snapshot changed the scores');
  assert(snapshot.answers.length === 10 && snapshot.answers.every((answer) => answer.label), 'share snapshot is missing answer labels');
  assert(snapshot.version === '0.2' && /^\d{4}-\d{2}-\d{2}$/u.test(snapshot.date), 'share snapshot is missing the date or version');
  assert(snapshot.nextAction.href === '../../people/' && value.primary === '../../people/', 'share snapshot has the wrong next action');
  assert(!value.notesText.includes('grant reporting') && !value.resultText.includes('grant reporting'), 'optional context persisted after a URL reload');
  const reopened = await renderFile(browser, page, viewport, {
    query: new URL(value.share).search,
    expression: inspection(`return {
      share:(document.getElementById('share')||{}).value||'',
      primary:(document.getElementById('primary-action')||{}).getAttribute&&document.getElementById('primary-action').getAttribute('href'),
      meta:(document.querySelector('.result-meta')||{}).textContent||''
    };`),
  });
  assert(reopened.value?.share === value.share, 'reopened share link changed its saved snapshot');
  assert(reopened.value?.primary === snapshot.nextAction.href, 'reopened share link changed its next action');
  assert((reopened.value?.meta || '').includes(snapshot.date) && (reopened.value?.meta || '').includes(snapshot.version), 'reopened share link changed its date or version');
}

async function checkIndividualRegression(browser, projectRoot) {
  const page = path.join(projectRoot, 'dist', 'assess', 'index.html');
  const rendered = await renderFile(browser, page, viewport, {
    query: '?s=0000000&c=000',
    expression: inspection(`return {text:(document.getElementById('result')||{}).textContent||'',strong:(document.querySelector('h2.strong')||{}).textContent||'',edge:(document.querySelector('h2.edge')||{}).textContent||''};`),
  });
  assert(rendered.value?.strong === 'None yet' && rendered.value?.edge === 'None identified', 'individual all-unknown result invented a strength or edge');
  assert((rendered.value?.text || '').includes('Unknown means unfamiliar'), 'individual all-unknown result does not explain the unknown state');
}

async function checkEditedNote(browser, page) {
  const rendered = await renderFile(browser, page, viewport, {
    expression: `(async()=>{
      const waitFor=async predicate=>{const deadline=Date.now()+6000;while(Date.now()<deadline){const value=predicate();if(value)return value;await new Promise(resolve=>setTimeout(resolve,40));}throw new Error('timed out waiting for note-edit case');};
      const answer=async value=>{const before=document.getElementById('qcount').textContent;const button=[...document.querySelectorAll('#answers button.ans')].find(item=>item.dataset.value===String(value));button.click();await waitFor(()=>document.getElementById('qcount').textContent!==before||!document.getElementById('result').classList.contains('hidden'));};
      for(const value of [5,3,5,4,3,2,3,3])await answer(value);
      const context=document.getElementById('context-input');
      context.value='First note';
      context.dispatchEvent(new Event('input',{bubbles:true}));
      await answer(1);
      await waitFor(()=>document.getElementById('qcount').textContent.includes('10 of 10'));
      document.getElementById('qback').click();
      await waitFor(()=>document.getElementById('qcount').textContent.includes('9 of 10'));
      const restored=document.getElementById('context-input').value;
      document.getElementById('context-input').value='Edited note';
      document.getElementById('context-input').dispatchEvent(new Event('input',{bubbles:true}));
      await answer(1);
      await answer(4);
      await waitFor(()=>!document.getElementById('result').classList.contains('hidden'));
      return {restored,text:document.getElementById('result').textContent,href:location.href};
    })()`,
  });
  assert(rendered.value?.restored === 'First note', 'Back did not restore the optional context');
  assert((rendered.value?.text || '').includes('Edited note'), 'the edited context is missing from the result');
  assert(!(rendered.value?.text || '').includes('First note'), 'the result kept the replaced context');
  assert((rendered.value?.href || '').includes('&c=314'), 'note-edit case has the wrong connective scores');
}

async function checkQuestionLayouts(browser, projectRoot) {
  const pages = [
    path.join(projectRoot, 'dist', 'assess', 'index.html'),
    path.join(projectRoot, 'dist', 'assess', 'org', 'index.html'),
  ];
  const viewports = [
    { width: 1024, height: 768 },
    { width: 1280, height: 720 },
    { width: 1440, height: 800 },
    { width: 390, height: 844 },
  ];
  for (const assessment of pages) for (const currentViewport of viewports) {
    const rendered = await renderFile(browser, assessment, currentViewport, {
      expression: `(async()=>{
        const results=[];
        const waitFor=async predicate=>{const deadline=Date.now()+3000;while(Date.now()<deadline){const value=predicate();if(value)return value;await new Promise(resolve=>setTimeout(resolve,20));}throw new Error('timed out waiting for question layout');};
        for(let index=0;index<10;index+=1){
          const card=document.getElementById('qcard').getBoundingClientRect();
          const overview=document.querySelector('.assess-overview').getBoundingClientRect();
          const input=document.getElementById('context-input');
          const buttons=[...document.querySelectorAll('#answers button.ans')];
          input.focus();
          results.push({
            question:index+1,
            documentHeight:document.documentElement.scrollHeight,
            viewportHeight:document.documentElement.clientHeight,
            documentWidth:document.documentElement.scrollWidth,
            viewportWidth:document.documentElement.clientWidth,
            cardBottom:card.bottom,
            questionBeforeOverview:card.top<overview.top,
            inputFont:parseFloat(getComputedStyle(input).fontSize),
            buttonFont:Math.min(...buttons.map(button=>parseFloat(getComputedStyle(button).fontSize))),
            inputFocused:document.activeElement===input,
            nativeButtons:buttons.every(button=>button.tagName==='BUTTON'&&button.tabIndex===0)
          });
          if(index===9)break;
          const before=document.getElementById('qcount').textContent;
          buttons[0].click();
          await waitFor(()=>document.getElementById('qcount').textContent!==before);
        }
        return results;
      })()`,
    });
    for (const result of rendered.value || []) {
      const label = `${path.basename(path.dirname(assessment))} Q${result.question} at ${currentViewport.width}×${currentViewport.height}`;
      assert(result.documentWidth <= result.viewportWidth, `${label}: document is wider than the viewport`);
      assert(result.inputFocused && result.nativeButtons, `${label}: native keyboard controls are not usable`);
      if (currentViewport.width > 1000) {
        assert(result.documentHeight <= result.viewportHeight, `${label}: document scrollbar is present`);
        assert(result.cardBottom <= result.viewportHeight, `${label}: question card ends below the viewport`);
      } else {
        assert(result.inputFont >= 16 && result.buttonFont >= 16, `${label}: control text is smaller than 16px`);
        assert(result.questionBeforeOverview, `${label}: the question does not appear before the visual overview`);
      }
    }
  }
}

export async function checkAssessOrg(projectRoot = root) {
  const page = path.join(projectRoot, 'dist', 'assess', 'org', 'index.html');
  if (!fs.existsSync(page)) throw new Error('dist/assess/org/index.html is missing; run node build.mjs first');
  const browser = findChromium();
  const checkedResults = await checkResults(browser, projectRoot);
  await checkInteraction(browser, page);
  await checkRoundTrip(browser, page);
  await checkIndividualRegression(browser, projectRoot);
  await checkEditedNote(browser, page);
  await checkQuestionLayouts(browser, projectRoot);
  return { browser, resultCases: checkedResults.length, interactionCases: 8 };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const result = await checkAssessOrg();
    console.log(`check-assess-org: ${result.resultCases} result cases and ${result.interactionCases} interaction cases pass with ${result.browser}`);
  } catch (error) {
    console.error(`check-assess-org: ${error.message}`);
    process.exitCode = 1;
  }
}
