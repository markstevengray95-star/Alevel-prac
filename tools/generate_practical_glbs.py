import os, math, sys
import numpy as np
import trimesh
from trimesh.transformations import rotation_matrix
from trimesh.visual.material import PBRMaterial

OUT=os.path.abspath(sys.argv[1] if len(sys.argv)>1 else "assets")
os.makedirs(OUT,exist_ok=True)
COL={
'metal':([150,165,162,255],.72,.28),'dark':([35,49,52,255],.45,.40),'black':([20,25,25,255],.25,.55),
'white':([222,229,224,255],.05,.45),'cream':([190,181,151,255],.05,.65),'wood':([187,137,76,255],0,.65),
'red':([190,62,51,255],.15,.38),'blue':([58,98,155,255],.18,.38),'green':([107,153,89,255],.05,.45),
'copper':([176,90,37,255],.62,.26),'gold':([195,128,49,255],.48,.30),'glass':([162,205,214,210],0,.20),
'screen':([153,228,151,255],.05,.28),'yellow':([221,184,88,255],.05,.45),'grey':([100,110,106,255],.18,.45)}
M={k:PBRMaterial(name=k,baseColorFactor=v[0],metallicFactor=v[1],roughnessFactor=v[2]) for k,v in COL.items()}
def add(s,m,n,k):m.visual.material=M[k];s.add_geometry(m,geom_name=n,node_name=n);return m
def box(s,n,p,z,k='dark'):m=trimesh.creation.box(extents=z);m.apply_translation(p);return add(s,m,n,k)
def cyl(s,n,p,r,h,k='metal',axis='z',sections=32):
 m=trimesh.creation.cylinder(radius=r,height=h,sections=sections)
 if axis=='x':m.apply_transform(rotation_matrix(math.pi/2,[0,1,0]))
 elif axis=='y':m.apply_transform(rotation_matrix(math.pi/2,[1,0,0]))
 m.apply_translation(p);return add(s,m,n,k)
def sphere(s,n,p,r,k='metal'):m=trimesh.creation.icosphere(subdivisions=2,radius=r);m.apply_translation(p);return add(s,m,n,k)
def rod(s,n,a,b,r=.035,k='metal',sections=20):
 a=np.array(a,float);b=np.array(b,float);v=b-a;L=np.linalg.norm(v);m=trimesh.creation.cylinder(radius=r,height=L,sections=sections)
 z=np.array([0.,0.,1.]);vn=v/L;axis=np.cross(z,vn);dot=np.clip(np.dot(z,vn),-1,1)
 if np.linalg.norm(axis)>1e-8:m.apply_transform(rotation_matrix(math.acos(dot),axis))
 elif dot<0:m.apply_transform(rotation_matrix(math.pi,[1,0,0]))
 m.apply_translation((a+b)/2);return add(s,m,n,k)
def torus(s,n,p,major,minor,k='copper',normal=(0,0,1)):
 m=trimesh.creation.torus(major_radius=major,minor_radius=minor,major_sections=48,minor_sections=10);normal=np.array(normal,float);normal/=np.linalg.norm(normal)
 z=np.array([0.,0.,1.]);axis=np.cross(z,normal);dot=np.clip(np.dot(z,normal),-1,1)
 if np.linalg.norm(axis)>1e-8:m.apply_transform(rotation_matrix(math.acos(dot),axis))
 elif dot<0:m.apply_transform(rotation_matrix(math.pi,[1,0,0]))
 m.apply_translation(p);return add(s,m,n,k)
def wire(s,n,pts,r=.025,k='black'):
 for i in range(len(pts)-1):rod(s,f'{n}_{i}',pts[i],pts[i+1],r,k,12)
def bench(s,w=8.2,d=4.6):box(s,'LabBench',(0,0,-.18),(w,d,.32),'cream')
def stand(s,x,y,h=4.5):box(s,f'StandBase{x}{y}',(x,y,.08),(.9,.65,.16),'dark');rod(s,f'StandRod{x}{y}',(x,y,.15),(x,y,h),.055,'metal')
def meter(s,n,p):x,y,z=p;box(s,n,p,(1,.65,.55),'dark');box(s,n+'Face',(x,y-.34,z+.05),(.68,.035,.29),'white');cyl(s,n+'Red',(x-.22,y-.37,z-.16),.055,.08,'red','y');cyl(s,n+'Black',(x+.22,y-.37,z-.16),.055,.08,'black','y')
def supply(s,p):x,y,z=p;box(s,'PowerSupply',p,(1.35,.75,.62),'white');box(s,'SupplyDisplay',(x-.18,y-.39,z+.08),(.52,.03,.18),'black');cyl(s,'SupplyRed',(x+.36,y-.40,z-.12),.06,.08,'red','y');cyl(s,'SupplyBlack',(x+.12,y-.40,z-.12),.06,.08,'black','y')
def ruler(s,p=(0,.9,.18),length=5.2):
 x,y,z=p;box(s,'MetreRule',p,(length,.26,.12),'wood')
 for i in range(21):
  xx=x-length/2+i*length/20;rod(s,f'RulerTick{i}',(xx,y-.135,z+.07),(xx,y-.135,z+.16 if i%5==0 else z+.12),.006,'black',6)
