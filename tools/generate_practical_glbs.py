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
'screen':([153,228,151,255],.05,.28),'yellow':([221,184,88,255],.05,.45),'grey':([100,110,106,255],.18,.45),
'orange':([218,104,34,255],.04,.34),'meter_yellow':([230,178,34,255],.02,.42),'navy':([25,45,62,255],.20,.36),
'lcd':([112,158,128,255],.02,.22),'burgundy':([96,37,30,255],.08,.45),'silver':([190,198,196,255],.78,.20),
'rubber_red':([150,25,24,255],.02,.62),'rubber':([32,37,38,255],.02,.78),'bluebase':([38,85,155,255],.10,.38),'paper':([235,232,218,255],0,.70),'brass':([168,118,42,255],.62,.25)}
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

def banana(s,n,p,k='red'):
 x,y,z=p;cyl(s,n,(x,y,z),.055,.09,k,'y',24);cyl(s,n+' Collar',(x,y+.055,z),.08,.035,'black','y',24)
def knob(s,n,p,r=.10,k='black'):
 cyl(s,n,p,r,.09,k,'y',32);rod(s,n+' Pointer',(p[0],p[1]-.052,p[2]),(p[0],p[1]-.052,p[2]+r*.72),.010,'white',8)
def orange_supply(s,p,name='Signal generator'):
 x,y,z=p
 box(s,name,p,(1.65,.83,.78),'orange');box(s,name+' black top',(x,y+.02,z+.43),(1.58,.76,.10),'black')
 box(s,name+' front',(x,y-.425,z),(1.47,.035,.59),'orange')
 box(s,name+' LCD',(x-.38,y-.448,z+.13),(.46,.025,.18),'lcd')
 knob(s,name+' coarse knob',(x+.12,y-.455,z+.10),.115);knob(s,name+' fine knob',(x+.42,y-.455,z+.10),.085)
 banana(s,name+' red socket',(x+.37,y-.465,z-.18),'red');banana(s,name+' black socket',(x+.10,y-.465,z-.18),'black')
 box(s,name+' foot L',(x-.55,y+.18,z-.43),(.18,.25,.10),'rubber');box(s,name+' foot R',(x+.55,y+.18,z-.43),(.18,.25,.10),'rubber')
def multimeter(s,n,p,kind='A'):
 x,y,z=p
 box(s,n,p,(.72,.40,1.08),'meter_yellow');box(s,n+' black face',(x,y-.213,z+.05),(.59,.035,.88),'black')
 box(s,n+' LCD',(x,y-.235,z+.34),(.42,.025,.19),'lcd');knob(s,n+' selector',(x,y-.238,z-.10),.145,'dark')
 banana(s,n+' COM',(x-.13,y-.245,z-.37),'black');banana(s,n+' V/A',(x+.14,y-.245,z-.37),'red')
 box(s,n+' label '+kind,(x,y-.242,z+.51),(.18,.018,.10),'paper')
def crocodile(s,n,p,k='red',axis='x'):
 x,y,z=p
 if axis=='x': box(s,n,(x,y,z),(.34,.13,.12),k);box(s,n+' jaw',(x+.19,y,z),(.16,.07,.05),'silver')
 else: box(s,n,(x,y,z),(.13,.34,.12),k);box(s,n+' jaw',(x,y+.19,z),(.07,.16,.05),'silver')
def rheostat(s,n,p):
 x,y,z=p
 box(s,n+' wooden base',(x,y,z-.18),(2.05,.70,.20),'burgundy')
 cyl(s,n+' ceramic former',(x,y,z+.08),.24,1.65,'cream','x',48)
 for i in range(24):
  xx=x-.78+i*1.56/23
  torus(s,n+f' resistance turn {i}',(xx,y,z+.08),.235,.012,'black',(1,0,0))
 rod(s,n+' slider rail',(x-.84,y,z+.48),(x+.84,y,z+.48),.035,'silver')
 box(s,n+' sliding contact',(x+.18,y,z+.50),(.20,.28,.14),'silver')
 rod(s,n+' contact arm',(x+.18,y,z+.48),(x+.18,y,z+.19),.025,'silver')
 banana(s,n+' left terminal',(x-.92,y-.39,z-.10),'red');banana(s,n+' right terminal',(x+.92,y-.39,z-.10),'black')
def knife_switch(s,n,p,closed=False):
 x,y,z=p
 box(s,n+' base',p,(.78,.48,.16),'black')
 banana(s,n+' terminal A',(x-.22,y-.29,z+.10),'red');banana(s,n+' terminal B',(x+.22,y-.29,z+.10),'black')
 a=np.array([x-.22,y,z+.17]);b=np.array([x+.22,y,z+.17 if closed else z+.48])
 rod(s,n+' blade',a,b,.035,'silver')
 sphere(s,n+' pivot',a,.065,'brass')
