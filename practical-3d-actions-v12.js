(()=>{
'use strict';
if(window.__practical3DPhysicalActionsV12)return;

const pick=(api,candidates)=>{
  const names=api.listObjects();
  for(const term of candidates){
    const found=names.find(n=>n.toLowerCase().includes(term.toLowerCase()));
    if(found)return found;
  }
  return null;
};
const status=(api,text)=>{
  const node=api.host?.querySelector('.young3d-status');
  if(node)node.textContent=text;
};
const action=(label,description,candidates,run)=>({label,description,candidates,run});
const uniqueGroupNames=(api,re)=>{
  const seen=new Set(),names=[];
  for(const o of api.objects||[]){
    if(!re.test(o.name)||seen.has(o.group))continue;
    seen.add(o.group);names.push(o.name);
  }
  return names;
};
const clamp=(v,limit)=>Math.max(-limit,Math.min(limit,v));
const boundedNudge=(api,name,delta,bounds=[2.6,2.0,2.8])=>{
  const current=api.offsetOf(name)||[0,0,0];
  const next=current.map((v,i)=>clamp(v+(delta[i]||0),bounds[i]??2.5));
  api.setGroupOffset(name,next);return next;
};
const nudgeMatching=(api,re,delta,bounds)=>uniqueGroupNames(api,re).forEach(n=>boundedNudge(api,n,delta,bounds));
const animateMatching=(api,re,to,duration,easing)=>Promise.all(uniqueGroupNames(api,re).map(n=>api.animateGroup(n,to,duration,easing)));


const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const rawObjects=(api,re)=>(api.objects||[]).filter(o=>re.test(o.name));
const setVisualMatching=(api,re,next={})=>{
  for(const o of rawObjects(api,re)){
    if(Array.isArray(next.color))o.visualColor=[...next.color];else if(next.color===null)o.visualColor=null;
    if(Array.isArray(next.emissive))o.visualEmissive=[...next.emissive];else if(next.emissive===null)o.visualEmissive=null;
    if(Number.isFinite(next.alpha))o.visualAlpha=next.alpha;else if(next.alpha===null)o.visualAlpha=null;
  }
  api.draw?.();
};
const pulseMatching=async(api,re,emissive=[.85,.18,.06],ms=260)=>{
  setVisualMatching(api,re,{emissive});await sleep(ms);setVisualMatching(api,re,{emissive:null});
};
const animateStandingWave=async api=>{
  const segments=rawObjects(api,/standing wave string segment/i).sort((a,b)=>a.name.localeCompare(b.name));
  if(!segments.length)return false;
  status(api,'Standing wave forming · fixed nodes stay nearly still while antinodes oscillate');
  const cycles=3,frames=72,amp=.16;
  api.state.waveActive=true;api.state.waveMaxObserved=0;
  const applyPhase=phase=>{
    let max=0;
    segments.forEach((o,i)=>{
      const x=(i+.5)/segments.length,dz=amp*Math.sin(3*Math.PI*x)*Math.sin(phase);
      o.offset=[0,0,dz];max=Math.max(max,Math.abs(dz));
    });
    api.state.waveMaxObserved=Math.max(api.state.waveMaxObserved,max);
    api.draw?.();
  };
  // Hold one clear antinode shape first so students can identify nodes/antinodes
  // before the string begins oscillating rapidly.
  applyPhase(Math.PI/2);await sleep(320);
  for(let f=0;f<=frames;f++){
    const phase=cycles*Math.PI*2*f/frames;
    applyPhase(phase);await sleep(24);
  }
  segments.forEach(o=>o.offset=[0,0,0]);api.state.waveActive=false;api.draw?.();
  status(api,'Standing-wave demo complete · measure node spacing along the metre rule');
  return true;
};
const showInterference=async(api,mode)=>{
  const pattern=Number(mode)===0?/interference fringe/i:/diffraction maximum/i;
  const rays=Number(mode)===0?/interference ray|laser beam/i:/diffracted ray|laser beam/i;
  status(api,Number(mode)===0?'Coherent light passes through both slits and produces bright/dark fringes':'Diffracted beams form discrete maxima on the screen');
  for(let k=0;k<4;k++){
    setVisualMatching(api,rays,{emissive:[.65,.02,.02]});
    const objs=rawObjects(api,pattern);
    objs.forEach((o,i)=>o.visualEmissive=[.95*(1-Math.min(.75,Math.abs(i-(objs.length-1)/2)*.12)),.08,.02]);
    api.draw?.();await sleep(260);
    setVisualMatching(api,rays,{emissive:null});setVisualMatching(api,pattern,{emissive:null});await sleep(130);
  }
  status(api,'Pattern highlighted · use several fringes/orders when measuring to reduce percentage uncertainty');
};
const walkthroughs={
  1:[
    ['Signal generator',['signal generator'],'Sets the driving frequency.'],
    ['Vibration generator',['vibration generator black body','vibration generator'],'Turns the electrical signal into string motion.'],
    ['Metre rule',['metre rule'],'Measures the vibrating length and node spacing.'],
    ['Pulley',['pulley wheel','pulley'],'Redirects the string while keeping the tension line straight.'],
    ['Mass hanger',['mass hanger tray','slotted mass'],'Provides the tension through its weight.']
  ],
  2:[
    ['Laser',['laser anodised barrel','laser'],'Provides coherent monochromatic light.'],
    ['Optical element',['double slit plate','diffraction grating'],'Creates interference or diffraction.'],
    ['Optical rail',['optical rail'],'Keeps the apparatus aligned and provides a distance reference.'],
    ['Screen',['projection screen'],'Shows the fringe or diffraction pattern.'],
    ['Metre rule',['metre rule'],'Provides the source-to-screen distance.']
  ],
  3:[
    ['Release',['release mechanism green housing','mechanical release green housing'],'Releases the ball without an extra push.'],
    ['Ball bearing',['ball bearing'],'Falls through the measured distance.'],
    ['First detector',['light gate 1 bridge','impact sensor plate'],'Detects the falling object.'],
    ['Second detector',['light gate 2 bridge','data logger'],'Completes the timing measurement.'],
    ['Metre rule',['vertical metre rule'],'Sets the measured drop distance.'],
    ['Data logger',['data logger cream case','data logger'],'Records the timing signal.']
  ],
  4:[
    ['Reference wire',['reference wire'],'Provides the comparison length.'],
    ['Test wire',['long suspended wire test wire'],'Extends when extra load is applied.'],
    ['Test load',['test mass hanger tray','test slotted mass'],'Applies the tensile force.'],
    ['Vernier comparison',['vernier moving cursor','vernier comparison bridge'],'Measures the tiny extension.'],
    ['Spirit level',['spirit level glass vial'],'Shows when the comparison bridge is level.'],
    ['Micrometer',['micrometer blue c frame','micrometer'],'Measures the wire diameter.']
  ],
  5:[
    ['Power supply',['low voltage dc power supply'],'Drives a controlled current through the wire.'],
    ['Ammeter',['ammeter yellow case','ammeter'],'Measures current in series.'],
    ['Resistance wire',['resistance wire'],'The test conductor whose resistivity is calculated.'],
    ['Sliding contact',['sliding contact insulated body','sliding contact'],'Selects the measured length.'],
    ['Voltmeter',['voltmeter yellow case','voltmeter'],'Measures potential difference across that length.'],
    ['Micrometer',['micrometer blue c frame','micrometer'],'Measures wire diameter at several positions.']
  ],
  6:[
    ['Cells',['cell 1 body','cell holder white base'],'Provide the emf.'],
    ['Switch',['switch blade','switch'],'Opens or closes the circuit.'],
    ['Ammeter',['ammeter yellow case','ammeter'],'Measures series current.'],
    ['Variable resistor',['variable resistor ceramic former','variable resistor'],'Changes the external resistance.'],
    ['Voltmeter',['voltmeter yellow case','voltmeter'],'Measures terminal potential difference.'],
    ['Rheostat slider',['variable resistor sliding contact'],'Changes the effective resistance wire length.']
  ]
};
const escapeRegex=value=>String(value).replace(/[.*+?^$()|[\]{}\\]/g,'\\function actionsFor(id,mode){');
const runWalkthrough=async(config,api)=>{
  const steps=walkthroughs[Number(config.id)]||[];if(!steps.length)return false;
  const home={target:[...api.state.target],radius:api.state.radius,azimuth:api.state.azimuth,elevation:api.state.elevation};
  api.clearVisuals?.();
  for(let i=0;i<steps.length;i++){
    const [label,candidates,note]=steps[i],name=pick(api,candidates);if(!name)continue;
    status(api,`Setup walkthrough ${i+1}/${steps.length}: ${label} · ${note}`);
    api.selectByName?.(name);
    const re=new RegExp(escapeRegex(name),'i');
    setVisualMatching(api,re,{emissive:[.28,.22,.04]});
    await api.focusByName?.(name,620,{radius:5.0});
    await sleep(920);
    setVisualMatching(api,re,{emissive:null});
  }
  await api.animateCamera?.(home,700);api.clearVisuals?.();
  status(api,'Setup walkthrough complete · use the physical demo controls to see the practical operate');
  return true;
};

function actionsFor(id,mode){
  switch(Number(id)){
    case 1:return[
      action('Run standing wave','Animate the string into a clear standing-wave pattern so nodes and antinodes are visible.',['standing wave string segment'],async(api)=>animateStandingWave(api)),
      action('Add load','Move the hanging mass downward to represent increasing the string tension.',['mass hanger tray','slotted mass'],async(api)=>{nudgeMatching(api,/mass hanger|slotted mass/i,[0,0,-.16],[.2,.2,1.25]);await pulseMatching(api,/pulley wheel/i,[.25,.25,.25],180);status(api,'Load increased · greater tension changes the resonant condition');}),
      action('Lift load','Raise the hanging load.',['mass hanger tray','slotted mass'],async(api)=>{nudgeMatching(api,/mass hanger|slotted mass/i,[0,0,.16],[.2,.2,1.25]);status(api,'Load raised · compare the resonant pattern at a different tension');})
    ];
    case 2:return[
      action(Number(mode)===0?'Show interference':'Show diffraction','Illuminate the beam paths and screen pattern.',['projection screen','screen'],async(api)=>showInterference(api,mode)),
      action('Move screen farther','Increase the slit/grating-to-screen separation visually.',['projection screen','screen'],async(api,name)=>{boundedNudge(api,name,[.42,0,0],[1.45,.2,.2]);nudgeMatching(api,/interference fringe|diffraction maximum/i,[.42,0,0],[1.45,.2,.2]);status(api,'Screen moved farther away · the pattern geometry changes with distance');}),
      action('Move screen nearer','Decrease the slit/grating-to-screen separation visually.',['projection screen','screen'],async(api,name)=>{boundedNudge(api,name,[-.42,0,0],[1.45,.2,.2]);nudgeMatching(api,/interference fringe|diffraction maximum/i,[-.42,0,0],[1.45,.2,.2]);status(api,'Screen moved nearer · compare the pattern spacing');})
    ];
    case 3:return[
      action('Release ball · run free fall','Release the ball and show the detector sequence.',['ball bearing','ball'],async(api,name)=>{
        api.setGroupOffset(name,[0,0,0]);status(api,'Ball released from rest…');
        if(Number(mode)===0){
          await api.animateGroup(name,{offset:[0,0,-1.30]},320,'gravity');await pulseMatching(api,/light gate 1 (emitter|detector|bridge)/i,[.95,.05,.02],150);
          status(api,'Ball interrupts light gate 1 · timer starts');
          await api.animateGroup(name,{offset:[0,0,-2.68]},260,'gravity');await pulseMatching(api,/light gate 2 (emitter|detector|bridge)/i,[.95,.05,.02],170);
          status(api,'Ball interrupts light gate 2 · timer stops');
          await api.animateGroup(name,{offset:[0,0,-3.25]},180,'gravity');await pulseMatching(api,/data logger (lcd|screen|display)/i,[.05,.65,.10],260);
        }else{
          await api.animateGroup(name,{offset:[0,0,-3.25]},650,'gravity');await pulseMatching(api,/impact sensor plate|data logger (lcd|screen|display)/i,[.05,.65,.10],300);
          status(api,'Ball reaches the impact detector · elapsed time is recorded');
        }
        status(api,'Free-fall demo complete · reset apparatus to repeat');
      })
    ];
    case 4:return[
      action('Show extension','Apply load and exaggerate the tiny wire extension so students can see what is measured.',['long suspended wire test wire'],async(api,name)=>{
        status(api,'Applying extra test load · extension is exaggerated visually so it can be seen');
        await Promise.all([
          api.animateGroup(name,{scaleZ:1.035,pivot:[.45,.35,4.30]},650,'smooth'),
          animateMatching(api,/test mass hanger|test slotted mass/i,{offset:[0,0,-.12]},650,'smooth'),
          api.animateGroup('vernier moving cursor',{offset:[0,0,-.075]},650,'smooth')
        ]);
        await pulseMatching(api,/vernier moving cursor|vernier scale/i,[.28,.32,.05],340);
        status(api,'Test wire extended · read the vernier after re-levelling; visual extension is deliberately magnified');
      }),
      action('Unload wire','Return the test wire and load to the starting position.',['long suspended wire test wire'],async(api,name)=>{
        await Promise.all([
          api.animateGroup(name,{scaleZ:1,pivot:[.45,.35,4.30]},520,'smooth'),
          animateMatching(api,/test mass hanger|test slotted mass/i,{offset:[0,0,0]},520,'smooth'),
          api.animateGroup('vernier moving cursor',{offset:[0,0,0]},520,'smooth')
        ]);status(api,'Load removed · compare loading and unloading readings');
      })
    ];
    case 5:return[
      action('Trace measurement','Show the measured wire section and the two electrical readings.',['sliding contact insulated body','sliding contact'],async(api,name)=>{
        status(api,'Current flows through the wire; the voltmeter measures across the selected length');
        setVisualMatching(api,/resistance wire/i,{emissive:[.18,.08,.01]});await pulseMatching(api,/ammeter lcd|ammeter display/i,[.05,.55,.08],300);
        await pulseMatching(api,/voltmeter lcd|voltmeter display/i,[.05,.55,.08],300);await sleep(180);
        setVisualMatching(api,/resistance wire/i,{emissive:null});await api.focusByName?.(name,480,{radius:4.7});
        status(api,'Move the jockey to change the measured length, then record V and I');
      }),
      action('Move contact','Slide the jockey along the resistance wire.',['sliding contact insulated body','sliding contact'],async(api,name)=>{boundedNudge(api,name,[.38,0,0],[2.15,.2,.2]);await pulseMatching(api,/voltmeter lcd|voltmeter display/i,[.05,.55,.08],240);status(api,'Contact moved · the selected wire length has increased');}),
      action('Move contact back','Slide the jockey toward the start of the wire.',['sliding contact insulated body','sliding contact'],async(api,name)=>{boundedNudge(api,name,[-.38,0,0],[2.15,.2,.2]);status(api,'Contact moved back · selected length decreased');})
    ];
    case 6:return[
      action('Run circuit demo','Close the switch, show current flow, then move the rheostat slider.',['switch blade','switch'],async(api,name)=>{
        status(api,'Closing switch…');
        await api.animateGroup(name,{angle:0,axis:[0,1,0],pivot:[-1.36,-1.12,.46]},330,'smooth');
        for(const re of [/cell positive to switch/i,/switch to ammeter/i,/ammeter to variable resistor/i,/variable resistor return to cell/i]){await pulseMatching(api,re,[.55,.05,.01],180);}
        await pulseMatching(api,/ammeter lcd|ammeter display|voltmeter lcd|voltmeter display/i,[.05,.55,.08],320);
        const slider=pick(api,['variable resistor sliding contact']);
        if(slider)await api.animateGroup(slider,{offset:[.32,0,0]},460,'smooth');
        status(api,'Circuit complete · moving the rheostat changes current and terminal p.d.');
      }),
      action('Toggle switch','Open or close the switch arm only.',['switch blade','switch'],async(api,name)=>{const next=Math.abs(api.angleOf(name)||0)<.2?-.66:0;await api.animateGroup(name,{angle:next,axis:[0,1,0],pivot:[-1.36,-1.12,.46]},320,'smooth');status(api,next?'Switch opened · current path broken':'Switch closed · current path complete');}),
      action('Move rheostat slider','Move only the variable-resistor contact along its winding.',['variable resistor sliding contact','sliding contact'],async(api,name)=>{boundedNudge(api,name,[.30,0,0],[.76,.2,.2]);await pulseMatching(api,/ammeter lcd|ammeter display/i,[.05,.55,.08],250);status(api,'Rheostat contact moved · effective resistance changed');})
    ];
    case 7:
      if(Number(mode)===1)return[
        action('Start spring oscillation','Set the spring-mass system moving vertically with a damped response.',['mass hanger','mass'],async(api,name)=>{status(api,'Spring-mass oscillation…');const pivot=[.18,.30,4.05];for(const [z,scale] of [[-.32,1.11],[.22,.94],[-.17,1.07],[.11,.97],[-.06,1.03],[.03,.99],[0,1]]){await Promise.all([animateMatching(api,/mass hanger|slotted mass/i,{offset:[0,0,z]},210,'spring'),api.animateGroup('spring',{scaleZ:scale,pivot},210,'spring')]);}status(api,'Oscillation demo complete · spring extension and load move together; numerical period data remains unchanged');})
      ];
      return[
        action('Release pendulum','Release the bob in a damped arc about the suspension point.',['pendulum bob','bob'],async(api,name)=>{status(api,'Pendulum released…');const pivot=[.22,.30,4.02],axis=[0,1,0];for(const a of [.28,-.24,.19,-.14,.09,-.05,0])await Promise.all([api.animateGroup(name,{angle:a,axis,pivot},210,'smooth'),api.animateGroup('pendulum string',{angle:a,axis,pivot},210,'smooth')]);status(api,'Pendulum demo complete · real pivot geometry retained; measured timing remains in the experiment model');})
      ];
    case 8:
      if(Number(mode)===0)return[
        action('Compress gas','Move the syringe plunger inward.',['syringe plunger','plunger'],async(api,name)=>{nudgeMatching(api,/syringe plunger|mass hanger|boyle slotted mass/i,[0,0,.24],[.2,.2,1.05]);status(api,'Gas compressed visually · set volume/pressure using the experiment controls for quantitative data');}),
        action('Expand gas','Move the plunger outward.',['syringe plunger','plunger'],async(api,name)=>{nudgeMatching(api,/syringe plunger|mass hanger|boyle slotted mass/i,[0,0,-.24],[.2,.2,1.05]);status(api,'Gas expanded visually');})
      ];
      return[
        action('Raise thermometer','Move the thermometer to inspect the water-bath setup.',['thermometer'],async(api,name)=>{boundedNudge(api,name,[0,0,.25],[.2,.2,.9]);status(api,'Thermometer raised for inspection · return it to the bath before taking a real reading');}),
        action('Lower thermometer','Return the thermometer toward the bath.',['thermometer'],async(api,name)=>{boundedNudge(api,name,[0,0,-.25],[.2,.2,.9]);status(api,'Thermometer lowered toward the bath');})
      ];
    case 9:return[
      action('Toggle switch','Open or close the capacitor circuit switch visually.',['switch blade','switch'],async(api,name)=>{const next=Math.abs(api.angleOf(name)||0)<.2?-.62:0;await api.animateGroup(name,{angle:next,axis:[0,1,0],pivot:[-.58,-.40,.46]},320,'smooth');status(api,next?'Switch moved to alternate contact visually':'Switch returned visually · use Run experiment for the validated charge/discharge trace');})
    ];
    case 10:return[
      action('Raise wire','Move the current-carrying wire slightly upward in the magnetic gap.',['current-carrying straight wire','straight wire','wire'],async(api,name)=>{boundedNudge(api,name,[0,0,.18],[.2,.2,.72]);status(api,'Wire raised in the field region');}),
      action('Lower wire','Move the wire slightly downward.',['current-carrying straight wire','straight wire','wire'],async(api,name)=>{boundedNudge(api,name,[0,0,-.18],[.2,.2,.72]);status(api,'Wire lowered in the field region');})
    ];
    case 11:return[
      action('Rotate coil 90°','Rotate the search coil to compare orientation to the field.',['search coil','coil'],async(api,name)=>{const next=((api.angleOf(name)||0)+Math.PI/2)%(Math.PI*2);await api.animateGroup(name,{angle:next,axis:[0,0,1],pivot:[.05,-.04,1.80]},650,'smooth');status(api,'Search coil rotated 90° · consider how flux linkage depends on orientation');}),
      action('Rotate coil again','Rotate the search coil through another quarter turn.',['search coil','coil'],async(api,name)=>{const next=(api.angleOf(name)||0)+Math.PI/2;await api.animateGroup(name,{angle:next,axis:[0,0,1],pivot:[.05,-.04,1.80]},650,'smooth');status(api,'Search coil rotated another 90°');})
    ];
    case 12:return[
      action('Move detector farther','Increase detector distance in the simulation-only geometry.',['gm tube','detector'],async(api,name)=>{boundedNudge(api,name,[.45,0,0],[2.0,.2,.2]);status(api,'Detector moved farther from the simulation source marker · quantitative distance is set in the model controls');}),
      action('Move detector nearer','Decrease detector distance in the simulation-only geometry.',['gm tube','detector'],async(api,name)=>{boundedNudge(api,name,[-.45,0,0],[2.0,.2,.2]);status(api,'Detector moved nearer in the simulation-only geometry');})
    ];
    default:return[];
  }
}

window.installPractical3DPhysicalActions=(config,api)=>{
  const host=api?.host;if(!host)return;
  host.querySelector('.p3d-physical-actions')?.remove();
  const defs=actionsFor(config.id,config.mode).map(def=>({...def,name:pick(api,def.candidates)})).filter(def=>def.name);
  if(!defs.length)return;
  const bar=document.createElement('div');bar.className='p3d-physical-actions';
  bar.innerHTML='<span class="p3d-actions-label">GUIDED 3D LAB</span><div class="p3d-actions-buttons"></div><small>Walk through the actual setup, then operate the moving parts. Quantitative readings still come from the validated experiment model.</small>';
  const buttons=bar.querySelector('.p3d-actions-buttons');
  if(walkthroughs[Number(config.id)]){
    const walk=document.createElement('button');walk.type='button';walk.textContent='Walk through setup';walk.className='p3d-walkthrough';
    walk.onclick=async()=>{if(walk.disabled)return;walk.disabled=true;try{await runWalkthrough(config,api);}catch(err){console.error('3D walkthrough:',err);status(api,'Walkthrough could not complete · reset apparatus and try again');}finally{walk.disabled=false;}};
    buttons.appendChild(walk);
  }
  defs.forEach(def=>{
    const b=document.createElement('button');b.type='button';b.textContent=def.label;b.title=def.description;
    b.onclick=async()=>{if(b.disabled)return;b.disabled=true;try{await def.run(api,def.name);}catch(err){console.error('3D physical action:',err);status(api,'3D action could not complete · reset apparatus and try again');}finally{b.disabled=false;}};
    buttons.appendChild(b);
  });
  const tools=host.querySelector('.practical3d-tools');
  if(tools)tools.insertAdjacentElement('afterend',bar);else host.appendChild(bar);
};

window.__practical3DPhysicalActionsV12={version:'14.3',actionsFor,walkthroughs,runWalkthrough};window.__practical3DPhysicalActionsV14=window.__practical3DPhysicalActionsV12;
})();