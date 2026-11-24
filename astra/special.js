// The main floor is read clockwise from the Theodore Roosevelt Rotunda.
// AMNH General Guide (1945), pp. 101–106, gives the historical case sequence.
// The modern Museum Shop doorway interrupts the middle of the left wall.
const akeleyCases=[
  ['water','Water Hole','entryR'],['nyala','Mountain Nyala','right',8.55,3.75],
  ['buffalo','African Buffalo','right',4.35,3.74],['lion','African Lions','right',.15,3.74],
  ['bongo','Bongo','right',-4.05,3.74],['eland','Giant Eland','right',-8.35,3.84],
  ['nile','Upper Nile Region','farR'],['plains','African Plains','farL'],
  ['kudu','Greater Kudu','left',-8.4,4.0],['sable','Giant Sable Antelope','left',-4.25,3.55],
  ['gemsbok','Gemsbok','left',3.48,2.80],['okapi','Okapi','left',6.64,2.80],
  ['desert','Libyan Desert','left',9.8,2.82],['gorilla','Gorilla','entryL'],
  ['klipspringer','Klipspringer','entryR',0,0,1],['cheetah','Cheetah','right',8.55,3.75,1],
  ['chimp','Chimpanzees','right',4.35,3.74,1],['lesser','Lesser Kudu and Gerenuk','right',.15,3.74,1],
  ['mandrill','Mandrill','right',-4.05,3.74,1],['impala','Impala','right',-8.35,3.84,1],
  ['white','White Rhinoceros','farR',0,0,1],['rhino','Black Rhinoceros','farL',0,0,1],
  ['hunt','African Hunting Dogs','left',-8.35,3.84,1],['vultures','Hyena, Jackal and Vultures','left',-4.05,3.74,1],
  ['leopard','Leopard and Bush Pig','left',.15,3.74,1],['colobus','Colobus Monkeys','left',4.35,3.74,1],
  ['veld','South African Group','left',8.55,3.75,1],['ostrich','Ostrich','entryL',0,0,1]
].map(([key,name,wall,at,width,upper=0])=>{
  const alongX=wall!=='right'&&wall!=='left';
  const direction=alongX?(wall.startsWith('entry')?-1:1):(wall==='right'?-1:1);
  return {key,name,alongX,direction,sideY:upper*5.2,upper,x:alongX?(wall.endsWith('R')?7.04:-7.04):-direction*11.42,
    z:alongX?-direction*12.07:at,width:alongX?8.12:width};
});
function akeleyStops(upper){
  return akeleyCases.filter(d=>d.upper===upper).map(d=>{
    const distance=d.alongX?3.83:(d.upper?3.27:3.65);
    return {name:d.name,x:d.x+(d.alongX?0:d.direction*distance),z:d.z+(d.alongX?d.direction*distance:0),
      lookX:d.x,lookZ:d.z,lookY:2.12};
  });
}
function akeleyCollisionBounds(upper){
  const objects=upper?[[0,0,14.4,15.8]]:[[0,0,5.34,12.58]];
  for(const c of akeleyCases.filter(d=>d.upper===upper)){
    const d=c.alongX?1.64:1.13;
    objects.push([c.x,c.z,c.alongX?c.width+.12:d,c.alongX?d:c.width+.08]);
  }
  return objects;
}

// Stop locations and sight lines are in the canonical 24 × 26 metre gallery.
const specialStops = {
  akeley:[{name:'African Elephant',x:3.80,z:7.75,lookX:-.13,lookZ:.33,lookY:2.45},...akeleyStops(0)],
  mezzanine:akeleyStops(1),
  meteorites: [
    {name:'Ahnighito',x:.7,z:5.2,lookX:0,lookZ:0,lookY:1.45},
    {name:'Woman · Cape York meteorite',x:-7.2,z:-3.8,lookX:-6.75,lookZ:-7.35,lookY:1.03},
    {name:'Dog · Cape York meteorite',x:-4.3,z:-4.4,lookX:-5.1,lookZ:-7.45,lookY:.82}
  ],
  rose: [
    {name:'Hayden Sphere',x:9.3,z:10.1,lookX:0,lookZ:0,lookY:9.1},
    {name:'Heilbrunn Cosmic Pathway',x:-8.7,z:8.4,lookX:-6.8,lookZ:5.7,lookY:3.2}
  ],
  gilder: [
    {name:'Kenneth C. Griffin Exploration Atrium',x:1.3,z:9.5,lookX:0,lookZ:-2.6,lookY:5.7},
    {name:'Atrium bridges',x:-4,z:-5.8,lookX:2,lookZ:1.2,lookY:6.6}
  ]
};

