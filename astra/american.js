// Case numbers and positions follow AMNH's North American Mammals educator
// guide. Convert its diagram to the same room coordinate frame as the atlas.
// A few apertures are offset to leave clearance at contemporary door entries.
const americanCases=[
  [1,'cougar','Cougar',315,356,'left',80],[2,'jaguar','Jaguar',342,432,'left',30],[4,'lynx','Canada lynx and snowshoe hare',342,494,'left',27],
  [6,'beaver','North American beaver',342,555,'left',29],[10,'dall','Dall sheep',342,682,'left',41],
  [11,'grizzly','Grizzly bear',286,456,'up',57],[12,'moose','Moose',251,555,'left',112],[13,'bighorn','Bighorn sheep',286,659,'down',52],
  [14,'caribou','Caribou',285,744,'up',50],[19,'bison','American bison and pronghorn',183,557,'right',112],[20,'muskox','Musk ox',149,659,'down',51],
  [22,'elk','Wapiti (elk)',119,355,'right',80],[23,'deer','White-tailed deer',90,432,'right',31],[25,'coyote','Coyote',90,495,'right',28],
  [26,'skunk','Spotted skunk and ringtail',90,525,'right',25],[27,'wolf','Wolf',90,555,'right',27],[28,'cottontail','Eastern cottontail',90,587,'right',27],
  [29,'blackbear','Black bear',90,617,'right',27],[30,'jackrabbit','Black-tailed and antelope jackrabbits',90,648,'right',27],[31,'goat','Mountain goat',90,682,'right',35],
  [33,'badger','American badger',73,297,'down',14],[34,'squirrel','Abert’s squirrel',89,297,'down',15],[35,'wolverine','Wolverine',106,297,'down',16],
  [37,'marten','American marten',141,297,'down',14],[38,'peccary','Collared peccary',157,297,'down',15],[41,'armadillo','Nine-banded armadillo',211,297,'down',16]
, [3,'western','Western gray squirrel',342,464,'left',27], [5,'sewellel','Sewellel (mountain beaver)',342,525,'left',26],
  [8,'fisher','Fisher and porcupine',342,617,'left',27],[9,'fox','Gray fox and opossum',342,648,'left',27],
  [17,'alaska','Alaska brown bear',216,397,'down',61],[18,'mule','Mule deer',149,456,'up',57],
  [21,'caribou2','Osborn caribou',151,744,'up',49],[43,'ferret','Black-footed ferret',242,297,'down',16]
].sort((a,b)=>a[0]-b[0]).map(([number,key,name,px,py,face,width])=>{
  const normal={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]}[face];
  // The compact service-corridor row is above the main diorama hall.
  const upperRow=number>31;
  const x=upperRow?-10.63+(number-32)*1.44:(px-213)*24/346;
  const z=upperRow?-11.83:(py-530.5)*26/559;
  const size=upperRow?1.29:width*(normal[0]?26/559:24/346);
  return {key,name,number,x,z,dx:normal[0],dz:normal[1],size,height:upperRow?1.44:Math.min(2.68,Math.max(1.48,size*.76)),small:upperRow};
});
const americanStops=americanCases.map(c=>{
  const distance=c.key==='western'?1.49:['jackrabbit','fox'].includes(c.key)?1.62:c.small?1.60:Math.max(2.15,Math.min(3.83,c.size*.75));
  return {name:c.name,x:c.x+c.dx*distance,z:c.z+c.dz*distance,lookX:c.x,lookZ:c.z,lookY:1.02+c.height*.50,
    wallLabel:true,markerLocal:[c.x+c.dx*.10,c.small?.77:c.size>3.5?.44:.61,c.z+c.dz*.10]};
});
function americanBounds(){
  const ranges=americanCases.map(c=>{
    const depth=c.small?.84:Math.min(1.52,c.size*.37);
    return [c.x-c.dx*depth*.5,c.z-c.dz*depth*.5,c.dx?depth:c.size+.08,c.dz?depth:c.size+.08];
  });
  return [...ranges,[0,1.8,.42,2.16],[0,-1.8,.42,2.16],[-5.10,1.37,1.48,6.42],[5.10,1.37,1.48,6.42]];
}
function addAmericanHall(group){
  const frames=new GalleryMesh(),frame='#39352d',gold='#968470',dark='#20241f';
  const direct=(x,z)=>Math.atan2(x,z);
  for(const c of americanCases){
    const item=americanMedia[c.key];if(!item)continue;
    const tangent=[c.dz,-c.dx],side=Math.min(1.5,c.size*.36),w=c.size,h=c.height,low=c.small?.86:w>3.5?.38:.65;
    const at=(u,y,dist)=>[c.x+tangent[0]*u+c.dx*dist,y,c.z+tangent[1]*u+c.dz*dist];
    const box=(u,y,d,sx,sy,sz,col)=>frames.box(at(u,y,d),c.dx?[sz,sy,sx]:[sx,sy,sz],col);
    const depth=item.depth?Uint8Array.from(atob(item.depth),s=>s.charCodeAt(0)):null;
    const nx=96,ny=55,p=[],uv=[],idx=[];
    const displayAspect=(c.dx?w*catalog.get('northMammals').sz:w*catalog.get('northMammals').sx)/(h*catalog.get('northMammals').sy);
    const imageAspect=item.w/item.h,uw=Math.min(1,displayAspect/imageAspect),vh=Math.min(1,imageAspect/displayAspect);
    const dt=(u,v)=>depth?depth[Math.min(79,Math.max(0,Math.round(v*79)))*128+Math.min(127,Math.max(0,Math.round(u*127)))]/255:0;
    for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){
      const a=x/nx,b=y/ny,u=.5+(a-.5)*uw,v=.5+(1-b-.5)*vh;
      const boundary=Math.max(0,1-(2*a-1)**6),level=dt(u,v);
      const z=-side*(.91-.64*level-.12*(2*a-1)**2)*boundary-.035;
      p.push(...at((a-.5)*w,low+b*h,z));uv.push(u,1-v);
      if(x<nx&&y<ny){const i=y*(nx+1)+x;idx.push(i,i+1,i+nx+1,i+1,i+nx+2,i+nx+1);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
    const t=sourceTexture(item),paint=new THREE.MeshBasicMaterial({map:t,color:0xf8f0df,side:THREE.DoubleSide,toneMapped:false});
    group.add(new THREE.Mesh(geo,paint));
    for(const sign of [-1,1]){
      box(sign*(w/2+.047),low+h*.53,-side*.46,.095,h+1.34,side+.16,frame);
      box(sign*(w/2+.021),low+h/2,.016,.038,h+.12,.084,gold);
    }
    box(0,low*.5-.005,-side*.43,w+.09,low,side+.17,dark);
    box(0,low-.032,.027,w+.12,.073,.13,gold);
    box(0,low+h+.056,-side*.39,w+.12,.12,side+.15,frame);
    box(0,1.96,-side-.115,w+.055,3.92,.085,'#242623');
    const top=low+h+.11;box(0,(4.18+top)*.5,-side*.40,w+.13,4.18-top,side+.16,'#292c26');
    const labelWidth=Math.min(1.46,w*.86);const marker=at(0,Math.max(.18,low-.18),.083);
    sign(group,c.name,'Diorama '+String(c.number).padStart(2,'0'),...marker,labelWidth,direct(c.dx,c.dz));
  }
  // Charcoal wall islands and shallow plaster arches form the three aisles.
  // The illuminated windows start just above a dark polished stone plinth.
  const wall='#262923',ceiling='#b2ada0';
  frames.box([0,4.35,0],[23.92,.24,25.92],ceiling);
  for(const side of [-1,1]){
    frames.box([side*5.10,2.08,1.37],[1.48,4.16,6.42],wall);
    for(const z of [-5.69,2.18,7.48])frames.box([side*8.45,4.16,z],[4.40,.20,.27],'#827f72');
  }
  function arch(cx,z,width){
    const spring=2.73,rise=.72,cap=4.22,depth=.42;
    for(let i=0;i<28;i++){
      const t=i*Math.PI/28,t2=(i+1)*Math.PI/28;
      const x0=cx+width*.5*Math.cos(t),x1=cx+width*.5*Math.cos(t2),h0=spring+rise*Math.sin(t),h1=spring+rise*Math.sin(t2);
      for(const side of [-1,1]){const zz=z+side*depth/2;frames.tri([x0,h0,zz],[x1,h1,zz],[x1,cap,zz],wall);frames.tri([x0,h0,zz],[x1,cap,zz],[x0,cap,zz],wall);}
      frames.tri([x0,h0,z-depth/2],[x1,h1,z-depth/2],[x0,h0,z+depth/2],'#494a40');
      frames.tri([x0,h0,z+depth/2],[x1,h1,z-depth/2],[x1,h1,z+depth/2],'#494a40');
    }
  }
  for(const z of [-3.38,5.94])arch(0,z,5.52);
  for(const x of [-6.97,6.97])arch(x,-6.84,5.12);
  const bench=sign=>{const z=sign*1.80;frames.box([0,.29,z],[.42,.10,2.16],'#594633');
    for(const end of [-1,1])frames.box([0,.138,z+end*.79],[.31,.276,.2],'#514a3b');};
  bench(1);bench(-1);
  group.add(frames.finish());
}
