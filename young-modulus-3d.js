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
        const mat=json.materials?.[material]||{},pbr=mat.pbrMetallicRoughness||{};
        items.push({
          name:node.name||mesh.name||('Part '+id+'-'+pi),
          color:pbr.baseColorFactor?.slice(0,3)||[.7,.8,.8],
          alpha:Number.isFinite(pbr.baseColorFactor?.[3])?pbr.baseColorFactor[3]:1,
          metallic:Number.isFinite(pbr.metallicFactor)?pbr.metallicFactor:0,
          roughness:Number.isFinite(pbr.roughnessFactor)?pbr.roughnessFactor:.5,
          emissive:mat.emissiveFactor?.slice(0,3)||[0,0,0],
          positions,normals,center,radius,min,max
        });
      });
    }
    for(const child of node.children||[])visit(child,matrix);
  }
  for(const id of json.scenes[json.scene||0].nodes)visit(id,identity());
  return items;
}

function makeFallbackBox(name,center,size,color){
  const [cx,cy,cz]=center,[sx,sy,sz]=size;
  const x0=cx-sx/2,x1=cx+sx/2,y0=cy-sy/2,y1=cy+sy/2,z0=cz-sz/2,z1=cz+sz/2;
  const positions=[],normals=[];
  const face=(a,b,c,d,n)=>{
    for(const p of [a,b,c,a,c,d]){positions.push(...p);normals.push(...n);}
  };
  face([x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[0,0,-1]);
  face([x0,y0,z1],[x0,y1,z1],[x1,y1,z1],[x1,y0,z1],[0,0,1]);
  face([x0,y0,z0],[x0,y0,z1],[x1,y0,z1],[x1,y0,z0],[0,-1,0]);
  face([x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1],[0,1,0]);
  face([x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1],[-1,0,0]);
  face([x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0],[1,0,0]);
  return {name,color,alpha:1,metallic:.08,roughness:.48,emissive:[0,0,0],positions,normals,center:[cx,cy,cz],radius:Math.max(.06,Math.hypot(sx,sy,sz)/2),min:[x0,y0,z0],max:[x1,y1,z1]};
}
function fallbackScene(id,mode=0){
  const green=[.25,.62,.43],orange=[.88,.53,.22],blue=[.25,.50,.78],cream=[.78,.82,.72],red=[.78,.28,.25],metal=[.58,.68,.66],dark=[.20,.28,.27],yellow=[.88,.74,.20];
  const common=[['Lab bench',[0,0,-.18],[7.8,4.2,.35],dark]];
  const scenes={
    1:[['Signal generator',[-2.5,-.9,.55],[1.25,.8,.8],orange],['Vibration generator',[-1.05,0,.55],[.65,.65,.85],green],['Metre rule',[.7,.1,.25],[4.1,.18,.12],cream],['Pulley',[2.5,.1,.75],[.55,.38,.55],metal],['Mass hanger',[2.65,.1,-.15],[.5,.5,1.25],yellow]],
    2:[['Laser',[-2.6,0,.55],[1.0,.55,.55],red],[mode?'Diffraction grating':'Double slit',[-.8,0,.65],[.18,1.0,1.1],metal],['Projection screen',[2.2,0,1.0],[.18,2.4,2.0],cream],['Metre rule',[.25,1.35,.18],[5.0,.16,.12],yellow]],
    3:[['Release mechanism',[-1.0,0,2.6],[.8,.8,.55],green],['Ball bearing',[-1.0,0,1.65],[.45,.45,.45],metal],['Light gate',[-1.0,0,.55],[1.1,.5,.85],blue],['Data logger',[1.7,-.8,.55],[1.45,.9,.85],orange],['Metre rule',[.15,1.1,1.35],[.16,.18,3.4],cream]],
    4:[['Reference wire',[-.65,0,1.65],[.10,.10,3.6],metal],['Test wire',[.65,0,1.65],[.10,.10,3.6],metal],['Vernier comparison',[0,0,1.35],[1.75,.55,.45],blue],['Mass hanger',[.65,0,-.4],[.55,.55,1.1],yellow],['Micrometer',[2.2,-.7,.45],[1.25,.65,.55],green]],
    5:[['DC power supply',[-2.45,-.75,.55],[1.45,.9,.85],orange],['Ammeter',[-.65,-.8,.5],[1.05,.75,.72],blue],['Voltmeter',[.8,-.8,.5],[1.05,.75,.72],green],['Resistance wire',[.3,.55,.55],[4.3,.12,.12],metal],['Sliding contact',[.65,.55,.7],[.35,.45,.42],yellow]],
    6:[['Cell holder',[-.1,-.7,.38],[1.2,.7,.45],cream],['Ammeter',[-2.2,-.8,.6],[.8,.5,1.0],yellow],['Voltmeter',[2.0,-.8,.6],[.8,.5,1.0],yellow],['Variable resistor',[.4,.55,.55],[2.0,.7,.75],metal],['Switch',[-1.0,-.65,.42],[.8,.45,.3],red]],
    7:mode?[['Retort stand',[-1.1,0,1.6],[.28,.4,3.3],metal],['Spring',[-.3,0,1.55],[.32,.32,2.35],green],['Mass hanger',[-.3,0,.0],[.65,.65,.85],yellow],['Metre rule',[1.1,.3,1.4],[.15,.18,3.1],cream]]:[['Retort stand',[-1.1,0,1.6],[.28,.4,3.3],metal],['Pendulum',[.1,0,1.55],[.13,.13,2.55],green],['Pendulum bob',[.1,0,.18],[.62,.62,.62],yellow],['Fiducial marker',[1.0,0,.35],[.22,.55,.85],orange],['Metre rule',[1.65,.35,1.4],[.15,.18,3.1],cream]],
    8:mode?[['Water bath',[0,0,.45],[2.7,2.0,.9],blue],['Gas flask',[0,0,1.3],[1.1,1.1,1.3],cream],['Thermometer',[1.2,0,1.55],[.18,.18,2.25],red],['Volume scale',[-1.35,0,1.05],[.18,.25,1.75],yellow]]:[['Gas syringe',[0,0,1.0],[3.2,.78,.82],cream],['Syringe plunger',[-1.7,0,1.0],[1.0,.45,.45],metal],['Mass hanger',[1.1,0,1.85],[.7,.7,.9],yellow],['Pressure scale',[0,1.0,.45],[2.4,.25,.55],blue]],
    9:[['DC power supply',[-2.4,-.75,.55],[1.45,.9,.85],orange],['Capacitor',[0,.35,.65],[1.1,.7,1.05],blue],['Voltmeter',[1.55,-.75,.5],[1.05,.75,.72],green],['Switch',[-.45,-.75,.42],[.85,.45,.3],red],['Variable resistor',[2.25,.35,.55],[1.2,.55,.55],metal]],
    10:[['Balance',[0,0,.4],[3.1,1.2,.55],blue],['Current-carrying straight wire',[0,0,1.0],[4.3,.10,.10],metal],['Magnet',[-.75,0,1.05],[.8,1.2,1.1],red],['Magnet',[.75,0,1.05],[.8,1.2,1.1],blue],['Ammeter',[2.45,-.85,.5],[1.05,.75,.72],green]],
    11:[['Search coil',[0,0,1.15],[1.4,.38,1.4],green],['Field coil',[-1.8,0,1.15],[1.3,.5,1.65],blue],['Signal generator',[1.9,-.75,.55],[1.4,.85,.8],orange],['Oscilloscope',[1.9,.7,.65],[1.5,.9,1.0],dark],['Metre rule',[0,1.25,.22],[4.7,.16,.12],cream]],
    12:[['GM tube',[0,0,1.0],[.65,.65,1.7],blue],['Detector stand',[0,0,.25],[1.2,1.0,.45],metal],['Counter',[2.0,-.75,.55],[1.4,.9,.85],orange],['Distance scale',[0,1.15,.22],[4.6,.16,.12],yellow],['Simulation source marker',[-2.0,0,.9],[.55,.55,.55],red]]
  };
  return [...common,...(scenes[id]||[])].map(x=>makeFallbackBox(...x));
}

const subtract=(a,b)=>a.map((v,i)=>v-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>{const d=Math.hypot(...a)||1;return a.map(v=>v/d);};
function lookAt(eye,target){const z=unit(subtract(eye,target)),x=unit(cross([0,0,1],z)),y=cross(z,x);return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-x[0]*eye[0]-x[1]*eye[1]-x[2]*eye[2],-y[0]*eye[0]-y[1]*eye[1]-y[2]*eye[2],-z[0]*eye[0]-z[1]*eye[1]-z[2]*eye[2],1];}
function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2);return [f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0];}
function shader(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
function program(gl){
const vertex=`attribute vec3 aPosition;attribute vec3 aNormal;uniform mat4 uMVP;uniform vec3 uOffset;uniform vec3 uPivot;uniform vec3 uAxis;uniform float uAngle;varying vec3 vNormal;varying vec3 vWorldPos;
vec3 rotateAxis(vec3 v,vec3 axis,float a){axis=normalize(axis);float c=cos(a),s=sin(a);return v*c+cross(axis,v)*s+axis*dot(axis,v)*(1.0-c);}
void main(){vec3 q=aPosition-uPivot;vec3 rotated=rotateAxis(q,uAxis,uAngle)+uPivot+uOffset;vNormal=normalize(rotateAxis(aNormal,uAxis,uAngle));vWorldPos=rotated;gl_Position=uMVP*vec4(rotated,1.0);}`;
const fragment=`precision highp float;varying vec3 vNormal;varying vec3 vWorldPos;uniform vec3 uColor;uniform vec3 uEye;uniform float uMetallic;uniform float uRoughness;uniform vec3 uEmissive;uniform float uAlpha;
const float PI=3.14159265359;
float Dggx(float NoH,float a){float a2=a*a;float d=NoH*NoH*(a2-1.0)+1.0;return a2/max(PI*d*d,.0001);}
float G1(float NoV,float k){return NoV/max(NoV*(1.0-k)+k,.0001);}
vec3 fresnel(vec3 F0,float VoH){return F0+(1.0-F0)*pow(1.0-VoH,5.0);}
vec3 lightBRDF(vec3 N,vec3 V,vec3 L,vec3 radiance,vec3 base,float metal,float rough,vec3 F0){
 vec3 H=normalize(V+L);float NoL=max(dot(N,L),0.0),NoV=max(dot(N,V),0.001),NoH=max(dot(N,H),0.0),VoH=max(dot(V,H),0.0);
 float a=max(.055,rough*rough),k=(rough+1.0)*(rough+1.0)/8.0;
 vec3 F=fresnel(F0,VoH);float D=Dggx(NoH,a),G=G1(NoV,k)*G1(NoL,k);
 vec3 spec=(D*G*F)/max(4.0*NoV*NoL,.001);vec3 kd=(1.0-F)*(1.0-metal);
 return (kd*base/PI+spec)*radiance*NoL;
}
void main(){
 vec3 N=normalize(vNormal),V=normalize(uEye-vWorldPos),base=max(uColor,vec3(.008));
 float metal=clamp(uMetallic,0.0,1.0),rough=clamp(uRoughness,.055,1.0);vec3 F0=mix(vec3(.04),base,metal);
 vec3 key=lightBRDF(N,V,normalize(vec3(-.45,-.72,.88)),vec3(3.0,2.85,2.55),base,metal,rough,F0);
 vec3 fill=lightBRDF(N,V,normalize(vec3(.84,.28,.48)),vec3(.85,1.00,1.12),base,metal,rough,F0);
 vec3 rim=lightBRDF(N,V,normalize(vec3(.18,.92,.34)),vec3(.56,.66,.78),base,metal,rough,F0);
 float hemi=N.z*.5+.5;vec3 env=mix(vec3(.095,.080,.064),vec3(.24,.275,.29),hemi);
 vec3 ambient=env*base*(.62-.23*metal)+F0*.035;
 float contact=clamp((vWorldPos.z+.35)/1.0,0.0,1.0);ambient*=mix(.78,1.0,contact);
 vec3 color=ambient+key+fill+rim+uEmissive*1.7;
 color=vec3(1.0)-exp(-color*1.18);color=pow(color,vec3(1.0/2.2));
 float vignette=1.0-clamp(length(gl_FragCoord.xy/vec2(1600.0,1100.0)-.5)*.12,0.0,.07);color*=vignette;
 gl_FragColor=vec4(color,clamp(uAlpha,0.0,1.0));
}`;
const p=gl.createProgram();gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,vertex));gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,fragment));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;
}
function projectPoint(m,p,w,h){const x=m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],y=m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],q=m[3]*p[0]+m[7]*p[1]+m[11]*p[2]+m[15]||1;return[(x/q*.5+.5)*w,(1-(y/q*.5+.5))*h,q];}
function mount(config){
  if(active)active.dispose();
  const host=document.querySelector(config.selector);if(!host)return;
  const home=host.parentNode,next=host.nextSibling,canvas=host.querySelector('canvas'),fallback=host.querySelector('.young3d-fallback'),status=host.querySelector('.young3d-status'),gl=canvas.getContext('webgl',{antialias:true,alpha:true,premultipliedAlpha:false});
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
    gl.viewport(0,0,width,height);gl.clearColor(.77,.80,.79,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    const target=state.target,c=Math.cos(state.elevation),eye=[target[0]+state.radius*c*Math.cos(state.azimuth),target[1]+state.radius*c*Math.sin(state.azimuth),target[2]+state.radius*Math.sin(state.elevation)],mvp=multiply(perspective(Math.PI/4,width/height,.1,100),lookAt(eye,target));lastMVP=mvp;
    gl.useProgram(prog);gl.uniformMatrix4fv(gl.getUniformLocation(prog,'uMVP'),false,new Float32Array(mvp));gl.uniform3fv(gl.getUniformLocation(prog,'uEye'),eye);
    const now=performance.now(),pulse=state.demoUntil>now?(0.5+0.5*Math.sin(now*.012)):0;
    const ordered=[...objects].sort((a,b)=>(b.alpha??1)-(a.alpha??1));
    for(const o of ordered){
      gl.bindBuffer(gl.ARRAY_BUFFER,o.pos);const p=gl.getAttribLocation(prog,'aPosition');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,3,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER,o.normal);const n=gl.getAttribLocation(prog,'aNormal');gl.enableVertexAttribArray(n);gl.vertexAttribPointer(n,3,gl.FLOAT,false,0,0);
      const off=effectiveOffset(o),isSel=!!selected&&o.group===selected.group,isHover=!!hovered&&o.group===hovered.group;
      let color=o.color;if(isSel)color=pulse?[1,.88,.28]:[.96,.77,.24];else if(isHover)color=[.65,.9,.55];
      const alpha=state.xray&&!isSel?.28:(o.alpha??1);gl.depthMask(alpha>.985);
      gl.uniform3fv(gl.getUniformLocation(prog,'uColor'),color);gl.uniform3fv(gl.getUniformLocation(prog,'uOffset'),off);gl.uniform3fv(gl.getUniformLocation(prog,'uPivot'),o.pivot||o.center);gl.uniform3fv(gl.getUniformLocation(prog,'uAxis'),o.axis||[0,0,1]);gl.uniform1f(gl.getUniformLocation(prog,'uAngle'),o.angle||0);gl.uniform1f(gl.getUniformLocation(prog,'uMetallic'),o.metallic??0);gl.uniform1f(gl.getUniformLocation(prog,'uRoughness'),o.roughness??.5);gl.uniform3fv(gl.getUniformLocation(prog,'uEmissive'),o.emissive||[0,0,0]);gl.uniform1f(gl.getUniformLocation(prog,'uAlpha'),alpha);
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
  const matchObject=name=>{
    const query=String(name||'').toLowerCase();
    return objects.find(o=>o.name.toLowerCase().includes(query))||null;
  };
  const membersFor=name=>{
    const first=matchObject(name);return first?objects.filter(o=>o.group===first.group):[];
  };
  const setGroupOffset=(name,next)=>{
    const members=membersFor(name);if(!members.length)return false;
    members.forEach(o=>o.offset=[next[0]||0,next[1]||0,next[2]||0]);draw();return true;
  };
  const nudgeGroup=(name,delta)=>{
    const members=membersFor(name);if(!members.length)return false;
    members.forEach(o=>o.offset=o.offset.map((v,i)=>v+(delta[i]||0)));draw();return true;
  };
  const setGroupAngle=(name,angle,axis=[0,0,1],pivot=null)=>{
    const members=membersFor(name);if(!members.length)return false;
    members.forEach(o=>{o.angle=angle;o.axis=[...axis];if(Array.isArray(pivot))o.pivot=[...pivot];});draw();return true;
  };
  const setGroupTransform=(name,next={})=>{
    const members=membersFor(name);if(!members.length)return false;
    members.forEach(o=>{
      if(Array.isArray(next.offset))o.offset=[...next.offset];
      if(Number.isFinite(next.angle))o.angle=next.angle;
      if(Array.isArray(next.axis))o.axis=[...next.axis];
      if(Array.isArray(next.pivot))o.pivot=[...next.pivot];
    });draw();return true;
  };
  const animateGroup=(name,to={},duration=850,easing='smooth')=>{
    const members=membersFor(name);if(!members.length)return Promise.resolve(false);
    const startOffset=[...members[0].offset],startAngle=members[0].angle||0;
    const targetOffset=Array.isArray(to.offset)?to.offset:startOffset,targetAngle=Number.isFinite(to.angle)?to.angle:startAngle;
    const axis=Array.isArray(to.axis)?to.axis:members[0].axis||[0,0,1],pivot=Array.isArray(to.pivot)?to.pivot:members[0].pivot||members[0].center;
    const ease=t=>easing==='linear'?t:easing==='gravity'?t*t:easing==='spring'?(1-Math.cos(t*Math.PI*2.5)*Math.exp(-4*t)):(t*t*(3-2*t));
    const t0=performance.now();
    return new Promise(resolve=>{
      const step=now=>{
        if(disposed){resolve(false);return;}
        const raw=Math.min(1,(now-t0)/Math.max(1,duration)),k=ease(raw);
        const off=startOffset.map((v,i)=>v+(targetOffset[i]-v)*k),angle=startAngle+(targetAngle-startAngle)*k;
        members.forEach(o=>{o.offset=[...off];o.angle=angle;o.axis=[...axis];o.pivot=[...pivot];});draw();
        if(raw<1)requestAnimationFrame(step);else resolve(true);
      };requestAnimationFrame(step);
    });
  };
  const tutorialNext=()=>{
    if(!important.length)return;state.tutorialIndex=(state.tutorialIndex+1)%important.length;const x=important[state.tutorialIndex];displayInfo(x.object,'TUTORIAL '+(state.tutorialIndex+1)+' / '+important.length);status.textContent='Tutorial: '+x.info.label;
  };
  const quizNext=()=>{
    if(!important.length)return;const index=(state.tutorialIndex+2)%important.length;state.tutorialIndex=index;state.quizTarget=important[index].info.label;selected=null;ui.panel.hidden=true;status.textContent='Quiz: click the '+state.quizTarget;draw();
  };
  const installGeometry=(items,source)=>{
    if(disposed)return;
    prog=program(gl);
    for(const item of items){
      const pos=gl.createBuffer(),normal=gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER,pos);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(item.positions),gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER,normal);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(item.normals),gl.STATIC_DRAW);
      const dir=unit(subtract(item.center,config.target)),scale=Math.max(.3,Math.min(1.25,item.radius*.42));
      objects.push({...item,pos,normal,count:item.positions.length/3,group:window.getPractical3DGroupKey?.(item.name,current?.id)||item.name,offset:[0,0,0],angle:0,axis:[0,0,1],pivot:[...item.center],explode:[dir[0]*scale,dir[1]*scale,Math.max(-.4,dir[2]*scale)]});
    }
    if(!objects.length)throw Error('3D apparatus has no drawable geometry');
    important=window.getPractical3DImportantEquipment?.(objects)||objects.filter(o=>!/lab bench/i.test(o.name)).slice(0,12).map(object=>({object,info:{label:object.name}}));
    host.dataset.modelLoaded='true';host.dataset.interactive3d='v14';host.dataset.modelSource=source;
    fallback.hidden=true;
    status.textContent=(source==='procedural'?'Built-in 3D fallback active · ':'')+'Photo 3D · drag to rotate · Shift/right-drag to pan · scroll to zoom';
    draw();observer=new ResizeObserver(draw);observer.observe(canvas);
    window.__practical3DInteractive={version:'14.0',renderQuality:'photoreal-pbr',modelSource:source,host,objects,state,listObjects:()=>objects.map(o=>o.name),selectByName:name=>{const o=objects.find(x=>x.name.toLowerCase().includes(String(name).toLowerCase()));if(o)displayInfo(o);return !!o;},pickAt:(x,y)=>pick(x,y)?.name||null,screenPoint:screenPointFor,offsetOf:name=>{const o=matchObject(name);return o?[...o.offset]:null;},angleOf:name=>matchObject(name)?.angle||0,setGroupOffset,nudgeGroup,setGroupAngle,setGroupTransform,animateGroup,toggleXray:()=>{state.xray=!state.xray;draw();return state.xray;},toggleExplode:()=>{state.exploded=!state.exploded;draw();return state.exploded;},setTool:t=>{state.tool=t;return state.tool;},tutorialNext,quizNext,draw};try{window.installPractical3DPhysicalActions?.(config,window.__practical3DInteractive);}catch(actionError){console.warn('3D physical actions:',actionError);}
  };
  loadModel(config.file).then(model=>installGeometry(geometry(model),'glb')).catch(e=>{
    if(disposed)return;
    console.warn('Primary GLB unavailable; using built-in apparatus geometry:',config.file,e);
    try{
      host.dataset.modelError=e?.message||'Primary GLB unavailable';
      installGeometry(fallbackScene(config.id,config.mode),'procedural');
      status.textContent='Built-in 3D fallback active · primary model unavailable · all interaction tools still work';
    }catch(fallbackError){
      host.dataset.modelError=(e?.message||'Unknown 3D load error')+'; fallback: '+(fallbackError?.message||fallbackError);
      status.textContent='3D model failed to load: '+host.dataset.modelError;
      fallback.hidden=false;
      let retry=host.querySelector('[data-3d-retry]');
      if(!retry){
        retry=document.createElement('button');retry.type='button';retry.dataset['3dRetry']='1';retry.textContent='Retry 3D model';
        retry.onclick=()=>{modelPromises.delete(config.file);host.dataset.modelError='';retry.remove();fallback.hidden=true;status.textContent='Retrying 3D model…';mount(config);};
        host.querySelector('.young3d-controls')?.appendChild(retry);
      }
      console.error('Apparatus 3D:',config.file,fallbackError);
    }
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
  ui.tools.querySelector('[data-3d-reset-objects]').onclick=()=>{objects.forEach(o=>{o.offset=[0,0,0];o.angle=0;o.axis=[0,0,1];o.pivot=[...o.center];});state.exploded=false;state.xray=false;state.labels=false;state.tool='orbit';selected=hovered=null;ui.panel.hidden=true;ui.labels.hidden=true;ui.tools.querySelectorAll('.active').forEach(x=>x.classList.remove('active'));ui.tools.querySelector('[data-3d-mode]').textContent='Guided 3D';host.classList.remove('p3d-free-move');status.textContent='Apparatus reset';draw();};
}
const MODEL_REGISTRY={
1:[{file:'assets/rp01-standing-waves.glb',target:[0,0,.8],azimuth:-1.03,elevation:.34,radius:9.3,label:'standing waves on a string'}],
2:[
 {file:'assets/rp02-double-slit.glb',target:[0,0,1.15],azimuth:-2.18,elevation:.38,radius:9.5,label:'Young double-slit optical bench'},
 {file:'assets/rp02-diffraction-grating.glb',target:[0,0,1.0],azimuth:-2.10,elevation:.34,radius:9.4,label:'diffraction-grating optical bench'}
],
3:[{file:'assets/rp03-free-fall.glb',target:[0,0,2.0],azimuth:-1.12,elevation:.34,radius:10.2,label:'free-fall light-gate timing apparatus'},{file:'assets/rp03-free-fall-impact.glb',target:[0,0,2.0],azimuth:-1.12,elevation:.34,radius:10.1,label:'AQA mechanical-release and impact-timer apparatus'}],
4:[{file:'assets/rp04-young-modulus.glb',target:[0,0,2.55],azimuth:-1.02,elevation:.35,radius:10.6,label:'Young modulus twin-wire apparatus'}],
5:[{file:'assets/rp05-resistivity-wire.glb',target:[0,0,.75],azimuth:-1.08,elevation:.32,radius:10.2,label:'resistivity-of-a-wire circuit'}],
6:[{file:'assets/rp06-iv-characteristics.glb',target:[0,0,.65],azimuth:-1.05,elevation:.34,radius:9.7,label:'AQA emf and internal-resistance circuit'}],
7:[
 {file:'assets/rp07-pendulum.glb',target:[0,0,2.0],azimuth:-1.12,elevation:.33,radius:9.8,label:'simple pendulum SHM setup'},
 {file:'assets/rp07-spring.glb',target:[0,0,2.0],azimuth:-1.10,elevation:.34,radius:9.8,label:'spring-mass SHM setup'}
],
8:[
 {file:'assets/rp08-boyle-syringe.glb',target:[0,0,2.25],azimuth:-1.12,elevation:.32,radius:9.8,label:'Boyle-law gas syringe setup'},
 {file:'assets/rp08-charles-law.glb',target:[0,0,1.2],azimuth:-1.10,elevation:.31,radius:9.5,label:'Charles-law water-bath setup'}
],
9:[{file:'assets/rp09-capacitor.glb',target:[0,0,.7],azimuth:-1.08,elevation:.30,radius:9.5,label:'capacitor charge/discharge circuit'}],
10:[{file:'assets/rp10-wire-balance.glb',target:[.3,0,1.0],azimuth:-1.02,elevation:.31,radius:10.3,label:'force-on-a-wire balance setup'}],
11:[{file:'assets/rp11-search-coil.glb',target:[0,0,1.5],azimuth:-1.05,elevation:.31,radius:10.0,label:'search-coil induction setup'}],
12:[{file:'assets/rp12-inverse-square.glb',target:[0,0,1.25],azimuth:-1.10,elevation:.31,radius:9.6,label:'inverse-square detector geometry'}]
};
function currentConfig(id=current?.id,mode=typeof currentMode==='number'?currentMode:0){
 const list=MODEL_REGISTRY[id],base=list?.[mode]||list?.[0];if(!base)return null;
 const selector=id===2?'#doubleSlit3d':id===4?'#young3d':'#practical3d';
 return {selector,id,mode,...base};
}
window.PRACTICAL_3D_MODELS=MODEL_REGISTRY;
window.getPractical3DConfig=currentConfig;
window.mountCurrentPractical3D=()=>{const cfg=currentConfig();if(cfg)mount(cfg);};
window.mountYoungModulus3D=()=>mount(currentConfig(4,0));
window.mountDoubleSlit3D=()=>mount(currentConfig(2,0));
window.unmountPractical3D=()=>{active?.dispose();active=null;};
window.unmountYoungModulus3D=window.unmountPractical3D;
})();