function addSpecial(g,id) {
  const tau=Math.PI*2;
  const quad=(a,b,c,d,color)=>{g.tri(a,b,c,color);g.tri(a,c,d,color);};
  const lerp=(a,b,t)=>a+(b-a)*t;
  const shade=(base,d)=>'#'+base.map(n=>Math.min(255,Math.max(0,Math.round(n+d))).toString(16).padStart(2,'0')).join('');
  let seed=6198;
  function rand(){ seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296; }
  function chain(points,radii,color) {
    for(let i=1;i<points.length;i++) g.rod(points[i-1],points[i],radii[i-1],radii[i],color);
  }
  function meteorites() {
    function iron(x,y,z,rx,ry,rz,phase){
      const cuts=64,levels=32;
      const pits=Array.from({length:48},()=>{const lat=Math.asin(2*rand()-1),lon=tau*rand();return [Math.cos(lat)*Math.cos(lon),Math.sin(lat),Math.cos(lat)*Math.sin(lon),.014+rand()*.027];});
      function vertex(i,j) {
        const a=i*tau/cuts,b=(j/levels-.5)*Math.PI;
        const u=Math.cos(a)*Math.cos(b),v=Math.sin(b),w=Math.sin(a)*Math.cos(b);
        let radius=1+.083*Math.sin(3*u+5*v+phase)*Math.cos(4*w+2*v)+.035*Math.sin(w*11+u*6+phase);
        for(const [px,py,pz,r] of pits){const d=1-u*px-v*py-w*pz; if(d<r)radius-=.06*(1-d/r)**2;}
        return [x+rx*(radius*u-.14*v+.09*w),y+ry*(v*radius+.13*u-.08*w),z+rz*w*radius];
      }
      const grid=Array.from({length:levels+1},(_,j)=>Array.from({length:cuts},(_,i)=>vertex(i,j)));
      for(let j=0;j<levels;j++)for(let i=0;i<cuts;i++){
        const n=(i+1)%cuts,p=grid[j][i];
        const tint=7*Math.sin(3*p[0]+2*p[2])+4*Math.cos(6*p[1]+4*p[0])+2*rand();
        quad(p,grid[j+1][i],grid[j+1][n],grid[j][n],shade([76,69,64],tint));
      }
    }
    function mount(x,z,s){
      g.box([x,.14,z],[4.9*s,.28,3.5*s],'#5a5752');
      g.box([x,.41,z],[4.62*s,.30,3.24*s],'#c0b5a6');
      for(const dx of [-1,1])g.box([x+dx*.94*s,.63,z],[.29*s,.5,1.61*s],'#443f3c');
    }
    mount(0,0,1.18);iron(0,1.49,0,2.24,1.00,1.39,1.4);
    mount(-6.1,-7.4,.86);iron(-6.75,1.03,-7.35,.86,.68,.69,2.3);iron(-5.10,.82,-7.45,.44,.35,.43,5.2);
  }
  function rose() {
    addHaydenSphere(g);
    addCosmicRamp(g);
    addRoseTrusses(g);
  }
  function gilder(){
    // The atrium's continuous cellular walls are lofted from an outer rectangle
    // through rounded reveal sections, then back out to the opposite face.
    const curve=(side,y,z)=>side*(8.20+.41*Math.sin(z*.46+y*.27)+.26*Math.sin(y*.79-z*.23));
    for(const side of [-1,1])for(let row=0;row<3;row++)for(let col=0;col<3;col++){
      const z0=-10.5+7*col, y0=1.85+4.17*row,w=7,h=4.17,zc=z0+w/2,yc=y0+h/2;
      const skew=.28*Math.sin(col*.9+side+row),phase=.7*col+row*.8;
      // Outer corners meet exactly at octants; adjacent panels share boundaries.
      const vector=i=>{const t=tau*i/64;return [Math.cos(t),Math.sin(t)];};
      function panel(i,rim,depth){
        const [u,v]=vector(i), m=Math.max(Math.abs(u),Math.abs(v));
        const outerZ=zc+u*w*.5/m,outerY=yc+v*h*.5/m;
        const wave=1+.075*Math.sin(3*Math.atan2(v,u)+phase);
        const innerZ=zc+(u*2.78+skew*v)*wave,innerY=yc+(v*1.49+.18*u)*wave;
        const z=lerp(outerZ,innerZ,rim),y=lerp(outerY,innerY,rim);
        return [curve(side,y,z)+side*depth,y,z];
      }
      for(let i=0;i<64;i++){
        const j=i+1;
        const surfaces=[[0,0,'#d1beaa'],[.66,-.14,'#d7c6b2'],[.9,-.05,'#d3bea8'],[1,.18,'#c3ab95'],[1,.63,'#b6a18e'],[.88,.93,'#cbb8a4'],[0,1.02,'#d3c2af']];
        for(let k=1;k<surfaces.length;k++){
          const [ra,da]=surfaces[k-1],[rb,db,colr]=surfaces[k];
          quad(panel(i,ra,da),panel(j,ra,da),panel(j,rb,db),panel(i,rb,db),colr);
        }
      }
    }
    // Broad sculpted connecting spans with undulating side parapets.
    for(const [y,z,skew] of [[5.0,-4.6,-.16],[8.9,2.2,.21],[12.3,-6.7,.10]]){
      const pt=(u,s,h)=>{const x=-9+18*u;return [x,y+h-.28*Math.sin(Math.PI*u),z+x*skew+.38*Math.sin(tau*u)+s*(.91+.25*Math.cos(tau*u))];};
      for(let i=0;i<34;i++){
        const a=i/34,b=(i+1)/34;
        quad(pt(a,-1,0),pt(a,1,0),pt(b,1,0),pt(b,-1,0),'#d5c4ae');
        quad(pt(a,-1,-.37),pt(b,-1,-.37),pt(b,1,-.37),pt(a,1,-.37),'#b29e8c');
        for(const s of [-1,1]){
          const ha=.65+.32*Math.cos(tau*a),hb=.65+.32*Math.cos(tau*b);
          quad(pt(a,s,-.37),pt(b,s,-.37),pt(b,s,hb),pt(a,s,ha),'#d4c1aa');
          g.rod(pt(a,s,ha+.09),pt(b,s,hb+.09),.041,.041,'#9f968a');
        }
      }
    }
    for(const side of [-1,1])for(const z of [-9.7,-3.5,3.5,9.7]){
      g.rod([side*8.5,.03,z],[side*8.35,2.01,z+.27],.47,.74,'#ccbaa4');
    }
  }
  const builders={meteorites,rose,gilder};
  if(builders[id])builders[id]();
}

