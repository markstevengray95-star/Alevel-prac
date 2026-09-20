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
def soft_box(s,n,p,size,k='dark',radius=.10,segments=7):
 # Smooth-front rounded rectangular prism.  The x/z silhouette is genuinely curved;
 # y is the case depth.  Used for instrument housings and weighted apparatus bases.
 x,y,z=p;w,d,h=size;hx=w/2;hy=d/2;hz=h/2
 r=max(.001,min(radius,hx*.92,hz*.92));pts=[]
 corners=[(hx-r,-hz+r,-math.pi/2,0),(hx-r,hz-r,0,math.pi/2),(-hx+r,hz-r,math.pi/2,math.pi),(-hx+r,-hz+r,math.pi,3*math.pi/2)]
 for cx,cz,a0,a1 in corners:
  for j in range(segments):
   a=a0+(a1-a0)*j/(segments-1)
   pts.append((cx+r*math.cos(a),cz+r*math.sin(a)))
 N=len(pts);verts=[]
 for yy in (-hy,hy):
  verts.extend([(x+px,y+yy,z+pz) for px,pz in pts])
 front_c=len(verts);verts.append((x,y-hy,z))
 back_c=len(verts);verts.append((x,y+hy,z))
 faces=[]
 for i in range(N):
  q=(i+1)%N
  faces.append((i,q,N+q));faces.append((i,N+q,N+i))
  faces.append((front_c,q,i));faces.append((back_c,N+i,N+q))
 m=trimesh.Trimesh(vertices=np.array(verts,float),faces=np.array(faces,int),process=True)
 return add(s,m,n,k)

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
 s=trimesh.Scene();bench(s,8.8,5.0)
 # Simulation-only visual recreation of the AQA detector/scaler geometry.
 # No real source-handling controls are represented.
 logger_box(s,(-2.65,-.92,.52),'Timer')
 box(s,'Virtual scaler counter',(0.65,-1.05,.72),(1.95,.82,1.22),'cream')
 box(s,'Scaler control panel',(.65,-1.49,.78),(1.55,.035,.74),'dark')
 box(s,'Scaler display',(.28,-1.515,.92),(.56,.025,.22),'lcd')
 knob(s,'Scaler voltage control',(.95,-1.52,.78),.12,'black')
 knob(s,'Scaler count control',(1.25,-1.52,.78),.10,'black')
 # GM tube in lateral orientation on a support block.
 box(s,'GM tube support',(-.75,.18,.30),(1.00,.68,.36),'burgundy')
 cyl(s,'Virtual GM tube',(-.75,.18,.72),.22,1.20,'navy','x',48)
 cyl(s,'GM tube window cap',(-1.38,.18,.72),.16,.08,'blue','x',36)
 wire(s,'Detector cable',[(-.14,.18,.72),(.12,-.38,.64),(.18,-1.02,.74)],.020,'black')
 # Measured axis/ruler between detector and a simulation-only source marker.
 ruler(s,(.30,.98,.17),5.80)
 box(s,'Simulation source holder',(2.55,.28,.34),(1.02,.84,.60),'burgundy')
 box(s,'Simulation source holder lid',(2.55,.28,.71),(1.02,.84,.12),'wood')
 cyl(s,'Simulation source marker',(2.10,.28,.64),.14,.16,'yellow','x')
 box(s,'Simulation source shield marker',(2.42,.28,.64),(.30,.36,.30),'grey')
 # White reference block makes the detector-source distance easy to read.
 box(s,'Distance reference block',(-.15,.62,.38),(.32,.46,.52),'white')
 return s

# --- Photorealistic AQA apparatus pass: Practicals 1-6 ---
# These functions deliberately use named sub-components so the web viewer can
# identify whole instruments while retaining detailed materials and geometry.
def photo_bench(s,w=9.0,d=5.0):
 # Main student bench.
 box(s,'Laboratory bench laminate',(0,0,-.20),(w,d,.30),'wood')
 box(s,'Laboratory bench dark edge',(0,-d/2+.04,-.10),(w,.08,.16),'dark')
 box(s,'Laboratory bench rear edge',(0,d/2-.04,-.10),(w,.08,.16),'dark')
 for x in (-w/2+.32,w/2-.32):
  box(s,'Bench rubber corner '+str(x),(x,-d/2+.28,-.38),(.34,.34,.18),'rubber')
 # Quiet laboratory context behind the apparatus gives students a true sense of
 # scale without competing with the experiment itself.
 rear_y=d/2+1.10
 box(s,'Laboratory background wall',(0,rear_y+.62,2.25),(w+2.0,.12,5.2),'paper')
 box(s,'Laboratory background worktop',(0,rear_y,.62),(w+1.0,1.02,.18),'dark')
 box(s,'Laboratory background cabinet carcass',(0,rear_y+.10,.12),(w+.80,.86,.92),'white')
 doors=6
 for i in range(doors):
  xx=-(w*.78)/2+i*(w*.78)/(doors-1)
  soft_box(s,f'Laboratory background cabinet door {i}',(xx,rear_y-.35,.15),(1.02,.035,.70),'white',.05,6)
  rod(s,f'Laboratory background cabinet handle {i}',(xx-.16,rear_y-.38,.34),(xx+.16,rear_y-.38,.34),.018,'silver',16)
 # blue storage bins and a simple service rail recall a real school lab.
 for row in range(2):
  for col in range(3):
   soft_box(s,f'Laboratory background blue tray {row}-{col}',(-2.15+col*.58,rear_y-.37,.17+row*.31),(.48,.08,.24),'blue',.035,5)
 box(s,'Laboratory background service rail',(0,rear_y+.49,1.40),(w+.7,.10,.22),'white')
 for xx in (-2.7,-1.35,0,1.35,2.7):
  soft_box(s,'Laboratory background socket '+str(xx),(xx,rear_y+.42,1.40),(.48,.05,.18),'white',.025,5)
  cyl(s,'Laboratory background socket L '+str(xx),(xx-.10,rear_y+.38,1.40),.027,.025,'black','y',16)
  cyl(s,'Laboratory background socket R '+str(xx),(xx+.10,rear_y+.38,1.40),.027,.025,'black','y',16)

def photo_boss(s,n,p):
 x,y,z=p
 soft_box(s,n+' body',(x,y,z),(.30,.31,.29),'black',.055,7)
 cyl(s,n+' rod collar',(x,y,z),.095,.33,'dark','z',32)
 cyl(s,n+' clamp screw',(x+.19,y,z),.045,.23,'silver','x',28)
 cyl(s,n+' thumb wheel',(x+.32,y,z),.085,.07,'black','x',32)
 for a in range(0,360,45):
  aa=math.radians(a)
  rod(s,n+f' thumb grip {a}',(x+.355,y+.075*math.cos(aa),z+.075*math.sin(aa)),(x+.355,y+.092*math.cos(aa),z+.092*math.sin(aa)),.010,'black',8)

def photo_label(s,n,p,z=(.42,.02,.14),k='paper'):
 box(s,n,p,z,k)

def photo_foot(s,n,p):
 box(s,n,p,(.24,.24,.08),'rubber')

