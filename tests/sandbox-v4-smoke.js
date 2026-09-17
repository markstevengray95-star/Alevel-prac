'use strict';
const { chromium } = require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/i.test(m.text()))errors.push(`console: ${m.text()}`);});
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__enhancementStackReady===true&&window.__experimentalSandboxV4Ready===true&&window.__practicalToolkitV4Ready===true,{timeout:15000});

  // AQA alignment: sandbox metadata must mirror each practical's declared apparatus-technique coverage.
  const alignment=await page.evaluate(()=>practicals.map(p=>({id:p.id,declared:p.at,configured:window.__AQA_SANDBOX_V4.config[p.id]?.at||[]})));
  for(const row of alignment){
    if(!row.configured.length)throw new Error(`P${row.id}: missing sandbox AQA config`);
    const a=[...row.declared].sort().join('|'),b=[...row.configured].sort().join('|');
    if(a!==b)throw new Error(`P${row.id}: AT mismatch declared=${a} configured=${b}`);
  }

  // Three complete integration passes across every practical and every mode.
  for(let pass=1;pass<=3;pass++){
    for(let id=1;id<=12;id++){
      await page.evaluate(id=>navigate('practical',id),id);
      await page.waitForTimeout(35);
      const modes=await page.evaluate(()=>current.modes.length);
      for(let m=0;m<modes;m++){
        const result=await page.evaluate(m=>{
          currentMode=m;renderModeTabs();renderPractical();
          const api=window.__AQA_SANDBOX_V4;api.referenceSetup(false);api.render();
          return {v:api.validate(),items:api.config[current.id].items.length,at:api.config[current.id].at.slice()};
        },m);
        if(!result.v.ready||result.v.score!==100)throw new Error(`pass ${pass} P${id} mode ${m}: reference setup failed ${JSON.stringify(result.v)}`);
        await page.waitForTimeout(20);
        if(await page.locator('#experimentalSandboxV4').count()!==1)throw new Error(`pass ${pass} P${id}: sandbox missing`);
        if(await page.locator('#practicalToolkitV4').count()!==1)throw new Error(`pass ${pass} P${id}: toolkit missing`);
        const read=await page.locator('#readouts').innerText();
        if(/\b(?:NaN|undefined|Infinity|null)\b/i.test(read))throw new Error(`pass ${pass} P${id}: invalid readout ${read}`);
      }
    }
  }

  // Challenge gating: an empty build cannot record; a validated build can.
  await page.evaluate(()=>{navigate('practical',5);const api=window.__AQA_SANDBOX_V4;api.clearSetup();api.session().mode='challenge';api.render();});
  await page.waitForTimeout(50);
  if(!(await page.locator('#recordBtn').isDisabled()))throw new Error('Challenge mode did not gate Record on an incomplete setup');
  await page.evaluate(()=>{window.__AQA_SANDBOX_V4.referenceSetup(false);window.__AQA_SANDBOX_V4.render();});
  await page.waitForTimeout(30);
  if(await page.locator('#recordBtn').isDisabled())throw new Error('Validated challenge setup did not enable Record');

  // Hidden-fault mode must alter the measured model without changing normal/default behaviour.
  const fault=await page.evaluate(()=>{
    const api=window.__AQA_SANDBOX_V4,s=api.session();s.mode='challenge';s.fault=null;
    const base=theoretical().y;
    document.querySelector('#experimentalSandboxV4 [data-sb-fault]').click();
    const changed=theoretical().y,hasFault=!!s.fault;
    document.querySelector('#experimentalSandboxV4 [data-sb-diagnose]')?.click();
    return {base,changed,hasFault,revealed:s.faultRevealed};
  });
  if(!fault.hasFault||!fault.revealed||Math.abs(fault.base-fault.changed)<1e-12)throw new Error(`Fault mode failed: ${JSON.stringify(fault)}`);

  // Toolkit: model dataset, repeat/uncertainty analysis, graph and exam workflow.
  await page.locator('#practicalToolkitV4').evaluate(el=>el.open=true);
  await page.locator('[data-tk-tab="teacher"]').click();
  await page.locator('#tkDataset').click();
  await page.waitForTimeout(50);
  const rows=await page.locator('#resultsTable tbody tr').count();
  if(rows<18)throw new Error(`Teacher dataset expected 18 readings, got ${rows}`);
  await page.locator('[data-tk-tab="uncertainty"]').click();
  if(!(await page.locator('[data-tk-tab="uncertainty"]').evaluate(b=>b.classList.contains('active'))))throw new Error('Uncertainty tab did not become active');
  if(await page.locator('#tkBody .tk-uncertainty').count()!==1)throw new Error('Uncertainty panel did not render');
  const uncertainty=await page.locator('#tkBody .tk-uncertainty').innerText();
  for(const [name,re] of [['Gradient uncertainty',/Gradient\s+uncertainty/i],['Repeated sets',/Repeated\s+sets/i],['Power rule',/Power\s+rule/i]])if(!re.test(uncertainty))throw new Error(`Uncertainty engine missing ${name}: ${JSON.stringify(uncertainty)}`);
  await page.locator('[data-tk-tab="graph"]').click();
  if(await page.locator('#tkGraph').count()!==1)throw new Error('Graph analysis canvas missing');
  await page.locator('[data-tk-tab="challenge"]').click();
  await page.locator('#tkExamToggle').click();
  if(!(await page.locator('body').evaluate(b=>b.classList.contains('exam-mode-v4'))))throw new Error('Exam view did not activate');
  await page.locator('#tkExamToggle').click();

  if(errors.length)throw new Error(`Browser errors:\n${errors.join('\n')}`);
  console.log('Sandbox v4 smoke passed: AQA AT alignment, 3× all-practical/mode sweeps, challenge gating, fault mode, uncertainty/graph/exam/teacher tools.');
  await browser.close();
})().catch(e=>{console.error(e.stack||e);process.exit(1);});