// Local dimensions become metres under the Rose Center's uniform 1.4× scale.
const haydenRadius = 9.46;
const haydenCenterY = 10.5;
const cosmicRamp = Object.freeze({inner:9.6, outer:11, startTurns:-.08, base:.09, rise:4.7});

function addHaydenSphere(g) {
  const tau=2*Math.PI;
  const latitudes=52, meridians=104;
  const point=(j,i,raise=0)=>{
    const lon=i*tau/meridians, lat=(j/latitudes-.5)*Math.PI;
    const radius=haydenRadius+raise,ring=radius*Math.cos(lat);
    return [ring*Math.cos(lon),haydenCenterY+radius*Math.sin(lat),ring*Math.sin(lon)];
  };
  const panels=['#bac4ca','#bdc6cc','#bfc8cd','#bcc5cb','#bec7cc','#bdc6cb'];
  for(let j=0;j<latitudes;j++) {
    for(let i=0;i<meridians;i++) {
      const a=point(j,i),b=point(j+1,i),c=point(j+1,i+1),d=point(j,i+1);
      const panel=Math.floor((i+(j>>1)%2*2)/4),band=Math.floor(j/2);
      const color=panels[(panel*7+band*3+Math.floor(panel/5))%panels.length];
      if(j<latitudes-1)g.tri(a,b,c,color);
      if(j>0)g.tri(a,c,d,color);
      // Thin inlaid seams follow the same spherical panels without cylinder meshes.
      if(j>2&&j<50&&j%2===0){
        const p=point(j,i,.004),q=point(j,i+1,.004),r=point(j+.021,i+1,.004),s=point(j+.021,i,.004);
        g.tri(p,s,r,'#a5b0b7');g.tri(p,r,q,'#a5b0b7');
      }
      if(j>2&&j<49&&(i+(band%2)*2)%4===0){
        const p=point(j,i,.004),q=point(j,i+.023,.004),r=point(j+1,i+.023,.004),s=point(j+1,i,.004);
        g.tri(p,s,r,'#aab5ba');g.tri(p,r,q,'#aab5ba');
      }
    }
  }
  for(let i=0;i<6;i++){
    const t=(i+.5)*tau/6,c=Math.cos(t),s=Math.sin(t);
    const pt=(r,y,off=0)=>[c*r-s*off,y,s*r+c*off];
    const foot=pt(5.8,.16);
    g.box(foot,[.89,.32,.89],'#657480');
    for(const side of [-1,1]){
      const contact=pt(5.1,2.85,.47*side);
      g.rod(foot,contact,.20,.13,'#9ca9b1');
      g.ell(contact,[.23,.21,.23],'#8d9ba6');
    }
  }
}