def photo_supply(s,p,name='Signal generator',orange=True):
 x,y,z=p;body='orange' if orange else 'white'
 soft_box(s,name,p,(1.78,.90,.84),body,.14,9)
 # dark recessed front and a gently rounded top shell make this read as a real bench PSU/signal generator
 soft_box(s,name+' front panel',(x,y-.463,z),(1.58,.045,.64),body,.08,7)
 soft_box(s,name+' top shell',(x,y+.015,z+.445),(1.66,.79,.10),'black',.045,7)
 soft_box(s,name+' LCD bezel',(x-.42,y-.492,z+.14),(.59,.035,.27),'black',.045,7)
 soft_box(s,name+' LCD screen',(x-.42,y-.515,z+.14),(.47,.018,.16),'lcd',.028,7)
 for i in range(4): soft_box(s,name+f' LCD segment {i}',(x-.55+i*.09,y-.528,z+.14),(.055,.006,.055),'screen',.012,5)
 knob(s,name+' frequency knob',(x+.16,y-.516,z+.12),.12,'black')
 knob(s,name+' amplitude knob',(x+.48,y-.516,z+.12),.09,'black')
 banana(s,name+' red output',(x+.36,y-.520,z-.18),'red');banana(s,name+' black output',(x+.08,y-.520,z-.18),'black')
 photo_label(s,name+' frequency label',(x-.42,y-.526,z+.33),(.42,.008,.08))
 # moulded side cheeks and rubber feet
 soft_box(s,name+' left bumper',(x-.855,y,z),(.08,.72,.66),'rubber',.035,6)
 soft_box(s,name+' right bumper',(x+.855,y,z),(.08,.72,.66),'rubber',.035,6)
 photo_foot(s,name+' foot L',(x-.58,y+.20,z-.45));photo_foot(s,name+' foot R',(x+.58,y+.20,z-.45))
 for i in range(7):
  soft_box(s,name+f' vent {i}',(x-.48+i*.16,y+.455,z+.05),(.08,.012,.22),'dark',.02,5)

def photo_dmm(s,n,p,kind='A'):
 x,y,z=p
 # Rounded rubberised handheld DMM body instead of a plain cuboid.
 soft_box(s,n+' yellow case',p,(.80,.47,1.20),'meter_yellow',.12,10)
 soft_box(s,n+' black face',(x,y-.251,z+.03),(.64,.038,.99),'black',.085,9)
 soft_box(s,n+' display bezel',(x,y-.278,z+.35),(.50,.025,.26),'dark',.045,7)
 soft_box(s,n+' LCD',(x,y-.294,z+.35),(.40,.011,.16),'lcd',.028,7)
 for i in range(3): soft_box(s,n+f' display segment {i}',(x-.10+i*.10,y-.301,z+.35),(.055,.006,.045),'screen',.010,5)
 knob(s,n+' rotary selector',(x,y-.300,z-.10),.15,'dark')
 # selector detents
 for i in range(10):
  a=math.radians(210+i*24)
  sphere(s,n+f' selector detent {i}',(x+.205*math.cos(a),y-.304,z-.10+.205*math.sin(a)),.011,'white')
 banana(s,n+' COM terminal',(x-.14,y-.307,z-.42),'black');banana(s,n+' measurement terminal',(x+.15,y-.307,z-.42),'red')
 photo_label(s,n+' '+kind+' marking',(x,y-.310,z+.56),(.18,.006,.09))
 # rubber corner guards
 for sx in (-1,1):
  soft_box(s,n+(' left' if sx<0 else ' right')+' rubber side',(x+sx*.375,y,z),(.07,.40,.95),'rubber',.03,6)
 photo_foot(s,n+' rear foot L',(x-.22,y+.24,z-.50));photo_foot(s,n+' rear foot R',(x+.22,y+.24,z-.50))

def photo_retort(s,n,x,y,h):
 soft_box(s,n+' blue base',(x,y,.07),(1.30,.86,.16),'bluebase',.13,9)
 soft_box(s,n+' black underside',(x,y,-.025),(1.18,.74,.055),'black',.10,8)
 rod(s,n+' vertical rod',(x,y,.14),(x,y,h),.050,'silver',40)
 # raised metal boss socket where the rod meets the heavy base
 cyl(s,n+' base socket',(x,y,.18),.105,.17,'silver',sections=36)
 photo_foot(s,n+' foot 1',(x-.42,y-.24,-.03));photo_foot(s,n+' foot 2',(x+.42,y-.24,-.03))

def photo_ruler(s,n,p,length=5.6,vertical=False):
 x,y,z=p
 if vertical:
  box(s,n,(x,y,z),(.18,.12,length),'wood')
  for i in range(41):
   zz=z-length/2+i*length/40
   rod(s,n+f' tick {i}',(x-.10,y-.065,zz),(x-.02 if i%5 else x+.03,y-.065,zz),.004,'black',6)
 else:
  box(s,n,(x,y,z),(length,.25,.11),'wood')
  for i in range(41):
   xx=x-length/2+i*length/40
   rod(s,n+f' tick {i}',(xx,y-.13,z+.06),(xx,y-.13,z+.12 if i%5 else z+.17),.004,'black',6)

def photo_p1():
 s=trimesh.Scene();photo_bench(s,9.2,5.1)
 photo_retort(s,'Retort stand',-2.75,.25,3.25)
 rod(s,'Retort clamp arm',(-2.75,.25,2.55),(-1.72,.25,2.55),.042,'silver',32);photo_boss(s,'Retort boss',(-2.67,.25,2.55))
 # real clamp: rounded body, two jaws and knurled screw
 soft_box(s,'Retort clamp body',(-1.70,.25,2.55),(.26,.45,.36),'black',.06,7)
 soft_box(s,'Retort clamp jaw upper',(-1.55,.25,2.70),(.16,.40,.09),'silver',.025,5)
 soft_box(s,'Retort clamp jaw lower',(-1.55,.25,2.40),(.16,.40,.09),'silver',.025,5)
 cyl(s,'Retort clamp thumb screw',(-1.72,-.02,2.55),.055,.24,'silver','y',28)
 cyl(s,'2 kg stand counterweight',(-2.75,.25,.36),.34,.24,'grey',sections=56)
 photo_supply(s,(.05,-1.42,.54),'Signal generator',True)
 # vibration generator with rounded moulded body and concentric metal armature
 soft_box(s,'Vibration generator black body',(-1.62,-.20,.56),(.74,.68,.52),'black',.10,9)
 soft_box(s,'Vibration generator metal mounting plate',(-1.62,-.20,.26),(.88,.80,.13),'silver',.07,7)
 cyl(s,'Vibration generator top electromagnet',(-1.62,-.20,.89),.26,.18,'silver',sections=56)
 torus(s,'Vibration generator top rubber ring',(-1.62,-.20,.985),.20,.022,'rubber',(0,0,1))
 rod(s,'Vibration generator drive pin',(-1.38,-.20,.90),(-1.10,-.20,.90),.045,'silver',32)
 banana(s,'Vibration generator red socket',(-1.78,-.55,.47),'red');banana(s,'Vibration generator black socket',(-1.48,-.55,.47),'black')
 # bridge and pulley are naturally angular/round real components
 box(s,'Wooden bridge',(2.15,-.20,.39),(.26,.55,.48),'wood')
 box(s,'Bridge top knife edge',(2.15,-.20,.68),(.12,.58,.10),'silver')
 torus(s,'Pulley wheel',(3.05,-.20,.72),.27,.048,'silver',(0,1,0))
 cyl(s,'Pulley axle',(3.05,-.20,.72),.052,.44,'black','y',36)
 soft_box(s,'Pulley black fork',(3.05,.04,.48),(.44,.34,.58),'black',.06,7)
 soft_box(s,'Pulley G clamp',(3.05,.29,.10),(.62,.36,.28),'dark',.07,7)
 # The active vibrating length is split into individually animatable sections.
 # At rest they form one continuous string; the walkthrough moves them into the
 # standing-wave shape rather than moving a single rigid cylinder.
 x0,x1=-1.15,2.15;z0,z1=.90,.74;segments=28
 for i in range(segments):
  xa=x0+(x1-x0)*i/segments;xb=x0+(x1-x0)*(i+1)/segments
  za=z0+(z1-z0)*i/segments;zb=z0+(z1-z0)*(i+1)/segments
  rod(s,f'Standing wave string segment {i:02d}',(xa,-.20,za),(xb,-.20,zb),.011,'white',10)
 rod(s,'String to pulley',(2.15,-.20,.74),(2.80,-.20,.74),.011,'white',12)
 rod(s,'String over pulley',(2.80,-.20,.74),(3.13,-.20,.56),.011,'white',12)
 rod(s,'String hanging section',(3.13,-.20,.56),(3.13,-.20,-.72),.011,'white',12)
 photo_ruler(s,'Metre rule',(.25,.82,.17),5.65,False)
 rod(s,'Mass hanger stem',(3.13,-.20,-.72),(3.13,-.20,-1.25),.023,'silver',28)
 cyl(s,'Mass hanger tray',(3.13,-.20,-1.31),.24,.075,'silver',sections=56)
 for i,z in enumerate((-1.20,-1.09,-.98,-.87)):
  cyl(s,f'Slotted mass {i+1}',(3.13,-.20,z),.23,.085,'grey',sections=56)
  torus(s,f'Slotted mass centre recess {i+1}',(3.13,-.20,z+.045),.10,.018,'black',(0,0,1))
 wire(s,'Generator red lead',[(.42,-1.90,.38),(-.25,-2.02,.31),(-1.28,-.62,.42),(-1.79,-.54,.47)],.018,'rubber_red')
 wire(s,'Generator black lead',[(.12,-1.90,.38),(-.52,-2.12,.30),(-1.42,-.72,.38),(-1.49,-.54,.47)],.018,'rubber')
 return s