def masses(s,p,n=4):
 x,y,z=p;rod(s,'MassStem',(x,y,z+.55),(x,y,z+1),.025,'metal')
 for i in range(n):cyl(s,f'Mass{i}',(x,y,z+.1+i*.12),.24,.10,'grey')
def p1():
 s=trimesh.Scene();bench(s);supply(s,(-2.7,-1.2,.38));box(s,'VibrationGenerator',(-1.35,-.15,.75),(.75,.65,.8),'dark');rod(s,'VibratorStem',(-1,-.15,.75),(-.72,-.15,.75),.045,'metal');wire(s,'String',[(-.72,-.15,.75),(2.55,-.15,.75),(2.72,-.15,.6),(2.72,-.15,-.05)],.014,'white');torus(s,'Pulley',(2.60,-.15,.72),.24,.045,'metal',(0,1,0));box(s,'PulleyStand',(2.60,.05,.34),(.35,.40,.55),'dark');masses(s,(2.72,-.15,-.55),3);ruler(s,(.55,.65,.16),4.4);return s
def p2g():
 s=trimesh.Scene();bench(s);box(s,'Laser',(-2.7,0,.55),(1.05,.55,.45),'black');cyl(s,'LaserLens',(-2.13,0,.55),.11,.12,'red','x');box(s,'DiffractionGrating',(-.7,0,1.05),(.12,.75,1.4),'dark')
 for i in range(13):rod(s,f'GratingLine{i}',(-.765,-.30+i*.05,.55),(-.765,-.30+i*.05,1.55),.006,'white',6)
 box(s,'Screen',(2.45,0,1.15),(.15,2.2,2),'white')
 for j,y in enumerate([-.72,-.36,0,.36,.72]):box(s,f'Maximum{j}',(2.36,y,1.15),(.02,.07 if y else .11,.85),'yellow')
 rod(s,'LaserBeam',(-2.1,0,.55),(2.32,0,.55),.012,'red');ruler(s,(0,1.35,.16),5);return s
def p3():
 s=trimesh.Scene();bench(s);stand(s,-.8,.2,4.5);box(s,'Release',(-.15,.2,4),(.8,.55,.35),'dark');sphere(s,'Ball',(-.15,.2,3.65),.18,'metal')
 for z in (2.4,1.15):
  box(s,f'GateTop{z}',(-.15,.2,z),(1.15,.35,.18),'dark');box(s,f'GateL{z}',(-.63,.2,z-.38),(.18,.35,.75),'dark');box(s,f'GateR{z}',(.33,.2,z-.38),(.18,.35,.75),'dark');rod(s,f'GateBeam{z}',(-.52,0,z-.38),(.22,0,z-.38),.012,'red')
 box(s,'DataLogger',(2.35,-.85,.55),(1.45,.8,.75),'white');box(s,'LoggerDisplay',(2.35,-1.27,.62),(.75,.03,.24),'black');wire(s,'GateCable',[(-.15,.38,2),(0.8,.7,1.1),(1.7,-.6,.7),(2,-.95,.62)],.02,'black');ruler(s,(1.05,.95,1.9),3.5);return s
def p5():
 s=trimesh.Scene();bench(s,8.6,4.8);supply(s,(-3,-1.25,.4));meter(s,'Ammeter',(-1.3,-1.25,.4));meter(s,'Voltmeter',(.5,-1.25,.4));ruler(s,(.1,.72,.20),5.7);rod(s,'ResistanceWire',(-2.7,.35,.48),(2.8,.35,.48),.022,'copper');box(s,'LeftTerminal',(-2.7,.35,.56),(.24,.22,.18),'dark');box(s,'RightTerminal',(2.8,.35,.56),(.24,.22,.18),'dark');box(s,'Slider',(.65,.35,.78),(.22,.25,.25),'red');rod(s,'Probe',(.65,.35,.72),(.65,.35,.5),.025,'metal');torus(s,'MicrometerFrame',(2.85,1.22,.76),.48,.08,'dark',(0,1,0));rod(s,'MicSpindle',(2.45,1.22,.76),(2.88,1.22,.76),.05,'metal');cyl(s,'MicThimble',(2.28,1.22,.76),.16,.36,'metal','x');wire(s,'Series',[(-2.7,-1.62,.3),(-1.8,-1.7,.35),(-1.3,-1.62,.35),(-2.7,.35,.56)],.018,'red');wire(s,'Return',[(2.8,.35,.56),(3.2,-1.9,.35),(-2.75,-1.9,.35)],.018,'black');wire(s,'VoltProbe',[(.3,-1.62,.35),(.65,.35,.78)],.014,'red');wire(s,'VoltZero',[(.7,-1.62,.35),(-2.7,.35,.56)],.014,'blue');return s