function addCosmicRamp(g) {
  const {inner,outer,startTurns,base,rise}=cosmicRamp;
  const pos=(t,r,dy=0)=>{
    const a=2*Math.PI*(t+startTurns);
    return [r*Math.cos(a),base+t*rise+dy,r*Math.sin(a)];
  };
  const quad=(a,b,c,d,col)=>{g.tri(a,b,c,col);g.tri(a,c,d,col);};
  for(let i=0;i<128;i++){
    const t=i/128,u=(i+1)/128;
    quad(pos(t,inner),pos(u,inner),pos(u,outer),pos(t,outer),'#899398');
    quad(pos(t,inner,-.145),pos(t,outer,-.145),pos(u,outer,-.145),pos(u,inner,-.145),'#60717c');
    for(const radius of [inner,outer]){
      quad(pos(t,radius),pos(t,radius,-.145),pos(u,radius,-.145),pos(u,radius),'#60727e');
      const edge=radius===inner?radius+.055:radius-.055;
      quad(pos(t,radius,.004),pos(t,edge,.004),pos(u,edge,.004),pos(u,radius,.004),'#c2c9cb');
      for(const [y,w] of [[.42,.009],[.65,.009],[.82,.029]])g.rod(pos(t,radius,y),pos(u,radius,y),w,w,'#a6b5bd');
      if(i%3===0)g.rod(pos(t,radius,.025),pos(t,radius,.82),.025,.025,'#8e9fa8');
    }
    if(i%12===6)g.rod(pos(t,outer-.13,-.14),pos(t,outer-.13,-(base+t*rise)),.081,.094,'#9aaab2');
  }
}

