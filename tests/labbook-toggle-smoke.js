'use strict';
const { chromium } = require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1365,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__enhancementStackReady===true&&window.__labBookInlineSwitch&&window.__labBookExampleDetailV2&&typeof window.navigate==='function',{timeout:12000});
  await page.evaluate(()=>navigate('labbook'));
  await page.waitForTimeout(200);

  if(await page.locator('#lbModeMine').count()!==1)throw new Error('My lab book switch button missing');
  if(await page.locator('#lbModeExample').count()!==1)throw new Error('Completed example switch button missing');
  if(!(await page.locator('#lbModeMine').evaluate(el=>el.classList.contains('active'))))throw new Error('My lab book should be the default view');
  if(await page.locator('#lbMinePane').isHidden())throw new Error('My lab book pane should be visible by default');
  if(await page.evaluate(()=>window.__labBookExampleDetailV2.count)!==12)throw new Error('Detailed example data should cover all 12 practicals');

  await page.locator('#lbModeExample').click();
  await page.waitForTimeout(220);
  if(!(await page.locator('#lbModeExample').evaluate(el=>el.classList.contains('active'))))throw new Error('Completed example button did not become active');
  if(!(await page.locator('#lbMinePane').isHidden()))throw new Error('Editable lab book should hide in example mode');
  if(await page.locator('#lbCompletedExamplePane .ex-sheet').count()!==1)throw new Error('Completed example did not render inline');
  if(await page.locator('#lbCompletedExamplePane .ex-table').count()<2)throw new Error('Completed example is missing worked result/uncertainty tables');
  if(!(await page.locator('#lbCompletedExamplePane').innerText()).includes('EXAMPLE RESULT'))throw new Error('Completed example result is missing');

  const requiredDetail=['Detailed apparatus record','Example contemporaneous notes','Worked example calculations','Uncertainty analysis in more detail','What should be written beside the graph','Practical-skills evidence shown by this record','Exam-style link'];
  const exSelect=page.locator('#lbCompletedExamplePane #exSelect');
  if(await exSelect.count()!==1)throw new Error('Example practical selector missing');

  for(let id=1;id<=12;id++){
    await exSelect.selectOption(String(id));
    await page.waitForTimeout(150);
    const pane=page.locator('#lbCompletedExamplePane');
    if(await pane.locator('.ex-detail-v2').count()!==1)throw new Error(`P${id}: detailed example enrichment missing`);
    if(await pane.locator('.ex-detail-table').count()<1)throw new Error(`P${id}: detailed apparatus table missing`);
    if(await pane.locator('.ex-working li').count()<2)throw new Error(`P${id}: worked calculations are too sparse`);
    if(await pane.locator('.ex-cpac span').count()<3)throw new Error(`P${id}: practical-skills evidence is too sparse`);
    const txt=await pane.innerText();
    for(const heading of requiredDetail)if(!txt.includes(heading))throw new Error(`P${id}: missing detailed heading ${heading}`);
  }

  await page.locator('#lbModeMine').click();
  await page.waitForTimeout(120);
  if(!(await page.locator('#lbModeMine').evaluate(el=>el.classList.contains('active'))))throw new Error('Could not switch back to My lab book');
  if(await page.locator('#lbMinePane').isHidden())throw new Error('My lab book pane did not return');

  if(errors.length)throw new Error('Browser errors: '+errors.join(' | '));
  console.log('Lab Book inline switch passed with enriched worked records for all 12 practicals.');
  await browser.close();
})().catch(e=>{console.error(e.stack||e);process.exit(1);});