'use strict';
const { chromium } = require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1500,height:1200}});
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});

  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__enhancementStackReady===true&&window.__freeBuildBenchV8Ready===true&&window.__freeBuildApparatusV9Ready===true,{timeout:15000});

  const seen=new Set();
  for(let id=1;id<=12;id++){
    await page.evaluate(id=>navigate('practical',id),id);
    await page.waitForTimeout(20);
    const modes=await page.evaluate(()=>current.modes.length);
    for(let mode=0;mode<modes;mode++){
      await page.evaluate(mode=>{
        currentMode=mode;running=false;simT=0;renderModeTabs();renderPractical();
        window.__freeBuildBenchV8.setMode();
        window.__freeBuildBenchV8.reset();
      },mode);
      await page.waitForTimeout(35);

      const coverage=await page.evaluate(()=>window.__freeBuildBenchV8.items().map(([id,name])=>({
        id,name,kind:window.__freeBuildApparatusV9.kind(id,name),
        html:window.__freeBuildApparatusV9.render(id,name)
      })));
      if(!coverage.length)throw new Error(`P${id} mode ${mode}: no apparatus items`);
      for(const x of coverage){
        if(x.kind==='generic')throw new Error(`P${id} mode ${mode}: generic apparatus fallback for ${x.id} / ${x.name}`);
        if(!/data-apparatus-kind=/.test(x.html)||!/fb-apparatus-svg/.test(x.html))throw new Error(`P${id} mode ${mode}: malformed apparatus SVG for ${x.name}`);
        if(/\b(?:NaN|undefined|Infinity|null)\b/i.test(x.html))throw new Error(`P${id} mode ${mode}: invalid SVG output for ${x.name}`);
        seen.add(x.kind);
      }

      const trayItems=page.locator('#freeBuildV8 [data-fb-tray]');
      if(await trayItems.count()!==coverage.length)throw new Error(`P${id} mode ${mode}: tray count mismatch`);
      for(let i=0;i<await trayItems.count();i++){
        const item=trayItems.nth(i);
        if(await item.locator('.fb-apparatus-svg').count()!==1)throw new Error(`P${id} mode ${mode}: tray item missing realistic SVG`);
        if(await item.locator('[data-apparatus-kind="generic"]').count())throw new Error(`P${id} mode ${mode}: generic tray SVG found`);
      }

      await page.evaluate(()=>window.__freeBuildBenchV8.reference());
      await page.waitForTimeout(35);
      const nodes=page.locator('#freeBuildV8 [data-fb-node]');
      if(await nodes.count()!==coverage.length)throw new Error(`P${id} mode ${mode}: reference node count mismatch`);
      for(let i=0;i<await nodes.count();i++){
        const node=nodes.nth(i);
        if(await node.locator('.fb-object-visual .fb-apparatus-svg').count()!==1)throw new Error(`P${id} mode ${mode}: placed apparatus missing realistic SVG`);
        if(await node.locator('[data-apparatus-kind="generic"]').count())throw new Error(`P${id} mode ${mode}: generic placed apparatus found`);
        const box=await node.locator('.fb-object-visual').boundingBox();
        if(!box||box.width<60||box.height<45)throw new Error(`P${id} mode ${mode}: apparatus visual too small or not rendered`);
      }

      if(!(await page.evaluate(()=>window.__freeBuildBenchV8.validate().ready)))throw new Error(`P${id} mode ${mode}: v9 visuals broke v8 reference validation`);
    }
  }

  // Distinctive apparatus spot checks.
  const expected=[
    [2,0,'light','laser'],[2,0,'slits','double-slit'],[2,1,'grating','diffraction-grating'],
    [3,0,'detector','light-gate'],[4,0,'micro','micrometer'],[5,0,'amm','ammeter'],
    [7,0,'pend','pendulum'],[7,1,'spring','spring'],[8,0,'syringe','gas-syringe'],
    [8,1,'bath','water-bath'],[9,0,'cap','capacitor'],[10,0,'balance','top-pan-balance'],
    [11,0,'scope','oscilloscope'],[11,0,'search','search-coil'],[12,0,'gm','gm-tube']
  ];
  for(const [pid,mode,item,kind] of expected){
    await page.evaluate(({pid,mode})=>{navigate('practical',pid);currentMode=mode;renderModeTabs();renderPractical();},{pid,mode});
    const got=await page.evaluate(item=>window.__freeBuildApparatusV9.kind(item,window.__freeBuildBenchV8.name(item)),item);
    if(got!==kind)throw new Error(`P${pid} ${item}: expected ${kind}, got ${got}`);
  }

  if(seen.size<35)throw new Error(`Apparatus variety too low: only ${seen.size} distinct visual kinds`);
  const api=await page.evaluate(()=>({ready:window.__freeBuildApparatusV9Ready,version:window.__freeBuildApparatusV9.version}));
  if(!api.ready||api.version!=='9.0')throw new Error('Free-build apparatus v9 API not ready');
  if(errors.length)throw new Error('Browser errors:\n'+errors.join('\n'));
  console.log(`Free-build apparatus v9 smoke passed: all practicals/modes use realistic non-generic apparatus visuals across ${seen.size} distinct equipment kinds.`);
  await browser.close();
})().catch(e=>{console.error(e.stack||e);process.exit(1);});