def p6():
 s=trimesh.Scene();bench(s);supply(s,(-2.7,-1.25,.4));meter(s,'Ammeter',(-1,-1.25,.4));meter(s,'Voltmeter',(.6,-1.25,.4));box(s,'LampBase',(.3,.2,.35),(.9,.55,.22),'dark');sphere(s,'LampBulb',(.3,.2,.8),.25,'glass');cyl(s,'LampCap',(.3,.2,.50),.15,.25,'metal');cyl(s,'Rheostat',(2.15,.2,.55),.28,1.6,'dark','x');rod(s,'RheostatSlider',(2.15,.2,.75),(2.15,.2,1.1),.05,'metal');box(s,'Switch',(2.4,-1.15,.25),(.85,.48,.18),'dark');rod(s,'SwitchBlade',(2.15,-1.15,.38),(2.62,-1.15,.62),.04,'metal');wire(s,'MainCircuit',[(-2.35,-1.62,.3),(-1,-1.62,.3),(-.45,-1,.4),(0,.2,.35),(.75,.2,.35),(1.35,.2,.55),(2.4,.2,.55),(2.4,-1.15,.35),(2.7,-1.65,.3),(-2.6,-1.65,.3)],.02,'red');wire(s,'VoltmeterBranch',[(.35,-1.62,.35),(0,.2,.35)],.014,'black');wire(s,'VoltmeterBranch2',[(.85,-1.62,.35),(.75,.2,.35)],.014,'red');return s
def p7p():
 s=trimesh.Scene();bench(s);stand(s,-1.4,.2,4.5);rod(s,'ClampArm',(-1.4,.2,4),(.15,.2,4),.05,'metal');wire(s,'PendulumString',[(.05,.2,3.95),(.35,.2,1.25)],.012,'white');sphere(s,'PendulumBob',(.35,.2,1.05),.22,'metal');box(s,'Fiducial',(.35,-.1,.72),(.08,.55,.95),'white');box(s,'Stopwatch',(2.1,-1.05,.3),(.75,.35,.50),'black');ruler(s,(.7,.95,.16),4.2);return s
def p7s():
 s=trimesh.Scene();bench(s);stand(s,-1.1,.2,4.5);rod(s,'ClampArm',(-1.1,.2,4),(.25,.2,4),.05,'metal');pts=[]
 for i in range(70):
  t=i/69*10*math.pi;pts.append((.15+.16*math.cos(t),.2+.16*math.sin(t),3.9-i/69*2.2))
 wire(s,'Spring',pts,.025,'metal');masses(s,(.15,.2,.45),4);ruler(s,(1.4,.65,1.9),3.5);box(s,'Timer',(2.45,-1,.4),(1,.55,.6),'white');return s
def p8b():
 s=trimesh.Scene();bench(s);stand(s,-1.4,.4,4.6);rod(s,'ClampArm',(-1.4,.4,3.4),(-.2,.4,3.4),.05,'metal');cyl(s,'GasSyringe',(-.05,.4,3.25),.34,2.1,'glass');cyl(s,'Plunger',(-.05,.4,2),.26,.22,'dark');rod(s,'PlungerRod',(-.05,.4,1.95),(-.05,.4,.95),.06,'metal');masses(s,(-.05,.4,.20),4);return s
def p8c():
 s=trimesh.Scene();bench(s);box(s,'WaterBath',(.6,.2,.65),(3.3,2,1.1),'glass');cyl(s,'Capillary',(.2,.2,1.75),.10,2.5,'glass');cyl(s,'LiquidColumn',(.2,.2,1.15),.045,1.1,'red');cyl(s,'Thermometer',(1.25,.2,1.7),.08,2.4,'white');cyl(s,'ThermometerFluid',(1.25,.18,1.25),.025,1.4,'red');stand(s,-1.6,.35,3.7);rod(s,'ClampArm',(-1.6,.35,2.2),(.4,.35,2.2),.05,'metal');ruler(s,(.2,1.45,.16),3.5);return s