const roseFrame = Object.freeze({halfWidth:11.85,halfDepth:12.83,header:4.13,roof:22.1});
function addRoseTrusses(g) {
  const {halfWidth,halfDepth,header,roof}=roseFrame;
  for(const side of [-1,1])for(const eastWest of [true,false]){
    const length=2*(eastWest?halfDepth:halfWidth), span=eastWest?halfWidth:halfDepth;
    const pt=(u,y,inset=0)=>eastWest?[side*(span-inset),y,u]:[u,y,side*(span-inset)];
    for(let i=0;i<=10;i++){
      const u=(i/10-.5)*length;
      g.rod(pt(u,header,.04),pt(u,roof,.04),.028,.028,'#9baeba');
      if(i%2===0){
        g.rod(pt(u,header,.30),pt(u,roof,.30),.052,.052,'#8297a3');
        if(i===0||i===10)g.rod(pt(u,0,.30),pt(u,header,.30),.075,.075,'#8d9faa');
        for(let j=1;j<=6;j++){
          const h=header+j*(roof-header)/7;
          g.rod(pt(u,h,.3),pt(u,h,.044),.046,.039,'#768a97');
          g.ell(pt(u,h,.04),[.075,.075,.075],'#c4cfd2');
        }
      }
    }
    for(let j=0;j<=7;j++){
      const y=header+j*(roof-header)/7;
      g.rod(pt(-length*.5,y,.04),pt(length*.5,y,.04),.032,.032,'#a2b5bf');
    }
    for(let i=0;i<5;i++){
      const a=(i/5-.5)*length,b=((i+1)/5-.5)*length;
      g.rod(pt(a,header,.23),pt(b,roof,.23),.017,.017,'#9aadb7');
      g.rod(pt(b,header,.23),pt(a,roof,.23),.017,.017,'#9aadb7');
    }
  }
  for(let n=-2;n<=2;n++){
    const z=n*5.04;
    for(const y of [roof,roof-.61])g.rod([-halfWidth,y,z],[halfWidth,y,z],.071,.071,'#9baeb9');
    for(let j=0;j<12;j++){
      const a=-halfWidth+2*halfWidth*j/12,b=a+2*halfWidth/12;
      g.rod([a,roof-.61,z],[(a+b)/2,roof,z],.032,.032,'#8ba0ae');
      g.rod([(a+b)/2,roof,z],[b,roof-.61,z],.032,.032,'#8ba0ae');
    }
  }
  for(let j=-4;j<=4;j++)g.rod([j*2.53,roof-.02,-halfDepth],[j*2.53,roof-.02,halfDepth],.023,.023,'#a0b2bb');
}

// The curtain wall uses one translucent draw, independent of the opaque pavilion.
function buildRoseGlass() {
  const {halfWidth,halfDepth,header,roof}=roseFrame;
  const vertices=[], colors=[];
  function pane(a,b,c,d,base,top){
    for(const [p,color] of [[a,base],[b,base],[c,top],[a,base],[c,top],[d,top]]){
      vertices.push(...p);colors.push(color.r,color.g,color.b);
    }
  }
  const low=new THREE.Color('#d2ebee'),high=new THREE.Color('#7daec7');
  for(const s of [-1,1])for(const eastWest of [true,false]){
    const span=eastWest?halfWidth:halfDepth,length=2*(eastWest?halfDepth:halfWidth);
    const pt=(u,y)=>eastWest?[s*span,y,u]:[u,y,s*span];
    for(let j=0;j<7;j++)for(let i=0;i<10;i++){
      const u=(i/10-.5)*length,v=((i+1)/10-.5)*length;
      const y=header+(roof-header)*j/7,yy=header+(roof-header)*(j+1)/7;
      const tint=.98+.019*Math.sin(3*i+2*j+s);
      pane(pt(u,y),pt(v,y),pt(v,yy),pt(u,yy),low.clone().lerp(high,j/7).multiplyScalar(tint),low.clone().lerp(high,(j+1)/7).multiplyScalar(tint));
    }
  }
  pane([-halfWidth,roof,-halfDepth],[halfWidth,roof,-halfDepth],[halfWidth,roof,halfDepth],[-halfWidth,roof,halfDepth],high,high);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const mat=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,transparent:true,opacity:.57,depthWrite:false,toneMapped:false});
  const glass=new THREE.Group();glass.add(new THREE.Mesh(geometry,mat));return glass;
}
