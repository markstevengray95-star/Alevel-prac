'use strict';
const { chromium } = require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1365,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__enhancementStackReady===true&&window.__labBookInlineSwitch&&typeof window.navigate==='function',{timeout:12000});
  await page.evaluate(()=>navigate('labbook'));
  await page.waitForTimeout(200);

  if(await page.locator('#lbModeMine').count()!==1)throw new Error('My lab book switch button missing');
  if(await page.locator('#lbModeExample').count()!==1)throw new Error('Completed example switch button missing');
  if(!(await page.locator('#lbModeMine').evaluate(el=>el.classList.contains('active'))))throw new Error('My lab book should be the default view');
  if(await page.locator('#lbMinePane').isHidden())throw new Error('My lab book pane should be visible by default');

  await page.locator('#lbModeExample').click();
  await page.waitForTimeout(180);
  if(!(await page.locator('#lbModeExample').evaluate(el=>el.classList.contains('active'))))throw new Error('Completed example button did not become active');
  if(!(await page.locator('#lbMinePane').isHidden()))throw new Error('Editable lab book should hide in example mode');
  if(await page.locator('#lbCompletedExamplePane .ex-sheet').count()!==1)throw new Error('Completed example did not render inline');
  if(await page.locator('#lbCompletedExamplePane .ex-table').count()<2)throw new Error('Completed example is missing worked result/uncertainty tables');
  if(!(await page.locator('#lbCompletedExamplePane').innerText()).includes('EXAMPLE RESULT'))throw new Error('Completed example result is missing');

  const exSelect=page.locator('#lbCompletedExamplePane #exSelect');
  if(await exSelect.count()!==1)throw new Error('Example practical selector missing');
  await exSelect.selectOption('8');
  await page.waitForTimeout(120);
  if(!(await page.locator('#lbCompletedExamplePane').innerText()).includes('Boyle'))throw new Error('Switching completed example practical failed');

  await page.locator('#lbModeMine').click();
  await page.waitForTimeout(120);
  if(!(await page.locator('#lbModeMine').evaluate(el=>el.classList.contains('active'))))throw new Error('Could not switch back to My lab book');
  if(await page.locator('#lbMinePane').isHidden())throw new Error('My lab book pane did not return');

  if(errors.length)throw new Error('Browser errors: '+errors.join(' | '));
  console.log('Lab Book inline switch passed: My lab book <-> Completed example, inline worked record, practical switching.');
  await browser.close();
})().catch(e=>{console.error(e.stack||e);process.exit(1);});