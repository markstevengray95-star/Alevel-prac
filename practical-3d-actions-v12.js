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

function actionsFor(id,mode){
  switch(Number(id)){
    case 1:return[
      action('Add load','Move the hanging mass to represent adding tension to the string.',['mass hanger','slotted mass','mass'],async(api,name)=>{api.nudgeGroup(name,[0,0,-.24]);status(api,'Load added · observe how tension would affect the standing-wave condition');}),
      action('Lift load','Reduce the hanging load position.',['mass hanger','slotted mass','mass'],async(api,name)=>{api.nudgeGroup(name,[0,0,.24]);status(api,'Load lifted · 3D position changed; numerical readings remain controlled by the experiment sliders');})
    ];
    case 2:return[
      action('Move screen farther','Increase the source-to-screen separation visually.',['projection screen','screen'],async(api,name)=>{api.nudgeGroup(name,[.45,0,0]);status(api,'Screen moved farther away · use the measured distance in the numerical model separately');}),
      action('Move screen nearer','Decrease the source-to-screen separation visually.',['projection screen','screen'],async(api,name)=>{api.nudgeGroup(name,[-.45,0,0]);status(api,'Screen moved nearer · check how fringe spacing depends on geometry');})
    ];
    case 3:return[
      action('Release ball','Release the ball vertically through the timing region.',['ball bearing','ball'],async(api,name)=>{api.setGroupOffset(name,[0,0,0]);status(api,'Ball released…');await api.animateGroup(name,{offset:[0,0,-2.15]},900);status(api,'Ball passed the timing region · reset apparatus to repeat');})
    ];
    case 4:return[
      action('Add load','Lower the mass hanger to represent an increased tensile load.',['mass hanger','hanger','slotted mass'],async(api,name)=>{api.nudgeGroup(name,[0,0,-.18]);status(api,'Load increased visually · extension is still measured by the validated practical model');}),
      action('Remove load','Raise the hanger one step.',['mass hanger','hanger','slotted mass'],async(api,name)=>{api.nudgeGroup(name,[0,0,.18]);status(api,'Load reduced visually · compare loading and unloading behaviour');})
    ];
    case 5:return[
      action('Move contact','Slide the contact along the resistance wire.',['sliding contact','movable contact','probe'],async(api,name)=>{api.nudgeGroup(name,[.38,0,0]);status(api,'Contact moved along the wire · set the measured length with the experiment control');}),
      action('Move contact back','Slide the contact toward the start of the wire.',['sliding contact','movable contact','probe'],async(api,name)=>{api.nudgeGroup(name,[-.38,0,0]);status(api,'Contact moved back along the wire');})
    ];
    case 6:return[
      action('Toggle switch','Open or close the circuit switch visually.',['switch blade','switch'],async(api,name)=>{const next=Math.abs(api.angleOf(name)||0)<.2?-.72:0;await api.animateGroup(name,{angle:next},280);status(api,next?'Switch opened visually · use Run experiment to change the validated circuit state':'Switch closed visually');})
    ];
    case 7:
      if(Number(mode)===1)return[
        action('Start spring oscillation','Set the spring-mass system moving vertically.',['mass hanger','mass','spring'],async(api,name)=>{status(api,'Spring-mass oscillation…');for(const z of [-.55,.38,-.30,.18,0])await api.animateGroup(name,{offset:[0,0,z]},260);status(api,'Oscillation demo complete · use the numerical run for measured period data');})
      ];
      return[
        action('Release pendulum','Release the bob into a damped-looking visual oscillation.',['pendulum bob','bob','pendulum'],async(api,name)=>{status(api,'Pendulum released…');for(const x of [.62,-.52,.40,-.28,.16,0])await api.animateGroup(name,{offset:[x,0,0]},220);status(api,'Pendulum demo complete · measured timing remains in the experiment model');})
      ];
    case 8:
      if(Number(mode)===0)return[
        action('Compress gas','Move the syringe plunger inward.',['syringe plunger','plunger'],async(api,name)=>{api.nudgeGroup(name,[.42,0,0]);status(api,'Gas compressed visually · set volume/pressure using the experiment controls for quantitative data');}),
        action('Expand gas','Move the plunger outward.',['syringe plunger','plunger'],async(api,name)=>{api.nudgeGroup(name,[-.42,0,0]);status(api,'Gas expanded visually');})
      ];
      return[
        action('Raise thermometer','Move the thermometer to inspect the water-bath setup.',['thermometer'],async(api,name)=>{api.nudgeGroup(name,[0,0,.25]);status(api,'Thermometer raised for inspection · return it to the bath before taking a real reading');}),
        action('Lower thermometer','Return the thermometer toward the bath.',['thermometer'],async(api,name)=>{api.nudgeGroup(name,[0,0,-.25]);status(api,'Thermometer lowered toward the bath');})
      ];
    case 9:return[
      action('Toggle switch','Open or close the capacitor circuit switch visually.',['switch blade','switch'],async(api,name)=>{const next=Math.abs(api.angleOf(name)||0)<.2?-.72:0;await api.animateGroup(name,{angle:next},280);status(api,next?'Switch opened visually':'Switch closed visually · use Run experiment for the charge/discharge trace');})
    ];
    case 10:return[
      action('Raise wire','Move the current-carrying wire slightly upward in the magnetic gap.',['current-carrying straight wire','straight wire','wire'],async(api,name)=>{api.nudgeGroup(name,[0,0,.18]);status(api,'Wire raised in the field region');}),
      action('Lower wire','Move the wire slightly downward.',['current-carrying straight wire','straight wire','wire'],async(api,name)=>{api.nudgeGroup(name,[0,0,-.18]);status(api,'Wire lowered in the field region');})
    ];
    case 11:return[
      action('Rotate coil 90°','Rotate the search coil to compare orientation to the field.',['search coil','coil'],async(api,name)=>{const next=(api.angleOf(name)||0)+Math.PI/2;await api.animateGroup(name,{angle:next},650);status(api,'Search coil rotated 90° · consider how flux linkage depends on orientation');}),
      action('Rotate coil again','Rotate the search coil through another quarter turn.',['search coil','coil'],async(api,name)=>{const next=(api.angleOf(name)||0)+Math.PI/2;await api.animateGroup(name,{angle:next},650);status(api,'Search coil rotated another 90°');})
    ];
    case 12:return[
      action('Move detector farther','Increase detector distance in the simulation-only geometry.',['gm tube','detector'],async(api,name)=>{api.nudgeGroup(name,[.45,0,0]);status(api,'Detector moved farther from the simulation source marker · quantitative distance is set in the model controls');}),
      action('Move detector nearer','Decrease detector distance in the simulation-only geometry.',['gm tube','detector'],async(api,name)=>{api.nudgeGroup(name,[-.45,0,0]);status(api,'Detector moved nearer in the simulation-only geometry');})
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
  bar.innerHTML='<span class="p3d-actions-label">PHYSICAL 3D</span><div class="p3d-actions-buttons"></div><small>Visual apparatus manipulation only — measured values come from the validated experiment model.</small>';
  const buttons=bar.querySelector('.p3d-actions-buttons');
  defs.forEach(def=>{
    const b=document.createElement('button');b.type='button';b.textContent=def.label;b.title=def.description;
    b.onclick=async()=>{if(b.disabled)return;b.disabled=true;try{await def.run(api,def.name);}finally{b.disabled=false;}};
    buttons.appendChild(b);
  });
  const tools=host.querySelector('.practical3d-tools');
  if(tools)tools.insertAdjacentElement('afterend',bar);else host.appendChild(bar);
};

window.__practical3DPhysicalActionsV12={version:'12.0',actionsFor};
})();