def photo_optical_common(kind='slit'):
 s=trimesh.Scene();photo_bench(s,9.1,5.0)
 # Black anodised optical rail.  The rail itself is rectangular in real apparatus; carriers are rounded cast pieces.
 box(s,'Optical rail',(0,.15,.28),(6.45,.32,.18),'black')
 for xx in (-2.55,-.95,2.55):
  soft_box(s,'Optical carrier '+str(xx),(xx,.15,.42),(.52,.60,.19),'dark',.07,7)
  cyl(s,'Optical carrier clamp '+str(xx),(xx,.15,.55),.075,.10,'silver',sections=28)
 cyl(s,'Laser anodised barrel',(-2.55,.15,.84),.16,.95,'black','x',64)
 cyl(s,'Laser red front ring',(-2.05,.15,.84),.165,.07,'red','x',48)
 cyl(s,'Laser glass aperture',(-2.00,.15,.84),.080,.03,'glass','x',40)
 soft_box(s,'Laser mounting cradle',(-2.55,.15,.55),(.80,.52,.23),'dark',.07,7)
 # metal post and round boss make the slit/grating holder recognisable as optical hardware
 rod(s,'Optical element post',(-.95,.15,.50),(-.95,.15,1.40),.045,'silver',30)
 soft_box(s,('Double slit' if kind=='slit' else 'Diffraction grating')+' holder',(-.95,.15,.93),(.18,.78,.94),'black',.045,7)
 soft_box(s,('Double slit plate' if kind=='slit' else 'Diffraction grating'),(-.855,.15,.93),(.032,.49,.59),'silver' if kind=='slit' else 'glass',.015,5)
 if kind=='slit':
  for yy in (-.035,.035): box(s,'Double slit aperture '+str(yy),(-.835,.15+yy,.93),(.010,.010,.31),'black')
 else:
  for i in range(31):
   yy=-.22+i*.44/30;rod(s,f'Grating line {i}',(-.835,.15+yy,.67),(-.835,.15+yy,1.19),.0022,'black',6)
 soft_box(s,'Screen cast base',(2.55,.15,.20),(1.22,.94,.21),'dark',.12,9)
 rod(s,'Screen vertical support',(2.55,.15,.28),(2.55,.15,2.15),.055,'silver',32)
 soft_box(s,'Projection screen',(2.55,.15,1.22),(.10,2.30,1.92),'paper',.035,6)
 soft_box(s,'Projection screen rear',(2.61,.15,1.22),(.045,2.34,1.96),'dark',.025,5)
 photo_ruler(s,'Metre rule',(.20,1.20,.17),5.85,False)
 rod(s,'Laser beam',(-2.00,.15,.84),(-.84,.15,.93),.008,'red',8)
 return s

def photo_p2d():
 s=photo_optical_common('slit')
 for i,dy in enumerate((-.40,-.27,-.14,0,.14,.27,.40)):
  rod(s,f'Interference ray {i}',(-.83,.15,.93),(2.49,.15+dy,.93),.004,'red',8)
  box(s,f'Interference fringe {i}',(2.49,.15+dy,.93),(.018,.038 if dy else .070,.72),'yellow')
 return s

def photo_p2g():
 s=photo_optical_common('grating')
 for i,dy in enumerate((-.78,-.39,0,.39,.78)):
  rod(s,f'Diffracted ray {i}',(-.83,.15,.93),(2.49,.15+dy,.93),.004,'red',8)
  sphere(s,f'Diffraction maximum {i}',(2.49,.15+dy,.93),.045 if dy else .075,'red')
 return s

def photo_logger(s,p,name='Data logger'):
 x,y,z=p
 soft_box(s,name+' cream case',p,(1.58,.82,.90),'cream',.14,9)
 soft_box(s,name+' dark front',(x,y-.425,z+.02),(1.39,.040,.68),'dark',.09,8)
 soft_box(s,name+' LCD bezel',(x-.25,y-.452,z+.13),(.63,.028,.29),'black',.045,7)
 soft_box(s,name+' LCD',(x-.25,y-.470,z+.13),(.52,.012,.18),'lcd',.028,7)
 for i in range(4): soft_box(s,name+f' screen segment {i}',(x-.42+i*.11,y-.479,z+.13),(.06,.006,.045),'screen',.010,5)
 banana(s,name+' input 1',(x+.28,y-.468,z-.18),'red');banana(s,name+' input 2',(x+.52,y-.468,z-.18),'black')
 knob(s,name+' mode control',(x+.44,y-.468,z+.15),.09,'silver')
 soft_box(s,name+' left bumper',(x-.75,y,z),(.08,.66,.64),'rubber',.03,5)
 soft_box(s,name+' right bumper',(x+.75,y,z),(.08,.66,.64),'rubber',.03,5)
 photo_foot(s,name+' foot L',(x-.52,y+.25,z-.48));photo_foot(s,name+' foot R',(x+.52,y+.25,z-.48))

