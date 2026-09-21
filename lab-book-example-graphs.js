(()=>{
'use strict';
const NS='http://www.w3.org/2000/svg';
const CFG={
  1:[
    {title:'Frequency against reciprocal length',table:/Vary L.*processed results/i,x:/1\/L/i,y:/Mean f \/ Hz/i,xLabel:'1/L / m⁻¹',yLabel:'Mean f / Hz',fit:true},
    {title:'Frequency squared against tension',table:/Vary T.*processed results/i,x:/^T \/ N$/i,y:/Mean f²/i,xLabel:'T / N',yLabel:'Mean f² / Hz²',fit:true},
    {title:'Frequency squared against reciprocal linear density',table:/Vary μ.*processed results/i,x:/1\/μ/i,y:/Mean f²/i,xLabel:'1/μ / m kg⁻¹',yLabel:'Mean f² / Hz²',fit:true}
  ],
  2:[
    {title:'Young double slits: fringe spacing against screen distance',table:/Young slits.*processed results/i,x:/^D \/ m$/i,y:/One fringe w/i,xLabel:'D / m',yLabel:'w / mm',fit:true},
    {title:'Diffraction grating: sin θ against reciprocal grating spacing',table:/First-order grating.*processed results/i,x:/1\/d/i,y:/sin θ/i,xLabel:'1/d / m⁻¹',yLabel:'sin θ',fit:true}
  ],
  3:[{title:'Free fall: height against time squared',table:/Free fall.*processed results/i,x:/Mean t²/i,y:/^h \/ m$/i,xLabel:'Mean t² / s²',yLabel:'h / m',fit:true}],
  4:[{title:'Young modulus: stress against strain',table:/Steel wire.*processed results/i,x:/Strain/i,y:/Stress \/ MPa/i,xLabel:'Strain / ×10⁻⁴',yLabel:'Stress / MPa',fit:true}],
  5:[{title:'Resistance against wire length',table:/Processed R = V\/I.*processed results/i,x:/^L \/ m$/i,y:/Mean R/i,xLabel:'L / m',yLabel:'Mean R / Ω',fit:true}],
  6:[{title:'Terminal p.d. against current',table:/Processed terminal p\.d\..*processed results/i,x:/^I \/ A$/i,y:/Mean V/i,xLabel:'I / A',yLabel:'Mean V / V',fit:true}],
  7:[
    {title:'Pendulum: period squared against length',table:/Pendulum.*processed results/i,x:/^L \/ m$/i,y:/T² \/ s²/i,xLabel:'L / m',yLabel:'T² / s²',fit:true},
    {title:'Mass–spring: period squared against mass',table:/Mass–spring.*processed results/i,x:/Total m \/ kg/i,y:/T² \/ s²/i,xLabel:'Total m / kg',yLabel:'T² / s²',fit:true}
  ],
  8:[
    {title:'Boyle’s law: volume against reciprocal pressure',table:/Boyle: trapped gas syringe.*processed results/i,x:/1\/P/i,y:/Mean V \/ cm³/i,xLabel:'1/P / kPa⁻¹',yLabel:'Mean V / cm³',fit:true},
    {title:'Charles’s law: air-column length against absolute temperature',table:/Charles: trapped air column.*processed results/i,x:/Temperature \/ K/i,y:/Mean Air-column length/i,xLabel:'Temperature / K',yLabel:'Mean air-column length / mm',fit:true}
  ],
  9:[
    {title:'Capacitor voltage against time',series:[
      {table:/Discharge.*processed results/i,x:/^t \/ s$/i,y:/Mean V/i,label:'Discharge'},
      {table:/Charge.*processed results/i,x:/^t \/ s$/i,y:/Mean V/i,label:'Charge'}
    ],xLabel:'t / s',yLabel:'Mean V / V',connect:true},
    {title:'Discharge log-linear plot',table:/Discharge.*processed results/i,x:/^t \/ s$/i,y:/ln\(V \/ 1 V\)/i,xLabel:'t / s',yLabel:'ln(V / 1 V)',fit:true},
    {title:'Charging log-linear plot',table:/Charge.*processed results/i,x:/^t \/ s$/i,y:/ln\(\(6\.00 − V\) \/ 1 V\)/i,xLabel:'t / s',yLabel:'ln((6.00 − V) / 1 V)',fit:true}
  ],
  10:[
    {title:'Magnetic force against current',table:/Vary current.*processed results/i,x:/^I \/ A$/i,y:/F = Δm g \/ N|F \/ N/i,xLabel:'I / A',yLabel:'F / N',fit:true},
    {title:'Magnetic force against flux density',table:/Vary flux density.*processed results/i,x:/^B \/ T$/i,y:/F \/ N/i,xLabel:'B / T',yLabel:'F / N',fit:true},
    {title:'Magnetic force against active wire length',table:/Vary active length.*processed results/i,x:/^L \/ m$/i,y:/F \/ N/i,xLabel:'L / m',yLabel:'F / N',fit:true}
  ],
  11:[{title:'Peak induced emf against cos θ',table:/Angle sweep.*processed results/i,x:/cos θ/i,y:/Epeak/i,xLabel:'cos θ',yLabel:'Epeak / V',fit:true}],
  12:[{title:'Inverse-square plot with counting uncertainty',table:/Processed mean rates and counting uncertainty/i,x:/1\/r²/i,y:/Mean N\/60|\(Mean N\/60/i,err:/Single-count σrate/i,xLabel:'1/r² / m⁻²',yLabel:'Background-corrected mean rate / s⁻¹',fit:true}]
};
function style(){
  if(document.querySelector('#labExampleGraphsStyle'))return;
  const s=document.createElement('style');s.id='labExampleGraphsStyle';
  s.textContent='.ex-graphs{display:grid;gap:16px;margin-top:14px}.ex-graph-card{border:1px solid var(--line,#d8ded9);border-radius:14px;background:rgba(255,255,255,.78);padding:12px 12px 9px;break-inside:avoid}.ex-graph-card h4{margin:0 0 4px;font-size:13px}.ex-graph-note{font-size:10px;color:var(--muted,#64736d);margin:0 0 8px}.ex-graph-svg{display:block;width:100%;height:auto;min-height:260px}.ex-graph-grid{stroke:rgba(70,90,82,.14);stroke-width:1}.ex-graph-axis{stroke:#40534b;stroke-width:1.35}.ex-graph-tick{fill:#56655f;font-size:10px}.ex-graph-label{fill:#263b33;font-size:11px;font-weight:700}.ex-graph-series-0{stroke:#2f6755;fill:#2f6755}.ex-graph-series-1{stroke:#a45d2c;fill:#a45d2c}.ex-graph-series-2{stroke:#555f9b;fill:#555f9b}.ex-graph-fit{stroke:#263b33;stroke-width:1.7;stroke-dasharray:6 4;fill:none}.ex-graph-join{fill:none;stroke-width:1.5;opacity:.72}.ex-graph-error{stroke:#303f39;stroke-width:1}.ex-graph-equation{font-size:10px;color:var(--muted,#64736d);margin-top:4px}.ex-graph-legend{display:flex;gap:14px;flex-wrap:wrap;font-size:10px;margin-top:5px}.ex-graph-legend span:before{content:"●";margin-right:5px}.ex-graph-legend span:nth-child(1):before{color:#2f6755}.ex-graph-legend span:nth-child(2):before{color:#a45d2c}.ex-graph-legend span:nth-child(3):before{color:#555f9b}@media print{.ex-graph-card{background:#fff}.ex-graph-svg{min-height:220px}}';
  document.head.appendChild(s);
}
const num=v=>{const n=Number(String(v??'').replace(/,/g,'').replace(/−/g,'-').trim());return Number.isFinite(n)?n:null;};
function col(table,re){return table?.headers?.findIndex(h=>re.test(String(h)))??-1;}
function tableFor(ex,re){return ex.tables?.find(t=>re.test(String(t.title)))||null;}
function readSeries(ex,spec){
  const t=tableFor(ex,spec.table);if(!t)return null;
  const xi=col(t,spec.x),yi=col(t,spec.y),ei=spec.err?col(t,spec.err):-1;
  if(xi<0||yi<0)return null;
  const points=t.rows.map(r=>({x:num(r[xi]),y:num(r[yi]),e:ei>=0?num(r[ei]):null})).filter(p=>p.x!==null&&p.y!==null);
  return points.length?{label:spec.label||t.title,points}:null;
}
function seriesFor(ex,cfg){
  if(cfg.series)return cfg.series.map(s=>readSeries(ex,s)).filter(Boolean);
  const one=readSeries(ex,cfg);return one?[one]:[];
}
function regression(points){
  const n=points.length;if(n<2)return null;
  let sx=0,sy=0,sxx=0,sxy=0;
  points.forEach(p=>{sx+=p.x;sy+=p.y;sxx+=p.x*p.x;sxy+=p.x*p.y;});
  const den=n*sxx-sx*sx;if(Math.abs(den)<1e-15)return null;
  const m=(n*sxy-sx*sy)/den,b=(sy-m*sx)/n;
  return {m,b};
}
function fmt(v){
  if(!Number.isFinite(v))return '';
  const a=Math.abs(v);
  if((a>0&&a<0.001)||a>=10000)return v.toExponential(2).replace('e+','e');
  if(a>=100)return v.toFixed(1).replace(/\.0$/,'');
  if(a>=10)return v.toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
  return v.toFixed(3).replace(/0+$/,'').replace(/\.$/,'');
}
function svgEl(tag,attrs={}){
  const e=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));return e;
}
function addText(svg,x,y,text,cls,extra={}){
  const e=svgEl('text',{x,y,class:cls,...extra});e.textContent=text;svg.appendChild(e);return e;
}
function drawChart(card,ex,cfg){
  const series=seriesFor(ex,cfg);if(!series.length){card.remove();return;}
  const all=series.flatMap(s=>s.points),W=760,H=430,L=78,R=24,T=26,B=68;
  let xmin=Math.min(...all.map(p=>p.x)),xmax=Math.max(...all.map(p=>p.x)),ymin=Math.min(...all.map(p=>p.y-(p.e||0))),ymax=Math.max(...all.map(p=>p.y+(p.e||0)));
  if(xmin===xmax){xmin-=1;xmax+=1;}if(ymin===ymax){ymin-=1;ymax+=1;}
  const xp=(xmax-xmin)*.07||1,yp=(ymax-ymin)*.10||1;xmin-=xp;xmax+=xp;ymin-=yp;ymax+=yp;
  const X=x=>L+(x-xmin)/(xmax-xmin)*(W-L-R),Y=y=>T+(ymax-y)/(ymax-ymin)*(H-T-B);
  const svg=svgEl('svg',{viewBox:'0 0 '+W+' '+H,class:'ex-graph-svg',role:'img','aria-label':cfg.title});
  for(let i=0;i<=5;i++){
    const x=L+(W-L-R)*i/5,y=T+(H-T-B)*i/5;
    svg.appendChild(svgEl('line',{x1:x,y1:T,x2:x,y2:H-B,class:'ex-graph-grid'}));
    svg.appendChild(svgEl('line',{x1:L,y1:y,x2:W-R,y2:y,class:'ex-graph-grid'}));
    addText(svg,x,H-B+18,fmt(xmin+(xmax-xmin)*i/5),'ex-graph-tick',{'text-anchor':'middle'});
    addText(svg,L-10,y+3,fmt(ymax-(ymax-ymin)*i/5),'ex-graph-tick',{'text-anchor':'end'});
  }
  svg.appendChild(svgEl('line',{x1:L,y1:H-B,x2:W-R,y2:H-B,class:'ex-graph-axis'}));
  svg.appendChild(svgEl('line',{x1:L,y1:T,x2:L,y2:H-B,class:'ex-graph-axis'}));
  addText(svg,(L+W-R)/2,H-22,cfg.xLabel,'ex-graph-label',{'text-anchor':'middle'});
  const yl=addText(svg,18,(T+H-B)/2,cfg.yLabel,'ex-graph-label',{'text-anchor':'middle'});yl.setAttribute('transform','rotate(-90 18 '+((T+H-B)/2)+')');
  series.forEach((s,si)=>{
    const cls='ex-graph-series-'+Math.min(si,2);
    if(cfg.connect){
      const pts=s.points.slice().sort((a,b)=>a.x-b.x).map(p=>X(p.x)+','+Y(p.y)).join(' ');
      svg.appendChild(svgEl('polyline',{points:pts,class:cls+' ex-graph-join'}));
    }
    s.points.forEach(p=>{
      if(Number.isFinite(p.e)&&p.e>0){
        const x=X(p.x),y1=Y(p.y-p.e),y2=Y(p.y+p.e);
        svg.appendChild(svgEl('line',{x1:x,y1,x2:x,y2,class:'ex-graph-error'}));
        svg.appendChild(svgEl('line',{x1:x-5,y1,x2:x+5,y2:y1,class:'ex-graph-error'}));
        svg.appendChild(svgEl('line',{x1:x-5,y1:y2,x2:x+5,y2:y2,class:'ex-graph-error'}));
      }
      svg.appendChild(svgEl('circle',{cx:X(p.x),cy:Y(p.y),r:4.2,class:cls,'data-ex-graph-point':'1'}));
    });
  });
  let eq='';
  if(cfg.fit&&series[0]?.points.length>=2){
    const fit=regression(series[0].points);
    if(fit){
      const xa=xmin,xb=xmax,ya=fit.m*xa+fit.b,yb=fit.m*xb+fit.b;
      svg.appendChild(svgEl('line',{x1:X(xa),y1:Y(ya),x2:X(xb),y2:Y(yb),class:'ex-graph-fit'}));
      eq='Best-fit: y = '+fmt(fit.m)+'x '+(fit.b<0?'− ':'+ ')+fmt(Math.abs(fit.b));
    }
  }
  card.appendChild(svg);
  if(series.length>1){
    const legend=document.createElement('div');legend.className='ex-graph-legend';
    series.forEach(s=>{const sp=document.createElement('span');sp.textContent=s.label;legend.appendChild(sp);});card.appendChild(legend);
  }
  if(eq){const e=document.createElement('div');e.className='ex-graph-equation';e.textContent=eq;card.appendChild(e);}
  card.dataset.pointCount=String(all.length);
}
function enrich(sheet){
  if(!sheet||sheet.dataset.graphs==='1')return;
  const id=+(sheet.querySelector('#exSelect')?.value||sheet.querySelector('.eyebrow')?.textContent?.match(/PRACTICAL\s+(\d+)/i)?.[1]||0);
  const ex=window.LAB_BOOK_EXAMPLES?.[id],cfgs=CFG[id];if(!ex||!cfgs)return;
  style();sheet.dataset.graphs='1';
  const sections=[...sheet.querySelectorAll('.ex-section')],graphSection=sections.find(s=>/^Graph$/i.test(s.querySelector('h3')?.textContent?.trim()||''));
  if(!graphSection)return;
  const wrap=document.createElement('div');wrap.className='ex-graphs';wrap.dataset.graphCount=String(cfgs.length);
  cfgs.forEach(cfg=>{
    const card=document.createElement('div');card.className='ex-graph-card';
    const h=document.createElement('h4');h.textContent=cfg.title;
    const note=document.createElement('p');note.className='ex-graph-note';note.textContent='Plotted directly from the completed-example data table above.';
    card.append(h,note);wrap.appendChild(card);drawChart(card,ex,cfg);
  });
  graphSection.insertBefore(wrap,graphSection.querySelector('.ex-result')||null);
}
function scan(){document.querySelectorAll('#labExampleModal .ex-sheet,#lbCompletedExamplePane .ex-sheet').forEach(enrich);}
const obs=new MutationObserver(scan);obs.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('change',e=>{if(e.target?.id==='exSelect')setTimeout(scan,0);});
setTimeout(scan,0);setTimeout(scan,250);
window.__labBookExampleGraphs={count:Object.keys(CFG).length,configs:CFG,refresh:scan};
})();