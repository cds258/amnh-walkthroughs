// The two atrium elevations share one wall surface and identical bridge positions.
// Each opening cuts an asymmetric arch through the full thickness of the wall.
const atriumOpenings=[
  [[-10.3,1.2,3.3,3.0,-.34],[-3.8,1.0,3.0,3.3,.17],[4.4,1.5,3.9,3.1,-.35],[11.8,1.4,2.8,3.5,.3],
   [-8.8,6.4,3.75,2.55,.28],[-1.2,7,3.35,2.05,-.62],[7.15,6.2,3.9,2.33,.32],
   [-12.3,11.1,3.75,2.25,-.26],[-4.6,11.6,4.1,2.5,.49],[4.9,11.4,4.03,2.3,-.65],[12,12.1,2.8,2.2,.35]],
  [[-10.3,.85,3.7,3.0,.33],[-4.7,1.65,2.9,3.45,-.33],[.9,1.1,3.05,3.5,.18],[8.7,1.3,4.15,3.35,.32],
   [-10.5,6.55,3.55,2.28,.66],[-2.3,6.3,4.2,2.35,-.41],[6.7,7.2,3.7,2.45,.55],[13.3,7.1,2.8,2.3,-.16],
   [-7.9,11.6,4.6,2.5,-.25],[1.2,11.6,3.75,2.35,.5],[9.7,12.2,3.55,2.45,-.46]]
];
function smoothMax(a,b,k){const h=Math.max(k-Math.abs(a-b),0)/k;return Math.max(a,b)+h*h*k*.25;}
function atriumWallField(x,y,z,side){
  const inner=8.29+.73*Math.sin(z*.31+y*.13+side)+.45*Math.cos(y*.57-z*.21)-.43*Math.exp(-y*.5);
  const t=Math.abs(x)-inner-1.02;
  let d=Math.abs(t)-1.02;
  d=smoothMax(d,Math.max(-.66-y,y-15.45),.42);d=smoothMax(d,Math.abs(z)-12.87,.26);
  if(d>1.1)return d;
  for(const [cz,cy,rx,ry,lean] of atriumOpenings[side>0?1:0]){
    const py=y-cy,pz=z-cz+lean*py;
    if(Math.abs(py)>ry+1.7||Math.abs(pz)>rx+2)continue;
    const wave=.045*Math.sin(2.8*Math.atan2(py/ry,pz/rx)+cz);
    const aperture=(1.-Math.hypot(pz/(rx*.85),py/(ry*.85))+wave)*ry+.22*Math.min(1.8,t*t);
    d=smoothMax(d,aperture,.56);
  }
  return d;
}
function carvedWall(side){
  const step=.225, nx=32,ny=75,nz=118,positions=[],indices=[];
  const width=nx+1,plane=width*(ny+1);
  const scalar=new Float32Array(plane*(nz+1)),cells=new Int32Array(scalar.length).fill(-1);
  const idx=(x,y,z)=>x+width*y+plane*z;
  const originX=side>0?5.1:-12.3,originY=-.92,originZ=-13.22;
  for(let k=0;k<=nz;k++)for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++)
    scalar[idx(i,j,k)]=atriumWallField(originX+i*step,originY+j*step,originZ+k*step,side);
  const offsets=[0,1,width,width+1,plane,plane+1,plane+width,plane+width+1];
  const edges=[[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]];
  for(let k=0;k<nz;k++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
    const id=idx(i,j,k),neg=scalar[id]<0;
    if(offsets.every(o=>(scalar[id+o]<0)===neg))continue;
    let x=0,y=0,z=0,count=0;
    for(const [a,b] of edges){
      const va=scalar[id+offsets[a]],vb=scalar[id+offsets[b]];
      if((va<0)===(vb<0))continue;
      const f=va/(va-vb),dx=(b&1)-(a&1),dy=((b>>1)&1)-((a>>1)&1),dz=(b>>2)-(a>>2);
      x+=(a&1)+dx*f;y+=((a>>1)&1)+dy*f;z+=(a>>2)+dz*f;count++;
    }
    cells[id]=positions.length/3;positions.push(originX+(i+x/count)*step,originY+(j+y/count)*step,originZ+(k+z/count)*step);
  }
  for(let k=1;k<nz;k++)for(let j=1;j<ny;j++)for(let i=1;i<nx;i++){
    const id=idx(i,j,k);
    for(const [axis,u,v] of [[1,width,plane],[width,plane,1],[plane,1,width]]){
      if((scalar[id]<0)===(scalar[id+axis]<0))continue;
      const a=cells[id],b=cells[id-u],c=cells[id-u-v],d=cells[id-v];if(Math.min(a,b,c,d)<0)continue;
      if(scalar[id]<0)indices.push(a,b,c,a,c,d);else indices.push(a,c,b,a,d,c);
    }
  }
  const geo=new THREE.BufferGeometry();geo.setIndex(indices);geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.computeVertexNormals();
  return geo;
}
function gilderSculpture(){
  const group=new THREE.Group(), g=new GalleryMesh();
  const concrete=shotcreteMaterial();
  for(const side of [-1,1]){if(!atriumCache.has(side)){const geo=carvedWall(side);geo.userData.permanent=true;atriumCache.set(side,geo);}
    const m=new THREE.Mesh(atriumCache.get(side),concrete);m.receiveShadow=true;m.castShadow=true;group.add(m);}
  const quad=(a,b,c,d,col)=>{g.tri(a,b,c,col);g.tri(a,c,d,col);};
  makeAtriumSteps(group);roundedAtriumBridges(group,concrete);atriumEnds(group,concrete);
  const outline=new THREE.Shape();outline.moveTo(-12.1,-13.15);outline.lineTo(12.1,-13.15);outline.lineTo(12.1,13.15);outline.lineTo(-12.1,13.15);outline.closePath();
  const skyglass=new THREE.MeshBasicMaterial({color:new THREE.Color(2.5,2.6,2.5),side:THREE.DoubleSide});
  for(const [cx,cz,rx,rz] of [[-3,-5,4.65,4.1],[4.8,3.4,3.8,4.55],[-4.5,8.1,2.4,2.95]]){
    const path=new THREE.Path();path.absellipse(cx,cz,rx,rz,0,2*Math.PI,true,0);outline.holes.push(path);
    const pt=(t,k,y)=>[cx+rx*k*Math.cos(t),y,cz+rz*k*Math.sin(t)];
    for(let i=0;i<72;i++){
      const a=i*Math.PI/36,b=(i+1)*Math.PI/36;
      quad(pt(a,1.01,15.22),pt(b,1.01,15.22),pt(b,.93,15.55),pt(a,.93,15.55),'#e7dac8');
      quad(pt(a,.93,15.55),pt(b,.93,15.55),pt(b,.86,16.38),pt(a,.86,16.38),'#ece3d6');
    }
    const sky=new THREE.Mesh(new THREE.CircleGeometry(1,72),skyglass);sky.rotation.x=Math.PI/2;sky.position.set(cx,16.39,cz);sky.scale.set(rx*.87,rz*.87,1);group.add(sky);
    for(let i=-3;i<=3;i++){const u=i*.24,w=rz*.859*Math.sqrt(1-u*u);g.rod([cx+u*rx*.86,16.35,cz-w],[cx+u*rx*.86,16.35,cz+w],.025,.025,'#9caaa9');}
  }
  const lid=new THREE.Mesh(new THREE.ShapeGeometry(outline,64),concrete);lid.rotation.x=Math.PI/2;lid.position.y=15.22;group.add(lid);
  group.add(g.finish());return group;
}
function meteoriteDisplay(){
  const group=new THREE.Group(),frame=new GalleryMesh();
  const tex=new THREE.TextureLoader().load(sceneImages.iron);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(3,1.55);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
  const iron=new THREE.MeshStandardMaterial({color:0x898783,map:tex,bumpMap:tex,bumpScale:.038,roughness:.79,metalness:.44});
  function mass(x,y,z,sx,sy,sz,seed){
    const geom=new THREE.SphereGeometry(1,140,80),p=geom.attributes.position;
    const signed=(n,p)=>Math.sign(n)*Math.pow(Math.abs(n),p);
    let state=seed;const rand=()=>((state=(state*1664525+1013904223)>>>0)/4294967296);
    const dents=Array.from({length:67},()=>{const u=rand()*2-1,a=rand()*Math.PI*2,r=Math.sqrt(1-u*u);return [r*Math.cos(a),u,r*Math.sin(a),.004+.024*rand()];});
    for(let i=0;i<p.count;i++){
      const u=p.getX(i),v=p.getY(i),w=p.getZ(i);
      let rock=1+.065*Math.sin(3*u+1.7*w+seed)*Math.cos(3.5*v-2.4*u)+.023*Math.sin(10*u-6*v+3*w)+.015*Math.cos(15*w+7*u);
      for(const [a,b,c,range] of dents){const d=1-a*u-b*v-c*w;if(d<range)rock-=.047*(1-d/range)**2;}
      const xx=signed(u,.71)*rock-.065*v,zz=signed(w,.68)*rock+.05*v;
      const yy=signed(v,.57)*rock-.19*xx+.085*zz+.058*Math.sin(4*u+1.3*w);
      p.setXYZ(i,sx*xx,sy*yy,sz*zz);
    }
    geom.computeVertexNormals();const m=new THREE.Mesh(geom,iron);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;group.add(m);
  }
  function base(x,z,w,d){
    frame.box([x,.075,z],[w,.15,d],'#414349');
    frame.box([x,.19,z],[w-.10,.09,d-.10],'#1e2528');
    for(let side of [-1,1])frame.box([x+side*w*.27,.32,z],[w*.12,.28,d*.65],'#303334');
  }
  addMeteorChamber(group);
  base(0,0,3.60,2.02);
  const main=anhSurface(),r=catalog.get('meteorites');
  main.scale.set(1/r.sx,1/r.sy,1/r.sz);main.position.y=.60;group.add(main);
  base(-6.1,-7.4,4.1,2.8);mass(-6.77,1.01,-7.4,.85,.68,.68,52);mass(-5.06,.7,-7.46,.43,.35,.43,61);
  group.add(frame.finish());return group;
}
function roseStructure(){
  const group=new THREE.Group(),shell=new GalleryMesh(),frame=new GalleryMesh();
  addHaydenSphere(shell);addRoseTrusses(frame);addCosmicRamp(frame);
  const aluminum=shell.finish(true);
  for(const m of aluminum.children){
    const mat=m.material.clone();mat.metalness=.48;mat.roughness=.33;mat.envMapIntensity=1.35;m.material=mat;
  }
  group.add(aluminum,frame.finish(true),buildRoseGlass());addRoseDetails(group,aluminum);
  for(let i=0;i<=13;i++){
    const t=i/13.8,a=(t+cosmicRamp.startTurns)*2*Math.PI,r=cosmicRamp.inner+.055;
    const name=i===0?'Present day':i+' billion years ago';
    sign(group,name,'Cosmic Pathway',r*Math.cos(a),.61+cosmicRamp.rise*t,r*Math.sin(a),.85,Math.PI*.5-a);
  }
  return group;
}
