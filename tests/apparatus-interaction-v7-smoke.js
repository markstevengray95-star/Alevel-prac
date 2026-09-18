'use strict';
const { chromium } = require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__enhancementStackReady===true&&window.__apparatusInteractionV7Ready===true,{timeout:15000});

  // All practicals/modes must keep a finite v7 scene layer.
  for(let id=1;id<=12;id++){
    await page.evaluate(id=>navigate('practical',id),id);await page.waitForTimeout(25);
    const modes=await page.evaluate(()=>current.modes.length);
    for(let mode=0;mode<modes;mode++){
      await page.evaluate(mode=>{
        running=false;simT=0;currentMode=mode;renderModeTabs();renderPractical();
        window.__animationRuntime?.forceFrame();window.__apparatusInteractionV7?.refresh({test:true});
      },mode);
      await page.waitForTimeout(15);
      if(await page.locator('#apparatusInteractionV7').count()!==1)throw new Error(`P${id} mode ${mode}: v7 layer missing`);
      const html=await page.locator('#apparatusInteractionV7').innerHTML();
      if(/\b(?:NaN|undefined|Infinity|null)\b/i.test(html))throw new Error(`P${id} mode ${mode}: invalid v7 visual output`);
      if(await page.locator('#scene').getAttribute('data-apparatus-layer')!=='v7')throw new Error(`P${id} mode ${mode}: v7 scene marker missing`);
    }
  }

  // P3 misalignment: physical release moves off the gate line and blocks recording.
  await page.evaluate(()=>{navigate('practical',3);window.__apparatusInteractionV7.set({releaseX:45});window.__animationRuntime.forceFrame();});
  let p3=await page.evaluate(()=>({st:window.__apparatusInteractionV7.status(),th:theoretical(),before:getData().length}));
  if(p3.st.kind!=='invalid'||p3.th.read.Time!=='NO GATE')throw new Error('P3 misalignment did not invalidate the timing setup');
  await page.evaluate(()=>record(1));
  let p3after=await page.evaluate(()=>getData().length);
  if(p3after!==p3.before)throw new Error('P3 invalid setup was recorded');
  await page.evaluate(()=>window.__apparatusInteractionV7.reset());

  // P4 off-level spirit bubble: systematic extension bias, but record remains possible.
  await page.evaluate(()=>{navigate('practical',4);window.__animationRuntime.forceFrame();});
  const p4base=await page.evaluate(()=>({ext:theoretical().read.Extension,y:theoretical().y}));
  await page.evaluate(()=>{window.__apparatusInteractionV7.set({level:.75});window.__animationRuntime.forceFrame();});
  const p4bad=await page.evaluate(()=>({st:window.__apparatusInteractionV7.status(),ext:theoretical().read.Extension,y:theoretical().y}));
  if(p4bad.st.kind!=='bias'||p4bad.ext===p4base.ext||p4bad.y===p4base.y)throw new Error('P4 off-level state did not create a measurement bias');

  // P5 actual connector drag to wrong terminal and open state.
  await page.evaluate(()=>{navigate('practical',5);window.__animationRuntime.forceFrame();window.__apparatusInteractionV7.refresh();});
  if(await page.locator('.v7-plug').count()!==1)throw new Error('P5 v7 connector missing');
  await page.evaluate(()=>{
    const svg=document.querySelector('#scene svg'),plug=svg.querySelector('.v7-plug'),bad=svg.querySelector('.v7-socket.bad'),r=svg.getBoundingClientRect();
    const toClient=el=>({clientX:r.left+(+el.getAttribute('cx'))/900*r.width,clientY:r.top+(+el.getAttribute('cy'))/430*r.height});
    const a=toClient(plug),b=toClient(bad);
    plug.dispatchEvent(new PointerEvent('pointerdown',{...a,pointerId:3,bubbles:true}));
    window.dispatchEvent(new PointerEvent('pointermove',{...b,pointerId:3,bubbles:true}));
    window.dispatchEvent(new PointerEvent('pointerup',{...b,pointerId:3,bubbles:true}));
  });
  const p5=await page.evaluate(()=>({s:window.__apparatusInteractionV7.state(),th:theoretical(),before:getData().length}));
  if(p5.s.lead!=='wrong'||p5.th.read.Voltage!=='0.00 V')throw new Error('P5 wrong connector did not affect the voltmeter');
  await page.evaluate(()=>record(1));
  if(await page.evaluate(()=>getData().length)!==p5.before)throw new Error('P5 wrong connection was recorded');
  await page.evaluate(()=>window.__apparatusInteractionV7.reset());

  // P6 open lead should suppress terminal-p.d. reading and block record.
  await page.evaluate(()=>{navigate('practical',6);window.__apparatusInteractionV7.set({lead:'open'});window.__animationRuntime.forceFrame();});
  const p6=await page.evaluate(()=>({st:window.__apparatusInteractionV7.status(),term:theoretical().read.Terminal,before:getData().length}));
  if(p6.st.kind!=='invalid'||p6.term!=='—')throw new Error('P6 open lead did not invalidate terminal-p.d. measurement');
  await page.evaluate(()=>record(1));if(await page.evaluate(()=>getData().length)!==p6.before)throw new Error('P6 open lead was recorded');

  // P7 fiducial away from equilibrium biases measured period.
  await page.evaluate(()=>{navigate('practical',7);currentMode=0;renderModeTabs();renderPractical();window.__animationRuntime.forceFrame();});
  const t7=await page.evaluate(()=>theoretical().read.Period);
  await page.evaluate(()=>{window.__apparatusInteractionV7.set({fiducialX:32});window.__animationRuntime.forceFrame();});
  const p7=await page.evaluate(()=>({st:window.__apparatusInteractionV7.status(),period:theoretical().read.Period}));
  if(p7.st.kind!=='bias'||p7.period===t7)throw new Error('P7 fiducial offset did not bias timing');

  // P9 wrong target changes the measured voltage and blocks recording.
  await page.evaluate(()=>{navigate('practical',9);window.__animationRuntime.start();window.__apparatusInteractionV7.set({lead:'wrong'});window.__animationRuntime.forceFrame();});
  await page.waitForTimeout(60);
  const p9=await page.evaluate(()=>({st:window.__apparatusInteractionV7.status(),th:theoretical(),before:getData().length}));
  if(p9.st.kind!=='invalid'||!Number.isFinite(p9.th.y))throw new Error('P9 wrong connection did not produce a finite wrong measurement');
  await page.evaluate(()=>record(1));if(await page.evaluate(()=>getData().length)!==p9.before)throw new Error('P9 wrong connection was recorded');
  await page.evaluate(()=>window.__animationRuntime.pause());

  // P10 balance zero bias and TARE interaction.
  await page.evaluate(()=>{navigate('practical',10);window.__animationRuntime.start();window.__apparatusInteractionV7.set({balanceZero:.05});window.__animationRuntime.forceFrame();});
  const p10=await page.evaluate(()=>({st:window.__apparatusInteractionV7.status(),bal:theoretical().read.Balance}));
  if(p10.st.kind!=='bias'||!/g$/.test(p10.bal))throw new Error('P10 balance zero bias missing');
  await page.locator('[data-v7-control="tare"]').click();
  const p10z=await page.evaluate(()=>window.__apparatusInteractionV7.state().balanceZero);
  if(Math.abs(p10z)>1e-9)throw new Error('P10 TARE did not reset balance zero');
  await page.evaluate(()=>window.__animationRuntime.pause());

  // P11 off-centre search coil reduces emf; wrong lead then blocks recording.
  await page.evaluate(()=>{navigate('practical',11);window.__animationRuntime.forceFrame();});
  const e11=await page.evaluate(()=>parseFloat(theoretical().read.EMF));
  await page.evaluate(()=>{window.__apparatusInteractionV7.set({coilX:60});window.__animationRuntime.forceFrame();});
  const p11bias=await page.evaluate(()=>({st:window.__apparatusInteractionV7.status(),emf:parseFloat(theoretical().read.EMF)}));
  if(p11bias.st.kind!=='bias'||!(p11bias.emf<e11))throw new Error('P11 off-centre coil did not reduce emf');
  await page.evaluate(()=>{window.__apparatusInteractionV7.set({lead:'wrong'});window.__animationRuntime.forceFrame();});
  const p11bad=await page.evaluate(()=>({st:window.__apparatusInteractionV7.status(),before:getData().length}));
  if(p11bad.st.kind!=='invalid')throw new Error('P11 wrong oscilloscope lead not invalid');
  await page.evaluate(()=>record(1));if(await page.evaluate(()=>getData().length)!==p11bad.before)throw new Error('P11 wrong lead was recorded');

  // Reset returns the apparatus to a valid reference state and normal recording works.
  await page.evaluate(()=>{window.__apparatusInteractionV7.reset();});
  const ready=await page.evaluate(()=>window.__apparatusInteractionV7.status());
  if(ready.kind!=='ready')throw new Error('v7 reset did not restore ready state');

  const api=await page.evaluate(()=>({ready:window.__apparatusInteractionV7Ready,version:window.__apparatusInteractionV7.version}));
  if(!api.ready||api.version!=='7.0')throw new Error('v7 API not ready');
  if(errors.length)throw new Error('Browser errors:\n'+errors.join('\n'));
  console.log('Apparatus interaction v7 smoke passed: setup faults affect measurements, invalid configurations block records, bias states remain finite, and reset restores reference setup.');
  await browser.close();
})().catch(e=>{console.error(e.stack||e);process.exit(1);});