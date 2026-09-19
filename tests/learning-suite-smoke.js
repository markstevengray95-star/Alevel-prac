'use strict';
const { chromium } = require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1365,height:900},serviceWorkers:'allow'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource.*fonts|ERR_INTERNET_DISCONNECTED/.test(m.text()))errors.push('console: '+m.text());});
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__enhancementStackReady===true&&window.__learningToolsReady===true&&window.PracticalTools&&window.__learningToolsCount===25,{timeout:20000});

  if(await page.locator('link[data-ui-polish-v3]').count()!==1)throw new Error('Polished UI stylesheet did not load');
  await page.evaluate(()=>navigate('tools'));
  await page.waitForTimeout(160);
  const cards=await page.locator('.tool-card').count();
  if(cards!==25)throw new Error(`Expected 25 Learning Tools cards, found ${cards}`);

  const checks={
    1:'#pcPractical',2:'#guP',3:'#lbcP',4:'#tsP',5:'text=Apparatus & technique coverage',
    6:'#tmSave',7:'#eqP',8:'#pvP',9:'#rqP',10:'#aiP',11:'#msAnswer',12:'#bdP',13:'#epP',14:'#phP',15:'#pwaRefresh',
    16:'#lmP',17:'#plP',18:'#imP',19:'#ucP',20:'#gcP',21:'#pbP',22:'#asP',23:'#edP',24:'#usP',25:'#pmP'
  };
  for(let id=1;id<=25;id++){
    await page.evaluate(id=>PracticalTools.open(id),id);
    await page.waitForTimeout(80);
    const body=page.locator('#toolBody');
    const text=(await body.innerText()).trim();
    if(!text||/could not load/i.test(text))throw new Error(`Tool ${id} failed to render`);
    const sel=checks[id];
    if(sel.startsWith('text=')){
      if(!text.includes(sel.slice(5)))throw new Error(`Tool ${id} missing expected content: ${sel}`);
    }else if(await page.locator(sel).count()!==1)throw new Error(`Tool ${id} missing expected control ${sel}`);
  }

  // Deep-dive controls should render their practical-specific visual structures.
  await page.evaluate(()=>PracticalTools.open(16,{practicalId:4}));await page.waitForTimeout(60);
  if(await page.locator('.measure-micrometer').count()!==1)throw new Error('Live Measurement micrometer visual missing');
  await page.evaluate(()=>PracticalTools.open(22,{practicalId:8}));await page.waitForTimeout(60);
  if(await page.locator('.setup-slot').count()!==4)throw new Error('Setup Challenge should show four apparatus roles');
  await page.evaluate(()=>PracticalTools.open(25,{practicalId:5}));await page.waitForTimeout(60);
  if(await page.locator('.mastery-card').count()!==10)throw new Error('Practical Mastery should show ten dimensions');

  // Imperfect mode must hook the real workbench recorder.
  await page.evaluate(()=>PracticalTools.open(18,{practicalId:1}));await page.waitForTimeout(50);
  const im=page.locator('#imEnable');if(!(await im.isChecked()))await im.check();
  await page.evaluate(()=>navigate('practical',1));await page.waitForTimeout(160);
  await page.evaluate(()=>record(1));await page.waitForTimeout(40);
  const imperfect=await page.evaluate(()=>{const d=state.data['1_0']||[];return d[d.length-1]?.imperfect===true;});
  if(!imperfect)throw new Error('Imperfect Experiment mode did not affect real Record reading path');
  await page.evaluate(()=>{state.learningTools.imperfect[1].enabled=false;save();});

  // Practical page should expose both the original and new direct-entry tools.
  await page.evaluate(()=>navigate('practical',1));await page.waitForTimeout(220);
  for(const sel of ['[data-suite-btn="coach"]','[data-suite-btn="troubleshoot"]','[data-suite-btn="exam-mode"]','[data-suite-btn="variations"]','[data-suite-btn="checklist"]','[data-suite-btn="hints"]','[data-suite-graph]','[data-suite-quality]','[data-suite-apparatus]','[data-suite-btn="live-measure"]','[data-suite-btn="planning"]','[data-suite-btn="imperfect"]','[data-suite-btn="uncertainty-calc"]','[data-suite-graph-choice]','[data-suite-btn="predict"]','[data-suite-btn="setup-challenge"]','[data-suite-btn="error-detective"]','[data-suite-btn="unknown-target"]','[data-suite-btn="mastery"]']){
    if(await page.locator(sel).count()!==1)throw new Error(`Practical integration button missing: ${sel}`);
  }

  await page.evaluate(()=>navigate('labbook'));
  await page.waitForTimeout(260);
  for(const sel of ['#lbModeMine','#lbModeExample','[data-suite-lab="checker"]','[data-suite-lab="checklist"]','[data-suite-lab="evidence"]']){
    if(await page.locator(sel).count()!==1)throw new Error(`Lab Book integration missing: ${sel}`);
  }

  await page.evaluate(()=>PracticalTools.open(6));
  await page.locator('#tmTask').fill('Smoke test class task');
  await page.locator('[data-tm-required="1"]').check();
  await page.locator('#tmExamples').check();
  await page.locator('#tmSave').click();
  await page.evaluate(()=>navigate('home'));
  await page.waitForTimeout(100);
  if(!(await page.locator('#teacherTaskBanner').innerText()).includes('Smoke test class task'))throw new Error('Teacher task banner failed');
  await page.evaluate(()=>PracticalTools.open(6));
  await page.locator('#tmClear').click();

  if(await page.locator('link[rel="manifest"]').count()!==1)throw new Error('PWA manifest link missing');
  await page.evaluate(async()=>{if('serviceWorker'in navigator)await navigator.serviceWorker.ready;});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__learningToolsReady===true&&window.__learningToolsCount===25,{timeout:20000});
  const controlled=await page.evaluate(()=>!!navigator.serviceWorker?.controller);
  if(!controlled)throw new Error('Service worker is not controlling the page after reload');

  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded',timeout:20000});
  await page.waitForFunction(()=>window.__enhancementStackReady===true&&window.__learningToolsReady===true&&window.__learningToolsCount===25,{timeout:20000});
  // A freshly activated service worker may replace the browsing context once.
  // Retry the tools navigation after that intentional controller handoff.
  let toolsOpened=false;
  for(let attempt=0;attempt<3&&!toolsOpened;attempt++){
    try{await page.evaluate(()=>navigate('tools'));toolsOpened=true;}
    catch(err){
      if(!/Execution context was destroyed|navigation/i.test(String(err)))throw err;
      await page.waitForLoadState('domcontentloaded');
      await page.waitForFunction(()=>window.__enhancementStackReady===true&&window.__learningToolsReady===true&&window.__learningToolsCount===25,{timeout:20000});
    }
  }
  if(!toolsOpened)throw new Error('Could not open Learning Tools after service-worker controller handoff');
  await page.waitForTimeout(120);
  if(await page.locator('.tool-card').count()!==25)throw new Error('Offline reload lost Learning Tools');
  if(await page.locator('link[data-ui-polish-v3]').count()!==1)throw new Error('Offline reload lost polished UI');
  await context.setOffline(false);

  if(errors.length)throw new Error('Browser errors: '+errors.join(' | '));
  console.log('Learning Tools suite passed: 25 tools, practical/Lab Book integration, imperfect recorder hook, mastery/setup visuals, Teacher Mode and offline reload.');
  await browser.close();
})().catch(e=>{console.error(e.stack||e);process.exit(1);});