def cell_holder(s,p):
 x,y,z=p
 box(s,'Cell holder',(x,y,z),(1.18,.62,.20),'white')
 for i,xx in enumerate((x-.28,x+.28)):
  cyl(s,f'Cell {i+1}',(xx,y,z+.20),.13,.54,'silver','x',40)
  cyl(s,f'Cell {i+1} positive cap',(xx+.285,y,z+.20),.075,.04,'brass','x',32)
 banana(s,'Cell red terminal',(x+.50,y-.34,z+.08),'red');banana(s,'Cell black terminal',(x-.50,y-.34,z+.08),'black')
def ruler(s,p=(0,.9,.18),length=5.2):
 x,y,z=p;box(s,'MetreRule',p,(length,.26,.12),'wood')
 for i in range(21):
  xx=x-length/2+i*length/20;rod(s,f'RulerTick{i}',(xx,y-.135,z+.07),(xx,y-.135,z+.16 if i%5==0 else z+.12),.006,'black',6)
def masses(s,p,n=4):
 x,y,z=p;rod(s,'MassStem',(x,y,z+.55),(x,y,z+1),.025,'metal')
 for i in range(n):cyl(s,f'Mass{i}',(x,y,z+.1+i*.12),.24,.10,'grey')
def p1():
 s=trimesh.Scene();bench(s,8.8,4.9)
 # AQA-style bench arrangement: blue-base retort stand, vibration generator, orange signal generator,
 # metre rule, pulley at the bench edge and a freely hanging mass hanger.
 box(s,'Retort stand blue base',(-2.55,.28,.08),(1.18,.78,.16),'bluebase');rod(s,'Retort stand vertical rod',(-2.55,.28,.15),(-2.55,.28,3.10),.052,'silver')
 rod(s,'Retort stand clamp arm',(-2.55,.28,2.55),(-1.70,.28,2.55),.042,'silver');box(s,'Boss head',(-2.48,.28,2.55),(.26,.24,.28),'dark')
 box(s,'Clamp jaws',(-1.67,.28,2.55),(.20,.42,.30),'dark')
 orange_supply(s,(0.0,-1.30,.52),'Signal generator')
 box(s,'Vibration generator body',(-1.72,-.12,.57),(.68,.62,.52),'black')
 cyl(s,'Vibration generator silver top',(-1.72,-.12,.89),.25,.17,'silver')
 cyl(s,'Vibration generator armature',(-1.46,-.12,.90),.055,.35,'silver','x')
 box(s,'Vibration generator mounting foot',(-1.72,-.12,.25),(.78,.72,.16),'grey')
 ruler(s,(.15,.78,.17),5.25)
 # Horizontal string from vibrator to pulley and then vertically down.
 wire(s,'String',[(-1.27,-.12,.90),(2.62,-.12,.90),(2.82,-.12,.70),(2.82,-.12,-.48)],.012,'white')
 torus(s,'Pulley wheel',(2.66,-.12,.78),.25,.045,'silver',(0,1,0))
 cyl(s,'Pulley axle',(2.66,-.12,.78),.055,.42,'black','y')
 box(s,'Pulley bracket',(2.66,.10,.47),(.42,.34,.62),'black')
 box(s,'Pulley bench clamp',(2.66,.34,.18),(.65,.34,.20),'black')
 # Clearly recognisable hanger with several slotted masses below the bench edge.
 rod(s,'Mass hanger stem',(2.82,-.12,-.48),(2.82,-.12,-1.05),.025,'silver')
 cyl(s,'Mass hanger tray',(2.82,-.12,-1.10),.24,.07,'silver')
 for i,z in enumerate((-1.00,-.88,-.76)):cyl(s,f'Slotted mass {i+1}',(2.82,-.12,z),.23,.085,'grey')
 # Cables between generator and vibration generator.
 wire(s,'Generator red lead',[(-.35,-1.72,.40),(-.78,-1.60,.35),(-1.45,-.45,.42),(-1.72,-.35,.52)],.018,'rubber_red')
 wire(s,'Generator black lead',[(.10,-1.72,.40),(-.20,-1.90,.35),(-1.60,-.58,.35),(-1.88,-.35,.48)],.018,'black')
 return s
def optical_support(s):
 box(s,'Optics stand blue base',(-2.35,.15,.08),(1.45,.92,.17),'bluebase')
 rod(s,'Optics stand vertical rod',(-2.35,.15,.15),(-2.35,.15,2.75),.052,'silver')
 rod(s,'Optics clamp arm',(-2.35,.15,1.35),(-1.34,.15,1.35),.040,'silver')
 box(s,'Optics boss head',(-2.27,.15,1.35),(.25,.23,.27),'dark')

def optical_screen(s):
 box(s,'Screen wooden base',(2.50,.06,.16),(1.02,.80,.22),'wood')
 box(s,'Projection screen',(2.50,.06,1.24),(.12,2.38,2.04),'paper')
 box(s,'Screen dark rear',(2.57,.06,1.24),(.07,2.40,2.08),'dark')

