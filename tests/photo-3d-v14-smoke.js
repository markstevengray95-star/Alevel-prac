'use strict';
const { chromium } = require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1600,height:1100}});
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__enhancementStackReady===true,{timeout:20000});

  // P8 Charles-law mode: renderer must expose PBR quality and preserve transparent glass alpha.
  await page.evaluate(()=>{navigate('practical',8);currentMode=1;renderModeTabs();renderPractical();});
  await page.waitForFunction(()=>window.__practical3DInteractive?.version==='14.0'&&document.querySelector('#practical3d')?.dataset.modelLoaded==='true',{timeout:16000});
  const render=await page.evaluate(()=>({
    version:window.__practical3DInteractive.version,
    quality:window.__practical3DInteractive.renderQuality,
    source:window.__practical3DInteractive.modelSource,
    alpha:window.__practical3DInteractive.objects.filter(o=>/beaker|water bath|thermometer glass|capillary/i.test(o.name)).map(o=>o.alpha)
  }));
  if(render.version!=='14.0'||render.quality!=='photoreal-pbr'||render.source!=='glb')throw new Error('Photo renderer metadata incorrect: '+JSON.stringify(render));
  if(!render.alpha.some(a=>Number.isFinite(a)&&a<.95))throw new Error('Glass/water transparency was not preserved from PBR material data');

  // P3 free-fall: physically accelerated visual drop and numerical model isolation.
  await page.evaluate(()=>{navigate('practical',3);currentMode=0;renderModeTabs();renderPractical();});
  await page.waitForFunction(()=>document.querySelector('#practical3d')?.dataset.modelLoaded==='true'&&window.__practical3DInteractive,{timeout:16000});
  const physics0=await page.evaluate(()=>JSON.stringify(theoretical()));
  const release=page.locator('#practical3d .p3d-physical-actions button',{hasText:'Release ball'});
  await release.click();await page.waitForTimeout(800);
  const ballState=await page.evaluate(()=>{
    const api=window.__practical3DInteractive,n=api.listObjects().find(x=>/ball bearing/i.test(x));return {n,offset:api.offsetOf(n)};
  });
  if(!ballState.n||ballState.offset[2]>-2.0)throw new Error('Gravity-style P3 release did not carry the ball through the timing region');
  if(await page.evaluate(()=>JSON.stringify(theoretical()))!==physics0)throw new Error('P3 visual release changed numerical physics');

  // P7 pendulum: both string and bob rotate around the suspension pivot and return to rest.
  await page.evaluate(()=>{navigate('practical',7);currentMode=0;renderModeTabs();renderPractical();});
  await page.waitForFunction(()=>document.querySelector('#practical3d')?.dataset.modelLoaded==='true'&&window.__practical3DInteractive,{timeout:16000});
  const pend=page.locator('#practical3d .p3d-physical-actions button',{hasText:'Release pendulum'});
  await pend.click();await page.waitForTimeout(260);
  const pendMid=await page.evaluate(()=>{
    const api=window.__practical3DInteractive;
    const bob=api.listObjects().find(n=>/pendulum bob/i.test(n)),str=api.listObjects().find(n=>/pendulum string/i.test(n));
    const bo=api.objects.find(o=>o.name===bob),so=api.objects.find(o=>o.name===str);
    return {bobAngle:api.angleOf(bob),stringAngle:api.angleOf(str),bobAxis:bo?.axis,stringAxis:so?.axis,bobPivot:bo?.pivot};
  });
  if(Math.abs(pendMid.bobAngle)<.03||Math.abs(pendMid.stringAngle)<.03)throw new Error('Pendulum string and bob did not rotate together');
  if(Math.abs((pendMid.bobAxis||[])[1]-1)>.05||Math.abs((pendMid.stringAxis||[])[1]-1)>.05)throw new Error('Pendulum did not use the physical y-axis hinge');
  await page.waitForTimeout(1450);
  const pendEnd=await page.evaluate(()=>{
    const api=window.__practical3DInteractive,b=api.listObjects().find(n=>/pendulum bob/i.test(n));return api.angleOf(b);
  });
  if(Math.abs(pendEnd)>.08)throw new Error('Pendulum did not settle back near equilibrium');


  // P7 spring mode: spring mesh must deform with the moving load assembly.
  await page.evaluate(()=>{navigate('practical',7);currentMode=1;renderModeTabs();renderPractical();});
  await page.waitForFunction(()=>document.querySelector('#practical3d')?.dataset.modelLoaded==='true'&&window.__practical3DInteractive,{timeout:16000});
  const springBtn=page.locator('#practical3d .p3d-physical-actions button',{hasText:'Start spring oscillation'});
  await springBtn.click();await page.waitForTimeout(250);
  const springMid=await page.evaluate(()=>{
    const api=window.__practical3DInteractive,s=api.listObjects().find(n=>/^spring/i.test(n));return {name:s,scale:s?api.scaleOf(s):null};
  });
  if(!springMid.name||Math.abs((springMid.scale??1)-1)<.025)throw new Error('Spring mesh did not visibly extend/compress with the load');
  await page.waitForTimeout(1450);

  // P8 Boyle mode: plunger and attached load must move vertically together.
  await page.evaluate(()=>{navigate('practical',8);currentMode=0;renderModeTabs();renderPractical();});
  await page.waitForFunction(()=>document.querySelector('#practical3d')?.dataset.modelLoaded==='true'&&window.__practical3DInteractive,{timeout:16000});
  const beforeBoyle=await page.evaluate(()=>{
    const api=window.__practical3DInteractive,p=api.listObjects().find(n=>/syringe plunger/i.test(n)),m=api.listObjects().find(n=>/mass hanger/i.test(n));return {p,m,po:api.offsetOf(p),mo:api.offsetOf(m)};
  });
  await page.locator('#practical3d .p3d-physical-actions button',{hasText:'Compress gas'}).click();await page.waitForTimeout(80);
  const afterBoyle=await page.evaluate(x=>{
    const api=window.__practical3DInteractive;return {po:api.offsetOf(x.p),mo:api.offsetOf(x.m)};
  },beforeBoyle);
  if(!(afterBoyle.po[2]>beforeBoyle.po[2]+.15&&afterBoyle.mo[2]>beforeBoyle.mo[2]+.15))throw new Error('Boyle plunger/load assembly did not move vertically together');

  // P6 switch hinge axis is physical, not a screen-space spin.
  await page.evaluate(()=>{navigate('practical',6);currentMode=0;renderModeTabs();renderPractical();});
  await page.waitForFunction(()=>document.querySelector('#practical3d')?.dataset.modelLoaded==='true'&&window.__practical3DInteractive,{timeout:16000});
  await page.locator('#practical3d .p3d-physical-actions button',{hasText:'Toggle switch'}).click();await page.waitForTimeout(380);
  const sw=await page.evaluate(()=>{
    const api=window.__practical3DInteractive,n=api.listObjects().find(x=>/switch blade/i.test(x))||api.listObjects().find(x=>/switch/i.test(x)),o=api.objects.find(x=>x.name===n);
    return {angle:api.angleOf(n),axis:o?.axis,pivot:o?.pivot};
  });
  if(Math.abs(sw.angle)<.3||Math.abs((sw.axis||[])[1]-1)>.05)throw new Error('P6 switch did not rotate about its physical hinge axis');

  // P11 search coil quarter-turn must retain vertical spindle pivot.
  await page.evaluate(()=>{navigate('practical',11);currentMode=0;renderModeTabs();renderPractical();});
  await page.waitForFunction(()=>document.querySelector('#practical3d')?.dataset.modelLoaded==='true'&&window.__practical3DInteractive,{timeout:16000});
  await page.locator('#practical3d .p3d-physical-actions button',{hasText:'Rotate coil 90°'}).first().click();await page.waitForTimeout(720);
  const coil=await page.evaluate(()=>{
    const api=window.__practical3DInteractive,n=api.listObjects().find(x=>/search coil winding/i.test(x))||api.listObjects().find(x=>/search coil/i.test(x)),o=api.objects.find(x=>x.name===n);
    return {angle:api.angleOf(n),axis:o?.axis,pivot:o?.pivot};
  });
  if(Math.abs(coil.angle-Math.PI/2)>.2||Math.abs((coil.axis||[])[2]-1)>.05)throw new Error('P11 search coil did not rotate about the vertical spindle');

  const bg=await page.locator('#practical3d').evaluate(el=>getComputedStyle(el).backgroundImage);
  if(!/gradient/i.test(bg))throw new Error('Photo 3D studio/lab background missing');
  if(errors.length)throw new Error('Browser errors:\n'+errors.join('\n'));
  console.log('Photo 3D v14 quality smoke passed: PBR transparency, realistic pivots/motion and physics isolation verified.');
  await browser.close();
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