def p9():
 s=trimesh.Scene();bench(s);supply(s,(-2.7,-1.25,.4));box(s,'ChangeoverSwitch',(-1.15,-.65,.35),(.9,.55,.2),'dark');rod(s,'SwitchBlade',(-1.35,-.65,.5),(-.85,-.65,.75),.04,'metal');box(s,'Resistor',(0,-.25,.45),(1.1,.45,.32),'cream');cyl(s,'Capacitor',(1.4,.1,.65),.33,.85,'black');meter(s,'Voltmeter',(2.7,-.8,.45));wire(s,'RC',[(-2.35,-1.62,.3),(-1.4,-.8,.35),(-.55,-.25,.45),(.55,-.25,.45),(1.4,.1,.25),(2.45,-1.13,.35)],.02,'red');wire(s,'Return',[(2.95,-1.13,.35),(1.4,.1,.25),(-2.65,-1.62,.3)],.02,'black');return s
def p10():
 s=trimesh.Scene();bench(s,8.6,4.8);supply(s,(-3,-1.3,.4));meter(s,'Ammeter',(-1.35,-1.3,.4));cyl(s,'VariableResistor',(.15,-1.25,.45),.24,1.1,'dark','x');box(s,'Switch',(1.3,-1.25,.25),(.75,.45,.18),'dark');box(s,'Balance',(2,.5,.42),(2.2,1.55,.7),'white');box(s,'BalancePan',(2,.5,.83),(1.85,1.25,.12),'metal');box(s,'NorthMagnet',(1.55,.5,1.4),(.45,.7,1),'red');box(s,'SouthMagnet',(2.45,.5,1.4),(.45,.7,1),'blue');stand(s,.5,.5,3.2);stand(s,3.5,.5,3.2);rod(s,'CurrentWire',(.8,.5,1.45),(3.2,.5,1.45),.035,'copper');wire(s,'CurrentLead',[(1.3,-1.25,.35),(.8,.5,1.45)],.02,'red');wire(s,'ReturnLead',[(3.2,.5,1.45),(3.6,-1.6,.35),(-2.65,-1.65,.35)],.02,'black');ruler(s,(0,-.2,.15),4.8);return s
def p11():
 s=trimesh.Scene();bench(s,8.3,4.8);supply(s,(-2.7,-1.2,.4))
 for r in (1.25,1.18,1.10):torus(s,'FieldCoil'+str(r),(-.35,.25,1.8),r,.035,'copper',(0,1,0))
 n=(math.sin(math.radians(35)),math.cos(math.radians(35)),0)
 for r in (.55,.50):torus(s,'SearchCoil'+str(r),(-.35,-.05,1.8),r,.025,'gold',n)
 rod(s,'SearchPivot',(-.35,-.05,.8),(-.35,-.05,2.75),.03,'metal');box(s,'Oscilloscope',(2.45,-.35,1),(1.8,.85,1.45),'dark');box(s,'ScopeScreen',(2.45,-.79,1.12),(1.15,.03,.75),'black');pts=[]
 for i in range(25):pts.append((1.98+i*.04,-.82,1.12+.18*math.sin(i/24*4*math.pi)))
 wire(s,'Waveform',pts,.012,'screen');wire(s,'ScopeLead',[(-.35,-.1,1.1),(.6,-1.1,.7),(1.7,-.75,.8)],.015,'black');return s
def p12():
 s=trimesh.Scene();bench(s);stand(s,-2.1,.35,3.5);box(s,'SourceHolder',(-1.55,.35,1.9),(.55,.55,.35),'dark');cyl(s,'VirtualSource',(-1.55,.35,1.9),.16,.18,'yellow','x');stand(s,1.2,.35,3);cyl(s,'GMTube',(.65,.35,1.9),.23,1,'grey','x');box(s,'Scaler',(2.5,-.85,.55),(1.5,.8,.75),'white');box(s,'ScalerDisplay',(2.5,-1.27,.62),(.8,.03,.25),'black');ruler(s,(-.25,.95,.16),4.2);wire(s,'DetectorCable',[(1.15,.35,1.9),(1.7,-.2,1.2),(2,-.95,.65)],.02,'black');return s
SC={'rp01-standing-waves':p1,'rp02-diffraction-grating':p2g,'rp03-free-fall':p3,'rp05-resistivity-wire':p5,'rp06-iv-characteristics':p6,'rp07-pendulum':p7p,'rp07-spring':p7s,'rp08-boyle-syringe':p8b,'rp08-charles-law':p8c,'rp09-capacitor':p9,'rp10-wire-balance':p10,'rp11-search-coil':p11,'rp12-inverse-square':p12}
for name,fn in SC.items():
 blob=fn().export(file_type='glb');path=os.path.join(OUT,name+'.glb');open(path,'wb').write(blob);print('3D',os.path.basename(path),len(blob))