def p2d():
 s=trimesh.Scene();bench(s,8.6,4.8);optical_support(s)
 # AQA photo: small slit plate held in a clamp near the stand, laser on the bench,
 # long metre rule to a freestanding white screen.
 box(s,'Double slit holder',(-1.30,.15,1.35),(.16,.76,.82),'dark')
 box(s,'Double slit plate',(-1.21,.15,1.35),(.035,.46,.52),'silver')
 for yy in (-.035,.035):box(s,'Double slit aperture '+str(yy),(-1.19,.15+yy,1.35),(.012,.012,.30),'black')
 box(s,'Laser body',(-2.05,-.78,.38),(1.22,.28,.30),'black')
 cyl(s,'Laser front lens',(-1.42,-.78,.38),.10,.10,'red','x')
 cyl(s,'Laser rear cap',(-2.70,-.78,.38),.12,.11,'dark','x')
 optical_screen(s);ruler(s,(.45,.93,.17),5.35)
 rod(s,'Laser beam',(-1.37,-.78,.38),(-1.18,.15,1.35),.010,'red')
 # Faint rays after the slit to the screen and a central fringe region.
 for dy in (-.34,-.17,0,.17,.34):rod(s,'Interference ray '+str(dy),(-1.18,.15,1.35),(2.42,.06+dy,1.35),.005,'red',8)
 for i,dy in enumerate((-.42,-.28,-.14,0,.14,.28,.42)):
  box(s,f'Fringe {i}',(2.43,.06+dy,1.35),(.018,.045 if dy else .075,.78),'yellow')
 return s

def p2g():
 s=trimesh.Scene();bench(s,8.6,4.8);optical_support(s)
 # Plane transmission grating held perpendicular to the laser beam.
 box(s,'Diffraction grating holder',(-1.30,.15,1.35),(.17,.78,.84),'dark')
 box(s,'Diffraction grating',(-1.20,.15,1.35),(.030,.50,.55),'glass')
 for i in range(19):
  yy=-.22+i*.44/18;rod(s,f'Grating line {i}',(-1.181,.15+yy,1.10),(-1.181,.15+yy,1.60),.003,'black',6)
 box(s,'Laser body',(-2.05,-.78,.38),(1.22,.28,.30),'black')
 cyl(s,'Laser front lens',(-1.42,-.78,.38),.10,.10,'red','x')
 optical_screen(s);ruler(s,(.45,.93,.17),5.35)
 rod(s,'Laser beam',(-1.37,-.78,.38),(-1.18,.15,1.35),.010,'red')
 for i,dy in enumerate((-0.72,-0.36,0,.36,.72)):
  rod(s,f'Diffracted ray {i}',(-1.18,.15,1.35),(2.42,.06+dy,1.35),.006,'red',8)
  sphere(s,f'Diffraction maximum {i}',(2.42,.06+dy,1.35),.055 if dy else .085,'red')
 return s
def logger_box(s,p,name='Data logger'):
 x,y,z=p
 box(s,name,p,(1.35,.72,.78),'orange');box(s,name+' display',(x,y-.38,z+.10),(.72,.025,.22),'lcd')
 banana(s,name+' input A',(x-.24,y-.39,z-.18),'green');banana(s,name+' input B',(x+.18,y-.39,z-.18),'yellow')
 knob(s,name+' control',(x+.46,y-.39,z+.12),.09,'black')

def p3():
 s=trimesh.Scene();bench(s,8.4,4.8)
 box(s,'Retort stand blue base',(-1.05,.28,.08),(1.18,.80,.16),'bluebase');rod(s,'Retort stand vertical rod',(-1.05,.28,.15),(-1.05,.28,4.55),.052,'silver')
 rod(s,'Upper clamp arm',(-1.05,.28,4.10),(-.15,.28,4.10),.042,'silver');box(s,'Upper boss head',(-.98,.28,4.10),(.24,.24,.28),'dark')
 box(s,'Release mechanism',(-.08,.28,4.10),(.65,.54,.36),'green');cyl(s,'Release screw',(.25,.28,4.10),.055,.24,'silver','x')
 sphere(s,'Ball bearing',(-.08,.28,3.72),.18,'silver')
 # Two realistic U-shaped light gates on separate mounting blocks.
 for idx,z in enumerate((2.55,1.20)):
  box(s,f'Light gate {idx+1} base',(-.08,.28,z-.62),(.92,.72,.18),'black')
  box(s,f'Light gate {idx+1} left',(-.47,.28,z-.20),(.17,.42,.78),'black')
  box(s,f'Light gate {idx+1} right',(.31,.28,z-.20),(.17,.42,.78),'black')
  box(s,f'Light gate {idx+1} top',(-.08,.28,z+.16),(.95,.42,.16),'black')
  rod(s,f'Light gate {idx+1} beam',(-.37,.05,z-.18),(.21,.05,z-.18),.010,'red',8)
 logger_box(s,(2.15,-.92,.55),'Data logger')
 wire(s,'Upper gate cable',[(-.45,.48,2.12),(.50,.82,1.55),(1.55,-.55,.78),(1.78,-1.18,.52)],.018,'green')
 wire(s,'Lower gate cable',[(.28,.48,.77),(.85,.58,.65),(1.60,-.72,.55),(2.10,-1.18,.45)],.018,'yellow')
 # Vertical metre rule and plumb-line check.
 box(s,'Vertical metre rule',(.92,.72,2.30),(.18,.15,3.85),'wood')
 for i in range(21):
  zz=.45+i*3.55/20;rod(s,f'Vertical ruler tick {i}',(.82,.63,zz),(.94 if i%5==0 else .89,.63,zz),.005,'black',6)
 wire(s,'Plumb line',[(-.72,.76,4.10),(-.72,.76,.48)],.008,'black');sphere(s,'Plumb bob',(-.72,.76,.38),.10,'grey')
 return s

