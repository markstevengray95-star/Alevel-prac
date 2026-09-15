'use strict';
const assert=require('assert');
const close=(a,b,tol=1e-9,msg='')=>assert.ok(Math.abs(a-b)<=tol,`${msg} expected ${b}, got ${a}`);

// P1 stationary waves: f=(1/2L)sqrt(T/mu), and f doubles when L halves.
{
  const L=.8,T=4.9,mu=.0015;
  const f=(1/(2*L))*Math.sqrt(T/mu);
  const fHalf=(1/(2*(L/2)))*Math.sqrt(T/mu);
  close(fHalf/f,2,1e-12,'P1 length relation');
}
// P2 Young slits and grating equations.
{
  const lam=632.8e-9,D=1.5,s=.4e-3;
  const w=lam*D/s;
  close(w/D,lam/s,1e-12,'P2 Young relation');
  const d=1.67e-6,n=2;
  assert.ok(n*lam/d<1,'P2 selected grating order must exist');
  close(Math.sin(Math.asin(n*lam/d)),n*lam/d,1e-12,'P2 grating relation');
}
// P3 free fall: h=(1/2)gt^2 and gradient h/t^2=g/2.
{
  const g=9.81,h=.5,t=Math.sqrt(2*h/g);
  close(h/(t*t),g/2,1e-12,'P3 h vs t^2 gradient');
  close(2*h/(t*t),g,1e-12,'P3 g recovery');
}
// P4 Young modulus: stress/strain=E.
{
  const F=10,L=1.5,d=.4e-3,E=2e11,A=Math.PI*d*d/4;
  const stress=F/A,strain=stress/E,ext=strain*L;
  close(stress/strain,E,1e-3,'P4 Young modulus');
  close(ext/L,strain,1e-15,'P4 strain from extension');
}
// P5 resistivity: R=rho L/A, linear in L.
{
  const rho=4.9e-7,d=.45e-3,A=Math.PI*d*d/4;
  const R1=rho*.4/A,R2=rho*.8/A;
  close(R2/R1,2,1e-12,'P5 R proportional L');
}
// P6 internal resistance: V=emf-Ir.
{
  const R=8,e=1.5,r=.6,I=e/(R+r),V=e-I*r;
  close(V,I*R,1e-12,'P6 terminal pd');
  close((e-V)/I,r,1e-12,'P6 gradient magnitude');
}
// P7 SHM linearised relationships.
{
  const g=9.81,L=.7,Tp=2*Math.PI*Math.sqrt(L/g);
  close(Tp*Tp/L,4*Math.PI*Math.PI/g,1e-12,'P7 pendulum T^2/L');
  const m=.4,k=8,Ts=2*Math.PI*Math.sqrt(m/k);
  close(Ts*Ts/m,4*Math.PI*Math.PI/k,1e-12,'P7 spring T^2/m');
}
// P8 gas laws.
{
  const patm=101,V0=4,load=400,area=.00032;
  const p=patm+(load/1000*9.81/area)/1000,V=patm*V0/p;
  close(p*V,patm*V0,1e-9,'P8 Boyle pV');
  const L0=4,T0=293.15,T=333.15,L=L0*T/T0;
  close(L/T,L0/T0,1e-12,'P8 Charles L/T');
}
// P9 RC: log-linear gradient is -1/RC for discharge and charge complement.
{
  const R=47000,C=.001,tau=R*C,V0=9,t1=10,t2=20;
  const v1=V0*Math.exp(-t1/tau),v2=V0*Math.exp(-t2/tau);
  close((Math.log(v2)-Math.log(v1))/(t2-t1),-1/tau,1e-12,'P9 discharge log gradient');
  const c1=V0*(1-Math.exp(-t1/tau)),c2=V0*(1-Math.exp(-t2/tau));
  close((Math.log(V0-c2)-Math.log(V0-c1))/(t2-t1),-1/tau,1e-12,'P9 charge complement gradient');
}
// P10 magnetic force F=BIL.
{
  const B=.2,I=2,L=.05,F=B*I*L;
  close(F,.02,1e-12,'P10 BIL');
  close(F/9.81*1000,2.038735983690112,1e-12,'P10 balance mass equivalent');
}
// P11 search coil: amplitude follows cos(theta), and scales with frequency in the model.
{
  const amp=.7,f=50;
  const e0=amp*(f/50)*Math.cos(0),e60=amp*(f/50)*Math.cos(Math.PI/3),e100Hz=amp*(100/50);
  close(e60/e0,.5,1e-12,'P11 cos angle relation');
  close(e100Hz/e0,2,1e-12,'P11 frequency scaling');
}
// P12 inverse square: corrected source rate * r^2 is constant; longer counts improve fractional statistics.
{
  const source=r=>5000/(r*r);
  close(source(10)*100,source(25)*625,1e-12,'P12 inverse square');
  const rate=source(20)+22;
  const frac=t=>Math.sqrt(rate*t/60)/(rate*t/60);
  assert.ok(frac(120)<frac(30),'P12 longer count time should reduce fractional uncertainty');
}
console.log('All 12 practical physics model checks passed.');