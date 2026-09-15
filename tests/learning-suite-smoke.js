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
  await page.waitForFunction(()=>window.__enhancementStackReady===true&&window.__learningToolsReady===true&&window.PracticalTools,{timeout:15000});

  await page.evaluate(()=>navigate('tools'));
  await page.waitForTimeout(120);
  const cards=await page.locator('.tool-card').count();
  if(cards!==15)throw new Error(`Expected 15 Learning Tools cards, found ${cards}`);

  const checks={
    1:'#pcPractical',2:'#guP',3:'#lbcP',4:'#tsP',5:'text=Apparatus & technique coverage',
    6:'#tmSave',7:'#eqP',8:'#pvP',9:'#rqP',10:'#aiP',11:'#msAnswer',12:'#bdP',13:'#epP',14:'#phP',15:'#pwaRefresh'
  };
  for(let id=1;id<=15;id++){
    await page.evaluate(id=>PracticalTools.open(id),id);
    await page.waitForTimeout(70);
    const body=page.locator('#toolBody');
    const text=(await body.innerText()).trim();
    if(!text||/could not load/i.test(text))throw new Error(`Tool ${id} failed to render`);
    const sel=checks[id];
    if(sel.startsWith('text=')){
      if(!text.includes(sel.slice(5)))throw new Error(`Tool ${id} missing expected content: ${sel}`);
    }else if(await page.locator(sel).count()!==1)throw new Error(`Tool ${id} missing expected control ${sel}`);
  }

  await page.evaluate(()=>navigate('practical',1));
  await page.waitForTimeout(180);
  for(const sel of ['[data-suite-btn="coach"]','[data-suite-btn="troubleshoot"]','[data-suite-btn="exam-mode"]','[data-suite-btn="variations"]','[data-suite-btn="checklist"]','[data-suite-btn="hints"]','[data-suite-graph]','[data-suite-quality]','[data-suite-apparatus]']){
    if(await page.locator(sel).count()!==1)throw new Error(`Practical integration button missing: ${sel}`);
  }

  await page.evaluate(()=>navigate('labbook'));
  await page.waitForTimeout(220);
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
  await page.waitForFunction(()=>window.__learningToolsReady===true,{timeout:15000});
  const controlled=await page.evaluate(()=>!!navigator.serviceWorker?.controller);
  if(!controlled)throw new Error('Service worker is not controlling the page after reload');

  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded',timeout:15000});
  await page.waitForFunction(()=>window.__enhancementStackReady===true&&window.__learningToolsReady===true,{timeout:15000});
  await page.evaluate(()=>navigate('tools'));
  await page.waitForTimeout(100);
  if(await page.locator('.tool-card').count()!==15)throw new Error('Offline reload lost Learning Tools');
  await context.setOffline(false);

  if(errors.length)throw new Error('Browser errors: '+errors.join(' | '));
  console.log('Learning Tools suite passed: 15 tools, workbench/Lab Book integration, Teacher Mode and offline reload.');
  await browser.close();
})().catch(e=>{console.error(e.stack||e);process.exit(1);});