def p3impact():
 s=trimesh.Scene();bench(s,8.4,4.8)
 # AQA alternative arrangement: mechanical release, ball bearing, impact pad and orange logger.
 box(s,'Retort stand blue base',(-.65,.25,.08),(1.20,.82,.16),'bluebase');rod(s,'Retort stand vertical rod',(-.65,.25,.15),(-.65,.25,4.35),.052,'silver')
 rod(s,'Mechanical release clamp arm',(-.65,.25,3.92),(.28,.25,3.92),.042,'silver');box(s,'Release boss head',(-.58,.25,3.92),(.24,.24,.28),'dark')
 box(s,'Mechanical release',(.28,.25,3.92),(.86,.56,.40),'green');cyl(s,'Release trigger',(.70,.25,3.92),.06,.24,'silver','x')
 sphere(s,'Ball bearing',(.28,.25,3.52),.18,'silver')
 box(s,'Impact pressure pad',(.28,.25,.28),(1.04,.84,.18),'black');box(s,'Impact sensor plate',(.28,.25,.41),(.80,.62,.08),'silver')
 logger_box(s,(2.15,-.88,.55),'Data logger')
 wire(s,'Release timer lead',[(.58,.52,3.92),(1.15,.72,2.45),(1.55,-.48,.95),(1.78,-1.16,.52)],.018,'green')
 wire(s,'Impact timer lead',[(.65,.45,.34),(1.20,.70,.42),(1.72,-.65,.42),(2.12,-1.16,.42)],.018,'yellow')
 box(s,'Vertical metre rule',(1.03,.76,2.22),(.18,.15,3.70),'wood')
 wire(s,'Plumb line',[(-.30,.82,3.92),(-.30,.82,.62)],.008,'black');sphere(s,'Plumb bob',(-.30,.82,.52),.10,'grey')
 return s
def p5():
 s=trimesh.Scene();bench(s,9.0,5.0)
 # AQA-style orange supply and two yellow digital multimeters.
 orange_supply(s,(-1.10,-1.25,.53),'Low voltage DC power supply')
 multimeter(s,'Ammeter',(-3.00,-.98,.72),'A');multimeter(s,'Voltmeter',(1.05,-.98,.72),'V')
 # Straight resistance wire fixed along a wooden metre rule.
 ruler(s,(.20,.92,.18),6.20)
 rod(s,'Resistance wire',(-2.85,.55,.49),(3.05,.55,.49),.018,'copper')
 crocodile(s,'Fixed crocodile clip',(-2.82,.55,.60),'black')
 crocodile(s,'Wire end crocodile clip',(3.02,.55,.60),'red')
 # Movable jockey/contact exactly above the selected wire length.
 box(s,'Sliding contact body',(.65,.55,.88),(.22,.28,.24),'rubber_red')
 rod(s,'Sliding contact needle',(.65,.55,.78),(.65,.55,.51),.023,'silver')
 box(s,'Sliding contact finger pad',(.65,.55,1.03),(.35,.34,.08),'red')
 # Separate micrometer used to measure wire diameter.
 line_pts=[(2.75,1.55,.42),(3.15,1.55,.50),(3.38,1.55,.82),(3.30,1.55,1.20),(2.95,1.55,1.34)]
 wire(s,'Micrometer C frame',line_pts,.065,'blue')
 rod(s,'Micrometer anvil',(2.93,1.55,1.30),(2.70,1.55,1.30),.045,'silver')
 rod(s,'Micrometer spindle',(2.12,1.55,1.30),(2.58,1.55,1.30),.045,'silver')
 cyl(s,'Micrometer thimble',(2.10,1.55,1.30),.16,.42,'silver','x')
 cyl(s,'Micrometer ratchet',(1.83,1.55,1.30),.11,.15,'dark','x')
 rod(s,'Wire sample in micrometer',(2.64,1.44,1.18),(2.64,1.66,1.42),.012,'copper')
 # Series and voltmeter branch leads mirror the visible AQA bench circuit.
 wire(s,'Supply positive lead',[(-.72,-1.69,.35),(-1.90,-1.95,.42),(-2.76,-1.22,.42)],.020,'red')
 wire(s,'Ammeter to fixed clip',[(-3.16,-1.22,.40),(-3.48,-.25,.52),(-2.82,.55,.60)],.020,'black')
 wire(s,'Wire return lead',[(3.02,.55,.60),(3.46,-.22,.48),(2.72,-1.94,.42),(-1.45,-1.72,.36)],.020,'black')
 wire(s,'Voltmeter negative branch',[(.90,-1.22,.42),(.40,-1.72,.55),(-2.82,.55,.60)],.016,'black')
 wire(s,'Voltmeter positive branch',[(1.20,-1.22,.42),(1.48,-.48,.65),(.65,.55,.90)],.016,'red')
 return s
