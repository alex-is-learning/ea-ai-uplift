import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findChromium, renderFile } from './check-render.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const viewport = { width: 390, height: 1280 };
const placements = [
  { query: '?s=0000000&c=000', place: 3, title: 'Find out first', gap: false, absent: 'The guide from one advanced user to shared practice' },
  { query: '?s=5111111&c=111', place: 2, title: 'One clear gap', gap: false, focus: 'rules' },
  { query: '?s=5111141&c=111', place: 1, title: 'Accounts, no practice', gap: false },
  { query: '?s=3334333&c=113', place: 2, title: 'One clear gap', gap: false },
  { query: '?s=3334333&c=112', place: 3, title: 'Find out first', gap: true },
  { query: '?s=1331313&c=151', place: 2, title: 'One clear gap', gap: false, focus: 'rules' },
  { query: '?s=3333525&c=113', place: 2, title: 'One clear gap', gap: false, focus: 'rules' },
  { query: '?s=1530553&c=052', place: 4, title: 'One process everyone names', gap: false },
  { query: '?s=5314343&c=354', place: 4, title: 'One process everyone names', gap: false },
  { query: '?s=3333555&c=113', place: 5, title: 'Running it, keep it running', gap: false, contains: 'Production 5, Ownership 5, Rules 3 or more.' },
  { query: '?s=5011131&c=115', place: 2, title: 'One clear gap', gap: false },
  { query: '?s=5111031&c=115', place: 2, title: 'One clear gap', gap: false },
  { query: '?s=5555035&c=115', place: 2, title: 'One clear gap', gap: false, focus: 'rules' },
  { query: '?s=5334353&c=112', place: 3, title: 'Find out first', gap: true, contains: 'your estimate' },
  { query: '?s=3333333&c=115', place: 2, title: 'One clear gap', gap: false, contains: 'Nothing written by one person is used by another.', link: 'The guide from one advanced user to shared practice' },
  { query: '?s=3333333&c=315', place: 2, title: 'One clear gap', gap: false, contains: 'Once or twice. The guide from one advanced user to shared practice turns that into a habit.' },
  { query: '?s=3333333&c=515', place: 2, title: 'One clear gap', gap: false, contains: 'Prompts moved between people three or more times last month.' },
  { query: '?s=3333333&c=155', place: 4, title: 'One process everyone names', gap: false, link: 'Post an ask on Help wanted' },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

async function checkPlacements(browser, page) {
  const results = [];
  for (const test of placements) {
    const rendered = await renderFile(browser, page, viewport, {
      query: test.query,
      expression: inspection(`
        const result=document.getElementById('result');
        return {
          place:result&&result.dataset.place,
          gap:result&&result.dataset.gap,
          focus:result&&result.dataset.focus,
          text:result&&result.innerText,
          hollowDots:document.querySelectorAll('#chart .hollow-dot').length,
          hollowAxes:document.querySelectorAll('#chart .axis.hollow').length,
          chartKey:(document.getElementById('chart-key')||{}).textContent||'',
          chartText:(document.getElementById('chart')||{}).textContent||'',
          links:[...document.querySelectorAll('#result a')].map(item=>item.textContent.trim())
        };
      `),
    });
    const value = rendered.value || {};
    assert(value.place === String(test.place), `${test.query}: expected placement ${test.place}, got ${value.place || 'no data-place'}`);
    assert(value.gap === String(test.gap), `${test.query}: expected data-gap=${test.gap}, got ${value.gap || 'missing'}`);
    assert((value.text || '').includes(test.title), `${test.query}: result does not contain placement title "${test.title}"`);
    if (test.focus) assert(value.focus === test.focus, `${test.query}: expected focus ${test.focus}, got ${value.focus || 'missing'}`);
    if (test.contains) assert(`${value.text || ''} ${value.chartText || ''}`.includes(test.contains), `${test.query}: result is missing "${test.contains}"`);
    if (test.absent) assert(!`${value.text || ''} ${value.chartText || ''}`.includes(test.absent), `${test.query}: result must omit "${test.absent}"`);
    if (test.link) assert((value.links || []).some((link) => link.includes(test.link)), `${test.query}: result is missing route "${test.link}"`);
    if (test.query.includes('s=0000000')) {
      assert(value.hollowDots === 7 && value.hollowAxes === 7, `${test.query}: expected seven hollow dots and axes, got ${value.hollowDots} and ${value.hollowAxes}`);
      assert(value.chartKey.includes('Not known'), `${test.query}: chart key does not say Not known`);
    }
    results.push(test.query);
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
      const initialEmail=document.getElementById('email-result')&&document.getElementById('email-result').href;
      const initialResultText=document.getElementById('result').innerText;
      const initialNotesText=(document.getElementById('local-notes')||{}).textContent||'';
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
        email:initialEmail,
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
  for (const field of [value.href, value.share, value.email]) {
    assert(!decodeURIComponent(field || '').includes('grant reporting'), 'optional context escaped into a URL or email link');
    assert(!decodeURIComponent(field || '').includes('Observed in staff survey'), 'optional context escaped into a URL or email link');
  }
  assert((value.email || '').includes('scores=5354323352'), 'email link has the wrong scores');
  assert((value.email || '').includes('team=orchard-2026'), 'email link is missing the team code');
  assert((value.email || '').includes('kind=org'), 'email link is missing kind=org');
  assert(value.teamCode.length === 24 && /^[A-Za-z0-9-]+$/u.test(value.teamCode), `team code was not sanitised to 24 safe characters: ${value.teamCode || 'missing'}`);
  assert(value.teamLink === `https://eaaiuplift.com/assess/?t=${value.teamCode}`, `team link does not contain the sanitised code: ${value.teamLink || 'missing'}`);
  assert((value.resultText || '').includes('Results are counted, not attributed, and each person decides whether to send theirs.'), 'team-code privacy line is missing');
  return value;
}

async function checkRoundTrip(browser, page) {
  const rendered = await renderFile(browser, page, viewport, {
    query: '?s=5354323&c=352&t=orchard-2026',
    expression: inspection(`
      return {
        share:(document.getElementById('share')||{}).value||'',
        notesText:(document.getElementById('local-notes')||{}).textContent||'',
        resultText:(document.getElementById('result')||{}).innerText||''
      };
    `),
  });
  const value = rendered.value || {};
  assert(value.share.includes('?s=5354323&c=352&t=orchard-2026'), 'round-trip share URL changed the scores or team code');
  assert(!value.notesText.includes('grant reporting') && !value.resultText.includes('grant reporting'), 'optional context persisted after a URL reload');
}

async function checkIndividualRegression(browser, projectRoot) {
  const page = path.join(projectRoot, 'dist', 'assess', 'index.html');
  const rendered = await renderFile(browser, page, viewport, {
    query: '?s=0000000&c=000',
    expression: inspection(`return {text:(document.getElementById('result')||{}).innerText||''};`),
  });
  assert((rendered.value?.text || '').includes('That is a clear starting point, not a bad result.'), 'individual all-zero reassurance copy changed');
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
      return {restored,text:document.getElementById('result').innerText,href:location.href};
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
      }
    }
  }
}

export async function checkAssessOrg(projectRoot = root) {
  const page = path.join(projectRoot, 'dist', 'assess', 'org', 'index.html');
  if (!fs.existsSync(page)) throw new Error('dist/assess/org/index.html is missing; run node build.mjs first');
  const browser = findChromium();
  const placementCases = await checkPlacements(browser, page);
  await checkInteraction(browser, page);
  await checkRoundTrip(browser, page);
  await checkIndividualRegression(browser, projectRoot);
  await checkEditedNote(browser, page);
  await checkQuestionLayouts(browser, projectRoot);
  return { browser, placementCases: placementCases.length, interactionCases: 8 };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const result = await checkAssessOrg();
    console.log(`check-assess-org: ${result.placementCases} placement cases and ${result.interactionCases} interaction cases pass with ${result.browser}`);
  } catch (error) {
    console.error(`check-assess-org: ${error.message}`);
    process.exitCode = 1;
  }
}