def photo_p3(light_gates=True):
 s=trimesh.Scene();photo_bench(s,8.8,5.0)
 photo_retort(s,'Free-fall stand',-1.10,.30,4.70)
 rod(s,'Release clamp arm',(-1.10,.30,4.22),(-.08,.30,4.22),.042,'silver',32);photo_boss(s,'Release boss',(-1.02,.30,4.22))
 soft_box(s,'Release mechanism green housing' if light_gates else 'Mechanical release green housing',(-.02,.30,4.22),(.74,.60,.44),'green',.10,9)
 cyl(s,'Release electromagnet core',(-.02,.30,3.97),.12,.18,'silver',sections=44)
 torus(s,'Release electromagnet retaining ring',(-.02,.30,4.055),.105,.018,'black',(0,0,1))
 banana(s,'Release red terminal',(.20,.00,4.26),'red');banana(s,'Release black terminal',(-.18,.00,4.26),'black')
 sphere(s,'Ball bearing',(-.02,.30,3.72),.18,'silver')
 if light_gates:
  for idx,z in enumerate((2.58,1.20)):
   soft_box(s,f'Light gate {idx+1} weighted base',(-.02,.30,z-.58),(1.04,.84,.18),'dark',.10,8)
   soft_box(s,f'Light gate {idx+1} left upright',(-.43,.30,z-.16),(.18,.46,.80),'black',.055,7)
   soft_box(s,f'Light gate {idx+1} right upright',(.39,.30,z-.16),(.18,.46,.80),'black',.055,7)
   soft_box(s,f'Light gate {idx+1} bridge',(-.02,.30,z+.20),(1.00,.46,.18),'black',.055,7)
   cyl(s,f'Light gate {idx+1} emitter',(-.31,.05,z-.16),.035,.09,'red','y',24)
   cyl(s,f'Light gate {idx+1} detector',(.27,.05,z-.16),.035,.09,'glass','y',24)
   photo_label(s,f'Light gate {idx+1} sensor label',(-.02,.055,z+.20),(.34,.006,.07))
  photo_logger(s,(2.28,-1.02,.58),'Data logger')
  wire(s,'Upper gate cable',[(-.43,.52,2.02),(.55,.82,1.55),(1.58,-.55,.78),(1.82,-1.35,.48)],.016,'green')
  wire(s,'Lower gate cable',[(.39,.52,.65),(.86,.62,.60),(1.66,-.72,.50),(2.18,-1.35,.44)],.016,'yellow')
 else:
  soft_box(s,'Impact pressure pad',(-.02,.30,.29),(1.15,.88,.18),'black',.10,8)
  soft_box(s,'Impact sensor plate',(-.02,.30,.42),(.90,.66,.08),'silver',.04,6)
  photo_logger(s,(2.28,-1.02,.58),'Data logger')
  wire(s,'Impact timer cable',[(.38,.45,.38),(1.25,.72,.45),(1.82,-.68,.48),(2.18,-1.35,.44)],.016,'yellow')
 photo_ruler(s,'Vertical metre rule',(1.02,.78,2.25),3.75,True)
 wire(s,'Plumb line',[(-.72,.80,4.22),(-.72,.80,.56)],.007,'black');sphere(s,'Plumb bob',(-.72,.80,.42),.095,'grey')
 return s

def photo_micrometer(s,p,n='Micrometer'):
 x,y,z=p
 # C frame made from several smooth rods, with separate anvil/spindle/sleeve/thimble
 pts=[(x+.55,y,z-.50),(x+.82,y,z-.22),(x+.84,y,z+.22),(x+.58,y,z+.52)]
 wire(s,n+' blue C frame',pts,.075,'blue')
 rod(s,n+' fixed anvil',(x+.58,y,z+.50),(x+.28,y,z+.50),.052,'silver',24)
 rod(s,n+' spindle',(x-.28,y,z+.50),(x+.18,y,z+.50),.052,'silver',24)
 cyl(s,n+' sleeve',(x-.45,y,z+.50),.12,.34,'silver','x',40)
 cyl(s,n+' thimble',(x-.72,y,z+.50),.17,.42,'silver','x',48)
 cyl(s,n+' ratchet',(x-1.00,y,z+.50),.105,.16,'dark','x',40)
 for i in range(9):
  xx=x-.91+i*.055;rod(s,n+f' thimble graduation {i}',(xx,y-.175,z+.48),(xx,y-.175,z+.56),.004,'black',6)

def photo_p4():
 s=trimesh.Scene();photo_bench(s,9.0,5.1)
 photo_retort(s,'Young modulus support left',-1.85,.35,4.80)
 photo_retort(s,'Young modulus support right',1.05,.35,4.80)
 rod(s,'Top support beam',(-1.85,.35,4.50),(1.05,.35,4.50),.085,'silver',40)
 photo_boss(s,'Reference wire top clamp',(-1.25,.35,4.45));photo_boss(s,'Test wire top clamp',(.45,.35,4.45))
 rod(s,'Reference wire',(-1.25,.35,4.30),(-1.25,.35,.88),.018,'copper',24)
 rod(s,'Long suspended wire test wire',(.45,.35,4.30),(.45,.35,.88),.018,'copper',24)
 # lower comparison apparatus: rounded cast bridge, vernier and real spirit-level vial
 soft_box(s,'Vernier comparison bridge',(-.40,.35,1.18),(2.20,.44,.22),'silver',.06,7)
 soft_box(s,'Vernier moving cursor',(.18,.08,1.25),(.34,.10,.62),'dark',.04,6)
 soft_box(s,'Vernier scale',(-.08,.08,1.25),(.12,.06,.78),'paper',.02,5)
 for i in range(15):
  zz=.92+i*.045;rod(s,f'Vernier graduation {i}',(-.15,.04,zz),(-.06 if i%5 else .01,.04,zz),.004,'black',6)
 cyl(s,'Spirit level glass vial',(-.55,.02,1.43),.075,.82,'glass','x',48)
 cyl(s,'Spirit level liquid',(-.55,.015,1.43),.058,.66,'green','x',42)
 cyl(s,'Spirit level end cap left',(-.98,.02,1.43),.09,.06,'brass','x',32);cyl(s,'Spirit level end cap right',(-.12,.02,1.43),.09,.06,'brass','x',32)
 sphere(s,'Spirit level bubble',(-.55,-.055,1.43),.045,'white')
 for xw,label in ((-1.25,'Reference'),(.45,'Test')):
  rod(s,label+' mass hanger stem',(xw,.35,.90),(xw,.35,.22 if label=='Test' else .42),.025,'silver',24)
  cyl(s,label+' mass hanger tray',(xw,.35,.16 if label=='Test' else .36),.25,.07,'silver',sections=56)
 for i,zv in enumerate((.47,.58,.69)): cyl(s,f'Reference slotted mass {i+1}',(-1.25,.35,zv),.235,.085,'grey',sections=56)
 for i,zv in enumerate((.27,.38,.49,.60)): cyl(s,f'Test slotted mass {i+1}',(.45,.35,zv),.235,.085,'grey',sections=56)
 photo_micrometer(s,(2.30,-.90,.50),'Micrometer')
 rod(s,'Wire sample in micrometer',(2.58,-1.03,1.00),(2.58,-.77,1.00),.012,'copper',20)
 photo_ruler(s,'Metre rule',(2.50,1.45,.17),3.00,False)
 return s