def p6():
 s=trimesh.Scene();bench(s,8.9,5.0)
 # AQA RP6: cell/battery, variable resistor, ammeter in series, voltmeter across the source, switch.
 multimeter(s,'Ammeter',(-2.55,-.95,.72),'A');multimeter(s,'Voltmeter',(2.25,-.95,.72),'V')
 rheostat(s,'Variable resistor',(0.0,.35,.54))
 cell_holder(s,(.45,-1.12,.26))
 knife_switch(s,'Switch',(-1.05,-1.05,.28),False)
 # Leads arranged as the photographed AQA circuit: ammeter and rheostat in the main loop,
 # voltmeter connected directly across the cell terminals.
 wire(s,'Cell positive to switch',[(.95,-1.46,.34),(.30,-1.78,.40),(-.85,-1.38,.42)],.020,'red')
 wire(s,'Switch to ammeter',[(-1.28,-1.34,.38),(-1.65,-1.70,.46),(-2.42,-1.22,.45)],.020,'red')
 wire(s,'Ammeter to rheostat',[(-2.68,-1.22,.42),(-3.10,-.10,.52),(-.92,-.02,.62)],.020,'black')
 wire(s,'Rheostat return to cell',[(.92,-.02,.62),(1.42,-.10,.54),(1.15,-1.35,.38),(-.05,-1.45,.34)],.020,'black')
 wire(s,'Voltmeter positive to cell',[(2.38,-1.22,.43),(2.65,-.42,.55),(.95,-1.46,.34)],.016,'red')
 wire(s,'Voltmeter negative to cell',[(2.12,-1.22,.43),(1.82,-1.72,.52),(-.05,-1.45,.34)],.016,'black')
 # AQA setup has the switch open between readings; blade geometry visibly shows this.
 return s
def p7p():
 s=trimesh.Scene();bench(s,8.5,4.9)
 box(s,'Pendulum stand blue base',(-.95,.30,.08),(1.24,.84,.17),'bluebase')
 rod(s,'Pendulum stand vertical rod',(-.95,.30,.15),(-.95,.30,4.55),.052,'silver')
 rod(s,'Pendulum clamp arm',(-.95,.30,4.03),(.15,.30,4.03),.040,'silver')
 box(s,'Pendulum boss head',(-.88,.30,4.03),(.24,.24,.28),'dark')
 box(s,'Pendulum clamp jaws',(.15,.30,4.03),(.18,.34,.28),'dark')
 wire(s,'Pendulum string',[(.18,.30,3.94),(.18,.30,.98)],.012,'white')
 sphere(s,'Pendulum bob',(.18,.30,.77),.20,'silver')
 # Fiducial pin/marker near equilibrium, as shown in the AQA guide.
 rod(s,'Fiducial marker pin',(.58,.18,.44),(.58,.18,.98),.018,'silver')
 sphere(s,'Fiducial marker blob',(.58,.18,.98),.065,'blue')
 ruler(s,(-2.10,.94,.17),3.50)
 logger_box(s,(2.00,-.95,.52),'Stop clock')
 # A small clamp weight keeps the stand visibly stable.
 cyl(s,'Stand counterweight',(-.95,.30,.31),.30,.16,'grey')
 return s
def p7s():
 s=trimesh.Scene();bench(s,8.5,4.9)
 box(s,'Spring stand blue base',(-.85,.30,.08),(1.24,.84,.17),'bluebase')
 rod(s,'Spring stand vertical rod',(-.85,.30,.15),(-.85,.30,4.55),.052,'silver')
 rod(s,'Spring clamp arm',(-.85,.30,4.00),(.08,.30,4.00),.040,'silver')
 box(s,'Spring boss head',(-.78,.30,4.00),(.24,.24,.28),'dark')
 box(s,'Spring clamp hook',(.08,.30,3.95),(.20,.20,.28),'dark')
 pts=[]
 for i in range(88):
  t=i/87*12*math.pi
  pts.append((.10+.13*math.cos(t),.30+.13*math.sin(t),3.82-i/87*2.05))
 wire(s,'Spring',pts,.021,'silver')
 rod(s,'Mass hanger stem',(.10,.30,1.75),(.10,.30,1.10),.025,'silver')
 cyl(s,'Mass hanger tray',(.10,.30,1.08),.25,.07,'silver')
 for i,z in enumerate((1.18,1.29,1.40)):
  cyl(s,f'Slotted mass {i+1}',(.10,.30,z),.235,.085,'grey')
 rod(s,'Fiducial marker pin',(.56,.15,.78),(.56,.15,1.48),.018,'silver')
 sphere(s,'Fiducial marker blob',(.56,.15,1.48),.065,'blue')
 ruler(s,(-2.05,.94,.17),3.45)
 logger_box(s,(2.00,-.95,.52),'Stop clock')
 cyl(s,'Stand counterweight',(-.85,.30,.31),.30,.16,'grey')
 return s
