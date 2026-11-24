// A low ceiling, dark gallery and pale elevator vestibule let the skull greet
// visitors from beyond the orientation-gallery opening.
function addOrientationHall(host,r){
  const group=new THREE.Group(),batch=new GalleryMesh();group.scale.set(1/r.sx,1/r.sy,1/r.sz);host.add(group);
  const w=r.w,d=r.d,h=5.97,partition=14.12,gap=4.24;
  batch.box([0,h+.055,partition/2-d*.25],[w,.16,d*.5+partition],'#292c2b');
  for(const side of [-1,1]){
    const half=w*.5-gap,center=side*(gap+half*.5);
    batch.box([center,h*.48,partition],[half,h*.96,.42],'#373a37');
    batch.box([center,h*.48,partition+.24],[half,h*.96,.10],'#c4c5b9');
    batch.box([side*(gap+.07),h*.5,partition+.30],[.145,h,.25],'#b5b9b2');
  }
  batch.box([0,h-.068,partition],[2*gap,.14,.47],'#8a8d82');
  const opened=r.ports.filter(p=>p.side==='south');
  let start=-w/2;
  for(const p of [...opened.sort((a,b)=>a.at-b.at),{at:w/2,width:0}]){
    const end=p.at-p.width/2;
    if(end>start)batch.box([(start+end)/2,2.61,d/2-.20],[end-start,5.24,.16],'#bfc5c1');
    start=p.at+p.width/2;
  }
  batch.box([0,.015,(d/2+partition)/2],[w-.19,.028,d/2-partition],'#b8b9b2');
  // Exhibit tracks have separate luminous apertures and black fittings.
  const mat=new THREE.MeshBasicMaterial({color:new THREE.Color(2.2,2.11,1.83)});
  for(const x of [-7.5,7.5]){
    batch.box([x,h-.10,-2.66],[.078,.09,31.5],'#383c39');
    for(let i=0;i<10;i++){
      const z=-17.1+i*3.2,center=new THREE.Vector3(x,h-.28,z),aim=new THREE.Vector3(-Math.sign(x)*.72,-.66,Math.sin(i*.7)*.26).normalize();
      const target=center.clone().addScaledVector(aim,.23);batch.rod(center.toArray(),target.toArray(),.098,.08,'#3d4140');
      const face=new THREE.Mesh(new THREE.CircleGeometry(.060,12),mat);face.position.copy(target).addScaledVector(aim,.002);face.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),aim);group.add(face);
    }
  }
  const research=[['PATAGOTITAN','Patagonia, Argentina','Late Cretaceous'],
    ['SAUROPOD FOSSILS','Como Bluff, Wyoming','Late Jurassic'],['THE FOSSIL HALLS','The vertebrate family tree','Fourth floor']];
  function plate(title,subtitle,kicker){
    const c=document.createElement('canvas');c.width=640;c.height=412;const ctx=c.getContext('2d');
    const grd=ctx.createLinearGradient(0,0,520,340);grd.addColorStop(0,'#165784');grd.addColorStop(1,'#131f33');ctx.fillStyle=grd;ctx.fillRect(0,0,640,412);
    ctx.fillStyle='#ade4ed';ctx.font='600 19px Arial';ctx.fillText(kicker.toUpperCase(),29,48);
    ctx.fillStyle='#f7f2e0';ctx.font='38px Georgia';ctx.fillText(title,28,119,585);ctx.font='25px Georgia';ctx.fillText(subtitle,30,163);
    ctx.strokeStyle='#7fbfc9';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(32,261);ctx.lineTo(204,261);ctx.lineTo(297,312);ctx.lineTo(560,312);ctx.moveTo(207,261);ctx.lineTo(319,215);ctx.lineTo(520,215);ctx.stroke();
    for(const [x,y] of [[32,261],[206,261],[559,312],[520,215]]){ctx.beginPath();ctx.arc(x,y,5,0,6.28);ctx.fill();}
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshBasicMaterial({map:tex,toneMapped:false});
  }
  for(let i=0;i<research.length;i++){
    const x=i===1?-w*.5+.32:w*.5-.32,z=[-9.8,-5.1,7.89][i];
    if(r.ports.some(p=>p.side===(x<0?'west':'east')&&Math.abs(z-p.at)<p.width/2+1.75))continue;
    batch.box([x,2.49,z],[.12,2.22,3.31],'#171e20');
    const m=new THREE.Mesh(new THREE.PlaneGeometry(3.18,2.06),plate(...research[i]));
    m.position.set(x-Math.sign(x)*.075,2.49,z);m.rotation.y=x<0?Math.PI/2:-Math.PI/2;group.add(m);
  }
  // The fossil tree of life continues from here through the vertebrate halls.
  const line=new THREE.Mesh(new THREE.PlaneGeometry(.22,d-.24),new THREE.MeshBasicMaterial({color:0x333536}));
  line.rotation.x=-Math.PI/2;line.position.set(4.91,.047,0);group.add(line);
  // Padded examination mounts on the fossil specimen shelf.
  for(let j=0;j<2;j++){
    const z=-11.4+j*5.0,x=-w*.5+.95;
    batch.box([x,.52,z],[1.77,1.04,4.36],'#46504b');batch.box([x,1.06,z],[1.84,.08,4.45],'#bab9a5');
    if(j===0){
      const p=new THREE.Vector3(x,1.35,z-.99),q=new THREE.Vector3(x+.10,1.48,z+1.14),dir=q.clone().sub(p);
      const points=[[0,.33,.23],[.075,.35,.21],[.20,.22,.13],[.46,.132,.098],[.72,.15,.115],[.89,.248,.16],[.96,.307,.213],[1,.285,.22]];
      for(let k=0;k<points.length-1;k++)for(let i=0;i<30;i++){
        const vertex=(a,i)=>{const [t,rx,ry]=a,u=i*2*Math.PI/30;return [p.x+dir.x*t+rx*Math.cos(u)+.06*Math.sin(t*3.14),p.y+dir.y*t+ry*Math.sin(u),p.z+dir.z*t+.06*Math.cos(2*u)*(t*t)];};
        const a=vertex(points[k],i),b=vertex(points[k],i+1),c=vertex(points[k+1],i+1),e=vertex(points[k+1],i);batch.tri(a,b,c,'#917759');batch.tri(a,c,e,'#927a5b');
      }
      sign(group,'Diplodocus femur','Como Bluff, Wyoming',x+1.0,.85,z,1.20,Math.PI/2);
    }else for(let k=0;k<5;k++){
      const zz=z+(k-2)*.73;batch.ell([x,1.32,zz],[.28,.23,.23],'#8e7759');
      batch.rod([x,1.43,zz],[x+.03,1.95,zz-.10],.104,.055,'#a18b6d');
      for(const side of [-1,1])batch.rod([x,1.53,zz],[x+side*.34,1.48,zz-.08],.08,.049,'#9e876a');
    }
  }
  r.orientationBarriers=[...[-1,1].map(s=>[s*(gap+(w*.5-gap)/2)/r.sx,partition/r.sz,(w*.5-gap)/r.sx,.42/r.sz]),
    ...[-11.4,-6.4].map(z=>[(-w*.5+.95)/r.sx,z/r.sz,1.85/r.sx,4.45/r.sz])];
  group.add(batch.finish(true));
}

