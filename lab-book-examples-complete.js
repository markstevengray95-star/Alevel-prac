/* Complete illustrative data for AQA Physics 7408 required practicals 1–12.
   Load after lab-book-examples.js. Invented teaching values, not student evidence.
   AQA 7408 practical list: https://www.aqa.org.uk/subjects/physics/a-level/physics-7408/specification/practical-assessment
   AQA physics practical handbook (lab book guidance, pp 20–22):
   https://filestore.aqa.org.uk/resources/physics/AQA-7407-7408-PHBK.PDF */
(()=>{
'use strict';
const E=window.LAB_BOOK_EXAMPLES;if(!E)return;
const fmt=(n,d)=>Number(n).toFixed(d);
const avg=a=>a.reduce((s,x)=>s+Number(x),0)/a.length;
const sample=(name,xHead,yHead,items,dp,process)=>{
 const raw={title:process?.rawTitle||`${name}: raw repeated readings`,headers:[xHead,`${yHead} 1`,`${yHead} 2`,`${yHead} 3`],rows:items.map(([x,ys])=>[String(x),...ys.map(v=>fmt(v,dp))])};
 const processed={title:`${name}: processed results`,headers:[xHead,`Mean ${yHead}`,'Half-range',...(process?.headers||[])],rows:items.map(([x,ys])=>{const m=avg(ys),h=(Math.max(...ys)-Math.min(...ys))/2;return [String(x),fmt(m,dp),fmt(h,dp),...(process?.values?.(x,m)||[])];})};
 return [raw,processed];
};
const patch=(id,changes)=>Object.assign(E[id],changes);
patch(1,{
 aim:'To test AQA RP1 in three separate sweeps: fundamental frequency against string length, tension and mass per unit length.',
 setup:'Vibration transducer, signal generator, string over a freely turning pulley, hanging masses including the hanger, metre rule and balance. Effective vibrating length was measured between nodes.',
 variables:['Sweep A: change L; keep T = 4.00 N and μ = 1.00 g m⁻¹.','Sweep B: change T; keep L = 0.600 m and μ = 1.00 g m⁻¹.','Sweep C: change μ; keep L = 0.600 m and T = 4.00 N. Keep the fundamental harmonic throughout.'],
 method:'Measure the mass and length of each string sample to find μ. For each setting, sweep the generator slowly from both sides to the largest clear one-loop response. Record three resonance judgements, retuning after each change. Use at least six settings in each of the three AQA sweeps.',
 unc:[['Effective length L','metre rule plus node positions','1 mm scale','estimate ±2 mm at each node, so about ±4 mm in L'],['Frequency f','signal generator','0.1 Hz','repeat resonance judgement; half-range typically ±0.1 Hz here'],['Tension and μ','masses/balance and measured sample length','instrument dependent','include hanger mass and propagate input uncertainties']],
 tables:[
  ...sample('Vary L, T = 4.00 N and μ = 1.00 g m⁻¹','L / m','f / Hz',[[.40,[78.9,79.2,79.0]],[.50,[63.1,63.3,63.2]],[.60,[52.6,52.8,52.7]],[.70,[45.1,45.3,45.2]],[.80,[39.4,39.6,39.5]],[.90,[35.0,35.2,35.1]]],1,{headers:['1/L / m⁻¹'],values:x=>[fmt(1/x,3)]}),
  ...sample('Vary T, L = 0.600 m and μ = 1.00 g m⁻¹','T / N','f / Hz',[[2,[37.2,37.3,37.4]],[3,[45.5,45.7,45.6]],[4,[52.6,52.8,52.7]],[5,[58.8,59.0,58.9]],[6,[64.5,64.6,64.7]],[7,[69.6,69.8,69.7]]],1,{headers:['Mean f² / Hz²'],values:(_,m)=>[fmt(m*m,1)]}),
  ...sample('Vary μ, L = 0.600 m and T = 4.00 N','μ / g m⁻¹','f / Hz',[[.5,[74.4,74.6,74.5]],[.75,[60.8,61.0,60.9]],[1,[52.6,52.8,52.7]],[1.25,[47.0,47.2,47.1]],[1.5,[42.9,43.1,43.0]],[2,[37.2,37.4,37.3]]],1,{headers:['1/μ / m kg⁻¹','Mean f² / Hz²'],values:(x,m)=>[fmt(1000/x,1),fmt(m*m,1)]})
 ],
 calc:'Example at L = 0.600 m: mean f = (52.6 + 52.8 + 52.7)/3 = 52.7 Hz; 1/L = 1.667 m⁻¹. The f–1/L gradient is about 31.6 Hz m, so v = 2 × gradient = 63.2 m s⁻¹. Independent check: √(T/μ) = √(4.00/0.00100) = 63.25 m s⁻¹. For the T sweep, gradient of f² against T ≈ 694 Hz² N⁻¹, giving μ = 1/(4L² gradient) ≈ 1.00 × 10⁻³ kg m⁻¹. For the μ sweep, gradient of f² against 1/μ ≈ T/(4L²) = 2.78 in SI plot units.',
 graph:'Three separate graphs: mean f / Hz against 1/L / m⁻¹; mean f² / Hz² against T / N; mean f² / Hz² against 1/μ / m kg⁻¹. Their expected intercepts are close to zero. Never join data from different harmonic numbers.',
 result:'All three sweeps are compatible with f = √(T/μ)/(2L); wave speed from the length graph ≈ 63.2 m s⁻¹.',
 conclusion:'At fixed controls, f ∝ 1/L, f² ∝ T and f² ∝ 1/μ. Each relationship is present in AQA RP1.',
 evaluation:[['Node location and pulley friction','Shift L and true T systematically','Measure between effective nodes and check free pulley motion.'],['Finite resonance width','Scatters repeated f readings','Approach the peak from both directions and repeat.'],['μ from a short sample','Large balance percentage uncertainty','Weigh a longer measured sample.']],
 reflection:'The three series test distinct variables. The instrument display step does not fully describe resonance uncertainty.'
});
patch(2,{
 aim:'To measure wavelength by both Young double slits and a diffraction grating, as required by AQA RP2.',
 setup:'Low-power 630 nm class red laser with beam stop; 0.300 mm double slits; interchangeable known gratings; screen and metre rule. The slit/grating plane defines D.',
 variables:['Young slits: D is independent; ten-fringe span is dependent; keep source and s fixed.','Grating: line density N is independent at first order; θ is dependent; keep source and order fixed.'],
 method:'Align source, slit/grating and screen. For slits, measure the span of ten complete fringe intervals three times at each D, then divide by ten. For gratings, measure the first-order position on both sides of the centre, calculate θ with tanθ = x/D, and average the angle magnitudes. Convert N lines mm⁻¹ to lines m⁻¹ before finding d.',
 unc:[['D','metre rule/tape','1 mm','allow about ±2 mm for slit/grating plane reference'],['Ten-interval span','ruler','1 mm','endpoint uncertainty divided by ten for one fringe'],['Grating spot position','screen ruler','1 mm','propagate through tanθ = x/D and sinθ'],['Slit/grating spacing','manufacturer value','tolerance dependent','systematic input uncertainty in λ']],
 tables:[
  ...sample('Young slits, s = 0.300 mm; span covers 10 intervals','D / m','10-interval span / mm',[[.8,[16.7,16.9,16.8]],[1,[20.9,21.1,21.0]],[1.2,[25.1,25.3,25.2]],[1.5,[31.4,31.6,31.5]],[1.8,[37.7,37.9,37.8]],[2,[41.9,42.1,42.0]]],1,{headers:['One fringe w / mm'],values:(_,m)=>[fmt(m/10,2)]}),
  {title:'Grating spot positions before angle processing (D = 1.50 m)',headers:['N / lines mm⁻¹','Left first-order x / mm','Right first-order x / mm','Mean |x| / mm'],rows:[['200','−190','190','190'],['250','−239','240','239.5'],['300','−289','289','289'],['350','−339','340','339.5'],['400','−390','391','390.5'],['500','−498','497','497.5']]},
  ...sample('First-order grating; θ averaged over symmetric spots','N / lines mm⁻¹','θ / °',[[200,[7.2,7.3,7.2]],[250,[9.0,9.1,9.1]],[300,[10.8,10.9,11.0]],[350,[12.7,12.8,12.7]],[400,[14.5,14.6,14.6]],[500,[18.3,18.4,18.4]]],1,{headers:['1/d / m⁻¹','sin θ'],values:(x,m)=>[fmt(x*1000,0),fmt(Math.sin(m*Math.PI/180),4)]})
 ],
 calc:'At D = 1.50 m, ten-interval mean = (31.4 + 31.6 + 31.5)/3 = 31.5 mm, so w = 3.15 mm. λ = ws/D = (3.15 × 10⁻³ m)(0.300 × 10⁻³ m)/(1.50 m) = 6.30 × 10⁻⁷ m. For 300 lines mm⁻¹, d = 1/300000 = 3.333 × 10⁻⁶ m. Mean θ = 10.9°, so λ = d sinθ/1 ≈ 6.30 × 10⁻⁷ m.',
 graph:'Young: plot w / mm against D / m; gradient ≈ 2.10 mm m⁻¹, then λ = gradient × s with units converted. Grating: plot sinθ against 1/d / m⁻¹ at fixed n = 1; gradient ≈ 6.30 × 10⁻⁷ m.',
 result:'Young slits λ ≈ 630 nm; grating λ ≈ 630 nm.',
 conclusion:'Two different interference arrangements give mutually consistent wavelength estimates.',
 evaluation:[['Fringe endpoint reading','Can dominate one small gap','Measure ten intervals; ten bright fringes span only nine intervals.'],['Grating not normal to beam','Left/right orders become asymmetric','Use symmetric spots and align the grating.'],['Angle calculation at large x/D','Small-angle approximation fails','Use tanθ = x/D followed by sinθ.']],
 reflection:'The slit span is a raw measurement; w and λ are processed quantities with their own units.'
});
patch(3,{
 method:'Measure vertical drop h using a consistent point on the ball and impact surface. Release without a push. Record three electronic times at each of six heights, calculate mean t, then square the mean. Plot h against mean t² as used in this worked example.',
 unc:[['Height h','metre rule and ball reference point','1 mm scale','about ±5 mm allowing endpoint definition'],['Time t','electronic timer','0.001 s','single display step; release/trigger variation can be larger'],['Time squared','processed','—','relative uncertainty approximately twice that in t']],
 tables:sample('Free fall, same ball and electronic trigger','h / m','t / s',[[.20,[.201,.202,.203]],[.40,[.285,.286,.286]],[.60,[.349,.350,.350]],[.80,[.403,.404,.405]],[1,[.451,.452,.452]],[1.20,[.494,.495,.495]]],3,{headers:['Mean t² / s²'],values:(_,m)=>[fmt(m*m,5)]}),
 calc:'At h = 0.60 m, mean t = (0.349 + 0.350 + 0.350)/3 = 0.3497 s and (mean t)² = 0.12227 s². Since h = ½gt², the gradient of h against t² is g/2. A fitted gradient near 4.90 m s⁻² gives g ≈ 9.80 m s⁻².',
 graph:'Plot h / m vertically against (mean t)² / s² horizontally. Use a best-fit line across all six heights and consider any non-zero intercept before deciding whether forcing through the origin is justified.',
 result:'g ≈ 9.8 m s⁻² for the illustrative readings.',
 conclusion:'The drop height is proportional to t² to the precision shown, consistent with approximately uniform acceleration from rest.',
 evaluation:[['Small h','Height/reference uncertainty becomes a larger percentage','Use a wide safe range of heights and consistent reference points.'],['Trigger and release delay','Can shift or scatter timings','Check the trigger arrangement and repeat each height.'],['Rounding time too early','Biases t²','Retain extra figures in intermediate calculations.']],
 reflection:'Electronic timing removes much reaction time, but defining the fall distance still matters.'
});
patch(4,{
 setup:'Steel test wire L = 2.000 m; reference wire/common support or equivalent stable comparison; hanger, fine extension scale and micrometer. Diameter measured in several orientations.',
 method:'Apply a small preload, define the zero, measure gauge length and repeat micrometer readings along the wire. Increase force in 1 N steps, let the reading settle, and take three extension readings at each load. Unload to check return within uncertainty.',
 unc:[['Diameter d','digital micrometer','0.001 mm','about ±0.005 mm including repositioning/zero; area has ≈2Δd/d'],['Original length','metre rule','1 mm','about ±2 mm including gauge marks'],['Extension','fine comparator','0.001 mm','about ±0.002 mm plus possible clamp slip']],
 tables:[{title:'Micrometer diameter checks',headers:['Position','Direction 1 / mm','Direction 2 / mm'],rows:[['Top','0.400','0.399'],['Middle','0.401','0.400'],['Bottom','0.400','0.400']]},...sample('Steel wire, L = 2.000 m','F / N','ΔL / mm',[[0,[0,0,0]],[1,[.079,.080,.080]],[2,[.158,.160,.160]],[3,[.238,.239,.240]],[4,[.317,.318,.319]],[5,[.396,.398,.399]]],3,{headers:['Stress / MPa','Strain / ×10⁻⁴'],values:(F,e)=>[fmt(F/(Math.PI*(.0004**2)/4)/1e6,1),fmt((e/1000)/2*1e4,3)]})],
 calc:'Mean d ≈ 0.400 mm; A = π(0.000400 m)²/4 = 1.257 × 10⁻⁷ m². At F = 4 N, mean extension = (0.317 + 0.318 + 0.319)/3 = 0.318 mm. Stress = F/A = 31.8 MPa; strain = 0.000318/2.000 = 1.59 × 10⁻⁴. E ≈ stress/strain = 2.00 × 10¹¹ Pa. The full stress–strain gradient gives the reported value.',
 graph:'Plot stress / Pa against strain (dimensionless). Straight elastic-region gradient = Young modulus E ≈ 2.00 × 10¹¹ Pa. Alternatively ΔL against F has gradient ≈ 7.96 × 10⁻⁵ m N⁻¹ and E = L/(A × gradient).',
 result:'Young modulus E ≈ 2.00 × 10¹¹ Pa for this illustrative steel wire.',
 conclusion:'Stress and strain are approximately proportional in the tested elastic range.',
 evaluation:[['Diameter enters through d²','2Δd/d contributes to E percentage uncertainty','Measure many positions and account for micrometer zero error.'],['Clamp slip or creep','Creates false extension','Use a rigid support and check unloading return.'],['Readings near zero','High fractional scale uncertainty','Use a fine extension measurement and a long wire.']],
 reflection:'Stress requires area, not diameter; strain requires original length, not the current length.'
});
patch(5,{
 setup:'Uniform constantan wire; mean diameter 0.450 mm measured with a micrometer. Ammeter in series, voltmeter across a selected length, low-voltage supply and switch.',
 method:'Measure diameter at several positions/orientations. Choose six lengths, measure paired current and voltage three times at each, opening the switch between readings. Calculate each R = V/I; use the mean R for the length graph.',
 unc:[['Wire length','metre rule','1 mm','about ±1 mm contact-position reading'],['Diameter','digital micrometer','0.001 mm','about ±0.005 mm including wire variation'],['Voltage','digital voltmeter','0.001 V','read while current is flowing'],['Current','ammeter','0.001 A','include meter accuracy; repeated nominal 0.200 A']],
 tables:[{title:'Micrometer diameter checks',headers:['Position','d₁ / mm','d₂ / mm'],rows:[['Start','0.449','0.451'],['Middle','0.450','0.450'],['End','0.450','0.450']]},{title:'Raw paired electrical readings',headers:['L / m','I / A (all three)','V₁ / V','V₂ / V','V₃ / V'],rows:[['0.20','0.200','0.123','0.125','0.124'],['0.40','0.200','0.247','0.249','0.248'],['0.60','0.200','0.369','0.371','0.370'],['0.80','0.200','0.493','0.495','0.494'],['1.00','0.200','0.617','0.619','0.618'],['1.20','0.200','0.741','0.743','0.742']]},...sample('Processed R = V/I','L / m','R / Ω',[[.2,[.615,.625,.620]],[.4,[1.235,1.245,1.240]],[.6,[1.845,1.855,1.850]],[.8,[2.465,2.475,2.470]],[1,[3.085,3.095,3.090]],[1.2,[3.705,3.715,3.710]]],3,{rawTitle:'Individual resistances calculated from the paired V/I readings'})],
 calc:'At L = 0.80 m, V̄ = (0.493 + 0.495 + 0.494)/3 = 0.494 V and I = 0.200 A, so R̄ = 2.470 Ω. Mean d = 0.450 mm gives A = πd²/4 = 1.590 × 10⁻⁷ m². The R–L gradient is about 3.09 Ω m⁻¹; ρ = gradient × A ≈ 4.91 × 10⁻⁷ Ω m.',
 graph:'Plot mean R / Ω against selected length L / m. Gradient = ρ/A; inspect the intercept for lead or contact resistance.',
 result:'Illustrative constantan resistivity ρ ≈ 4.9 × 10⁻⁷ Ω m.',
 conclusion:'Resistance increases approximately in proportion to length for the same uniform wire at near-constant temperature.',
 evaluation:[['Wire warms when energised','R rises over a run','Use small current and switch off between readings.'],['Diameter error','A and ρ change by roughly twice the percentage d error','Average micrometer readings at several locations.'],['Contact resistance','Positive graph intercept','Use a gradient over wide L range and firm clean contacts.']],
 reflection:'The electrical table shows the actual V and I readings used to calculate the R values.'
});
patch(6,{
 method:'Use a cell, series switch/ammeter/variable resistor and a voltmeter across the terminals. For each load, close the switch briefly and take three paired I,V readings, reopening between them to limit drift. Include a broad safe current range.',
 unc:[['Current I','digital ammeter','0.001 A','consider meter calibration as well as display step'],['Terminal pd V','digital voltmeter','0.01 V','about ±0.01 V per displayed reading'],['Cell state','same cell during run','—','warm-up or depletion can create systematic drift']],
 tables:[{title:'Raw paired current and voltage readings',headers:['Nominal I / A','I₁ / A','V₁ / V','I₂ / A','V₂ / V','I₃ / A','V₃ / V'],rows:[['0.10','0.100','1.51','0.100','1.51','0.100','1.50'],['0.30','0.300','1.43','0.300','1.43','0.300','1.42'],['0.50','0.500','1.35','0.500','1.35','0.500','1.34'],['0.60','0.600','1.31','0.600','1.32','0.600','1.31'],['0.80','0.800','1.23','0.800','1.23','0.800','1.22'],['1.00','1.000','1.15','1.000','1.15','1.000','1.14']]},...sample('Processed terminal p.d.','I / A','V / V',[[.1,[1.51,1.51,1.50]],[.3,[1.43,1.43,1.42]],[.5,[1.35,1.35,1.34]],[.6,[1.31,1.32,1.31]],[.8,[1.23,1.23,1.22]],[1,[1.15,1.15,1.14]]],2)],
 calc:'V = ε − Ir. Using well-separated points, gradient ≈ (1.147 − 1.507)/(1.00 − 0.10) = −0.400 V A⁻¹ = −0.400 Ω. The line intercept is about 1.547 V, so ε ≈ 1.55 V and internal resistance r ≈ 0.40 Ω. At 0.60 A, mean V = (1.31 + 1.32 + 1.31)/3 = 1.313 V.',
 graph:'Plot mean terminal pd V / V vertically against I / A. Fit a straight line; y-intercept = ε and magnitude of negative gradient = r.',
 result:'ε ≈ 1.55 V and r ≈ 0.40 Ω.',
 conclusion:'Terminal pd decreases approximately linearly as current increases, consistent with internal resistance.',
 evaluation:[['Cell warms/discharges','Changes ε or r during the series','Keep switch open between readings and check open-circuit voltage.'],['Short current range','Large slope uncertainty','Use a wide safe set of loads.'],['Voltmeter load','Open-circuit reading is not exactly emf','Use a high-resistance meter and infer intercept from the fit.']],
 reflection:'Current and voltage are simultaneous paired readings, not separate measurements at different loads.'
});
patch(7,{
 aim:'To investigate simple harmonic motion using both a simple pendulum and a mass–spring system, as required by AQA RP7.',
 setup:'Pendulum: length measured from pivot to bob centre, small amplitude and fiducial marker. Spring: hanger and added masses measured together, equilibrium marker and a fixed vertical scale. Stopwatch times 20 complete oscillations.',
 variables:['Pendulum: vary L; measure T; keep bob, small amplitude and timing method fixed.','Mass–spring: vary total oscillating mass m; measure T; keep the same spring and small amplitude.'],
 method:'Displace the pendulum by less than about 10°, release without a push, time 20 cycles past a fiducial marker and repeat three times. Measure each pivot-to-centre length. Separately load the spring with known total masses, displace slightly, time 20 complete cycles and repeat. Divide each mean time by 20 before squaring.',
 tables:[
 ...sample('Pendulum: time for 20 cycles','L / m','20T / s',[[.25,[20.04,20.08,20.06]],[.35,[23.72,23.74,23.76]],[.50,[28.36,28.40,28.38]],[.65,[32.34,32.38,32.36]],[.80,[35.88,35.92,35.90]],[1,[40.10,40.14,40.12]]],2,{headers:['Mean T / s','T² / s²'],values:(_,m)=>[fmt(m/20,3),fmt((m/20)**2,3)]}),
 ...sample('Mass–spring: time for 20 cycles','Total m / kg','20T / s',[[.1,[8.86,8.90,8.88]],[.2,[12.54,12.58,12.56]],[.3,[15.36,15.42,15.40]],[.4,[17.74,17.78,17.76]],[.5,[19.84,19.90,19.88]],[.6,[21.72,21.78,21.76]]],2,{headers:['Mean T / s','T² / s²'],values:(_,m)=>[fmt(m/20,3),fmt((m/20)**2,3)]})
 ],
 calc:'Pendulum at L = 0.50 m: mean 20T = (28.36 + 28.40 + 28.38)/3 = 28.38 s; T = 1.419 s and T² = 2.013 s². T²–L gradient ≈ 4.02 s² m⁻¹; g = 4π²/gradient ≈ 9.82 m s⁻². Spring at total m = 0.40 kg: mean 20T = 17.76 s; T = 0.888 s and T² = 0.789 s². T²–m gradient ≈ 1.97 s² kg⁻¹; k = 4π²/gradient ≈ 20.0 N m⁻¹.',
 graph:'Two separate plots: pendulum T² / s² against L / m (gradient 4π²/g); mass–spring T² / s² against total mass m / kg (gradient 4π²/k). A spring intercept may reveal effective spring mass.',
 result:'Pendulum g ≈ 9.8 m s⁻²; spring constant k ≈ 20 N m⁻¹.',
 conclusion:'Both systems show period squared approximately proportional to the relevant varied quantity in the small-amplitude range.',
 evaluation:[['Timing one oscillation','Reaction time dominates','Time 20 cycles using a fiducial marker and repeat.'],['Pendulum amplitude too large','Small-angle model breaks down','Keep initial displacement small and consistent.'],['Ignoring hanger/effective spring mass','Shifts spring T²–m graph','Include the hanger in m and discuss intercept.']],
 reflection:'The two systems need separate axes and conclusions; their gradients represent different physical constants.'
});
patch(8,{
 aim:'To investigate both Boyle’s law at approximately fixed temperature and Charles’s law at approximately fixed pressure.',
 setup:'Boyle: sealed vertical gas syringe, hanging-mass loop pulling the plunger outward, measured seal diameter 20.0 mm and atmospheric pressure 100.0 kPa. In this geometry Pgas = Patm − mg/A. Charles: separate trapped air column at nearly atmospheric pressure in a stirred water bath.',
 variables:['Boyle: vary hanging mass and therefore absolute gas pressure; measure gas volume; keep gas amount and temperature fixed.','Charles: vary water-bath temperature; measure trapped-air column length (proportional to volume); keep gas amount and pressure fixed.'],
 method:'Boyle: measure syringe seal diameter and calculate area. Hang each mass, let the plunger settle and read three volumes; repeat on reversing the sequence to reveal friction. Do not compress rapidly. Charles: immerse the separate trapped-air column in a water bath at six temperatures, stir gently, wait for thermal equilibrium, then read column length three times. Convert °C to K.',
 tables:[{title:'Boyle derived absolute pressure from hanging mass',headers:['m / kg','A / m²','P = Patm − mg/A / kPa'],rows:[[0,'3.142 × 10⁻⁴','100.0'],[.2,'3.142 × 10⁻⁴','93.8'],[.4,'3.142 × 10⁻⁴','87.5'],[.6,'3.142 × 10⁻⁴','81.3'],[.8,'3.142 × 10⁻⁴','75.0'],[1,'3.142 × 10⁻⁴','68.8']]},
 ...sample('Boyle: trapped gas syringe','P / kPa','V / cm³',[[100,[24.9,25.0,25.1]],[93.8,[26.6,26.7,26.7]],[87.5,[28.5,28.6,28.6]],[81.3,[30.6,30.8,30.7]],[75,[33.2,33.3,33.4]],[68.8,[36.2,36.4,36.4]]],1,{headers:['P V / kPa cm³','1/P / kPa⁻¹'],values:(p,v)=>[fmt(p*v,1),fmt(1/p,5)]}),
 ...sample('Charles: trapped air column','Bath temperature / °C','Air-column length / mm',[[20,[49.9,50.0,50.1]],[30,[51.6,51.7,51.8]],[40,[53.3,53.4,53.5]],[50,[55.0,55.1,55.2]],[65,[57.5,57.7,57.6]],[80,[60.1,60.3,60.2]]],1,{headers:['Temperature / K','Length/T / mm K⁻¹'],values:(c,l)=>[fmt(c+273.15,2),fmt(l/(c+273.15),4)]})],
 calc:'Boyle: d = 0.0200 m, so A = πd²/4 = 3.142 × 10⁻⁴ m². At m = 0.400 kg, P = 100.0 kPa − (0.400 × 9.81)/A/1000 = 87.5 kPa. Mean V = (28.5 + 28.6 + 28.6)/3 = 28.57 cm³; PV ≈ 2500 kPa cm³. Charles: at 50°C, T = 323.15 K and mean air-column length = 55.1 mm, so length/T ≈ 0.1705 mm K⁻¹; the constant cross-section makes length proportional to volume.',
 graph:'Boyle: plot V / cm³ against 1/P / kPa⁻¹, or P against 1/V, at fixed T; PV should be near 2.50 × 10³ kPa cm³. Charles: plot air-column length / mm against absolute T / K; gradient ≈ 0.1705 mm K⁻¹.',
 result:'Boyle: PV ≈ 2.50 × 10³ kPa cm³; Charles: trapped-air length/T ≈ 0.1705 mm K⁻¹.',
 conclusion:'The two datasets are approximately consistent with P ∝ 1/V at fixed T and V ∝ T in kelvin at fixed P.',
 evaluation:[['Syringe friction','Hysteresis, apparent P/V offset','Take increasing and decreasing sequences and wait for settling.'],['Compression or expansion changes gas temperature','Breaks Boyle isothermal condition','Move slowly and wait for thermal equilibrium.'],['Bath not equilibrated','Column temperature differs from thermometer','Stir and wait before each reading.']],
 reflection:'The hanging-mass pressure sign depends on the force geometry. This example explicitly uses a mass pulling the plunger outward.'
});
patch(9,{
 aim:'To investigate both charging and discharging of a capacitor, using a log-linear plot to determine RC.',
 setup:'Polarised capacitor C ≈ 470 μF; resistor R = 100 kΩ; low-voltage 6.00 V supply; changeover switch; high-input-resistance voltmeter/data logger. Nominal RC = 47.0 s.',
 variables:['Independent: elapsed time after switch position changes.','Dependent: capacitor voltage V.','Controls: same R, C, meter and 6.00 V initial/final supply level. Reset initial conditions for repeats.'],
 method:'Check capacitor polarity and voltage rating. Charge fully to 6.00 V; switch to discharge through the 100 kΩ resistor and record three repeat-run voltages at each elapsed time. Recharge between runs. For charging, first discharge safely through the resistor; switch to the supply and repeat the time series. Use ln(V/1 V) for discharge and ln((6.00−V)/1 V) for charge, excluding any zero difference.',
 tables:[
 ...sample('Discharge: three repeat runs from 6.00 V','t / s','V / V',[[0,[6,6,6]],[20,[3.91,3.93,3.92]],[40,[2.55,2.57,2.56]],[60,[1.67,1.68,1.67]],[80,[1.09,1.10,1.09]],[100,[.71,.72,.71]],[120,[.46,.47,.47]]],2,{headers:['ln(V / 1 V)'],values:(_,v)=>[fmt(Math.log(v),3)]}),
 ...sample('Charge: three repeat runs from 0 V','t / s','V / V',[[0,[0,0,0]],[20,[2.07,2.09,2.08]],[40,[3.43,3.45,3.44]],[60,[4.32,4.34,4.33]],[80,[4.90,4.92,4.91]],[100,[5.28,5.30,5.29]],[120,[5.52,5.54,5.53]]],2,{headers:['6.00 − mean V / V','ln((6.00 − V) / 1 V)'],values:(_,v)=>[fmt(6-v,2),fmt(Math.log(6-v),3)]})],
 calc:'Discharge: at 40 s, mean V = (2.55 + 2.57 + 2.56)/3 = 2.56 V and ln(V/1 V) = 0.940. A log-plot slope close to −0.0213 s⁻¹ gives τ = −1/slope ≈ 46.9 s. Charge: at 40 s, mean V = 3.44 V, remaining difference 6.00 − 3.44 = 2.56 V, so its logarithm is also 0.940; charge gives the same |slope|. C = τ/R ≈ 46.9/100000 = 469 μF.',
 graph:'Show raw V–t curves first. Then plot ln(V/1 V) against t for discharge and ln((6.00−V)/1 V) against t for charging. Both straight-line slopes should be close to −1/RC ≈ −0.0213 s⁻¹.',
 result:'Discharge τ ≈ 46.9 s; charge τ ≈ 46.9 s; inferred C ≈ 469 μF for R = 100 kΩ.',
 conclusion:'The charge and discharge curves are exponential; both log-linear slopes give a time constant near the nominal 47.0 s.',
 evaluation:[['Switch/timing lag','Distorts early points','Use a data logger triggered by the switch.'],['Late voltage near meter resolution','Log uncertainty becomes large','Exclude points whose V or V₀−V is indistinguishable from zero, stating why.'],['Meter input resistance or leakage','Changes effective RC','Use a high-input-resistance meter and compare with measured component values.']],
 reflection:'Logarithms use dimensionless ratios; V/1 V is written explicitly on the graph axis.'
});
patch(10,{
 aim:'To test how top-pan-balance force changes separately with current I, flux density B and active wire length L.',
 setup:'Magnet assembly tared on a top-pan balance. Straight wire supported independently through the pole gap, perpendicular to B and clear of the magnets. Low-voltage supply and series ammeter.',
 variables:['Sweep A: vary I; keep B = 0.220 T and L = 0.050 m.','Sweep B: vary B; keep I = 2.00 A and L = 0.050 m.','Sweep C: vary active L; keep I = 2.00 A and B = 0.220 T.'],
 method:'Tare the magnet assembly with no current. For each setting, switch current on briefly, record three balance changes Δm and convert grams to kilograms before multiplying by g. Reverse current as a sign check. Retare and vary only one quantity per series; the active length is the part inside the approximately uniform field.',
 tables:[
 ...sample('Vary current, B = 0.220 T, L = 0.050 m','I / A','Δm / g',[[.5,[.55,.56,.57]],[1,[1.11,1.12,1.13]],[1.5,[1.67,1.68,1.69]],[2,[2.23,2.24,2.25]],[2.5,[2.79,2.80,2.81]],[3,[3.35,3.36,3.37]]],2,{headers:['F = Δm g / N'],values:(_,m)=>[fmt(m/1000*9.81,4)]}),
 ...sample('Vary flux density, I = 2.00 A, L = 0.050 m','B / T','Δm / g',[[.1,[1.01,1.02,1.03]],[.15,[1.52,1.53,1.54]],[.2,[2.03,2.04,2.05]],[.25,[2.54,2.55,2.56]],[.3,[3.05,3.06,3.07]],[.4,[4.07,4.08,4.09]]],2,{headers:['F / N'],values:(_,m)=>[fmt(m/1000*9.81,4)]}),
 ...sample('Vary active length, I = 2.00 A, B = 0.220 T','L / m','Δm / g',[[.02,[.89,.90,.91]],[.03,[1.34,1.35,1.36]],[.04,[1.79,1.80,1.81]],[.05,[2.23,2.24,2.25]],[.07,[3.13,3.14,3.15]],[.1,[4.47,4.48,4.49]]],2,{headers:['F / N'],values:(_,m)=>[fmt(m/1000*9.81,4)]})],
 calc:'At I = 2.00 A, balance change 2.24 g = 0.00224 kg, so F = Δmg = 0.00224 × 9.81 = 0.02197 N. With active L = 0.050 m, B = F/(IL) = 0.02197/(2.00 × 0.050) = 0.220 T. The current-sweep F–I gradient is about 0.0110 N A⁻¹ = BL; B = gradient/L = 0.220 T.',
 graph:'Plot three separate graphs: F against I (gradient BL), F against B (gradient IL), F against active L in metres (gradient BI). Each should be linear over the tested range.',
 result:'Example B from the current graph ≈ 0.220 T; F is proportional to each of I, B and L at fixed controls.',
 conclusion:'The three series support F = BIL for a wire perpendicular to the magnetic field.',
 evaluation:[['Wire moves or touches pole pieces','False balance change','Use an independent support and maintain a clear gap.'],['Fringe field and unclear active L','Systematic B calculation error','Measure the wire length wholly within the uniform central field.'],['Balance resolution/zero drift','Large error at low F','Repeat/tare and reverse current to check sign.']],
 reflection:'The balance reads the reaction force on the magnets. The equal-magnitude force on the wire has opposite direction.'
});
patch(11,{
 aim:'To investigate the effect of search-coil angle on magnetic flux linkage using an oscilloscope, as AQA RP11 requires.',
 setup:'A stationary N = 200 turn search coil of area A = 10.0 cm² centred in a sinusoidal AC magnetic field with peak B = 4.00 mT and f = 50.0 Hz. Angle θ is between the coil normal and field direction. Oscilloscope displays peak-to-peak induced voltage.',
 variables:['Independent: θ, angle between coil normal and B.','Dependent: peak-to-peak induced emf, converted to peak emf.','Controls: coil turns and area, centre position, field amplitude, drive frequency and oscilloscope probe setting.'],
 method:'Hold the search coil centred and stationary at each angle. Set time base to show several complete cycles; measure peak-to-peak trace divisions three times and multiply by volts/division. Divide Vpp by two for peak emf. Record θ from 0° to 90°, keeping the AC field amplitude/frequency fixed, and plot peak emf against cosθ.',
 tables:[{title:'Oscilloscope setting and conversion',headers:['Vertical scale','Probe factor','Frequency','One example trace'],rows:[['0.100 V/div','×1','50.0 Hz','At θ = 0°, about 5.03 divisions peak-to-peak = 0.503 Vpp']]},...sample('Angle sweep: measured peak-to-peak emf','θ / °','Vpp / V',[[0,[.501,.503,.505]],[15,[.484,.486,.488]],[30,[.433,.435,.437]],[45,[.353,.355,.357]],[60,[.250,.252,.251]],[75,[.129,.130,.131]],[90,[.004,.005,.006]]],3,{headers:['cos θ','Epeak = Vpp/2 / V'],values:(angle,v)=>[fmt(Math.cos(angle*Math.PI/180),3),fmt(v/2,4)]})],
 calc:'At θ = 0°, mean Vpp = (0.501 + 0.503 + 0.505)/3 = 0.503 V, so Epeak = 0.2515 V. Plot gradient Epeak/cosθ ≈ 0.251 V. With sinusoidal B(t), Epeak = 2πfNBA cosθ, giving maximum flux linkage NBA = gradient/(2πf) = 0.251/(2π × 50.0) ≈ 8.0 × 10⁻⁴ Wb-turn. Independently, 200 × 0.00400 × 0.00100 = 8.0 × 10⁻⁴ Wb-turn.',
 graph:'Plot Epeak / V vertically against cosθ horizontally. Slope ≈ 0.251 V; a residual near θ = 90° can reflect misalignment or electrical pickup. State the angle is to the coil normal.',
 result:'Peak flux linkage NBA ≈ 8.0 × 10⁻⁴ Wb-turn; peak emf ∝ cosθ.',
 conclusion:'The angular dependence is consistent with flux linkage NBA cosθ and Faraday’s law for a time-varying field.',
 evaluation:[['Confusing Vpp and peak voltage','Factor-of-two error in NBA','Record volts/div, probe factor and amplitude definition.'],['Coil centre shifts on rotation','Field strength changes as well as θ','Pivot the search coil about its centre.'],['Near 90° pickup/misalignment','Non-zero small voltage','Measure background pickup and repeat angular setting.']],
 reflection:'A stationary coil produces AC emf because B changes with time. A steady DC field with a stationary coil would not do so.'
});
patch(12,{
 aim:'Simulation-only worked record for the inverse-square law for gamma count rate, including background subtraction and count uncertainty.',
 setup:'Virtual sealed gamma source, virtual GM detector and scaler. Distance r is defined between source position and detector sensitive centre. Each source count lasts 60 s; a separate simulated background count lasts 120 s.',
 variables:['Independent: source–detector distance r.','Dependent: background-corrected count rate.','Controls: same virtual source/detector orientation, geometry and 60 s source count time.'],
 method:'In the simulation, measure background over 120 s. For each of six distances, take three raw 60 s counts without changing alignment. Divide counts by 60 s, subtract background rate and calculate 1/r². Retain raw counts and do not force a negative corrected rate to zero.',
 tables:[{title:'Raw 120 s simulated background count',headers:['Background counts Nb','Time tb / s','Background rate Nb/tb / s⁻¹'],rows:[['37','120','0.3083']]},{title:'Raw repeated 60 s source-plus-background counts',headers:['r / m','N₁ / counts','N₂ / counts','N₃ / counts','t / s'],rows:[['0.20','2720','2651','2780','60'],['0.30','1212','1250','1180','60'],['0.40','692','718','664','60'],['0.50','450','468','421','60'],['0.60','312','331','300','60'],['0.70','236','251','224','60']]},{title:'Processed mean rates and counting uncertainty',headers:['r / m','1/r² / m⁻²','Mean N','(Mean N/60 − 37/120) / s⁻¹','Single-count σrate / s⁻¹'],rows:[[.2,[2720,2651,2780]],[.3,[1212,1250,1180]],[.4,[692,718,664]],[.5,[450,468,421]],[.6,[312,331,300]],[.7,[236,251,224]]].map(([r,ns])=>{const N=avg(ns),rate=N/60-37/120,sigma=Math.sqrt(N/60**2+37/120**2);return [fmt(r,2),fmt(1/r**2,3),fmt(N,1),fmt(rate,3),fmt(sigma,3)];})}],
 unc:[['Source-plus-background count','GM/scaler','1 count','Poisson single-count standard uncertainty ≈ √N'],['Background count','120 s separate count','1 count','σbackground rate = √37/120 ≈ 0.0507 s⁻¹'],['Distance','scale and detector-centre definition','1 mm','relative uncertainty in 1/r² ≈ 2Δr/r']],
 calc:'At r = 0.40 m, mean raw count = (692 + 718 + 664)/3 = 691.3 in 60 s. Corrected rate = 691.3/60 − 37/120 = 11.214 s⁻¹. Single-count rate standard uncertainty ≈ √(691.3/60² + 37/120²) = 0.441 s⁻¹; the standard uncertainty of the mean of three independent source counts is smaller, √(691.3/(3 × 60²) + 37/120²) = 0.258 s⁻¹ because the same background estimate is shared. 1/r² = 6.25 m⁻².',
 graph:'Plot background-corrected mean rate / s⁻¹ against 1/r² / m⁻² with count-derived vertical uncertainty bars. Gradient is near 1.8 m² s⁻¹ for this simulated geometry; consider a non-zero intercept, finite detector size and dead time.',
 result:'Corrected rate is broadly proportional to 1/r²; random counting spread is visible, especially at larger distances.',
 conclusion:'The simulated counts support the inverse-square relationship within statistical and geometry limitations.',
 evaluation:[['Poisson count variation','Repeated counts at one r differ','Count longer or use more repeats; never manufacture matching counts.'],['Background estimated once','Its uncertainty is shared across all corrected points','Take a longer background count and propagate it separately.'],['Small r or large r','Finite geometry/dead time or low signal','Use an intermediate distance range and disclose deviations.']],
 reflection:'This is only a simulation example. Real gamma-source work requires supervised school procedures and cannot be evidenced by a virtual record.'
});
window.LAB_BOOK_EXAMPLES_COMPLETE_VERSION='2026-09-16';
})();
