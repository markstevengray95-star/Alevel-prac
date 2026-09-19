/* Orbitable AQA RP4 apparatus, loaded from the Blender-exported GLB. */
(()=>{
'use strict';
let active=null;
const modelPromises=new Map();
const identity=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
function multiply(a,b){const out=new Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)out[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return out;}
function transform(node){if(node.matrix)return node.matrix;const [x,y,z,w]=node.rotation||[0,0,0,1],s=node.scale||[1,1,1],t=node.translation||[0,0,0];return [
 (1-2*(y*y+z*z))*s[0],2*(x*y+z*w)*s[0],2*(x*z-y*w)*s[0],0,
 2*(x*y-z*w)*s[1],(1-2*(x*x+z*z))*s[1],2*(y*z+x*w)*s[1],0,
 2*(x*z+y*w)*s[2],2*(y*z-x*w)*s[2],(1-2*(x*x+y*y))*s[2],0,
 t[0],t[1],t[2],1];}
async function fetchModelFile(file,retry=false){
  const url=retry?(file+(file.includes('?')?'&':'?')+'retry3d='+Date.now()):file;
  const r=await fetch(url,{cache:retry?'reload':'default'});
  if(!r.ok)throw Error(`3D model HTTP ${r.status}`);
  const bytes=await r.arrayBuffer(),dv=new DataView(bytes);
  if(bytes.byteLength<20||dv.getUint32(0,true)!==0x46546c67||dv.getUint32(4,true)!==2)throw Error('Invalid Blender GLB');
  let json,binOffset=0;
  for(let p=12;p<bytes.byteLength;){const n=dv.getUint32(p,true),type=dv.getUint32(p+4,true);if(type===0x4e4f534a)json=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,p+8,n)));if(type===0x004e4942)binOffset=p+8;p+=8+n;}
  if(!json||!binOffset)throw Error('Incomplete Blender GLB');
  return {json,dv,binOffset};
}
function loadModel(file){
  if(modelPromises.has(file))return modelPromises.get(file);
  const promise=(async()=>{
    try{return await fetchModelFile(file,false);}
    catch(first){
      console.warn('3D model first load failed, retrying:',file,first);
      try{return await fetchModelFile(file,true);}
      catch(second){second.message=`${second.message}; retry failed after: ${first.message}`;throw second;}
    }
  })().catch(e=>{modelPromises.delete(file);throw e;});
  modelPromises.set(file,promise);return promise;
}
function readAccessor(model,id){const {json,dv,binOffset}=model,a=json.accessors[id],view=json.bufferViews[a.bufferView],parts={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],width={5121:1,5123:2,5125:4,5126:4}[a.componentType];if(!parts||!width)throw Error('Unsupported GLB accessor');const start=binOffset+(view.byteOffset||0)+(a.byteOffset||0),stride=view.byteStride||parts*width,values=new Array(a.count*parts);for(let i=0;i<a.count;i++)for(let j=0;j<parts;j++){const at=start+i*stride+j*width;values[i*parts+j]=a.componentType===5126?dv.getFloat32(at,true):a.componentType===5125?dv.getUint32(at,true):a.componentType===5123?dv.getUint16(at,true):dv.getUint8(at);}return values;}
function geometry(model){
  const {json}=model,items=[];
  function visit(id,parent){
    const node=json.nodes[id],matrix=multiply(parent,transform(node));
    if(node.mesh!==undefined){
      const mesh=json.meshes[node.mesh];
      mesh.primitives.forEach((primitive,pi)=>{
        if(primitive.mode!==undefined&&primitive.mode!==4)return;
        const material=primitive.material??0,positions=[],normals=[];
        const pos=readAccessor(model,primitive.attributes.POSITION),norm=primitive.attributes.NORMAL!==undefined?readAccessor(model,primitive.attributes.NORMAL):null;
        const indices=primitive.indices!==undefined?readAccessor(model,primitive.indices):Array.from({length:pos.length/3},(_,i)=>i);
        let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
        for(const ix of indices){
          const i=ix*3,x=pos[i],y=pos[i+1],z=pos[i+2],nx=norm?norm[i]:0,ny=norm?norm[i+1]:0,nz=norm?norm[i+2]:1;
          const px=matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12],py=matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13],pz=matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14];
          positions.push(px,py,pz);min=[Math.min(min[0],px),Math.min(min[1],py),Math.min(min[2],pz)];max=[Math.max(max[0],px),Math.max(max[1],py),Math.max(max[2],pz)];
          let ax=matrix[0]*nx+matrix[4]*ny+matrix[8]*nz,ay=matrix[1]*nx+matrix[5]*ny+matrix[9]*nz,az=matrix[2]*nx+matrix[6]*ny+matrix[10]*nz;const d=Math.hypot(ax,ay,az)||1;normals.push(ax/d,ay/d,az/d);
        }
        const center=[(min[0]+max[0])/2,(min[1]+max[1])/2,(min[2]+max[2])/2],radius=Math.max(.06,Math.hypot(max[0]-min[0],max[1]-min[1],max[2]-min[2])/2);
        items.push({
          name:node.name||mesh.name||('Part '+id+'-'+pi),
          color:json.materials?.[material]?.pbrMetallicRoughness?.baseColorFactor?.slice(0,3)||[.7,.8,.8],
          positions,normals,center,radius,min,max
        });
      });
    }
    for(const child of node.children||[])visit(child,matrix);
  }
  for(const id of json.scenes[json.scene||0].nodes)visit(id,identity());
  return items;
}
const subtract=(a,b)=>a.map((v,i)=>v-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>{const d=Math.hypot(...a)||1;return a.map(v=>v/d);};
function lookAt(eye,target){const z=unit(subtract(eye,target)),x=unit(cross([0,0,1],z)),y=cross(z,x);return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-x[0]*eye[0]-x[1]*eye[1]-x[2]*eye[2],-y[0]*eye[0]-y[1]*eye[1]-y[2]*eye[2],-z[0]*eye[0]-z[1]*eye[1]-z[2]*eye[2],1];}
function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2);return [f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0];}
function shader(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
function program(gl){const vertex=`attribute vec3 aPosition;attribute vec3 aNormal;uniform mat4 uMVP;uniform vec3 uOffset;varying vec3 vNormal;void main(){vNormal=aNormal;gl_Position=uMVP*vec4(aPosition+uOffset,1.0);}`;const fragment=`precision mediump float;varying vec3 vNormal;uniform vec3 uColor;uniform float uAlpha;void main(){vec3 n=normalize(vNormal);float diffuse=max(dot(n,normalize(vec3(-0.4,-0.7,0.8))),0.0);float fill=max(dot(n,normalize(vec3(0.8,0.4,0.4))),0.0);vec3 lit=uColor*(0.47+0.48*diffuse+0.18*fill);gl_FragColor=vec4(pow(lit,vec3(0.85)),uAlpha);}`;const p=gl.createProgram();gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,vertex));gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,fragment));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;}
function projectPoint(m,p,w,h){const x=m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],y=m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],q=m[3]*p[0]+m[7]*p[1]+m[11]*p[2]+m[15]||1;return[(x/q*.5+.5)*w,(1-(y/q*.5+.5))*h,q];}
function mount(config){
  if(active)active.dispose();
  const host=document.querySelector(config.selector);if(!host)return;
  const home=host.parentNode,next=host.nextSibling,canvas=host.querySelector('canvas'),fallback=host.querySelector('.young3d-fallback'),status=host.querySelector('.young3d-status'),gl=canvas.getContext('webgl',{antialias:true,alpha:false});
  if(!gl){status.textContent='3D is unavailable in this browser. The apparatus reference is shown below.';fallback.hidden=false;return;}
  let disposed=false,objects=[],prog,observer,lastMVP=null,hovered=null,selected=null,important=[],raf=0;
  const state={azimuth:config.azimuth,elevation:config.elevation,radius:config.radius,target:[...config.target],xray:false,exploded:false,labels:false,tool:'orbit',tutorialIndex:-1,quizTarget:null,demoUntil:0};
  const ensureUI=()=>{
    let tools=host.querySelector('.practical3d-tools');
    if(!tools){tools=document.createElement('div');tools.className='practical3d-tools';tools.innerHTML='<button type="button" data-3d-mode>Guided 3D</button><button type="button" data-3d-labels>Labels</button><button type="button" data-3d-xray>X-ray</button><button type="button" data-3d-explode>Explode</button><button type="button" data-3d-tutorial>Tutorial</button><button type="button" data-3d-quiz>Quiz</button><button type="button" data-3d-reset-objects>Reset apparatus</button>';host.appendChild(tools);}
    let labels=host.querySelector('.practical3d-label-layer');if(!labels){labels=document.createElement('div');labels.className='practical3d-label-layer';host.appendChild(labels);}
    let panel=host.querySelector('.practical3d-info');if(!panel){panel=document.createElement('aside');panel.className='practical3d-info';panel.hidden=true;host.appendChild(panel);}
    return{tools,labels,panel};
  };
  const ui=ensureUI();
  const cleanup=()=>{disposed=true;cancelAnimationFrame(raf);observer?.disconnect();if(host.parentNode===document.body)host.remove();for(const o of objects){gl.deleteBuffer(o.pos);gl.deleteBuffer(o.normal);}if(prog)gl.deleteProgram(prog);};
  active={dispose:cleanup};
  const effectiveOffset=o=>{const e=state.exploded?o.explode:[0,0,0];return[o.offset[0]+e[0],o.offset[1]+e[1],o.offset[2]+e[2]];};
  const displayInfo=(o,prefix='')=>{
    if(!o){ui.panel.hidden=true;return;}
    selected=o;const info=window.getPractical3DEquipmentInfo?.(o.name,current?.id)||{label:o.name,purpose:'Part of the practical apparatus.',how:'Used as part of the experimental setup.',use:'Keep it correctly positioned.',mistake:'Moving it unintentionally can affect the setup.'};
    const safety=info.safety?'<p class="p3d-safety">'+info.safety+'</p>':'';
    ui.panel.hidden=false;ui.panel.innerHTML='<button type="button" class="p3d-close" aria-label="Close equipment information">×</button><span class="eyebrow">'+(prefix||'SELECTED EQUIPMENT')+'</span><h4>'+info.label+'</h4><dl><dt>Purpose</dt><dd>'+info.purpose+'</dd><dt>How it works</dt><dd>'+info.how+'</dd><dt>Correct use</dt><dd>'+info.use+'</dd><dt>Common mistake</dt><dd>'+info.mistake+'</dd></dl>'+safety+'<div class="p3d-info-actions"><button type="button" data-3d-demo>Show how it works</button><button type="button" data-3d-focus>Focus view</button></div><small>Mesh: '+info.meshName+'</small>';
    ui.panel.querySelector('.p3d-close').onclick=()=>{ui.panel.hidden=true;selected=null;draw();};
    ui.panel.querySelector('[data-3d-demo]').onclick=()=>{state.demoUntil=performance.now()+2600;status.textContent='Demonstrating '+info.label+'…';animate();};
    ui.panel.querySelector('[data-3d-focus]').onclick=()=>{const off=effectiveOffset(o);state.target=[o.center[0]+off[0],o.center[1]+off[1],o.center[2]+off[2]];state.radius=Math.max(5.8,Math.min(config.radius,o.radius*7+4));draw();};
    if(state.quizTarget){
      const target=state.quizTarget;
      if(info.label===target){status.textContent='Correct — '+target;state.quizTarget=null;ui.panel.classList.add('quiz-correct');setTimeout(()=>ui.panel.classList.remove('quiz-correct'),900);}
      else status.textContent='Not quite — find '+target;
    }
    draw();
  };
  const updateLabels=()=>{
    ui.labels.hidden=!state.labels;
    if(!state.labels||!lastMVP)return;
    if(!ui.labels.dataset.ready){
      ui.labels.innerHTML=important.slice(0,14).map((x,i)=>'<button type="button" data-label-index="'+i+'">'+x.info.label+'</button>').join('');
      ui.labels.querySelectorAll('[data-label-index]').forEach(b=>b.onclick=()=>displayInfo(important[+b.dataset.labelIndex].object,'LABEL'));
      ui.labels.dataset.ready='1';
    }
    const rect=canvas.getBoundingClientRect();
    ui.labels.querySelectorAll('[data-label-index]').forEach(b=>{const o=important[+b.dataset.labelIndex].object,off=effectiveOffset(o),p=projectPoint(lastMVP,[o.center[0]+off[0],o.center[1]+off[1],o.center[2]+off[2]],rect.width,rect.height);b.style.transform='translate('+Math.round(p[0])+'px,'+Math.round(p[1])+'px)';b.hidden=p[2]<=0;});
  };
  const draw=()=>{
    if(disposed||!prog||!canvas.isConnected)return;
    const dpr=Math.min(window.devicePixelRatio||1,2),width=Math.max(1,Math.round(canvas.clientWidth*dpr)),height=Math.max(1,Math.round(canvas.clientHeight*dpr));if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    gl.viewport(0,0,width,height);gl.clearColor(.075,.12,.15,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);
    if(state.xray){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);}else{gl.disable(gl.BLEND);gl.depthMask(true);}
    const target=state.target,c=Math.cos(state.elevation),eye=[target[0]+state.radius*c*Math.cos(state.azimuth),target[1]+state.radius*c*Math.sin(state.azimuth),target[2]+state.radius*Math.sin(state.elevation)],mvp=multiply(perspective(Math.PI/4,width/height,.1,100),lookAt(eye,target));lastMVP=mvp;
    gl.useProgram(prog);gl.uniformMatrix4fv(gl.getUniformLocation(prog,'uMVP'),false,new Float32Array(mvp));
    const now=performance.now(),pulse=state.demoUntil>now?(0.5+0.5*Math.sin(now*.012)):0;
    for(const o of objects){
      gl.bindBuffer(gl.ARRAY_BUFFER,o.pos);const p=gl.getAttribLocation(prog,'aPosition');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,3,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER,o.normal);const n=gl.getAttribLocation(prog,'aNormal');gl.enableVertexAttribArray(n);gl.vertexAttribPointer(n,3,gl.FLOAT,false,0,0);
      const off=effectiveOffset(o),isSel=!!selected&&o.group===selected.group,isHover=!!hovered&&o.group===hovered.group;
      let color=o.color;if(isSel)color=pulse?[1,.88,.28]:[.96,.77,.24];else if(isHover)color=[.65,.9,.55];
      gl.uniform3fv(gl.getUniformLocation(prog,'uColor'),color);gl.uniform3fv(gl.getUniformLocation(prog,'uOffset'),off);gl.uniform1f(gl.getUniformLocation(prog,'uAlpha'),state.xray&&!isSel?.30:1);
      gl.drawArrays(gl.TRIANGLES,0,o.count);
    }
    gl.depthMask(true);updateLabels();
  };
  const animate=()=>{cancelAnimationFrame(raf);const loop=()=>{draw();if(!disposed&&state.demoUntil>performance.now())raf=requestAnimationFrame(loop);else if(!disposed&&status.textContent.startsWith('Demonstrating'))status.textContent='Drag to rotate · Shift/right-drag to pan · Scroll to zoom';};raf=requestAnimationFrame(loop);};
  const pick=(clientX,clientY)=>{
    if(!lastMVP)return null;const r=canvas.getBoundingClientRect(),x=clientX-r.left,y=clientY-r.top;let best=null,bestScore=Infinity;
    for(const o of objects){
      if(/lab bench|bench surface|bench front|graduation|tick|waveform|ray guide|lead/i.test(o.name))continue;
      const off=effectiveOffset(o),c0=[o.center[0]+off[0],o.center[1]+off[1],o.center[2]+off[2]],pc=projectPoint(lastMVP,c0,r.width,r.height),px=projectPoint(lastMVP,[c0[0]+o.radius,c0[1],c0[2]],r.width,r.height),py=projectPoint(lastMVP,[c0[0],c0[1]+o.radius,c0[2]],r.width,r.height),pz=projectPoint(lastMVP,[c0[0],c0[1],c0[2]+o.radius],r.width,r.height);
      if(pc[2]<=0)continue;const rp=Math.max(14,Math.min(95,Math.max(Math.hypot(px[0]-pc[0],px[1]-pc[1]),Math.hypot(py[0]-pc[0],py[1]-pc[1]),Math.hypot(pz[0]-pc[0],pz[1]-pc[1]))));const d=Math.hypot(x-pc[0],y-pc[1]),score=d/rp;if(score<1.18&&score<bestScore){best=o;bestScore=score;}
    }return best;
  };
  const screenPointFor=name=>{
    if(!lastMVP)return null;const o=objects.find(x=>x.name.toLowerCase().includes(String(name).toLowerCase()));if(!o)return null;const off=effectiveOffset(o),r=canvas.getBoundingClientRect(),p=projectPoint(lastMVP,[o.center[0]+off[0],o.center[1]+off[1],o.center[2]+off[2]],r.width,r.height);return{x:r.left+p[0],y:r.top+p[1],localX:p[0],localY:p[1]};
  };
  const tutorialNext=()=>{
    if(!important.length)return;state.tutorialIndex=(state.tutorialIndex+1)%important.length;const x=important[state.tutorialIndex];displayInfo(x.object,'TUTORIAL '+(state.tutorialIndex+1)+' / '+important.length);status.textContent='Tutorial: '+x.info.label;
  };
  const quizNext=()=>{
    if(!important.length)return;const index=(state.tutorialIndex+2)%important.length;state.tutorialIndex=index;state.quizTarget=important[index].info.label;selected=null;ui.panel.hidden=true;status.textContent='Quiz: click the '+state.quizTarget;draw();
  };
  loadModel(config.file).then(model=>{
    if(disposed)return;prog=program(gl);
    for(const item of geometry(model)){const pos=gl.createBuffer(),normal=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,pos);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(item.positions),gl.STATIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,normal);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(item.normals),gl.STATIC_DRAW);const dir=unit(subtract(item.center,config.target)),scale=Math.max(.3,Math.min(1.25,item.radius*.42));objects.push({...item,pos,normal,count:item.positions.length/3,group:window.getPractical3DGroupKey?.(item.name,current?.id)||item.name,offset:[0,0,0],explode:[dir[0]*scale,dir[1]*scale,Math.max(-.4,dir[2]*scale)]});}
    if(!objects.length)throw Error('Blender model has no drawable geometry');
    important=window.getPractical3DImportantEquipment?.(objects)||objects.slice(0,12).map(object=>({object,info:{label:object.name}}));
    host.dataset.modelLoaded='true';host.dataset.interactive3d='v11';status.textContent='Drag to rotate · Shift/right-drag to pan · Scroll to zoom';draw();observer=new ResizeObserver(draw);observer.observe(canvas);
    window.__practical3DInteractive={version:'11.0',host,objects,state,listObjects:()=>objects.map(o=>o.name),selectByName:name=>{const o=objects.find(x=>x.name.toLowerCase().includes(String(name).toLowerCase()));if(o)displayInfo(o);return !!o;},pickAt:(x,y)=>pick(x,y)?.name||null,screenPoint:screenPointFor,offsetOf:name=>{const o=objects.find(x=>x.name.toLowerCase().includes(String(name).toLowerCase()));return o?[...o.offset]:null;},toggleXray:()=>{state.xray=!state.xray;draw();return state.xray;},toggleExplode:()=>{state.exploded=!state.exploded;draw();return state.exploded;},setTool:t=>{state.tool=t;return state.tool;},tutorialNext,quizNext,draw};
  }).catch(e=>{
    if(disposed)return;
    host.dataset.modelError=e?.message||'Unknown 3D load error';
    status.textContent='3D model failed to load: '+host.dataset.modelError;
    fallback.hidden=false;
    let retry=host.querySelector('[data-3d-retry]');
    if(!retry){
      retry=document.createElement('button');retry.type='button';retry.dataset['3dRetry']='1';retry.textContent='Retry 3D model';
      retry.onclick=()=>{modelPromises.delete(config.file);host.dataset.modelError='';retry.remove();fallback.hidden=true;status.textContent='Retrying 3D model…';mount(config);};
      host.querySelector('.young3d-controls')?.appendChild(retry);
    }
    console.error('Apparatus 3D:',config.file,e);
  });
  let drag=null;
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('pointerdown',e=>{
    const hit=pick(e.clientX,e.clientY);canvas.setPointerCapture(e.pointerId);
    if(state.tool==='move'&&hit&&!/bench/i.test(hit.name)){selected=hit;displayInfo(hit,'FREE MOVE');drag={type:'move',x:e.clientX,y:e.clientY,group:hit.group};}
    else if(e.button===2||e.shiftKey)drag={type:'pan',x:e.clientX,y:e.clientY};
    else{if(hit){selected=hit;displayInfo(hit);}drag={type:'orbit',x:e.clientX,y:e.clientY};}
  });
  canvas.addEventListener('pointermove',e=>{
    const hit=pick(e.clientX,e.clientY);if(!drag){if(hit!==hovered){hovered=hit;canvas.style.cursor=hit?'pointer':'grab';draw();}return;}
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;
    if(drag.type==='orbit'){state.azimuth+=dx*.008;state.elevation=Math.max(-1.25,Math.min(1.25,state.elevation+dy*.006));}
    else{const right=[-Math.sin(state.azimuth),Math.cos(state.azimuth),0],up=[-Math.sin(state.elevation)*Math.cos(state.azimuth),-Math.sin(state.elevation)*Math.sin(state.azimuth),Math.cos(state.elevation)],scale=state.radius*.0025;
      if(drag.type==='pan'){for(let i=0;i<3;i++)state.target[i]+=(-dx*right[i]+dy*up[i])*scale;}
      if(drag.type==='move'){for(const o of objects)if(o.group===drag.group)for(let i=0;i<3;i++)o.offset[i]+=(dx*right[i]-dy*up[i])*scale;}
    }draw();
  });
  const endDrag=()=>{drag=null;canvas.style.cursor='grab';};canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);
  canvas.addEventListener('wheel',e=>{e.preventDefault();state.radius=Math.max(4.5,Math.min(28,state.radius*Math.exp(e.deltaY*.001)));draw();},{passive:false});
  host.querySelector('[data-young-reset]').onclick=()=>{state.azimuth=config.azimuth;state.elevation=config.elevation;state.radius=config.radius;state.target=[...config.target];draw();};
  host.querySelector('[data-young-expand]').onclick=e=>{const expanded=host.classList.toggle('young3d-expanded');if(expanded)document.body.appendChild(host);else if(home.isConnected)home.insertBefore(host,next?.isConnected?next:null);e.currentTarget.textContent=expanded?'Close large view':'Enlarge 3D view';requestAnimationFrame(draw);};
  ui.tools.querySelector('[data-3d-mode]').onclick=e=>{state.tool=state.tool==='move'?'orbit':'move';e.currentTarget.textContent=state.tool==='move'?'Free move 3D':'Guided 3D';host.classList.toggle('p3d-free-move',state.tool==='move');status.textContent=state.tool==='move'?'Free move: drag equipment to reposition it':'Guided 3D: apparatus locked; drag to rotate';};
  ui.tools.querySelector('[data-3d-labels]').onclick=e=>{state.labels=!state.labels;e.currentTarget.classList.toggle('active',state.labels);draw();};
  ui.tools.querySelector('[data-3d-xray]').onclick=e=>{state.xray=!state.xray;e.currentTarget.classList.toggle('active',state.xray);draw();};
  ui.tools.querySelector('[data-3d-explode]').onclick=e=>{state.exploded=!state.exploded;e.currentTarget.classList.toggle('active',state.exploded);draw();};
  ui.tools.querySelector('[data-3d-tutorial]').onclick=tutorialNext;ui.tools.querySelector('[data-3d-quiz]').onclick=quizNext;
  ui.tools.querySelector('[data-3d-reset-objects]').onclick=()=>{objects.forEach(o=>o.offset=[0,0,0]);state.exploded=false;state.xray=false;state.labels=false;state.tool='orbit';selected=hovered=null;ui.panel.hidden=true;ui.labels.hidden=true;ui.tools.querySelectorAll('.active').forEach(x=>x.classList.remove('active'));ui.tools.querySelector('[data-3d-mode]').textContent='Guided 3D';host.classList.remove('p3d-free-move');status.textContent='Apparatus reset';draw();};
}
const MODEL_REGISTRY={
1:[{file:'assets/rp01-standing-waves.glb',target:[0,0,.8],azimuth:-1.03,elevation:.34,radius:10.4,label:'standing waves on a string'}],
2:[
 {file:'assets/rp02-double-slit.glb',target:[0,0,1.15],azimuth:-2.18,elevation:.38,radius:10.5,label:'Young double-slit optical bench'},
 {file:'assets/rp02-diffraction-grating.glb',target:[0,0,1.0],azimuth:-2.10,elevation:.34,radius:10.1,label:'diffraction-grating optical bench'}
],
3:[{file:'assets/rp03-free-fall.glb',target:[0,0,2.0],azimuth:-1.12,elevation:.34,radius:11.4,label:'free-fall timing apparatus'}],
4:[{file:'assets/rp04-young-modulus.glb',target:[0,0,2.55],azimuth:-1.02,elevation:.35,radius:11.9,label:'Young modulus twin-wire apparatus'}],
5:[{file:'assets/rp05-resistivity-wire.glb',target:[0,0,.75],azimuth:-1.08,elevation:.32,radius:11.3,label:'resistivity-of-a-wire circuit'}],
6:[{file:'assets/rp06-iv-characteristics.glb',target:[0,0,.75],azimuth:-1.05,elevation:.31,radius:10.8,label:'current-voltage characteristics circuit'}],
7:[
 {file:'assets/rp07-pendulum.glb',target:[0,0,2.0],azimuth:-1.12,elevation:.33,radius:10.8,label:'simple pendulum SHM setup'},
 {file:'assets/rp07-spring.glb',target:[0,0,2.0],azimuth:-1.10,elevation:.34,radius:10.8,label:'spring-mass SHM setup'}
],
8:[
 {file:'assets/rp08-boyle-syringe.glb',target:[0,0,2.25],azimuth:-1.12,elevation:.32,radius:10.8,label:'Boyle-law gas syringe setup'},
 {file:'assets/rp08-charles-law.glb',target:[0,0,1.2],azimuth:-1.10,elevation:.31,radius:10.4,label:'Charles-law water-bath setup'}
],
9:[{file:'assets/rp09-capacitor.glb',target:[0,0,.7],azimuth:-1.08,elevation:.30,radius:10.4,label:'capacitor charge/discharge circuit'}],
10:[{file:'assets/rp10-wire-balance.glb',target:[.3,0,1.0],azimuth:-1.02,elevation:.31,radius:11.3,label:'force-on-a-wire balance setup'}],
11:[{file:'assets/rp11-search-coil.glb',target:[0,0,1.5],azimuth:-1.05,elevation:.31,radius:11.0,label:'search-coil induction setup'}],
12:[{file:'assets/rp12-inverse-square.glb',target:[0,0,1.25],azimuth:-1.10,elevation:.31,radius:10.5,label:'inverse-square detector geometry'}]
};
function currentConfig(id=current?.id,mode=typeof currentMode==='number'?currentMode:0){
 const list=MODEL_REGISTRY[id],base=list?.[mode]||list?.[0];if(!base)return null;
 const selector=id===2?'#doubleSlit3d':id===4?'#young3d':'#practical3d';
 return {selector,...base};
}
window.PRACTICAL_3D_MODELS=MODEL_REGISTRY;
window.getPractical3DConfig=currentConfig;
window.mountCurrentPractical3D=()=>{const cfg=currentConfig();if(cfg)mount(cfg);};
window.mountYoungModulus3D=()=>mount(currentConfig(4,0));
window.mountDoubleSlit3D=()=>mount(currentConfig(2,0));
window.unmountPractical3D=()=>{active?.dispose();active=null;};
window.unmountYoungModulus3D=window.unmountPractical3D;
})();
