'use strict';
const { chromium } = require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];
  const invalidValue=/\b(?:NaN|undefined|Infinity|null)\b/i;
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/i.test(m.text()))errors.push(`console: ${m.text()}`);});
  page.on('dialog',async d=>{errors.push(`unexpected dialog: ${d.message()}`);await d.dismiss();});

  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.navigate==='function'&&typeof window.theoretical==='function');
  await page.waitForFunction(()=>typeof window.AQA_SETUP_GUIDE==='object'&&typeof window.renderLabBook==='function',{timeout:8000});
  await page.waitForTimeout(250);

  for(let id=1;id<=12;id++){
    await page.evaluate(id=>navigate('practical',id),id);
    await page.waitForTimeout(120);
    const modeCount=await page.locator('#modeTabs button').count();
    if(modeCount<1)throw new Error(`P${id}: no modes rendered`);

    for(let mode=0;mode<modeCount;mode++){
      await page.locator('#modeTabs button').nth(mode).click();
      await page.waitForTimeout(80);
      if(await page.locator('#scene svg').count()!==1)throw new Error(`P${id} mode ${mode}: scene SVG missing`);
      if(await page.locator('#controls input[type=range]').count()<1)throw new Error(`P${id} mode ${mode}: controls missing`);
      if(await page.locator('.aqa-setup-card').count()!==1)throw new Error(`P${id} mode ${mode}: AQA setup check missing`);

      await page.locator('#runBtn').click();
      await page.waitForTimeout(id===3?700:280);

      const readout=await page.locator('#readouts').innerText();
      if(invalidValue.test(readout))throw new Error(`P${id} mode ${mode}: invalid readout: ${readout}`);
      const sceneText=await page.locator('#scene').innerText().catch(()=> '');
      if(invalidValue.test(sceneText))throw new Error(`P${id} mode ${mode}: invalid scene text: ${sceneText}`);

      const before=await page.locator('#resultsTable tbody tr').count().catch(()=>0);
      await page.locator('#recordBtn').click();
      await page.waitForTimeout(50);
      const after=await page.locator('#resultsTable tbody tr').count().catch(()=>0);
      if(after<=before)throw new Error(`P${id} mode ${mode}: recording did not append a row`);

      if(await page.locator('#pauseBtn').count())await page.locator('#pauseBtn').click();
      await page.locator('#resetBtn').click();
      await page.waitForTimeout(30);
    }
  }

  // Boyle's law must use the AQA vertical syringe + hanging masses arrangement.
  await page.evaluate(()=>navigate('practical',8));
  await page.waitForTimeout(180);
  if(await page.locator('#scene [data-part="Gas syringe"]').count()!==1)throw new Error('P8 Boyle gas syringe missing');
  if(await page.locator('#scene [data-part="Mass holder + slotted masses"]').count()!==1)throw new Error('P8 Boyle hanging mass holder/masses missing');
  if(await page.locator('#scene [data-part="String loop"]').count()!==1)throw new Error('P8 Boyle plunger-to-mass string loop missing');
  if(await page.locator('#p8Seal').count()!==1)throw new Error('P8 Boyle rubber-seal diameter measurement control missing');
  const boyle=await page.evaluate(()=>{
    const vals=getVals();
    vals[0]=200;const light=theoretical();
    vals[0]=1000;const heavy=theoretical();
    vals[0]=400;renderControls();renderScene();updateReadouts();
    return {pLight:light.x,pHeavy:heavy.x,invVLight:light.y,invVHeavy:heavy.y};
  });
  if(!(boyle.pHeavy<boyle.pLight))throw new Error(`P8 Boyle pressure should decrease with hanging mass: ${JSON.stringify(boyle)}`);
  if(!(boyle.invVHeavy<boyle.invVLight))throw new Error(`P8 Boyle volume should increase as hanging load lowers pressure: ${JSON.stringify(boyle)}`);

  // Check the hands-on layer is present after practical rendering.
  await page.evaluate(()=>navigate('practical',5));
  await page.waitForTimeout(250);
  if(await page.locator('#handsTool').count()!==1)throw new Error('Hands-on toolbar failed to load');
  if(await page.locator('#scene [data-part="Sliding contact"]').count()!==1)throw new Error('P5 draggable sliding contact missing');

  // Check circuit builder loads and has its expected challenge slots.
  await page.evaluate(()=>navigate('circuit'));
  await page.waitForTimeout(100);
  if(await page.locator('.builder-shell').count()!==1)throw new Error('Circuit builder failed to load');
  if(await page.locator('.build-slot').count()<5)throw new Error('Circuit builder slots missing');

  // Check the new AQA-guided Lab Book.
  await page.evaluate(()=>navigate('labbook'));
  await page.waitForTimeout(160);
  if(await page.locator('#view-labbook.active').count()!==1)throw new Error('Lab book view did not open');
  if(await page.locator('#labBookRoot .lab-step-card').count()!==1)throw new Error('Lab book step card missing');
  if(await page.locator('[data-lab-step]').count()!==9)throw new Error('Lab book should have 9 guided steps');
  if(await page.locator('#labPracticalSelect option').count()!==12)throw new Error('Lab book should cover all 12 practicals');
  await page.locator('[data-lab-step="4"]').click();
  await page.waitForTimeout(40);
  if(await page.locator('#importLabData').count()!==1)throw new Error('Lab book raw-data import control missing');
  await page.locator('#importLabData').click();
  const raw=await page.locator('[data-lab-field="rawData"]').inputValue();
  if(!raw.trim())throw new Error('Lab book did not import recorded simulation data');
  await page.locator('#labStepDone').check();
  if(!(await page.locator('[data-lab-step="4"]').evaluate(el=>el.classList.contains('done'))))throw new Error('Lab book completion state did not save/render');

  if(errors.length)throw new Error(`Browser errors:\n${errors.join('\n')}`);
  console.log('Chromium smoke test passed: all 12 practicals/modes, AQA setup checks, Boyle syringe+masses physics, recording, hands-on controls, circuit builder and Lab Book.');
  await browser.close();
})().catch(async e=>{console.error(e.stack||e);process.exit(1);});