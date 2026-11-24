'use strict';
const $=id=>document.getElementById(id);
const rooms=Object.values(floors).flat();
const catalog=new Map(rooms.map(r=>[r.id,r]));
const stop=(name,x,z,lookX,lookY,lookZ)=>({name,x,z,lookX,lookY,lookZ});
const highlights={
  universe:universeStops(),
  gilder2:[{...stop('Griffin Atrium overlook',2.25,.80,2.8,0,-7.6),wallLabel:true,markerLocal:[2.25,.85,.80]}],
  forecourt:[{name:'Theodore Roosevelt Memorial entrance',x:0,z:8.93,lookX:0,lookY:6.7,lookZ:-12.27,wallLabel:true,markerLocal:[1.4,.83,-11.20]}],
  rotunda:[stop('Barosaurus',5.03,11.19,-.52,4.65,0),stop('Juvenile Barosaurus',1.9,4.5,1.8,1.3,1.25),stop('Allosaurus',6.1,-4.7,3,2,-.25)],
  fossil:[stop('Tyrannosaurus rex',.18,3.95,-5.50,2.40,1.35),stop('Apatosaurus',-1.25,2.45,5.55,2.35,.12),stop('Allosaurus feeding on a sauropod',-5.1,-3.4,-2.5,1.45,-6.25),...(typeof fossilStudyStops==='undefined'?[]:fossilStudyStops)],
  titan:[stop('The Titanosaur',7.2,3.9,.1,2.6,-.3),
    {name:'Titanosaur skull',x:2.95,z:12.33,lookX:0,lookY:4.48,lookZ:10.62,wallLabel:true,markerLocal:[1.65,1.40,10.25]},
    {name:'Diplodocus femur',x:-8.02,z:-7.41,lookX:-11.12,lookY:1.12,lookZ:-7.41,wallLabel:true,markerLocal:[-10.4,.78,-7.41]}],
  ornith:[stop('Triceratops',-2.25,-.85,-3.7,2.08,4.02),stop('Stegosaurus',5.48,-.85,7.03,2.08,4.22),{...stop('Edmontosaurus mummy (AMNH 5060)',-4.12,-6.03,-3.27,1.08,-8.75),wallLabel:true},{...stop('Edmontosaurus comparative skull',3.71,-6.61,3.25,1.52,-8.80),wallLabel:true}, {...stop('End-Cretaceous extinction',-8.38,5.13,-10.05,1.47,7.70),wallLabel:true}, {...stop('Ornithischian family tree',6.90,-3.60,7.87,1.72,-6.66),wallLabel:true}],
  ocean:[...oceanStops,...(typeof oceanSideStops==='undefined'?[]:oceanSideStops)],northMammals:americanStops,terrace:(typeof terraceStops==='undefined'?[]:terraceStops),...specialStops
};
const arrivals={
  universe:stop('Cullman Hall of the Universe',1.55,3.3,-1.32,1.23,.33),
  ocean:stop('Milstein Hall of Ocean Life',-5.70,-10.25,-.20,3.36,.44),
  akeley:stop('Akeley Hall',-3.8,9.85,.09,2.78,-.40),
  northMammals:stop('North American Mammals',.5,10.65,-.8,1.75,-1.25),
  rotunda:stop('Roosevelt Rotunda',9,11.55,1.2,4.8,0),
  rose:stop('Rose Center',-6.55,12.08,0,10.55,0),
  gilder:stop('Exploration Atrium',4.98,-10.9,-.7,5.0,1.8),
  meteorites:stop('Hall of Meteorites',4.1,7.4,-.6,1.55,-.65),
  fossil:stop('Saurischian Dinosaurs',.10,7.90,-1.05,2.37,-.70),
  titan:stop('Wallach Orientation Center',8.2,6.30,-.4,2.83,-1.9),
  terrace:terraceStops[0],
  ornith:stop('Hall of Ornithischian Dinosaurs',10.45,-1.85,-4.05,2.16,3.52)
};
const names={rose:'Rose Center · Hayden Planetarium',gilder:'Gilder Center · Exploration Atrium',titan:'Wallach Orientation Center',rotunda:'Roosevelt Rotunda'};
const notes={
  forecourt:'The memorial steps at Central Park West and 79th Street.',
  rotunda:'Barosaurus, its young, and an approaching Allosaurus.',
  akeley:'African elephants and habitat dioramas.',ocean:'Beneath the blue whale.',meteorites:'Fragments of the Cape York meteorite.',
  rose:'Inside the glass cube of the Rose Center.',gilder:'Bridges and sculpted openings in the Exploration Atrium.',
  fossil:'Theropods and their saurischian relatives.',titan:'Walk the length of the Titanosaur cast.',ornith:'Horned and armored dinosaurs.'
};
const noop=()=>{}, probe={box:noop,tri:noop,ell:noop,rod:noop};
const sideInfo={north:[0,-1],south:[0,1],east:[1,0],west:[-1,0]};
const architectural=new Set(['rotunda','ocean','fossil']);
const roseScale=1.4, upperDeck=4.79*roseScale, oceanDrop=3;
const roseUpper=r=>r.id==='bigBang'||r.id==='cosmicPath';
const roseZone=r=>roseUpper(r)||r.id==='rose';
for(const [f,entries] of Object.entries(floors)){
  for(const r of entries){
    r.level=Number(f);r.sx=r.w/24;r.sz=r.d/26;r.sy=Math.max(.85,Math.min(1.65,r.sx,r.sz));
    if(r.id==='rotunda')r.sy=1.30;
    r.display=names[r.id]||r.name;
    r.stops=highlights[r.id]||addCollection(probe,r.name)||[];
    if(!highlights[r.id]&&r.stops.length){
      r.artScale=Math.min(1.25,r.sx,r.sz);
      const ax=r.artScale/r.sx,ay=r.artScale/r.sy,az=r.artScale/r.sz;
      r.stops=r.stops.map(s=>({...s,x:s.x*ax,z:s.z*az,lookX:s.lookX*ax,lookZ:s.lookZ*az,
        lookY:s.lookY*ay,width:s.width*ax,depth:s.depth*az}));
    }
    if(r.id==='rose'){
      r.stops=r.stops.map(s=>({...s,x:s.x*roseScale/r.sx,z:s.z*roseScale/r.sz,
        lookX:s.lookX*roseScale/r.sx,lookY:s.lookY*roseScale/r.sy,lookZ:s.lookZ*roseScale/r.sz}));
    }
    r.ports=r.links.map(id=>{
      const b=catalog.get(id),dx=b.x-r.x,dz=b.z-r.z;
      const vertical=Math.abs(dx)>(r.w+b.w)/2-.05;
      const side=vertical?(dx>0?'east':'west'):(dz>0?'south':'north');
      const k=vertical?'z':'x',size=vertical?'d':'w';
      const lo=Math.max(r[k]-r[size]/2,b[k]-b[size]/2), hi=Math.min(r[k]+r[size]/2,b[k]+b[size]/2);
      if(roseUpper(r)&&roseUpper(b))return {id,side,at:(hi-r[k])-1.4,width:2.45};
      return {id,side,at:(lo+hi)/2-r[k],width:Math.min(5.6,(hi-lo)*.74)};
    });
    r.blocks=[];
  }
}
const blockers={
  rotunda:[[0,0,16,5.2],...[-1,1].flatMap(x=>[-1,1].flatMap(z=>[[x*3.7,z*11.98,1.28,1.28],[x*10.98,z*3.7,1.28,1.28]]))],fossil:[...saurischianPlinths,[-1.1,-6.25,9.6,2.8]],titan:[[0,0,22,3.65]],
  ornith:[[...ornithLayout.trike,4.50,3.24],[...ornithLayout.stego,4.50,3.24],[-10.05,7.7,1.58,2.42], [7.87,-6.66,1.88,1.24],[-3.15,-8.75,2.48,3.16],[3.25,-8.80,1.08,1.63]],meteorites:[[0,0,3.65,1.98],[-6.1,-7.4,4.2,3]],
  akeley:akeleyCollisionBounds(0),
  ocean:[[-7.7,12.3,8,1.4],[7.7,12.3,8,1.4],[11,7.65,1.8,7.4]],
  mezzanine:akeleyCollisionBounds(1)
};
const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(65,1,.08,300);
let optics,renderer,room=catalog.get('rotunda'), currentFloor=-1, yaw=0,pitch=0,lastFrame=0,nearest=null;
const keys=new Set(), pos=new THREE.Vector3(), camEuler=new THREE.Euler(0,0,0,'YXZ');
let floorGroup=new THREE.Group(),needsFrame=true,settleReflectionAt=0;
let belowAtriumStair=false;
let previousRoom=null,previousYaw=NaN,previousPitch=NaN,lastMotion=0,slowFrames=0,fastFrames=0;
let resolutionScale=1,movingScale=1,quality='auto',softwareGraphics=false;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
try{const saved=localStorage.getItem('museum-atlas-detail');if(['auto','high','low'].includes(saved))quality=saved;}catch{}
function setRenderScale(scale){
  resolutionScale=scale;renderer.setPixelRatio(Math.min(devicePixelRatio,1.55)*scale);
  renderer.setSize(innerWidth,innerHeight,false);optics?.resize();needsFrame=true;
}
function setDetail(mode){
  quality=mode;movingScale=mode==='auto'&&softwareGraphics?.62:1;slowFrames=fastFrames=0;try{localStorage.setItem('museum-atlas-detail',mode);}catch{}
  if(renderer)setRenderScale(mode==='low'?.72:1);
}
const gateProjection=new THREE.Matrix4(),gateFrustum=new THREE.Frustum(),gateBox=new THREE.Box3();
function cullBehindWalls(){
  gateProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
  gateFrustum.setFromProjectionMatrix(gateProjection,THREE.WebGLCoordinateSystem);
  const visible=new Set([room.id]),distant=new Set();
  for(const p of room.ports){
    const [dx,dz]=sideInfo[p.side],x=room.x+(dx?dx*room.w/2:p.at),z=room.z+(dz?dz*room.d/2:p.at);
    const w=dz?p.width/2+.35:.5,d=dx?p.width/2+.35:.5;
    gateBox.min.set(x-w,-.6,z-d);gateBox.max.set(x+w,clearance(room,catalog.get(p.id))+.75,z+d);
    const distance=Math.hypot(pos.x-x,pos.z-z),next=catalog.get(p.id);
    const sharedRose=roseUpper(room)&&roseUpper(next);
    if(!gateFrustum.intersectsBox(gateBox)&&distance>1.2&&!sharedRose)continue;
    if(distance<Math.max(7.25,p.width*1.65)||sharedRose||!p.backdrop){
      if(!next.built){buildRoom(next);renderer.shadowMap.needsUpdate=true;}
      visible.add(next.id);
    }else distant.add(next.id);
  }
  for(const o of floorGroup.children){
    if(o.userData.portal)o.visible=o.userData.from===room.id&&distant.has(o.userData.to);
    else o.visible=visible.has(o.userData.roomId)||(o.userData.roseDeck&&(visible.has('cosmicPath')||visible.has('bigBang')||visible.has('terrace')));
  }
}
const previousPosition=new THREE.Vector3(Infinity,Infinity,Infinity);
THREE.DefaultLoadingManager.onLoad=()=>{needsFrame=true;settleReflectionAt=performance.now()+750;};
scene.add(floorGroup);
const hemi=new THREE.HemisphereLight(0xfff1d6,0xb3a493,1.55);
const sun=new THREE.DirectionalLight(0xffe2b4,2.15);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-28,right:28,top:28,bottom:-28,near:.5,far:110});
sun.shadow.bias=-.00028;sun.shadow.normalBias=.025;
scene.add(hemi,sun,sun.target);
const bounce=new THREE.DirectionalLight(0xbad7e6,.66);bounce.position.set(-9,6,7);scene.add(bounce);
function portalLocal(r){return r.ports.map(p=>{const s=['west','east'].includes(p.side)?r.sz:r.sx;return {...p,at:p.at/s,width:p.width/s};});}
function localToWorld(r,x,y,z){return new THREE.Vector3(r.x+x*r.sx,y*r.sy,r.z+z*r.sz);}
function blocked(r,x,z){
  const lx=(x-r.x)/r.sx,lz=(z-r.z)/r.sz;
  if(r.id==='forecourt'&&z<15.07&&Math.abs(x)>3.04)return true;
  if(r.id==='gilder'&&Math.abs(lx)>6.2&&atriumWallField(lx,1.5,lz,Math.sign(lx))<.10)return true;
  if(r.id==='gilder2'&&x>-30.8&&x<-15.2&&z>-168&&z<-153){
    const span=gilderBridge(x,z);
    if(!span.onDeck)return true;
  }
  if(roseZone(r)){
    const rose=catalog.get('rose'), dist=Math.hypot(x-rose.x,z-rose.z)/roseScale;
    if(roseUpper(r)&&dist<10.96)return true;
    if(r.id==='rose'&&dist<9.46){
      const clearance=roseScale*(10.5-Math.sqrt(9.46**2-dist**2));
      if(clearance<1.9)return true;
    }
  }
  return r.blocks.some(([bx,bz,w,d])=>Math.abs(lx-bx)<w/2+.18/r.sx&&Math.abs(lz-bz)<d/2+.18/r.sz);
}
// Ocean Life is entered on its perimeter mezzanine. Two stair flights descend
// to the whale floor; the hall stays on the museum's floor-one map.
function oceanDeck(g,ports){
  const granite='#647887',rail='#adbfc5',underside='#435866',railHeight=.64;
  for(const side of [-1,1]){
    g.box([side*10.75,-.12,0],[2.5,.24,26],granite);
    g.box([0,-.12,side*11.5],[19,.24,3],granite);
    const baluster=(a,b)=>{
      g.rod([a[0],railHeight,a[1]],[b[0],railHeight,b[1]],.028,.028,rail);
      const n=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/1.3);
      for(let i=0;i<=n;i++){const x=a[0]+(b[0]-a[0])*i/n,z=a[1]+(b[1]-a[1])*i/n;g.rod([x,0,z],[x,railHeight,z],.024,.024,rail);}
    };
    baluster([side*9.5,-10],[side*9.5,10]);
    baluster([side*9.5,10],[0,10]);baluster([0,-10],[side*7.45,-10]);
    for(let i=0;i<24;i++){
      const h=oceanDrop*(1-i/24);
      g.box([side*8.46,-oceanDrop+h/2,-10+(i+.5)/3],[2.03,h,1/3+.005],granite);
    }
    for(const x of [side*7.45,side*9.47]){
      g.rod([x,railHeight,-10],[x,railHeight-oceanDrop,-2],.028,.028,rail);
      for(let i=0;i<=4;i++)g.rod([x,-oceanDrop*i/4,-10+2*i],[x,railHeight-oceanDrop*i/4,-10+2*i],.024,.024,rail);
    }
  }
  for(const p of ports){
    const [dx,dz]=sideInfo[p.side];
    g.box([dx?dx*12:p.at,-oceanDrop/2,dz?dz*13:p.at],dx?[.18,oceanDrop,p.width]:[p.width,oceanDrop,.18],underside);
  }
}
function oceanSurface(x,z){
  const r=catalog.get('ocean'),lx=Math.abs((x-r.x)/r.sx),lz=(z-r.z)/r.sz;
  if(lx>=7.4&&lx<=9.5&&lz>=-10&&lz<=-2)return -oceanDrop*r.sy*(lz+10)/8;
  if(lx>=9.5||Math.abs(lz)>=10)return 0;
  return -oceanDrop*r.sy;
}
function hostGroup(r){
  const g=new THREE.Group();g.position.set(r.x,0,r.z);g.scale.set(r.sx,r.sy,r.sz);return g;
}
function clearance(r,other){
  const arch=q=>q.id==='ocean'?(6-oceanDrop)*q.sy:architectural.has(q.id)?6*q.sy:0;
  const bounds=q=>q.id==='titan'?5.8:8*q.sy-.20;
  return Math.min(bounds(r),bounds(other),Math.max(arch(r),arch(other))||Math.min(3.65*r.sy,3.65*other.sy));
}
function genericHall(g,r,ports){
  const dark=['akeley','mezzanine','meteorites','universe'].includes(r.id), modern=/gilder|rose|cosmic|scales|grandFoyer|invisible|gems|planet|insect/i.test(r.id);
  let wall=dark?'#5c5b4b':modern?'#d4d0c3':'#c9c2ae', trim=dark?'#86806b':modern?'#adb5ae':'#e5d9be', floor=dark?'#726856':modern?'#969f9d':'#bdaf96';
  if(fitPalette[roomFitOuts[r.id]])[wall,trim,floor]=fitPalette[roomFitOuts[r.id]];
  if(r.id==='titan'){wall='#303330';trim='#4d514c';floor='#575953';}
  if(r.id==='ornith'){wall='#d6d9cf';trim='#bac0b6';floor='#abb4a8';}
  if(r.id==='northMammals'){wall='#30332c';trim='#44453b';floor='#625f53';}
  if(r.id==='meteorites'){wall='#373632';trim='#44433f';floor='#686860';}
  const h=/gilder|rose|cosmic/i.test(r.id)?18:dark?12:8;
  if(r.id==='mezzanine'){
    for(const side of [-1,1]){
      g.box([side*9.6,-.17,0],[4.8,.34,26],floor);
      g.box([0,-.17,side*10.45],[14.4,.34,5.1],floor);
      g.box([side*7.2,.62,0],[.12,1.24,15.8],trim);
      g.box([0,.62,side*7.9],[14.4,1.24,.12],trim);
    }
  } else if(!roseUpper(r)&&r.id!=='gilder2')g.box([0,-.11,0],[24,.22,26],floor);
  if(r.id!=='mezzanine'&&!roseUpper(r)&&r.id!=='gilder2'){
    for(let i=-10;i<=10;i+=2)g.box([i,.006,0],[.016,.012,26],'#8f8878');
    for(let i=-12;i<=12;i+=2)g.box([0,.007,i],[24,.012,.015],'#8f8878');
  }
  if(!roseZone(r))g.box([0,h+.1,0],[24,.2,26],modern?'#c7c9c1':trim);
  for(const [side,[dx,dz]] of Object.entries(sideInfo)){
    if(r.id==='gilder'&&side==='north')continue;
    if(roseUpper(r)&&((r.id==='cosmicPath'&&side==='west')||(r.id==='bigBang'&&side==='east')))continue;
    const limit=dx?13:12,span=(lo,hi,y,ht,depth,c,shift=0)=>{
      if(hi-lo<=.001)return;
      g.box(dx?[dx*(12-shift),y,(lo+hi)/2]:[(lo+hi)/2,y,dz*(13-shift)],dx?[depth,ht,hi-lo]:[hi-lo,ht,depth],c);
    };
    let start=-limit;
    const solid=(a,b)=>{
      const height=roseZone(r)?3.15:h;
      span(a,b,height/2,height,.15,wall);span(a,b,.25,.50,.24,trim,.02);
      span(a,b,h-1,.21,.28,trim,.04);
      for(let j=a+2.1;j<b-.6;j+=4.5)span(j-.20,j+.20,h/2,h,.39,trim,.11);
    };
    for(const p of ports.filter(p=>p.side===side).sort((a,b)=>a.at-b.at)){
      const a=p.at-p.width/2,b=p.at+p.width/2,opening=Math.min(h-.14,clearance(r,catalog.get(p.id))/r.sy);
      solid(start,a);span(a,b,(h+opening)/2,h-opening,.15,wall);
      span(a-.12,b+.12,opening+.065,.13,.32,trim,.02);
      for(const u of [a-.057,b+.057])span(u-.059,u+.059,opening/2,opening,.33,trim,.045);
      start=b;
    }
    solid(start,limit);
  }
  if(r.id==='akeley'){
    for(const side of [-1,1]){
      g.box([side*9.6,5.05,0],[4.8,.30,26],trim);g.box([0,5.05,side*10.45],[14.4,.30,5.1],trim);
      g.box([side*7.2,5.82,0],[.12,1.24,15.8],trim);g.box([0,5.82,side*7.9],[14.4,1.24,.12],trim);
    }
  }
  if(!roseZone(r))for(const x of [-7,7])for(const z of [-8,0,8]) {
    g.box([x,h-.1,z],[2.6,.13,.38],'#4c5149');g.box([x,h-.19,z],[2.46,.05,.26],'#ffedc5');
  }
}
const labelCache=new Map();
function labelTexture(title,kicker){
  const key=title+'|'+kicker;if(labelCache.has(key))return labelCache.get(key);
  const c=document.createElement('canvas');c.width=672;c.height=207;
  const ctx=c.getContext('2d'),object=kicker==='Exhibit'||/^Diorama|Wyoming|Cast study|Patagonia/i.test(kicker),direction=kicker==='Gallery';
  ctx.fillStyle=object?'#ece5ce':direction?'#252c2c':'#333e38';ctx.fillRect(0,0,c.width,c.height);
  ctx.fillStyle=object?'#997247':'#c4a574';ctx.fillRect(0,0,9,c.height);
  ctx.fillStyle=object?'#61533e':'#dbccab';ctx.font='600 18px Arial';ctx.fillText(object&&kicker==='Exhibit'?'AMERICAN MUSEUM OF NATURAL HISTORY':kicker.toUpperCase(),27,42,605);
  const width=direction?535:614;
  const words=title.split(' '),max=direction?45:46;let lines,font=max;
  do{
    ctx.font=(object?'':'500 ')+font+'px Georgia';lines=[''];
    for(const word of words){const i=lines.length-1,str=(lines[i]+' '+word).trim();if(lines[i]&&ctx.measureText(str).width>width)lines.push(word);else lines[i]=str;}
    if(lines.length<=2)break;font-=2;
  }while(font>28);
  ctx.fillStyle=object?'#252d29':'#fff8e7';
  lines.slice(0,2).forEach((line,i)=>ctx.fillText(line,27,(lines.length>1?104:130)+font*1.1*i,width));
  if(direction){ctx.strokeStyle='#e0ceaa';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(608,140);ctx.lineTo(608,85);ctx.lineTo(588,105);ctx.moveTo(608,85);ctx.lineTo(628,105);ctx.stroke();}
  if(object){ctx.fillStyle='#b0a38a';ctx.fillRect(27,177,611,2);}
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
  const mat=new THREE.MeshBasicMaterial({map:tex,side:THREE.FrontSide});labelCache.set(key,mat);return mat;
}
function sign(parent,title,kicker,x,y,z,width,angle) {
  const m=new THREE.Mesh(new THREE.PlaneGeometry(width,width*207/672),labelTexture(title,kicker));
  m.position.set(x,y,z);m.rotation.y=angle;parent.add(m);return m;
}
function buildRoom(r){
  const firstObject=floorGroup.children.length;
  const host=hostGroup(r),geometry=new GalleryMesh(),ports=portalLocal(r);
  const off=r.id==='fossil'?-24:r.id==='ocean'?24:0;
  if(architectural.has(r.id))addHalls(geometry,r.id,ports.map(p=>p.side),ports);
  else if(r.id==='forecourt')host.add(buildMemorialEntrance(r));
  else if(r.id==='terrace'&&typeof arthurRossTerrace==='function')host.add(arthurRossTerrace(r,ports));
  else genericHall(geometry,r,ports);
  if(architectural.has(r.id)||r.id==='ornith')addHallFinishes(host,r.id,ports);
  const shell=geometry.finish();shell.position.x=-off;host.add(shell);
  if(r.id==='ocean'){
    shell.position.y=-oceanDrop;
    const deck=new GalleryMesh();oceanDeck(deck,ports);host.add(deck.finish());
  }
  const art=new GalleryMesh();
  if(r.id==='fossil'||r.id==='rotunda')addFossils(art,r.id);
  else if(r.id==='ocean'){
    const whale=new GalleryMesh();addOcean(art,whale);
    const body=whale.finish(true),scale=1.40;
    if(typeof addBlueWhaleSkin==='function')addBlueWhaleSkin(body);
    body.scale.set(scale/r.sx,scale/r.sy,scale/r.sz);
    body.position.set(-24*scale/r.sx,-oceanDrop+.78,0);host.add(body);
  }
  else if(r.id==='titan')addTitan(art);
  else if(r.id==='ornith')addOrnith(art);
  else if(['meteorites','gilder','gilder2','rose'].includes(r.id)){} // Built as dedicated material groups below.
  else if(r.id==='mezzanine')addSpecial(art,'akeley');
  else if(specialStops[r.id])addSpecial(art,r.id);
  else if(r.id!=='northMammals'&&r.id!=='universe')addCollection(art,r.name);
  const display=r.id==='meteorites'?meteoriteDisplay():r.id==='rose'?roseStructure():
    ['gilder','gilder2'].includes(r.id)?gilderSculpture():art.finish(true);
  display.position.x=-off;
  if(r.id==='northMammals')addAmericanHall(display);
  else if(typeof addCollectionDetails==='function')addCollectionDetails(display,r.name,r.id);
  if(typeof addHabitatArt==='function')addHabitatArt(display,r.id);
  if(r.artScale)display.scale.set(r.artScale/r.sx,r.artScale/r.sy,r.artScale/r.sz);
  if(r.id==='ocean')display.position.y=-oceanDrop;
  if(r.id==='mezzanine'){
    display.position.y=-5.2;
    const lower=new GalleryMesh();lower.box([0,-5.32,0],[24,.24,26],'#726856');host.add(lower.finish());
  }
  if(r.id==='gilder2'){
    const base=catalog.get('gilder');
    display.scale.set(base.sx/r.sx,base.sy/r.sy,base.sz/r.sz);
    display.position.set((base.x-r.x)/r.sx,-5*base.sy/r.sy,(base.z-r.z)/r.sz);
    const decks=new GalleryMesh();
    function slab(x0,z0,x1,z1,y){decks.box([(x0+x1)/2,y-.15,(z0+z1)/2],[x1-x0,.3,z1-z0],'#d3c6b1');}
    slab(-42,-174,-30.8,-149,0);slab(-15.2,-174,-10,-149,0);
    slab(-30.8,-174,-15.2,-168,0);
    const stairs0=base.x+stairLeft*base.sx,stairs1=base.x+stairRight*base.sx,landing=base.z+stairEast*base.sz;
    slab(-30.8,-153,stairs0,-149,0);slab(stairs1,-153,-15.2,-149,0);slab(stairs0,landing,stairs1,-149,0);
    slab(-36,-174,-10,-133,-5*base.sy);
    floorGroup.add(decks.finish());
  }
  if(r.id==='rose'){
    display.scale.set(roseScale/r.sx,roseScale/r.sy,roseScale/r.sz);

  }
  if((roseUpper(r)||r.id==='terrace')&&!floorGroup.userData.roseDeck)buildRoseDeck();
  if(r.id==='titan'){
    // The 122-foot cast runs along the long dimension of the orientation hall.
    const turn=new THREE.Matrix4().makeRotationY(-Math.PI/2);
    display.matrixAutoUpdate=false;
    display.matrix.makeScale(1.70/r.sx,1.37/r.sy,1.70/r.sz).multiply(turn);
  }
  host.add(display);
  r.blocks=blockers[r.id]||r.stops.map(s=>[s.lookX,s.lookZ,s.width||3.8,s.depth||2.7]);
  if(specialStops[r.id]&&!blockers[r.id])r.blocks=[];
  if(r.id==='northMammals')r.blocks=americanBounds();
  if(r.id==='forecourt'||r.id==='gilder2')r.blocks=[];
  if(r.id==='universe'){buildUniverse(host,r);r.blocks=r.universeBlocks;}
  if(r.id==='terrace'&&typeof terraceBlockers==='function')r.blocks=terraceBlockers(r);
  if(r.id==='titan')r.blocks=[[0,0,3.65*1.7/r.sx,22*1.7/r.sz]];
  addGalleryInterior(host,r);
  if(r.interiorBlocks?.length)r.blocks=r.blocks.concat(r.interiorBlocks);
  if(r.orientationBarriers)r.blocks=r.blocks.concat(r.orientationBarriers);
  const mounts=new GalleryMesh();
  r.stops.forEach(s=>{
    if(s.wallLabel){
      const [x,y,z]=s.markerLocal||[s.lookX,s.lookY,s.lookZ];s.marker=localToWorld(r,x,y-(r.id==='ocean'?oceanDrop:0),z);return;
    }
    const dx=s.x-s.lookX,dz=s.z-s.lookZ,len=Math.hypot(dx,dz)||1;
    // Set the label between the viewpoint and specimen, at reading height.
    const reach=Math.min(5.0,len*.57),wide=Math.min(1.16,1.43/r.sx);
    const signSide=r.id==='rotunda'&&s.name==='Juvenile Barosaurus'?-1:1;
    let x=s.x-dx/len*reach+dz/len*.62*signSide,z=s.z-dz/len*reach-dx/len*.62*signSide;
    if(s.name==='Ahnighito'){x=2.50;z=.97;}
    const baseY=r.id==='ocean'&&s.name!=='Kelp Forests'?-oceanDrop:r.id==='meteorites'?meteorStep(x,z):0;
    const angle=Math.atan2(dx*r.sx,dz*r.sz);
    mounts.rod([x,baseY,z],[x,baseY+1.04/r.sy,z],.027,.042,'#575650');
    mounts.box([x,baseY+.024/r.sy,z],[.32,.048/r.sy,.28],'#50514b');
    const plate=sign(host,s.name,'Exhibit',x+Math.sin(angle)*.13/r.sx,baseY+1.06/r.sy,z+Math.cos(angle)*.13/r.sz,wide,angle);
    plate.rotation.order='YXZ';plate.rotation.x=-.41;plate.scale.y=1.46;
    s.marker=localToWorld(r,x,baseY+1.34/r.sy,z);

  });
  host.add(mounts.finish());
  // Small signs beside each opening keep the transom and specimen sightlines clear.
  for(const p of r.ports){
    if(roseUpper(r)&&roseUpper(catalog.get(p.id)))continue;
    const [dx,dz]=sideInfo[p.side],length=dx?r.d:r.w;
    const sideSpace=at=>Math.min(length/2-Math.abs(at),...r.ports.filter(q=>q!==p&&q.side===p.side).map(q=>Math.abs(q.at-at)-q.width/2));
    const right=p.at+p.width/2+.99,left=p.at-p.width/2-.99;
    let along=sideSpace(right)>=.83?right:left;
    const width=Math.min(1.64,p.width*.79),over=sideSpace(along)<.65;
    if(over)along=p.at;
    const px=dx?dx*(r.w/2-.56):along,pz=dz?dz*(r.d/2-.56):along;
    const height=over?clearance(r,catalog.get(p.id))+.30:1.77;
    sign(floorGroup,catalog.get(p.id).name,'Gallery',r.x+px,height,r.z+pz,width,Math.atan2(-dx,-dz));
  }
  if(r.lift||r.core){
    const lx=r.lift?10:r.x+r.w*.37,lz=r.lift?-7:r.z+r.d*.35;
    r.liftPoint={x:lx,z:lz};
    const lift=new GalleryMesh();lift.box([lx,1.35,lz],[2.15,2.70,.55],'#37493f');
    for(const dx of [-.47,.47])lift.box([lx+dx,1.28,lz+.29],[.91,2.53,.07],'#87928b');
    lift.box([lx+.85,1.17,lz+.36],[.18,.24,.03],'#e9cb85');
    floorGroup.add(lift.finish());sign(floorGroup,'Elevators','Floor '+(r.level||'LL'),lx,2.98,lz+.34,1.80,0);
  }
  floorGroup.add(host);
  for(const o of floorGroup.children.slice(firstObject))o.userData.roomId=r.id;
  r.built=true;
}
function disposeFloor(){
  const materials=new Set(),textures=new Set();
  const retained=new Set([GalleryMesh.solid,GalleryMesh.colored,GalleryMesh.artSolid,GalleryMesh.artColored,
    ...hallSurfaceMaterials.values(),...caseMaterials.values(),...atriumCache.values()]);
  if(typeof museumSpecimenMaterials!=='undefined')for(const m of museumSpecimenMaterials.values())retained.add(m);
  const retainedImages=new Set([...habitatTextures.values(),...museumMaps.values(),...(typeof museumSpecimenTextures==='undefined'?[]:museumSpecimenTextures.values())]);
  const retainedGeometry=new Set([GalleryMesh.sphere,GalleryMesh.cube,...(typeof museumSpecimenMeshes==='undefined'?[]:museumSpecimenMeshes.values())]);
  floorGroup.traverse(o=>{
    if(o.geometry&&!retainedGeometry.has(o.geometry)&&!o.geometry.userData.permanent)o.geometry.dispose();
    if(o.isInstancedMesh)o.dispose();
    const used=Array.isArray(o.material)?o.material:[o.material];
    for(const m of used)if(m&&!retained.has(m))materials.add(m);
  });
  for(const m of materials){
    for(const t of [m.map,m.bumpMap,m.normalMap,m.roughnessMap,m.emissiveMap,m.alphaMap])if(t&&!retainedImages.has(t))textures.add(t);
    m.dispose();
  }
  for(const tex of textures)tex.dispose();
  labelCache.clear();
  scene.remove(floorGroup);floorGroup=new THREE.Group();scene.add(floorGroup);
  rooms.forEach(r=>{r.built=false;r.backdropsBuilt=false;for(const p of r.ports)p.backdrop=null;});
}
function visibleRooms(r){
  if(!r.built)buildRoom(r);
  if(!r.backdropsBuilt){
    for(const p of r.ports){p.backdrop=doorwayBackdrop(r,p);if(p.backdrop)floorGroup.add(p.backdrop);}
    r.backdropsBuilt=true;
  }
  for(const o of floorGroup.children)o.visible=!o.userData.portal&&(o.userData.roomId===r.id||(o.userData.roseDeck&&(roseUpper(r)||r.id==='terrace')));
}
function changeRoom(r){
  room=r;belowAtriumStair=false;camera.fov=({rose:79,terrace:74,gilder:72,ocean:69,cosmicPath:72,bigBang:72})[r.id]||65;camera.updateProjectionMatrix();needsFrame=true;settleReflectionAt=performance.now()+780;
  if(r.level!==currentFloor){disposeFloor();currentFloor=r.level;}
  visibleRooms(r);
  if(typeof setTerraceGlass==='function')setTerraceGlass(r.id==='terrace',floorGroup);
  $('hallName').textContent=r.display;
  $('floorLabel').textContent=r.level?'Floor '+r.level:'Lower level';
  $('wing').textContent=r.z<-115?'Columbus Avenue':r.x>33?'81st Street':r.x<-65?'77th Street':'Central Park West';
  $('sub').textContent=notes[r.id]||(r.id==='mezzanine'?'The upper balcony of Akeley Hall.':r.stops.map(s=>s.name).slice(0,2).join(' · '));
  const cool=['ocean','rose','universe','cosmicPath','bigBang'].includes(r.id);
  scene.background=new THREE.Color(cool?0x354e5c:0xbfb599);scene.fog=new THREE.FogExp2(scene.background,.008);
  hemi.color.set(cool?0xcde8ff:0xffefd5);sun.color.set(cool?0xd4eaff:0xffe3b8);
  sun.target.position.set(r.x,0,r.z);sun.position.set(r.x-19,26,r.z+14);
  setGalleryLight(r);
  renderer.shadowMap.needsUpdate=true;
}
function visit(r,s=null){
  if(typeof r==='string')r=catalog.get(r);
  changeRoom(r);
  const dest=s||arrivals[r.id]||r.stops[0]||stop(r.name,0,7,0,1.65,-4);
  pos.copy(localToWorld(r,dest.x,0,dest.z));pos.y=1.68;
  if(blocked(r,pos.x,pos.z)){for(const [x,z] of [[8,8],[-8,6],[0,9],[9,0]]){const p=localToWorld(r,x,0,z);if(!blocked(r,p.x,p.z)){pos.x=p.x;pos.z=p.z;break;}}}
  const aim=localToWorld(r,dest.lookX,dest.lookY,dest.lookZ);
  if(r.id==='ocean'){
    const upper=dest.name==='Kelp Forests'||dest===arrivals.ocean;
    pos.y+=upper?0:-oceanDrop*r.sy;aim.y+=upper?0:-oceanDrop*r.sy;
  }
  if(r.id==='forecourt')pos.y+=memorialFloor(pos.z);
  aim.sub(pos);
  yaw=Math.atan2(-aim.x,-aim.z);pitch=Math.atan2(aim.y,Math.hypot(aim.x,aim.z));
  keys.clear();nearest=null;
}
function canMove(x,z){
  const r=room,dx=x-r.x,dz=z-r.z;
  let side=Math.abs(dx)>r.w/2-.25?(dx>0?'east':'west'):Math.abs(dz)>r.d/2-.25?(dz>0?'south':'north'):null;
  if(r.id==='gilder'||r.id==='gilder2'){
    const base=catalog.get('gilder'),lx=(x-base.x)/base.sx,lz=(z-base.z)/base.sz;
    const previousZ=(pos.z-base.z)/base.sz,landing=stairEast-.018;
    if(lx>stairLeft+.08&&lx<stairRight-.08){
      if(r.id==='gilder'&&!belowAtriumStair&&previousZ<landing&&lz>=landing){changeRoom(catalog.get('gilder2'));pos.y=1.68;return true;}
      if(r.id==='gilder2'&&previousZ>=landing&&lz<landing){changeRoom(base);pos.y=1.68+base.sy*atriumStep(lx,lz);return true;}
      if(r.id==='gilder2'&&lz<landing&&z>=-153)return false;
    }
  }
  if(r.id==='gilder'){
    const height=atriumStep(dx/r.sx,dz/r.sz)*r.sy,oldFeet=pos.y-1.68;
    if(belowAtriumStair){
      if(height>0&&height<2.18)return false;
      if(!height)belowAtriumStair=false;
    }else if(oldFeet<.26&&height>2.28){belowAtriumStair=true;}
    else if(Math.abs(height-oldFeet)>.48)return false;
  }
  if(r.id==='ocean'){
    const feet=pos.y-1.68,h=oceanSurface(x,z);
    if(feet> -oceanDrop*r.sy+.28&&Math.abs(h-feet)>.48)return false;
    if(side&&feet<-.48)return false;
  }
  if(r.id==='rose'&&pos.y>2.23){
    const height=rampHeight(x,z),feet=pos.y-1.68;
    if(height===null&&Math.hypot(x-catalog.get('rose').x,z-catalog.get('rose').z)>11*roseScale&&feet>upperDeck-.70){
      const target=catalog.get('cosmicPath');changeRoom(target);pos.y=1.68;return true;
    }
    if(height===null||Math.abs(height-feet)>.55)return false;
  }
  if(roseUpper(r)){
    const height=rampHeight(x,z);
    if(height!==null&&height>upperDeck-.44){changeRoom(catalog.get('rose'));pos.y=height+1.68;return true;}
  }
  if(!side)return !blocked(r,x,z);
  const at=['east','west'].includes(side)?dz:dx;
  if(roseUpper(r)&&((r.id==='bigBang'&&side==='east')||(r.id==='cosmicPath'&&side==='west'))&&Math.abs(dz)<r.d/2-.3){
    const next=Math.abs(dx)>r.w/2?catalog.get(r.id==='bigBang'?'cosmicPath':'bigBang'):r;
    if(blocked(next,x,z))return false;
    if(next!==r)changeRoom(next);return true;
  }
  const p=r.ports.find(p=>p.side===side&&Math.abs(p.at-at)<p.width/2-.28);
  if(!p)return false;
  if(Math.abs(dx)>r.w/2||Math.abs(dz)>r.d/2){const b=catalog.get(p.id);if(blocked(b,x,z))return false;changeRoom(b);}
  return true;
}
// The same sphere and ramp occupy the same plan coordinates on both floors.
function buildRoseDeck(){
  const begin=floorGroup.children.length,base=catalog.get('rose'),lower=roseStructure();lower.scale.setScalar(roseScale);
  lower.position.set(base.x,-upperDeck,base.z);
  floorGroup.add(lower);
  const outline=new THREE.Shape();
  outline.moveTo(41,29);outline.lineTo(99,29);outline.lineTo(99,65);outline.lineTo(41,65);outline.closePath();
  const hole=new THREE.Path();hole.absarc(base.x,-base.z,11*roseScale,0,Math.PI*2,true);outline.holes.push(hole);
  const deck=new THREE.Mesh(new THREE.ShapeGeometry(outline,80),new THREE.MeshStandardMaterial({color:0xbbc1be,side:THREE.DoubleSide}));
  deck.rotation.x=-Math.PI/2;floorGroup.add(deck);
  const lowerFloor=new GalleryMesh();
  lowerFloor.box([base.x,-upperDeck-.1,base.z],[41,.2,36],'#acb6b5');
  for(let i=0;i<96;i++){
    const at=(k,y)=>[base.x+11*roseScale*Math.cos(k*Math.PI/48),y,base.z+11*roseScale*Math.sin(k*Math.PI/48)];
    if(i>=86&&i<=91)continue;
    lowerFloor.rod(at(i,1.15),at(i+1,1.15),.04,.04,'#889899');
    if(i%3===0)lowerFloor.rod(at(i,0),at(i,1.15),.035,.035,'#889899');
  }
  floorGroup.add(lowerFloor.finish());floorGroup.userData.roseDeck=true;
  for(const o of floorGroup.children.slice(begin))o.userData.roseDeck=true;
}
function rampHeight(x,z){
  const base=catalog.get('rose'),dx=(x-base.x)/roseScale,dz=(z-base.z)/roseScale;
  const radius=Math.hypot(dx,dz);
  if(radius<9.59||radius>11.02)return null;
  const t=(Math.atan2(dz,dx)/(2*Math.PI)+1.08)%1;
  return (.09+t*4.7)*roseScale;
}
function gilderBridge(x,z){
  const r=catalog.get('gilder'),lx=(x-r.x)/r.sx,lz=(z-r.z)/r.sz,u=(lx+9)/18;
  const mid=-4.6-lx*.16+.38*Math.sin(2*Math.PI*u);
  return {onDeck:Math.abs(lz-mid)<.91+.25*Math.cos(Math.PI*2*u),height:-.28*Math.sin(Math.PI*u)*r.sy};
}
function updateElevation(){
  if(room.id==='forecourt'){pos.y=1.68+memorialFloor(pos.z);return;}
  if(room.id==='meteorites'){pos.y=1.68+room.sy*meteorStep((pos.x-room.x)/room.sx,(pos.z-room.z)/room.sz);return;}
  if(room.id==='gilder'){pos.y=belowAtriumStair?1.68:1.68+room.sy*atriumStep((pos.x-room.x)/room.sx,(pos.z-room.z)/room.sz);return;}
  if(room.id==='gilder2'){
    const span=gilderBridge(pos.x,pos.z);pos.y=1.68+(span.onDeck?span.height:0);return;
  }
  if(room.id==='ocean'){
    const surface=oceanSurface(pos.x,pos.z);
    if(Math.abs(surface-(pos.y-1.68))<.48)pos.y=surface+1.68;
    return;
  }
  if(room.id!=='rose'){pos.y=1.68;return;}
  const y=rampHeight(pos.x,pos.z),feet=pos.y-1.68;
  if(y!==null&&Math.abs(feet-y)<.55)pos.y=y+1.68;
  else pos.y=1.68;
}
function render(now){
  requestAnimationFrame(render);
  const elapsed=lastFrame?now-lastFrame:16.7,dt=Math.min(.18,elapsed/1000);lastFrame=now;
  if(!$('dialog').open){
    const forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
    const strafe=Number(keys.has('KeyD'))-Number(keys.has('KeyA'));
    yaw+=dt*1.65*(Number(keys.has('ArrowLeft'))-Number(keys.has('ArrowRight')));
    const speed=(keys.has('ShiftLeft')||keys.has('ShiftRight')?8:3.9)*dt/(Math.hypot(forward,strafe)||1);
    const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*strafe)*speed,dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*strafe)*speed;
    const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.18));
    for(let i=0;i<steps&&(dx||dz);i++){
      if(dx&&canMove(pos.x+dx/steps,pos.z))pos.x+=dx/steps;
      if(dz&&canMove(pos.x,pos.z+dz/steps))pos.z+=dz/steps;
      if(steps>1)updateElevation();
    }
  }
  updateElevation();
  const changed=previousRoom!==room||previousYaw!==yaw||previousPitch!==pitch||!previousPosition.equals(pos);
  const redrawReflection=settleReflectionAt&&now>=settleReflectionAt;
  if(room.id==='terrace'&&!reducedMotion.matches&&!document.hidden&&!$('dialog').open&&Math.floor(now/150)!==Math.floor((now-elapsed)/150))needsFrame=true;
  if(changed){
    const continuous=now-lastMotion<450||keys.size>0;lastMotion=now;
    if(quality==='auto'){
      if(continuous&&elapsed>38){slowFrames++;fastFrames=0;}else if(continuous&&elapsed<22){fastFrames++;slowFrames=0;}
      if(slowFrames>=4){movingScale=Math.max(.54,movingScale-.14);slowFrames=0;}
      if(fastFrames>42){movingScale=Math.min(1,movingScale+.12);fastFrames=0;}
      if(resolutionScale!==movingScale)setRenderScale(movingScale);
    }
  }else if(quality==='auto'&&resolutionScale<1&&now-lastMotion>360){setRenderScale(1);}
  if(!changed&&!needsFrame&&!redrawReflection)return;
  if(redrawReflection)settleReflectionAt=0;
  if(changed&&room.id==='rotunda')settleReflectionAt=now+775;
  needsFrame=false;previousRoom=room;previousYaw=yaw;previousPitch=pitch;previousPosition.copy(pos);
  updateLocator();camera.position.copy(pos);camera.rotation.copy(camEuler.set(pitch,yaw,0));camera.updateMatrixWorld();cullBehindWalls();
  if(optics&&quality!=='low'&&!(quality==='auto'&&resolutionScale<.73))optics.draw(scene);else renderer.render(scene,camera);
  let best=null,score=Infinity;
  for(const s of room.stops){
    const v=s.marker.clone().project(camera),d=s.marker.distanceTo(pos);
    if(v.z<0||v.z>1||Math.abs(v.x)>.8||v.y<-.46||v.y>.7||d>17)continue;
    const cost=d+Math.abs(v.x)*7;if(cost<score){best={s,v};score=cost;}
  }
  nearest=best?.s;const hot=$('hotspot');hot.hidden=!best||$('dialog').open;
  if(best){hot.style.left=((best.v.x+1)*50)+'%';hot.style.top=((1-best.v.y)*50)+'%';hot.lastElementChild.textContent=best.s.name;}
  const l=room.liftPoint,near=l&&Math.hypot(l.x-pos.x,l.z-pos.z)<4;
  $('near').textContent=near?'E · Use elevator':'';
}
function startMuseum(){
  try{renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'high-performance'});}
  catch(e){$('loading').querySelector('span').textContent='Enable WebGL 2 or hardware acceleration in your browser to enter the museum.';$('loading').querySelector('i').hidden=true;return;}
  const gl=renderer.getContext(),debugInfo=gl.getExtension('WEBGL_debug_renderer_info');
  if(debugInfo)softwareGraphics=/swiftshader|llvmpipe|software rasterizer/i.test(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.shadowMap.autoUpdate=false;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  prepareLight(renderer,scene);
  optics=museumOptics(renderer,camera);
  function resize(){needsFrame=true;renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();optics?.resize();}
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)needsFrame=true;});
  $('dialog').addEventListener('close',()=>{needsFrame=true;});
  addEventListener('resize',resize);resize();setDetail(quality);visit('rotunda');
  requestAnimationFrame(now=>{render(now);requestAnimationFrame(()=>{$('loading').hidden=true;});});
}