def photo_p5():
 s=trimesh.Scene();photo_bench(s,9.4,5.1)
 photo_supply(s,(-1.05,-1.42,.54),'Low voltage DC power supply',True)
 photo_dmm(s,'Ammeter',(-3.15,-1.02,.76),'A');photo_dmm(s,'Voltmeter',(1.05,-1.02,.76),'V')
 photo_ruler(s,'Metre rule',(.15,.95,.17),6.35,False)
 rod(s,'Resistance wire',(-2.92,.58,.49),(3.08,.58,.49),.016,'copper',28)
 crocodile(s,'Fixed crocodile clip',(-2.90,.58,.60),'black');crocodile(s,'Wire end crocodile clip',(3.05,.58,.60),'red')
 soft_box(s,'Sliding contact insulated body',(.62,.58,.89),(.25,.31,.26),'rubber_red',.055,7)
 soft_box(s,'Sliding contact finger pad',(.62,.58,1.04),(.39,.36,.085),'red',.04,6)
 rod(s,'Sliding contact needle',(.62,.58,.81),(.62,.58,.51),.022,'silver',24)
 # a visible sprung contact collar makes the jockey look like real apparatus rather than a block
 torus(s,'Sliding contact spring collar',(.62,.58,.76),.055,.010,'silver',(0,0,1))
 photo_micrometer(s,(2.25,1.58,.40),'Micrometer')
 rod(s,'Wire sample in micrometer',(2.53,1.45,.90),(2.53,1.71,.90),.011,'copper',20)
 wire(s,'Supply positive lead',[(-.65,-1.90,.38),(-1.25,-2.10,.32),(-2.35,-1.82,.40),(-3.00,-1.32,.43)],.020,'rubber_red')
 wire(s,'Ammeter to fixed clip',[(-3.28,-1.32,.40),(-3.58,-.35,.50),(-2.90,.58,.60)],.020,'rubber')
 wire(s,'Wire return lead',[(3.05,.58,.60),(3.55,-.22,.48),(2.78,-2.04,.38),(-1.40,-1.90,.34)],.020,'rubber')
 wire(s,'Voltmeter black branch',[(.91,-1.32,.41),(.32,-1.82,.52),(-2.90,.58,.60)],.016,'rubber')
 wire(s,'Voltmeter red branch',[(1.20,-1.32,.41),(1.50,-.50,.62),(.62,.58,.91)],.016,'rubber_red')
 return s

def photo_rheostat(s,p):
 x,y,z=p
 soft_box(s,'Variable resistor bakelite base',(x,y,z-.18),(2.18,.80,.23),'burgundy',.11,9)
 # end cheeks and exposed ceramic former/windings
 soft_box(s,'Variable resistor left end cheek',(x-.91,y,z+.10),(.18,.62,.67),'dark',.06,7)
 soft_box(s,'Variable resistor right end cheek',(x+.91,y,z+.10),(.18,.62,.67),'dark',.06,7)
 cyl(s,'Variable resistor ceramic former',(x,y,z+.10),.25,1.72,'cream','x',64)
 for i in range(38):
  xx=x-.81+i*1.62/37;torus(s,f'Variable resistor resistance winding {i}',(xx,y,z+.10),.242,.008,'black',(1,0,0))
 rod(s,'Variable resistor slider rail',(x-.88,y,z+.52),(x+.88,y,z+.52),.035,'silver',32)
 soft_box(s,'Variable resistor sliding contact',(x+.18,y,z+.54),(.23,.31,.15),'silver',.035,6)
 rod(s,'Variable resistor contact arm',(x+.18,y,z+.50),(x+.18,y,z+.18),.020,'silver',20)
 knob(s,'Variable resistor slider knob',(x+.18,y-.18,z+.68),.085,'black')
 banana(s,'Variable resistor red terminal',(x-.98,y-.42,z-.10),'red');banana(s,'Variable resistor black terminal',(x+.98,y-.42,z-.10),'black')

def photo_p6():
 s=trimesh.Scene();photo_bench(s,9.2,5.1)
 photo_dmm(s,'Ammeter',(-2.70,-1.02,.76),'A');photo_dmm(s,'Voltmeter',(2.35,-1.02,.76),'V')
 photo_rheostat(s,(0.0,.42,.56))
 soft_box(s,'Cell holder white base',(.55,-1.20,.25),(1.34,.74,.23),'white',.10,8)
 for i,xx in enumerate((.25,.83)):
  cyl(s,f'Cell {i+1} body',(xx,-1.20,.47),.14,.58,'silver','x',56)
  cyl(s,f'Cell {i+1} positive cap',(xx+.31,-1.20,.47),.075,.05,'brass','x',40)
  torus(s,f'Cell {i+1} insulating ring',(xx+.285,-1.20,.47),.105,.018,'black',(1,0,0))
  soft_box(s,f'Cell {i+1} label band',(xx,-1.34,.47),(.28,.02,.14),'blue',.03,5)
 banana(s,'Cell red terminal',(1.08,-1.58,.34),'red');banana(s,'Cell black terminal',(.04,-1.58,.34),'black')
 soft_box(s,'Switch black base',(-1.12,-1.12,.29),(.88,.54,.17),'black',.08,7)
 banana(s,'Switch terminal A',(-1.36,-1.43,.39),'red');banana(s,'Switch terminal B',(-.88,-1.43,.39),'black')
 rod(s,'Switch blade',(-1.36,-1.12,.46),(-.88,-1.12,.82),.035,'silver',28)
 sphere(s,'Switch pivot',(-1.36,-1.12,.46),.065,'brass')
 cyl(s,'Switch insulated handle',(-.83,-1.12,.86),.075,.20,'burgundy','x',32)
 wire(s,'Cell positive to switch',[(1.08,-1.58,.34),(.42,-1.92,.38),(-.92,-1.47,.40)],.020,'rubber_red')
 wire(s,'Switch to ammeter',[(-1.36,-1.47,.40),(-1.78,-1.78,.45),(-2.56,-1.34,.44)],.020,'rubber_red')
 wire(s,'Ammeter to variable resistor',[(-2.84,-1.34,.42),(-3.12,-.10,.50),(-1.02,.00,.62)],.020,'rubber')
 wire(s,'Variable resistor return to cell',[(1.02,.00,.62),(1.52,-.12,.54),(1.28,-1.48,.38),(.04,-1.58,.34)],.020,'rubber')
 wire(s,'Voltmeter positive to cell',[(2.50,-1.34,.43),(2.70,-.42,.54),(1.08,-1.58,.34)],.016,'rubber_red')
 wire(s,'Voltmeter negative to cell',[(2.20,-1.34,.43),(1.84,-1.78,.50),(.04,-1.58,.34)],.016,'rubber')
 return s

# --- Photorealistic AQA apparatus pass: Practicals 7-12 ---
def photo_stopclock(s,p,name='Stop clock'):
 x,y,z=p
 box(s,name+' grey case',p,(1.28,.72,.82),'cream')
 box(s,name+' dark face',(x,y-.38,z+.03),(1.10,.035,.62),'dark')
 box(s,name+' LCD bezel',(x-.18,y-.405,z+.13),(.54,.024,.25),'black')
 box(s,name+' LCD',(x-.18,y-.420,z+.13),(.44,.010,.16),'lcd')
 for i in range(4): box(s,name+f' LCD segment {i}',(x-.32+i*.095,y-.427,z+.13),(.052,.006,.045),'screen')
 knob(s,name+' mode knob',(x+.38,y-.407,z+.10),.085,'silver')
 box(s,name+' start button',(x+.34,y-.414,z-.17),(.20,.018,.12),'green')
 box(s,name+' reset button',(x+.58,y-.414,z-.17),(.20,.018,.12),'red')
 photo_foot(s,name+' foot L',(x-.42,y+.23,z-.45));photo_foot(s,name+' foot R',(x+.42,y+.23,z-.45))