def p8b():
 s=trimesh.Scene();bench(s,8.5,4.9)
 box(s,'Boyle stand blue base',(-1.35,.34,.08),(1.25,.84,.17),'bluebase')
 rod(s,'Boyle stand vertical rod',(-1.35,.34,.15),(-1.35,.34,4.45),.052,'silver')
 rod(s,'Boyle clamp arm',(-1.35,.34,3.38),(-.25,.34,3.38),.040,'silver')
 box(s,'Boyle boss head',(-1.28,.34,3.38),(.24,.24,.28),'dark')
 box(s,'Gas syringe clamp',(-.18,.34,3.38),(.22,.46,.32),'dark')
 # Transparent vertical syringe, plunger downwards, sealed top.
 cyl(s,'Gas syringe transparent barrel',(-.02,.34,3.20),.30,2.20,'glass')
 torus(s,'Gas syringe upper rim',(-.02,.34,4.30),.31,.035,'white')
 torus(s,'Gas syringe lower rim',(-.02,.34,2.10),.31,.035,'white')
 cyl(s,'Syringe plunger seal',(-.02,.34,2.47),.25,.20,'rubber')
 rod(s,'Syringe plunger rod',(-.02,.34,2.36),(-.02,.34,1.42),.055,'silver')
 cyl(s,'Syringe plunger flange',(-.02,.34,1.34),.29,.09,'white')
 cyl(s,'Sealed syringe nozzle',(-.02,.34,4.46),.075,.34,'white')
 box(s,'Syringe pinch clip',(.12,.34,4.62),(.25,.18,.14),'dark')
 # Scale markings.
 for i in range(17):
  z=2.30+i*.105
  rod(s,f'Syringe graduation {i}',(.27,.12,z),(.27+(.13 if i%4==0 else .06),.12,z),.006,'black',6)
 # Mass hanger suspended from plunger.
 rod(s,'Mass hanger hook',(-.02,.34,1.28),(-.02,.34,.88),.025,'silver')
 cyl(s,'Mass hanger tray',(-.02,.34,.85),.25,.07,'silver')
 for i,z in enumerate((.95,1.06,1.17)):
  cyl(s,f'Boyle slotted mass {i+1}',(-.02,.34,z),.235,.085,'grey')
 # Micrometer shown alongside for measuring seal diameter, matching AQA apparatus set.
 line_pts=[(2.10,1.32,.45),(2.50,1.32,.53),(2.72,1.32,.84),(2.64,1.32,1.18),(2.31,1.32,1.31)]
 wire(s,'Micrometer C frame',line_pts,.064,'blue')
 rod(s,'Micrometer spindle',(1.48,1.32,1.28),(1.98,1.32,1.28),.045,'silver')
 cyl(s,'Micrometer thimble',(1.45,1.32,1.28),.16,.40,'silver','x')
 return s
def p8c():
 s=trimesh.Scene();bench(s,8.5,4.9)
 # Large transparent beaker/water bath with ruler, capillary and thermometer.
 cyl(s,'Two litre beaker',(0,.20,.82),1.08,1.62,'glass')
 torus(s,'Beaker top rim',(0,.20,1.64),1.10,.035,'white')
 cyl(s,'Water bath',(0,.20,.66),1.02,1.28,'glass')
 box(s,'Vertical ruler',(-.24,.20,2.20),(.18,.12,3.55),'wood')
 for i in range(21):
  zz=.48+i*3.20/20;rod(s,f'Charles ruler tick {i}',(-.34,.13,zz),(-.24 if i%5==0 else -.29,.13,zz),.005,'black',6)
 cyl(s,'Capillary tube',(.10,.16,2.05),.055,3.30,'glass')
 cyl(s,'Trapped air column',(.10,.16,1.86),.024,.80,'white')
 sphere(s,'Liquid marker drop',(.10,.16,2.26),.045,'red')
 # Elastic bands holding tube against ruler.
 torus(s,'Upper elastic band',(-.07,.18,2.72),.22,.024,'rubber',(0,0,1))
 torus(s,'Lower elastic band',(-.07,.18,1.72),.22,.024,'rubber',(0,0,1))
 cyl(s,'Thermometer',(1.34,.20,2.06),.065,3.10,'glass')
 cyl(s,'Thermometer liquid',(1.34,.20,1.70),.022,1.95,'red')
 sphere(s,'Thermometer bulb',(1.34,.20,.72),.10,'glass')
 rod(s,'Stirring rod',(-1.25,.20,.50),(-.75,.20,2.30),.045,'glass')
 return s
