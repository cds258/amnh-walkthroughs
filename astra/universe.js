// The four exhibition zones and meteorite follow AMNH's Cullman educator plan.
// Coordinates here are metres from the centre of the lower-level gallery.
const universeStations=[
  ['Willamette Meteorite',-1.85,4.90,-3.15,1.76,.5],
  ['Astro Bulletin',14.8,1.70,19.1,2.32,.10],
  ['Ecosphere',10.55,4.50,11.75,1.35,2.40],
  ['Interacting galaxies',-14.30,-8.20,-17.1,2.18,-12.25],
  ['Our star, the Sun',.1,-9.7,2.85,1.82,-13.22]
];
function universeStops(){
  const sx=54/24,sz=55/26,sy=1.65;
  return universeStations.map(([name,x,z,a,b,c])=>({name,x:x/sx,z:z/sz,lookX:a/sx,lookY:b/sy,lookZ:c/sz}));
}
function willametteIron(){
  const photo=sourceTexture(universeMedia.willFace),tiled=new THREE.TextureLoader().load(sceneImages.iron);
  tiled.colorSpace=THREE.SRGBColorSpace;tiled.wrapS=tiled.wrapT=THREE.RepeatWrapping;
  const shell=new THREE.BufferGeometry(),verts=[],uv=[],ind=[],sectors=144;
  const outline=[[.081,.904],[.035,.859],[.031,.806],[.015,.74],[.012,.665],[.032,.63],[.071,.581],[.063,.532],[.077,.50],[.096,.483],[.126,.482],[.123,.443],[.133,.404],[.152,.384],[.153,.354],[.176,.323],[.221,.300],[.278,.289],[.318,.273],[.326,.252],[.375,.238],[.393,.214],[.45,.203],[.487,.191],[.515,.183],[.552,.181],[.588,.173],[.615,.167],[.646,.170],[.694,.148],[.721,.150],[.768,.153],[.774,.172],[.803,.174],[.815,.186],[.860,.201],[.873,.223],[.902,.251],[.915,.310],[.913,.368],[.888,.376],[.87,.373],[.866,.421],[.846,.459],[.806,.497],[.795,.567],[.774,.617],[.732,.64],[.71,.657],[.677,.684],[.641,.699],[.592,.711],[.553,.723],[.508,.749],[.479,.784],[.441,.834],[.39,.853],[.32,.869],[.24,.89],[.172,.902]];
  const pits=[[.54,.26,.043],[.74,.22,.05],[.68,.29,.051],[.42,.33,.092],[.53,.32,.05],[.833,.34,.055],[.70,.415,.099],[.53,.43,.084],[.39,.44,.058],[.273,.40,.104],[.30,.55,.082],[.39,.668,.105],[.48,.64,.057],[.57,.60,.061],[.65,.55,.11],[.16,.58,.081],[.15,.725,.096],[.20,.799,.076],[.40,.56,.044],[.75,.31,.024],[.36,.287,.025],[.56,.20,.024],[.28,.489,.028],[.60,.698,.035]];
  function frontPoint(u,v){
    const side=Math.min(1,Math.max(0,(.89-v)/.74));let z=.44+.13*side+.07*Math.cos(v*19+u*8.2);
    for(const [a,b,r] of pits){const d=Math.hypot((u-a)/r,(v-b)/(r*.8));if(d<1)z-=.39*(1-d*d)**1.6;}
    return z+.025*Math.sin(u*75)*Math.cos(v*71);
  }
  const ring=(k,f,depth)=>{
    for(let j=0;j<=sectors;j++){
      const t=(j%sectors)/sectors*outline.length,i=Math.floor(t),a=outline[i],b=outline[(i+1)%outline.length],mix=t-i;
      const u=.485+((a[0]+(b[0]-a[0])*mix)-.485)*f,v=.50+((a[1]+(b[1]-a[1])*mix)-.50)*f;
      const rr=frontPoint(u,v),z=depth<0?rr:.5*(1-depth)+(-.73+.08*Math.sin(t*.71)+.045*Math.sin(t*2.7))*depth;
      verts.push((u-.49)*2.45,(.904-v)*3.85+.16,z);
      if(depth<0)uv.push(u,1-v);else uv.push(j/sectors*4.0+depth*.21,(1-depth)*1.6+f);
    }
    if(k)for(let j=0;j<sectors;j++){const a=(k-1)*(sectors+1)+j,b=a+sectors+1;ind.push(a,b,a+1,b,b+1,a+1);}
  };
  let k=0;for(let n=0;n<=42;n++)ring(k++,Math.max(.0001,n/42),-1);
  const faceCount=ind.length;
  for(let n=0;n<=18;n++){const t=n/18;ring(k++,1-.11*t+.10*Math.sin(Math.PI*t),t);}
  for(let n=1;n<=22;n++){const t=n/22;ring(k++,Math.max(.0001,.89*(1-t)),1+.15*Math.sin(t*Math.PI/2));}
  shell.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));shell.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));shell.setIndex(ind);shell.computeVertexNormals();
  shell.addGroup(0,faceCount,0);shell.addGroup(faceCount,ind.length-faceCount,1);
  const m=new THREE.Mesh(shell,[new THREE.MeshStandardMaterial({map:photo,roughness:.83,metalness:.13,side:THREE.DoubleSide}),new THREE.MeshStandardMaterial({map:tiled,color:0x6f6661,bumpMap:tiled,bumpScale:.05,roughness:.77,metalness:.28,side:THREE.DoubleSide})]);m.castShadow=m.receiveShadow=true;return m;
}
function buildUniverse(host,r){
  const group=new THREE.Group();group.scale.set(1/r.sx,1/r.sy,1/r.sz);host.add(group);
  const batch=new GalleryMesh(),blocks=[],metal='#9dabae',slate='#46545a',white='#e4e7e0',navy='#202a35';
  const mark=(x,z,w,d)=>blocks.push([x/r.sx,z/r.sz,w/r.sx,d/r.sz]);
  function disc(x,y,z,radius,thick,col){
    const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,thick,64),new THREE.MeshStandardMaterial({color:col,roughness:.61}));m.position.set(x,y,z);m.receiveShadow=true;group.add(m);return m;
  }
  function curve(x,y,z,rad,tube,col,start=0,end=2*Math.PI){
    const m=new THREE.Mesh(new THREE.TorusGeometry(rad,tube,8,80,end-start),new THREE.MeshStandardMaterial({color:col,roughness:.39,metalness:.59}));
    m.position.set(x,y,z);m.rotation.set(-Math.PI/2,0,start);group.add(m);
  }
  function panel(x,z,w,h,y,angle,item,title){
    const card=new THREE.Group();card.position.set(x,y,z);card.rotation.y=angle;group.add(card);
    const edges=new GalleryMesh();edges.box([0,0,-.055],[w+.13,h+.13,.12],slate);
    const tex=sourceTexture(item);
    const face=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,color:0xf6f3ee,toneMapped:false}));card.add(edges.finish(),face);
    if(title)sign(card,title,'Rose Center for Earth and Space',0,-h*.56,.06,Math.min(w,3.92),0);
  }
  // Brushed metal floor railing around the pitted iron mass. The public can
  // approach the east end without intersecting the exhibit.
  const mx=-3.15,mz=.5,iron=willametteIron();iron.position.set(mx,.10,mz);group.add(iron);
  disc(mx,.047,mz,2.35,.094,0x8a8c78);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2,x=mx+Math.cos(a)*2.35,z=mz+Math.sin(a)*2.35;batch.rod([x,.04,z],[x,.73,z],.031,.031,metal);}
  curve(mx,.72,mz,2.35,.043,0x9ea7a2);mark(mx,mz,4.64,4.64);
  // The coffered circular ceiling and curved galleries surround the meteorite.
  for(const radius of [9.8,16.6]){curve(0,6.55,-.6,radius,.40,0xc5ccc8);curve(0,6.05,-.6,radius,.064,0xc0cfd1);}
  const ceiling=new THREE.Mesh(new THREE.RingGeometry(1.65,20.8,124,3),new THREE.MeshStandardMaterial({color:0xe1e7e3,roughness:.85,side:THREE.DoubleSide}));ceiling.position.set(0,6.85,-.6);ceiling.rotation.x=Math.PI/2;group.add(ceiling);
  for(let i=0;i<28;i++){const a=i*Math.PI/14,x=Math.cos(a),z=Math.sin(a);
    batch.rod([x*2.05,6.8,-.6+z*2.05],[x*20.3,6.8,-.6+z*20.3],.033,.055,metal);
    const at=[x*9.9,6.12,-.6+z*9.9];batch.ell(at,[.13,.055,.13],'#ffedd0');}
  for(const [x,z] of [[-16,-12],[16,-12],[-16,11],[16,11]]){batch.rod([x,0,z],[x,6.80,z],.20,.32,metal);mark(x,z,.44,.44);}
  const astro=universeMedia.astro,gal=universeMedia.galaxy;
  batch.box([19.23,2.56,.1],[.48,5.12,7.18],navy);mark(19.23,.1,.5,7.2);
  panel(18.94,.1,4.11,2.32,2.52,-Math.PI/2,astro,'Astro Bulletin');
  panel(-17.1,-12.25,5.62,2.81,2.51,.56,gal,'Interacting galaxies');
  panel(-11.30,13.00,6.00,3.00,2.56,2.49,astro,'The observable universe');
  function island(x,z,w,h,item,title){
    const k=new GalleryMesh();k.box([0,.61,0],[w,.99,1.51],slate);k.box([0,1.17,0],[w+.18,.10,1.67],metal);k.box([0,1.97,-.30],[w,1.60,.23],navy);
    const pod=k.finish();pod.position.set(x,0,z);group.add(pod);if(item)panel(x,z-.15,w-.15,1.35,2.0,0,item,title);
    mark(x,z,w+.3,1.72);
  }
  island(2.85,-13.22,4.8,2.1,universeMedia.sun||gal,'Our star, the Sun');
  island(3.64,12.60,4.50,2.1,universeMedia.nebula||astro,'Formation of planetary systems');
  // One-metre sealed glass habitat and its planted living volume.
  const ex=11.75,ez=2.40;disc(ex,.48,ez,.63,.96,0x768080);disc(ex,1.06,ez,.55,.14,0x9fa99f);
  const globe=new THREE.Mesh(new THREE.SphereGeometry(.505,36,26),new THREE.MeshPhysicalMaterial({color:0xaed3bf,transparent:true,opacity:.28,roughness:.10,metalness:.13,clearcoat:1,depthWrite:false}));globe.position.set(ex,1.59,ez);group.add(globe);
  batch.ell([ex,1.27,ez],[.38,.115,.38],'#85806b');for(let i=0;i<37;i++){const a=i*2.399,radius=.31*Math.sqrt(i/37),x=ex+Math.cos(a)*radius,z=ez+Math.sin(a)*radius;batch.rod([x,1.29,z],[x+.085*Math.sin(a),1.48+.24*Math.abs(Math.cos(i*8)),z],.021,.008,i%2?'#656e43':'#6e805a');}
  mark(ex,ez,1.22,1.22);group.add(batch.finish(true));r.universeBlocks=blocks;
}