def photo_cell_pack(s,p,name='Cell holder'):
 x,y,z=p
 box(s,name+' white base',(x,y,z),(1.28,.68,.22),'white')
 for i,xx in enumerate((x-.29,x+.29)):
  cyl(s,f'{name} cell {i+1}',(xx,y,z+.22),.135,.56,'silver','x',48)
  cyl(s,f'{name} cell {i+1} positive cap',(xx+.30,y,z+.22),.072,.045,'brass','x',30)
  box(s,f'{name} cell {i+1} label band',(xx,y-.145,z+.22),(.28,.018,.13),'blue')
 banana(s,name+' red terminal',(x+.52,y-.37,z+.09),'red')
 banana(s,name+' black terminal',(x-.52,y-.37,z+.09),'black')

def photo_p7p():
 s=trimesh.Scene();photo_bench(s,8.9,5.0)
 photo_retort(s,'Pendulum stand',-.95,.30,4.70)
 rod(s,'Pendulum clamp arm',(-.95,.30,4.12),(.22,.30,4.12),.042,'silver',28);photo_boss(s,'Pendulum boss',(-.87,.30,4.12))
 box(s,'Pendulum clamp jaws',(.20,.30,4.12),(.20,.38,.30),'black')
 wire(s,'Pendulum string',[(.22,.30,4.02),(.22,.30,1.02)],.010,'white')
 sphere(s,'Pendulum bob',(.22,.30,.80),.205,'silver')
 # fixed fiducial/reference marker at equilibrium
 box(s,'Fiducial marker weighted base',(.72,.08,.12),(.52,.48,.16),'bluebase')
 rod(s,'Fiducial marker pin',(.72,.08,.18),(.72,.08,1.08),.018,'silver',18)
 sphere(s,'Fiducial marker blob',(.72,.08,1.08),.065,'blue')
 photo_ruler(s,'Metre rule',(-2.05,1.02,.17),3.60,False)
 photo_stopclock(s,(2.22,-1.04,.56),'Stop clock')
 cyl(s,'Stand counterweight',(-.95,.30,.32),.31,.17,'grey',sections=44)
 return s

def photo_p7s():
 s=trimesh.Scene();photo_bench(s,8.9,5.0)
 photo_retort(s,'Spring stand',-.88,.30,4.70)
 rod(s,'Spring clamp arm',(-.88,.30,4.10),(.18,.30,4.10),.042,'silver',28);photo_boss(s,'Spring boss',(-.80,.30,4.10))
 box(s,'Spring clamp hook',(.18,.30,4.05),(.22,.22,.30),'black')
 pts=[]
 for i in range(116):
  t=i/115*14*math.pi
  pts.append((.18+.135*math.cos(t),.30+.135*math.sin(t),3.90-i/115*2.16))
 wire(s,'Spring',pts,.019,'silver')
 rod(s,'Mass hanger stem',(.18,.30,1.72),(.18,.30,1.08),.024,'silver',20)
 cyl(s,'Mass hanger tray',(.18,.30,1.05),.25,.07,'silver',sections=44)
 for i,z in enumerate((1.16,1.27,1.38,1.49)):cyl(s,f'Slotted mass {i+1}',(.18,.30,z),.235,.082,'grey',sections=44)
 box(s,'Fiducial marker weighted base',(.72,.06,.12),(.52,.48,.16),'bluebase')
 rod(s,'Fiducial marker pin',(.72,.06,.18),(.72,.06,1.55),.018,'silver',18)
 sphere(s,'Fiducial marker blob',(.72,.06,1.55),.065,'blue')
 photo_ruler(s,'Metre rule',(-2.05,1.02,.17),3.60,False)
 photo_stopclock(s,(2.22,-1.04,.56),'Stop clock')
 cyl(s,'Stand counterweight',(-.88,.30,.32),.31,.17,'grey',sections=44)
 return s

def photo_p8b():
 s=trimesh.Scene();photo_bench(s,8.9,5.0)
 photo_retort(s,'Boyle stand',-1.42,.36,4.62)
 rod(s,'Boyle clamp arm',(-1.42,.36,3.48),(-.24,.36,3.48),.042,'silver',28);photo_boss(s,'Boyle boss',(-1.34,.36,3.48))
 box(s,'Gas syringe clamp',(-.18,.36,3.48),(.24,.48,.34),'black')
 # transparent syringe with external graduations and distinct plunger
 cyl(s,'Gas syringe transparent barrel',(-.02,.36,3.17),.305,2.26,'glass',sections=64)
 torus(s,'Gas syringe upper rim',(-.02,.36,4.31),.315,.035,'white')
 torus(s,'Gas syringe lower rim',(-.02,.36,2.03),.315,.035,'white')
 cyl(s,'Syringe plunger seal',(-.02,.36,2.43),.255,.20,'rubber',sections=48)
 rod(s,'Syringe plunger rod',(-.02,.36,2.36),(-.02,.36,1.38),.052,'silver',28)
 cyl(s,'Syringe plunger flange',(-.02,.36,1.30),.30,.09,'white',sections=48)
 cyl(s,'Sealed syringe nozzle',(-.02,.36,4.48),.075,.34,'white',sections=36)
 box(s,'Syringe pinch clip',(.13,.36,4.64),(.26,.18,.14),'dark')
 for i in range(21):
  zz=2.22+i*.09
  rod(s,f'Gas syringe graduation {i}',(.27,.12,zz),(.27+(.14 if i%5==0 else .065),.12,zz),.005,'black',6)
 rod(s,'Mass hanger hook',(-.02,.36,1.26),(-.02,.36,.82),.024,'silver',20)
 cyl(s,'Mass hanger tray',(-.02,.36,.79),.25,.07,'silver',sections=44)
 for i,z in enumerate((.90,1.01,1.12,1.23)):cyl(s,f'Boyle slotted mass {i+1}',(-.02,.36,z),.235,.082,'grey',sections=44)
 photo_micrometer(s,(2.25,1.38,.40),'Micrometer')
 photo_label(s,'Syringe diameter reference card',(2.10,1.13,.22),(.92,.02,.34))
 return s