def p9():
 s=trimesh.Scene();bench(s,8.8,5.0)
 # AQA-style capacitor circuit: yellow digital voltmeter, orange timer/data logger,
 # two-position switch, capacitor and resistor on the bench.
 multimeter(s,'Voltmeter',(2.45,-.95,.72),'V')
 logger_box(s,(-2.55,-.95,.52),'Stop clock')
 # Two-position/changeover switch on a black base.
 box(s,'Two-position switch base',(-.55,-.72,.28),(.90,.56,.18),'black')
 banana(s,'Switch terminal A',(-.80,-1.02,.38),'red');banana(s,'Switch terminal B',(-.30,-1.02,.38),'black')
 banana(s,'Switch common',(-.55,-.44,.38),'red')
 rod(s,'Changeover switch blade',(-.55,-.44,.44),(-.78,-.78,.58),.035,'silver')
 sphere(s,'Switch pivot',(-.55,-.44,.44),.065,'brass')
 # Capacitor and resistor mounted in small holders.
 box(s,'Capacitor holder',(.55,.42,.26),(.70,.55,.18),'white')
 cyl(s,'Capacitor',(.55,.42,.63),.21,.68,'black')
 banana(s,'Capacitor red terminal',(.30,.08,.32),'red');banana(s,'Capacitor black terminal',(.80,.08,.32),'black')
 box(s,'Resistor holder',(-1.45,.42,.26),(.78,.55,.18),'white')
 cyl(s,'Resistor',(-1.45,.42,.55),.13,.60,'cream','x')
 banana(s,'Resistor red terminal',(-1.78,.08,.32),'red');banana(s,'Resistor black terminal',(-1.12,.08,.32),'black')
 # Low-voltage charging source.
 cell_holder(s,(1.70,.55,.26))
 # Circuit leads laid out visibly around the components.
 wire(s,'Switch to capacitor',[(-.30,-.98,.38),(.15,-.72,.44),(.30,.08,.32)],.018,'red')
 wire(s,'Capacitor to resistor',[(.80,.08,.32),(.18,.88,.42),(-1.12,.08,.32)],.018,'black')
 wire(s,'Resistor to switch',[(-1.78,.08,.32),(-2.05,-.42,.42),(-.80,-.98,.38)],.018,'red')
 wire(s,'Cell positive charge lead',[(2.18,.20,.34),(1.40,-.35,.44),(-.55,-.44,.38)],.018,'red')
 wire(s,'Cell negative return',[(1.20,.20,.34),(1.10,-.50,.46),(.80,.08,.32)],.018,'black')
 wire(s,'Voltmeter positive branch',[(2.58,-1.20,.42),(2.15,-.42,.52),(.30,.08,.32)],.016,'red')
 wire(s,'Voltmeter negative branch',[(2.32,-1.20,.42),(1.90,-.65,.48),(.80,.08,.32)],.016,'black')
 return s
def p10():
 s=trimesh.Scene();bench(s,9.1,5.0)
 orange_supply(s,(-2.75,-1.18,.53),'Low voltage DC power supply')
 multimeter(s,'Ammeter',(-.95,-1.05,.72),'A')
 rheostat(s,'Variable resistor',(2.55,.62,.54))
 # AQA top-pan balance at the centre with magnet assembly on its pan.
 box(s,'Top-pan balance base',(.65,.20,.30),(2.10,1.46,.54),'navy')
 box(s,'Top-pan balance pan',(.65,.20,.64),(1.72,1.15,.11),'silver')
 box(s,'Balance digital display',(.65,-.58,.35),(.80,.05,.24),'lcd')
 # Magnet/pole pieces supported on the balance pan.
 box(s,'Magnet yoke base',(.65,.20,.90),(1.42,.46,.20),'dark')
 box(s,'Magnet north pole',(.16,.20,1.36),(.30,.54,.85),'red')
 box(s,'Magnet south pole',(1.14,.20,1.36),(.30,.54,.85),'blue')
 # Wire passes through the field gap but is held independently of the balance.
 box(s,'Wire support left',( -1.10,.20,.42),(.42,.72,.84),'dark')
 box(s,'Wire support right',(2.38,.20,.42),(.42,.72,.84),'dark')
 rod(s,'Current-carrying straight wire',(-1.28,.20,1.42),(2.56,.20,1.42),.030,'copper')
 banana(s,'Wire left terminal',(-1.28,-.20,1.42),'red');banana(s,'Wire right terminal',(2.56,-.20,1.42),'black')
 # Calipers shown separately for active-length measurement.
 box(s,'Digital caliper beam',(2.70,-1.20,.28),(1.80,.16,.12),'silver')
 box(s,'Digital caliper slider',(2.35,-1.20,.33),(.32,.32,.25),'dark')
 box(s,'Digital caliper display',(2.35,-1.37,.35),(.26,.025,.12),'lcd')
 # Leads and variable-resistor path.
 wire(s,'Supply to ammeter',[(-2.38,-1.62,.40),(-1.65,-1.78,.43),(-1.08,-1.28,.45)],.020,'red')
 wire(s,'Ammeter to wire',[(-.82,-1.28,.45),(-.62,-.25,.62),(-1.28,-.20,1.42)],.020,'red')
 wire(s,'Wire to rheostat',[(2.56,-.20,1.42),(3.20,.05,.90),(1.62,.22,.62)],.020,'black')
 wire(s,'Rheostat return',[(3.46,.22,.62),(3.65,-1.82,.42),(-2.38,-1.82,.40)],.020,'black')
 return s
