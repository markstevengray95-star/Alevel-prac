const CACHE='practical-lab-v20260920-final3d-r5';
const ASSETS=[
'./','./index.html','./styles.css','./visual-upgrades.css','./learning-tools.css','./ui-polish-v3.css','./sandbox-tools-v3.css','./experimental-sandbox-v4.css','./simulation-visuals-v5.css','./realistic-instruments-v6.css','./apparatus-interaction-v7.css','./free-build-bench-v8.css','./free-build-apparatus-v9.css','./practical-3d.css','./practical-3d-interactive-v11.css','./practical-3d-actions-v12.css','./app-icon.svg','./manifest.webmanifest','./assets/rp01-standing-waves.glb','./assets/rp02-double-slit.png','./assets/rp02-double-slit.glb','./assets/rp02-diffraction-grating.glb','./assets/rp03-free-fall.glb','./assets/rp03-free-fall-impact.glb','./assets/rp04-young-modulus.png','./assets/rp04-young-modulus.glb','./assets/rp05-resistivity-wire.png','./assets/rp05-resistivity-wire.glb','./assets/rp06-iv-characteristics.glb','./assets/rp07-pendulum.glb','./assets/rp07-spring.glb','./assets/rp08-boyle-syringe.png','./assets/rp08-boyle-syringe.glb','./assets/rp08-charles-law.glb','./assets/rp09-capacitor.glb','./assets/rp10-wire-balance.png','./assets/rp10-wire-balance.glb','./assets/rp11-search-coil.png','./assets/rp11-search-coil.glb','./assets/rp12-inverse-square.glb',
'./data-base.js','./data-extra.js','./core-a.js','./core-b.js','./scene-helpers.js','./scene-p1-4.js','./scene-p5-8.js','./scene-p9-12.js','./scene-dispatch.js','./scenes-b.js','./visual-upgrades.js','./animation-runtime-v2.js','./experimental-sandbox-v4.js','./simulation-visuals-v5.js','./realistic-instruments-v6.js','./apparatus-interaction-v7.js','./free-build-core-v8.js','./free-build-apparatus-v9.js','./free-build-ui-v8.js','./practical-toolkit-v4.js','./feature-26-live-scope.js','./feature-27-setup-snapshots.js','./feature-28-repeat-analysis.js',
'./accuracy-fixes.js','./accuracy-p2-p6.js','./accuracy-p7-p12.js','./accuracy-final.js','./accuracy-browser-fixes.js','./physical-interactions.js','./physical-interactions.css','./interaction-geometry.js',
'./practical-3d-equipment-v11.js','./practical-3d-actions-v12.js','./young-modulus-3d.js','./aqa-setup-alignment.js','./aqa-setup-visual-fixes.js','./p2-visual-accuracy.js','./p4-p6-run-accuracy.js','./lab-book.js','./lab-book-v2.js','./lab-book.css','./lab-book-v2.css','./lab-book-final.css','./lab-book-examples.js','./lab-book-examples-complete.js','./lab-book-example-detail-v2b.js','./lab-book-example-detail-v3.js','./lab-book-inline-switch.js','./lab-book-bootstrap.js','./learning-tools-core.js',
'./p1.js','./p2.js','./p3.js','./p4.js','./p5.js','./p6.js','./p7.js','./p8.js','./p9.js','./p10.js','./p11.js','./p12.js',
'./feature-01.js','./feature-02.js','./feature-03.js','./feature-04.js','./feature-05.js','./feature-06.js','./feature-07.js','./feature-08.js','./feature-09.js','./feature-10.js','./feature-11.js','./feature-12.js','./feature-13.js','./feature-14.js','./feature-15.js','./feature-16.js','./feature-17.js','./feature-18.js','./feature-19.js','./feature-20.js','./feature-21.js','./feature-22.js','./feature-23.js','./feature-24.js','./feature-25.js'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(async cache=>{
 const results=await Promise.allSettled(ASSETS.map(asset=>cache.add(asset)));
 const failed=results.map((r,i)=>r.status==='rejected'?ASSETS[i]:null).filter(Boolean);
 if(failed.length)console.warn('Offline cache skipped unavailable assets:',failed);
}).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin)return;
 const requestUrl=new URL(event.request.url);
 if(/\.glb$/i.test(requestUrl.pathname)){
   event.respondWith(fetch(event.request,{cache:'no-store'}).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(event.request,c));}return r;}).catch(()=>caches.match(event.request,{ignoreSearch:true})));return;
 }
 if(event.request.mode==='navigate'){
   event.respondWith((async()=>{
     const cache=await caches.open(CACHE);
     const shellUrl=new URL('./index.html',self.registration.scope).href;
     const cached=await cache.match(shellUrl,{ignoreSearch:true})||await cache.match('./index.html',{ignoreSearch:true});
     try{
       const r=await fetch(event.request,{cache:'no-store'});
       if(r&&r.ok){
         await cache.put(shellUrl,r.clone());
         return r;
       }
       if(cached)return cached;
       return r||Response.error();
     }catch(err){
       if(cached)return cached;
       const rootCached=await cache.match(new URL('./',self.registration.scope).href,{ignoreSearch:true});
       if(rootCached)return rootCached;
       throw err;
     }
   })());return;
 }
 // Core 3D runtime files are network-first so a deployed model/rendering fix cannot
 // remain hidden behind an older installed PWA cache.
 if(/\/(young-modulus-3d|practical-3d-equipment-v11|practical-3d-actions-v12|scene-dispatch)\.js$/i.test(requestUrl.pathname)){
   event.respondWith(fetch(event.request,{cache:'no-store'}).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(event.request,c));}return r;}).catch(()=>caches.match(event.request,{ignoreSearch:true})));return;
 }
 event.respondWith(caches.match(event.request,{ignoreSearch:true}).then(cached=>cached||fetch(event.request).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(event.request,c));}return r;})));
});
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting();});