// End exhibits on the museum's ornithischian-hall educator plan.
function buildOrnithResearch(parent,r){
  const host=new THREE.Group();host.scale.set(1/r.sx,1/r.sy,1/r.sz);parent.add(host);
  function island(x,z,yaw){
    const o=new THREE.Group();o.position.set(x*r.sx,0,z*r.sz);o.rotation.y=yaw;host.add(o);return o;
  }
  const impact=island(-10.05,7.70,2.12),brass='#737566';
  collectionBox(impact,[0,.12,0],[2.13,.22,1.62],'#77817a');
  collectionBox(impact,[0,.67,-.10],[1.67,.92,.68],'#c6c8b9');
  const earth=new THREE.Mesh(new THREE.SphereGeometry(.67,72,40),new THREE.MeshStandardMaterial({map:sourceTexture(astronomyMedia.earth),roughness:.63,metalness:.08}));
  earth.position.set(-.36,1.63,-.08);earth.rotation.y=-.14;earth.rotation.z=.32;impact.add(earth);
  const marker=new THREE.Mesh(new THREE.TorusGeometry(.031,.011,7,18),new THREE.MeshBasicMaterial({color:0xffbc58}));
  const lon=-89.53*Math.PI/180,lat=21.3*Math.PI/180;
  const normal=new THREE.Vector3(Math.cos(lat)*Math.cos(lon),Math.sin(lat),-Math.cos(lat)*Math.sin(lon));
  marker.position.copy(normal).multiplyScalar(.681);marker.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);earth.add(marker);
  const strata=new GalleryMesh();
  const colors=['#705e4e','#8d7c67','#a19079','#a39176','#b7ad90','#635c52','#ac8c6a','#826c52','#9e8871','#c0ad8c'];
  for(let i=0;i<10;i++){const y=1.0+i*.074;strata.box([.63,y,-.03],[.61+.025*Math.cos(i*2.1),.077,.41+.04*Math.sin(i)],colors[i]);}
  impact.add(strata.finish(true));
  collectionCard(impact,'End-Cretaceous extinction','Impact crater and boundary layer',0,.75,.55,1.65);
  const tree=island(7.87,-6.66,-.47);collectionBox(tree,[0,.18,0],[3.4,.35,1.0],'#8c958b');
  for(const u of [-1.16,1.16])collectionPost(tree,[u,.34,-.04],[u,2.22,-.04],.06,.055,brass);
  collectionBox(tree,[0,1.84,0],[3.25,1.52,.09],'#818e81');
  const c=document.createElement('canvas');c.width=1152;c.height=536;
  const g=c.getContext('2d');g.fillStyle='#e3e9de';g.fillRect(0,0,c.width,c.height);g.fillStyle='#344c3c';g.fillRect(0,0,c.width,99);
  g.fillStyle='#f4f4e7';g.font='49px Georgia';g.fillText('Ornithischian family tree',37,66);
  g.font='27px Arial';g.lineWidth=7;g.strokeStyle='#5f7561';g.fillStyle='#263d31';
  function stem(points){g.beginPath();for(const [i,p] of points.entries())if(i)g.lineTo(...p);else g.moveTo(...p);g.stroke();}
  stem([[60,314],[211,314],[211,216],[440,216]]);stem([[211,314],[211,400],[438,400]]);
  stem([[450,216],[562,216],[562,167],[710,167]]);stem([[562,216],[562,250],[710,250]]);
  stem([[438,400],[566,400],[566,335],[710,335]]);stem([[566,400],[566,429],[710,429]]);
  for(const [word,x,y] of [['Ornithischia',42,302],['Thyreophora',268,202],['Neornithischia',267,386],['Stegosaurs',731,177],['Ankylosaurs',731,260],['Ornithopods',731,345],['Marginocephalians',731,439]])g.fillText(word,x,y);
  const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=4;
  const face=new THREE.Mesh(new THREE.PlaneGeometry(3.17,1.46),new THREE.MeshBasicMaterial({map:tx}));face.position.set(0,1.84,.052);tree.add(face);
}