def p11():
 s=trimesh.Scene();bench(s,9.2,5.0)
 orange_supply(s,(-2.75,-1.15,.53),'AC low-voltage source')
 # Large circular field coil on its own black feet, matching the AQA apparatus.
 for r in (1.20,1.14,1.08):
  torus(s,'Large circular coil winding '+str(r),(0.05,.30,1.78),r,.028,'copper',(0,1,0))
 box(s,'Large coil left foot',(-.78,.30,.26),(.55,.72,.20),'dark')
 box(s,'Large coil right foot',(.88,.30,.26),(.55,.72,.20),'dark')
 # Search coil rotates about a vertical spindle at the centre.
 angle=math.radians(32)
 normal=(math.sin(angle),math.cos(angle),0)
 for r in (.52,.47,.42):
  torus(s,'Search coil winding '+str(r),(0.05,-.04,1.78),r,.020,'gold',normal)
 rod(s,'Search coil vertical pivot',(.05,-.04,.88),(.05,-.04,2.70),.028,'silver')
 box(s,'Search coil clamp base',(.05,-.04,.82),(.52,.45,.16),'dark')
 # Protractor beneath the coil, with radial guide line.
 cyl(s,'Protractor disc',(.05,-.06,.48),.82,.035,'paper')
 for deg in range(0,181,15):
  a=math.radians(deg);r0=.66;r1=.80
  rod(s,f'Protractor tick {deg}',(.05+r0*math.cos(a),-.085,.48+r0*math.sin(a)),(.05+r1*math.cos(a),-.085,.48+r1*math.sin(a)),.006,'black',6)
 rod(s,'Search coil angle pointer',(.05,-.09,.48),(.55,-.09,.82),.014,'red',8)
 # Oscilloscope/CRO.
 box(s,'Oscilloscope',(2.85,-.10,1.15),(2.05,.86,1.62),'navy')
 box(s,'Oscilloscope screen',(2.58,-.56,1.28),(1.20,.035,.86),'black')
 pts=[]
 for i in range(33):
  xx=2.05+1.04*i/32;zz=1.28+.22*math.sin(i*math.pi/8);pts.append((xx,-.585,zz))
 wire(s,'Oscilloscope waveform',pts,.012,'screen')
 for x in (3.55,3.75):knob(s,'Oscilloscope control '+str(x),(x,-.56,1.28),.075,'silver')
 # Leads.
 wire(s,'Field coil red lead',[(-.15,.36,.58),(-.80,1.28,.46),(-2.45,-.72,.38)],.020,'red')
 wire(s,'Field coil black lead',[(.25,.36,.58),(.72,1.24,.48),(-2.10,-.72,.38)],.020,'black')
 wire(s,'Search coil signal lead',[(.05,-.04,1.05),(.90,-.92,.60),(1.85,-.82,.72),(2.15,-.56,1.05)],.016,'black')
 return s
def p12():
 s=trimesh.Scene();bench(s);stand(s,-2.1,.35,3.5);box(s,'SourceHolder',(-1.55,.35,1.9),(.55,.55,.35),'dark');cyl(s,'VirtualSource',(-1.55,.35,1.9),.16,.18,'yellow','x');stand(s,1.2,.35,3);cyl(s,'GMTube',(.65,.35,1.9),.23,1,'grey','x');box(s,'Scaler',(2.5,-.85,.55),(1.5,.8,.75),'white');box(s,'ScalerDisplay',(2.5,-1.27,.62),(.8,.03,.25),'black');ruler(s,(-.25,.95,.16),4.2);wire(s,'DetectorCable',[(1.15,.35,1.9),(1.7,-.2,1.2),(2,-.95,.65)],.02,'black');return s
SC={'rp01-standing-waves':p1,'rp02-double-slit':p2d,'rp02-diffraction-grating':p2g,'rp03-free-fall':p3,'rp03-free-fall-impact':p3impact,'rp05-resistivity-wire':p5,'rp06-iv-characteristics':p6,'rp07-pendulum':p7p,'rp07-spring':p7s,'rp08-boyle-syringe':p8b,'rp08-charles-law':p8c,'rp09-capacitor':p9,'rp10-wire-balance':p10,'rp11-search-coil':p11,'rp12-inverse-square':p12}
for name,fn in SC.items():
 blob=fn().export(file_type='glb');path=os.path.join(OUT,name+'.glb');open(path,'wb').write(blob);print('3D',os.path.basename(path),len(blob))