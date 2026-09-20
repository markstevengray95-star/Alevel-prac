'use strict';
const { chromium } = require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});

  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__enhancementStackReady===true&&window.PRACTICAL_3D_MODELS,{timeout:20000});
  if((await page.locator('#appVersionBadge').innerText()).trim()!=='Photo 3D v14.2')throw new Error('Live 3D version badge missing or stale');
  if(await page.locator('script[src^="lab-book-bootstrap.js"]').count()!==1)throw new Error('Enhancement bootstrap is not loaded explicitly by index.html');

  const checked=new Set();
  for(let id=1;id<=12;id++){
    await page.evaluate(id=>navigate('practical',id),id);
    await page.waitForTimeout(30);
    const modes=await page.evaluate(()=>current.modes.length);
    for(let mode=0;mode<modes;mode++){
      await page.evaluate(mode=>{currentMode=mode;renderModeTabs();renderPractical();},mode);
      await page.waitForTimeout(50);
      const selector=id===2?'#doubleSlit3d':id===4?'#young3d':'#practical3d';
      await page.waitForFunction(sel=>document.querySelector(sel)?.dataset.modelLoaded==='true',selector,{timeout:15000});
      const info=await page.evaluate(sel=>{
        const host=document.querySelector(sel),cfg=window.getPractical3DConfig(),details=host?.closest('details');
        return {file:cfg?.file,label:cfg?.label,canvas:!!host?.querySelector('canvas'),download:host?.querySelector('.practical3d-download')?.getAttribute('href'),status:host?.querySelector('.young3d-status')?.textContent,open:!!details?.open,source:host?.dataset.modelSource,revision:host?.dataset.modelRevision};
      },selector);
      if(!info.open)throw new Error(`P${id} mode ${mode}: 3D section is collapsed instead of visible by default`);
      if(!info.file||!info.canvas)throw new Error(`P${id} mode ${mode}: 3D config/canvas missing`);
      if(info.download!==info.file)throw new Error(`P${id} mode ${mode}: GLB download link mismatch`);
      if(!/Drag to rotate/.test(info.status||''))throw new Error(`P${id} mode ${mode}: model did not finish loading`);
      if(id<=6&&info.source!=='glb')throw new Error(`P${id} mode ${mode}: first-six practical regressed from detailed GLB to ${info.source}`);
      if(id<=6&&info.revision!=='20260920-p1p6-photoreal-r2')throw new Error(`P${id} mode ${mode}: stale model revision ${info.revision}`);
      checked.add(info.file);

      const glb=await page.evaluate(async file=>{
        const r=await fetch(file);const b=new Uint8Array(await r.arrayBuffer());
        return {ok:r.ok,size:b.length,magic:String.fromCharCode(...b.slice(0,4))};
      },info.file);
      if(!glb.ok||glb.size<800||glb.magic!=='glTF')throw new Error(`P${id} mode ${mode}: invalid GLB ${JSON.stringify(glb)}`);

      const box=await page.locator(selector+' canvas').boundingBox();
      if(!box||box.width<250||box.height<200)throw new Error(`P${id} mode ${mode}: 3D canvas not visible after opening`);
    }
  }

  const required=[
    'assets/rp01-standing-waves.glb','assets/rp02-double-slit.glb','assets/rp02-diffraction-grating.glb','assets/rp03-free-fall.glb','assets/rp03-free-fall-impact.glb',
    'assets/rp04-young-modulus.glb','assets/rp05-resistivity-wire.glb','assets/rp06-iv-characteristics.glb',
    'assets/rp07-pendulum.glb','assets/rp07-spring.glb','assets/rp08-boyle-syringe.glb','assets/rp08-charles-law.glb',
    'assets/rp09-capacitor.glb','assets/rp10-wire-balance.glb','assets/rp11-search-coil.glb','assets/rp12-inverse-square.glb'
  ];
  for(const f of required)if(!checked.has(f))throw new Error('3D asset never exercised: '+f);

  await page.evaluate(()=>navigate('practical',1));await page.waitForTimeout(50);
  if(await page.locator('#practical3dTool').count()!==1)throw new Error('Generic 3D toolbar button missing on P1');
  await page.locator('#practical3dTool').click();
  const expanded=await page.locator('#practical3d').evaluate(el=>({parent:el.parentElement.tagName,width:el.getBoundingClientRect().width}));
  if(expanded.parent!=='BODY'||expanded.width<700)throw new Error('Generic enlarged 3D view failed: '+JSON.stringify(expanded));
  await page.locator('#practical3d [data-young-expand]').click();

  await page.evaluate(()=>navigate('practical',2));await page.waitForTimeout(50);
  if(await page.locator('#doubleSlit3dTool').count()!==1)throw new Error('Legacy P2 3D toolbar ID regressed');
  await page.evaluate(()=>navigate('practical',4));await page.waitForTimeout(50);
  if(await page.locator('#young3dTool').count()!==1)throw new Error('Legacy P4 3D toolbar ID regressed');

  if(errors.length)throw new Error('Browser errors:\n'+errors.join('\n'));
  console.log('All-practical Photo 3D v14 smoke passed: every practical/mode loaded a valid interactive GLB, export link and enlarged viewer.');
  await browser.close();
})().catch(e=>{console.error(e.stack||e);process.exit(1);});