def photo_p8c():
 s=trimesh.Scene();photo_bench(s,8.9,5.0)
 # water bath / Charles-law arrangement
 cyl(s,'Two litre beaker',(0,.20,.84),1.10,1.66,'glass',sections=72)
 torus(s,'Beaker top rim',(0,.20,1.68),1.11,.035,'white')
 cyl(s,'Water bath',(0,.20,.68),1.02,1.30,'glass',sections=72)
 # darker base plate gives visible glass contact
 cyl(s,'Beaker heatproof mat',(0,.20,.08),1.18,.08,'dark',sections=64)
 photo_ruler(s,'Vertical ruler',(-.28,.20,2.20),3.55,True)
 cyl(s,'Capillary tube',(.10,.16,2.05),.055,3.32,'glass',sections=40)
 cyl(s,'Trapped air column',(.10,.16,1.86),.023,.82,'white',sections=32)
 sphere(s,'Liquid marker drop',(.10,.16,2.28),.043,'red')
 torus(s,'Upper elastic band',(-.08,.18,2.74),.225,.022,'rubber')
 torus(s,'Lower elastic band',(-.08,.18,1.70),.225,.022,'rubber')
 cyl(s,'Thermometer glass stem',(1.35,.20,2.06),.063,3.12,'glass',sections=40)
 cyl(s,'Thermometer liquid column',(1.35,.20,1.70),.021,1.98,'red',sections=24)
 sphere(s,'Thermometer bulb',(1.35,.20,.70),.105,'glass')
 rod(s,'Stirring rod',(-1.24,.20,.50),(-.76,.20,2.34),.042,'glass',20)
 # thermometer scale card
 box(s,'Thermometer scale card',(1.57,.20,2.06),(.12,.18,3.08),'paper')
 for i in range(17):
  zz=.62+i*.18;rod(s,f'Thermometer graduation {i}',(1.49,.10,zz),(1.58 if i%4==0 else 1.54,.10,zz),.004,'black',6)
 return s

def photo_p9():
 s=trimesh.Scene();photo_bench(s,9.2,5.1)
 photo_dmm(s,'Voltmeter',(2.55,-1.04,.76),'V')
 photo_stopclock(s,(-2.65,-1.02,.56),'Stop clock')
 # two-position switch with three visible terminals
 box(s,'Two-position switch base',(-.58,-.72,.29),(.96,.60,.18),'black')
 banana(s,'Two-position switch terminal A',(-.84,-1.04,.39),'red')
 banana(s,'Two-position switch terminal B',(-.32,-1.04,.39),'black')
 banana(s,'Two-position switch common',(-.58,-.40,.39),'red')
 rod(s,'Two-position switch blade',(-.58,-.40,.46),(-.82,-.80,.62),.035,'silver',24)
 sphere(s,'Two-position switch pivot',(-.58,-.40,.46),.067,'brass')
 # capacitor with polarity stripe and resistor with colour bands
 box(s,'Capacitor holder',(.62,.43,.26),(.76,.58,.18),'white')
 cyl(s,'Capacitor black body',(.62,.43,.65),.22,.72,'black',sections=56)
 box(s,'Capacitor polarity stripe',(.43,.20,.65),(.09,.02,.55),'white')
 banana(s,'Capacitor red terminal',(.34,.08,.32),'red');banana(s,'Capacitor black terminal',(.88,.08,.32),'black')
 box(s,'Resistor holder',(-1.52,.43,.26),(.82,.58,.18),'white')
 cyl(s,'Resistor ceramic body',(-1.52,.43,.56),.135,.66,'cream','x',48)
 for i,k in enumerate(('red','black','gold')):torus(s,f'Resistor colour band {i}',(-1.68+i*.16,.43,.56),.137,.018,k,(1,0,0))
 banana(s,'Resistor red terminal',(-1.88,.08,.32),'red');banana(s,'Resistor black terminal',(-1.16,.08,.32),'black')
 photo_cell_pack(s,(1.72,.58,.27),'Cell holder')
 wire(s,'Switch to capacitor',[(-.32,-1.00,.39),(.14,-.72,.45),(.34,.08,.32)],.018,'rubber_red')
 wire(s,'Capacitor to resistor',[(.88,.08,.32),(.18,.92,.42),(-1.16,.08,.32)],.018,'rubber')
 wire(s,'Resistor to switch',[(-1.88,.08,.32),(-2.12,-.43,.42),(-.84,-1.00,.39)],.018,'rubber_red')
 wire(s,'Cell positive charge lead',[(2.24,.20,.36),(1.42,-.34,.45),(-.58,-.40,.39)],.018,'rubber_red')
 wire(s,'Cell negative return',[(1.20,.20,.36),(1.10,-.52,.47),(.88,.08,.32)],.018,'rubber')
 wire(s,'Voltmeter red branch',[(2.70,-1.35,.43),(2.16,-.45,.54),(.34,.08,.32)],.016,'rubber_red')
 wire(s,'Voltmeter black branch',[(2.40,-1.35,.43),(1.92,-.66,.50),(.88,.08,.32)],.016,'rubber')
 return s

def photo_caliper(s,p,n='Digital caliper'):
 x,y,z=p
 box(s,n+' stainless beam',(x,y,z),(1.92,.15,.12),'silver')
 box(s,n+' fixed jaw',(x-.86,y,z+.22),(.12,.18,.52),'silver')
 box(s,n+' slider housing',(x-.28,y,z+.08),(.38,.34,.30),'dark')
 box(s,n+' display bezel',(x-.28,y-.18,z+.10),(.30,.025,.16),'black')
 box(s,n+' display',(x-.28,y-.195,z+.10),(.24,.010,.10),'lcd')
 box(s,n+' moving jaw',(x-.05,y,z+.25),(.10,.18,.56),'silver')
 rod(s,n+' depth rod',(x+.92,y,z),(x+1.22,y,z),.025,'silver',18)

def photo_p10():
 s=trimesh.Scene();photo_bench(s,9.5,5.1)
 photo_supply(s,(-2.85,-1.28,.54),'Low voltage DC power supply',True)
 photo_dmm(s,'Ammeter',(-1.02,-1.10,.76),'A')
 photo_rheostat(s,(2.70,.68,.56))
 # top-pan digital balance
 box(s,'Top-pan balance navy base',(.68,.20,.31),(2.18,1.50,.56),'navy')
 box(s,'Top-pan balance stainless pan',(.68,.20,.66),(1.78,1.18,.12),'silver')
 box(s,'Top-pan balance front panel',(.68,-.58,.35),(1.26,.035,.34),'dark')
 box(s,'Top-pan balance digital display',(.45,-.605,.37),(.56,.014,.19),'lcd')
 box(s,'Top-pan balance tare button',(1.08,-.607,.37),(.20,.016,.12),'green')
 # magnet pole assembly rests only on balance
 box(s,'Magnet yoke base',(.68,.20,.92),(1.48,.48,.20),'dark')
 box(s,'Magnet north pole',(.16,.20,1.39),(.32,.56,.88),'red')
 box(s,'Magnet south pole',(1.20,.20,1.39),(.32,.56,.88),'blue')
 box(s,'Magnet top yoke',(.68,.20,1.84),(1.36,.48,.18),'dark')
 # independently supported straight wire through field gap
 box(s,'Wire support left blue base',(-1.20,.20,.16),(.62,.78,.24),'bluebase')
 box(s,'Wire support right blue base',(2.54,.20,.16),(.62,.78,.24),'bluebase')
 rod(s,'Wire support left post',(-1.20,.20,.24),(-1.20,.20,1.55),.045,'silver',24)
 rod(s,'Wire support right post',(2.54,.20,.24),(2.54,.20,1.55),.045,'silver',24)
 rod(s,'Current-carrying straight wire',(-1.38,.20,1.44),(2.72,.20,1.44),.028,'copper',24)
 banana(s,'Wire left terminal',(-1.38,-.20,1.44),'red');banana(s,'Wire right terminal',(2.72,-.20,1.44),'black')
 photo_caliper(s,(2.82,-1.36,.29),'Digital caliper')
 wire(s,'Supply to ammeter',[(-2.45,-1.77,.40),(-1.68,-1.90,.43),(-1.16,-1.42,.45)],.020,'rubber_red')
 wire(s,'Ammeter to wire',[(-.88,-1.42,.45),(-.66,-.28,.64),(-1.38,-.20,1.44)],.020,'rubber_red')
 wire(s,'Wire to variable resistor',[(2.72,-.20,1.44),(3.34,.06,.92),(1.64,.25,.64)],.020,'rubber')
 wire(s,'Variable resistor return',[(3.72,.25,.64),(3.82,-1.92,.42),(-2.45,-1.97,.40)],.020,'rubber')
 return s

