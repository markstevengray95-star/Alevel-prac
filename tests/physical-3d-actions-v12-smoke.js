'use strict';
const { chromium } = require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1500,height:1000}});
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});

  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__enhancementStackReady===true&&window.__practical3DPhysicalActionsV12?.version==='14.0',{timeout:20000});

  // P3: manual visual ball release must move the ball through the scene.
  await page.evaluate(()=>navigate('practical',3));
  await page.waitForFunction(()=>document.querySelector('#practical3d')?.dataset.modelLoaded==='true'&&window.__practical3DInteractive,{timeout:16000});
  const ball=await page.evaluate(()=>window.__practical3DInteractive.listObjects().find(n=>/ball bearing|\bball\b/i.test(n)));
  if(!ball)throw new Error('P3 ball object missing');
  const beforeBall=await page.evaluate(name=>window.__practical3DInteractive.offsetOf(name),ball);
  const release=page.locator('#practical3d .p3d-physical-actions button',{hasText:'Release ball'});
  if(await release.count()!==1)throw new Error('P3 Release ball action missing');
  await release.click();
  await page.waitForTimeout(1050);
  const afterBall=await page.evaluate(name=>window.__practical3DInteractive.offsetOf(name),ball);
  if(!(afterBall[2]<beforeBall[2]-1.0))throw new Error('P3 Release ball did not move vertically through the timing region');

  // P11: search coil rotation should change object angle by roughly a quarter turn.
  await page.evaluate(()=>navigate('practical',11));
  await page.waitForFunction(()=>document.querySelector('#practical3d')?.dataset.modelLoaded==='true'&&window.__practical3DInteractive,{timeout:16000});
  const coil=await page.evaluate(()=>window.__practical3DInteractive.listObjects().find(n=>/search coil/i.test(n)));
  if(!coil)throw new Error('P11 search coil object missing');
  const beforeAngle=await page.evaluate(name=>window.__practical3DInteractive.angleOf(name),coil);
  const rotate=page.locator('#practical3d .p3d-physical-actions button',{hasText:'Rotate coil 90°'}).first();
  if(await rotate.count()!==1)throw new Error('P11 Rotate coil action missing');
  await rotate.click();
  await page.waitForTimeout(760);
  const afterAngle=await page.evaluate(name=>window.__practical3DInteractive.angleOf(name),coil);
  if(Math.abs((afterAngle-beforeAngle)-Math.PI/2)>.18)throw new Error('P11 coil did not rotate by about 90 degrees');

  // P6: a switch action should change the switch blade angle and remain visual-only.
  await page.evaluate(()=>navigate('practical',6));
  await page.waitForFunction(()=>document.querySelector('#practical3d')?.dataset.modelLoaded==='true'&&window.__practical3DInteractive,{timeout:16000});
  const switchName=await page.evaluate(()=>window.__practical3DInteractive.listObjects().find(n=>/switch/i.test(n)));
  if(switchName){
    const physicsBefore=await page.evaluate(()=>JSON.stringify(theoretical()));
    const angleBefore=await page.evaluate(name=>window.__practical3DInteractive.angleOf(name),switchName);
    const toggle=page.locator('#practical3d .p3d-physical-actions button',{hasText:'Toggle switch'}).first();
    if(await toggle.count()!==1)throw new Error('P6 Toggle switch action missing');
    await toggle.click();await page.waitForTimeout(360);
    const angleAfter=await page.evaluate(name=>window.__practical3DInteractive.angleOf(name),switchName);
    if(Math.abs(angleAfter-angleBefore)<.3)throw new Error('P6 switch angle did not change');
    const physicsAfter=await page.evaluate(()=>JSON.stringify(theoretical()));
    if(physicsAfter!==physicsBefore)throw new Error('Visual switch action altered the validated numerical physics model');
  }

  if(errors.length)throw new Error('Browser errors:\n'+errors.join('\n'));
  console.log('Physical 3D actions v14 smoke passed: free-fall release, search-coil rotation and visual circuit switch interactions work without changing the numerical physics model.');
  await browser.close();
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
