const CACHE='practical-lab-v20260918-instruments-v6';
const ASSETS=[
'./','./index.html','./styles.css','./visual-upgrades.css','./learning-tools.css','./ui-polish-v3.css','./sandbox-tools-v3.css','./experimental-sandbox-v4.css','./simulation-visuals-v5.css','./realistic-instruments-v6.css','./app-icon.svg','./manifest.webmanifest','./assets/rp02-double-slit.png','./assets/rp02-double-slit.glb','./assets/rp04-young-modulus.png','./assets/rp04-young-modulus.glb','./assets/rp05-resistivity-wire.png','./assets/rp08-boyle-syringe.png','./assets/rp10-wire-balance.png','./assets/rp11-search-coil.png',
'./data-base.js','./data-extra.js','./core-a.js','./core-b.js','./scene-helpers.js','./scene-p1-4.js','./scene-p5-8.js','./scene-p9-12.js','./scene-dispatch.js','./scenes-b.js','./visual-upgrades.js','./animation-runtime-v2.js','./experimental-sandbox-v4.js','./simulation-visuals-v5.js','./realistic-instruments-v6.js','./practical-toolkit-v4.js','./feature-26-live-scope.js','./feature-27-setup-snapshots.js','./feature-28-repeat-analysis.js',
'./accuracy-fixes.js','./accuracy-p2-p6.js','./accuracy-p7-p12.js','./accuracy-final.js','./accuracy-browser-fixes.js','./physical-interactions.js','./physical-interactions.css','./interaction-geometry.js',
'./young-modulus-3d.js','./aqa-setup-alignment.js','./aqa-setup-visual-fixes.js','./p2-visual-accuracy.js','./p4-p6-run-accuracy.js','./lab-book.js','./lab-book-v2.js','./lab-book.css','./lab-book-v2.css','./lab-book-final.css','./lab-book-examples.js','./lab-book-examples-complete.js','./lab-book-example-detail-v2b.js','./lab-book-example-detail-v3.js','./lab-book-inline-switch.js','./lab-book-bootstrap.js','./learning-tools-core.js',
'./p1.js','./p2.js','./p3.js','./p4.js','./p5.js','./p6.js','./p7.js','./p8.js','./p9.js','./p10.js','./p11.js','./p12.js',
'./feature-01.js','./feature-02.js','./feature-03.js','./feature-04.js','./feature-05.js','./feature-06.js','./feature-07.js','./feature-08.js','./feature-09.js','./feature-10.js','./feature-11.js','./feature-12.js','./feature-13.js','./feature-14.js','./feature-15.js','./feature-16.js','./feature-17.js','./feature-18.js','./feature-19.js','./feature-20.js','./feature-21.js','./feature-22.js','./feature-23.js','./feature-24.js','./feature-25.js'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin)return;
 if(event.request.mode==='navigate'){
   event.respondWith(fetch(event.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put('./index.html',c));return r;}).catch(()=>caches.match('./index.html',{ignoreSearch:true})));return;
 }
 event.respondWith(caches.match(event.request,{ignoreSearch:true}).then(cached=>cached||fetch(event.request).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(event.request,c));}return r;})));
});
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting();});