def photo_scope(s,p,n='Oscilloscope'):
 x,y,z=p
 box(s,n+' navy case',p,(2.12,.92,1.70),'navy')
 box(s,n+' black front',(x,y-.48,z),(1.93,.035,1.48),'dark')
 box(s,n+' screen bezel',(x-.30,y-.505,z+.14),(1.18,.026,.91),'black')
 box(s,n+' phosphor screen',(x-.30,y-.520,z+.14),(1.04,.010,.77),'screen')
 pts=[]
 for i in range(41):
  xx=x-.79+.98*i/40;zz=z+.14+.19*math.sin(i*math.pi/7);pts.append((xx,y-.528,zz))
 wire(s,n+' waveform',pts,.010,'green')
 for j,(dx,dz) in enumerate(((.58,.38),(.80,.38),(.58,.04),(.80,.04),(.58,-.30),(.80,-.30))):
  knob(s,n+f' control {j}',(x+dx,y-.515,z+dz),.072,'silver')
 banana(s,n+' input',(x+.58,y-.520,z-.55),'red');banana(s,n+' ground',(x+.82,y-.520,z-.55),'black')
 photo_foot(s,n+' foot L',(x-.70,y+.28,z-.91));photo_foot(s,n+' foot R',(x+.70,y+.28,z-.91))

def photo_p11():
 s=trimesh.Scene();photo_bench(s,9.6,5.2)
 photo_supply(s,(-2.90,-1.25,.54),'AC low-voltage source',True)
 # field coil with multiple copper turns on rigid black former
 box(s,'Large circular coil left foot',(-.82,.32,.24),(.62,.82,.22),'dark')
 box(s,'Large circular coil right foot',(.92,.32,.24),(.62,.82,.22),'dark')
 for r in (1.24,1.18,1.12,1.06,1.00):
  torus(s,'Large circular coil winding '+str(r),(0.05,.32,1.80),r,.024,'copper',(0,1,0))
 box(s,'Large circular coil lower former',(0.05,.32,.62),(2.12,.34,.22),'black')
 # search coil on pivot with protractor
 angle=math.radians(32);normal=(math.sin(angle),math.cos(angle),0)
 for r in (.54,.49,.44,.39):
  torus(s,'Search coil winding '+str(r),(0.05,-.04,1.80),r,.017,'gold',normal)
 rod(s,'Search coil vertical pivot',(.05,-.04,.86),(.05,-.04,2.76),.027,'silver',24)
 box(s,'Search coil clamp base',(.05,-.04,.80),(.56,.48,.17),'dark')
 cyl(s,'Protractor disc',(.05,-.06,.47),.84,.035,'paper',sections=72)
 for deg in range(0,181,10):
  a=math.radians(deg);r0=.68;r1=.82
  rod(s,f'Protractor tick {deg}',(.05+r0*math.cos(a),-.085,.47+r0*math.sin(a)),(.05+r1*math.cos(a),-.085,.47+r1*math.sin(a)),.005,'black',6)
 rod(s,'Search coil angle pointer',(.05,-.09,.47),(.58,-.09,.84),.013,'red',8)
 photo_scope(s,(2.92,-.12,1.18),'Oscilloscope')
 wire(s,'Field coil red lead',[(-.18,.38,.60),(-.84,1.30,.46),(-2.50,-.76,.38)],.020,'rubber_red')
 wire(s,'Field coil black lead',[(.28,.38,.60),(.78,1.28,.48),(-2.18,-.76,.38)],.020,'rubber')
 wire(s,'Search coil signal lead',[(.05,-.04,1.05),(.92,-.95,.60),(1.92,-.86,.73),(2.18,-.60,1.04)],.016,'rubber')
 return s

def photo_p12():
 s=trimesh.Scene();photo_bench(s,9.1,5.1)
 # Simulation-only inverse-square detector geometry. No real-source handling hardware is modelled.
 photo_stopclock(s,(-2.78,-1.02,.56),'Timer')
 box(s,'Virtual scaler counter cream case',(.72,-1.08,.76),(2.05,.88,1.30),'cream')
 box(s,'Virtual scaler counter dark front',(.72,-1.54,.80),(1.82,.035,.84),'dark')
 box(s,'Virtual scaler counter display bezel',(.28,-1.565,.96),(.64,.024,.28),'black')
 box(s,'Virtual scaler counter display',(.28,-1.580,.96),(.54,.010,.18),'lcd')
 knob(s,'Virtual scaler voltage control',(1.02,-1.57,.82),.12,'black')
 knob(s,'Virtual scaler count control',(1.34,-1.57,.82),.10,'black')
 # virtual GM tube and support
 box(s,'Virtual GM tube support',(-.82,.20,.30),(1.08,.72,.38),'burgundy')
 cyl(s,'Virtual GM tube',(-.82,.20,.74),.22,1.26,'navy','x',56)
 cyl(s,'Virtual GM tube window cap',(-1.48,.20,.74),.16,.09,'blue','x',40)
 cyl(s,'Virtual GM tube rear cap',(-.16,.20,.74),.19,.07,'dark','x',36)
 wire(s,'Virtual detector cable',[(-.16,.20,.74),(.12,-.40,.66),(.22,-1.06,.76)],.020,'rubber')
 photo_ruler(s,'Metre rule',(.26,1.02,.17),5.90,False)
 # clearly non-real simulation marker, intentionally not a real handling representation
 box(s,'Simulation source holder',(2.62,.30,.35),(1.08,.88,.62),'burgundy')
 box(s,'Simulation source holder lid',(2.62,.30,.72),(1.08,.88,.12),'wood')
 cyl(s,'Simulation source marker',(2.14,.30,.65),.145,.17,'yellow','x',36)
 box(s,'Simulation-only label plate',(2.62,-.16,.62),(.76,.025,.22),'paper')
 box(s,'Distance reference block',(-.18,.64,.39),(.34,.48,.54),'white')
 return s

SC={
'rp01-standing-waves':photo_p1,
'rp02-double-slit':photo_p2d,
'rp02-diffraction-grating':photo_p2g,
'rp03-free-fall':lambda:photo_p3(True),
'rp03-free-fall-impact':lambda:photo_p3(False),
'rp04-young-modulus':photo_p4,
'rp05-resistivity-wire':photo_p5,
'rp06-iv-characteristics':photo_p6,
'rp07-pendulum':photo_p7p,
'rp07-spring':photo_p7s,
'rp08-boyle-syringe':photo_p8b,
'rp08-charles-law':photo_p8c,
'rp09-capacitor':photo_p9,
'rp10-wire-balance':photo_p10,
'rp11-search-coil':photo_p11,
'rp12-inverse-square':photo_p12
}
for name,fn in SC.items():
 blob=fn().export(file_type='glb');path=os.path.join(OUT,name+'.glb');open(path,'wb').write(blob);print('3D',os.path.basename(path),len(blob))