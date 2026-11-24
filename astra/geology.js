const museumMaps=new Map();
function sourceTexture(item){
  if(!museumMaps.has(item.url)){
    const t=new THREE.TextureLoader().load(item.data);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
    museumMaps.set(item.url,t);
  }
  return museumMaps.get(item.url);
}
function meteorStep(x,z){
  const radius=Math.hypot(x/1.09,z);
  return radius<4.86?.56:radius<5.20?.42:radius<5.55?.28:radius<5.9?.14:0;
}
// The silhouette follows the broad, sloping face visible in Cassano's photograph.
// Join it continuously to a narrowing back, referenced from the historic published
// measurements. The other sides use a de-lit, tiled sample of this same iron.
function anhSurface(){
  const outline=[[.105,.161],[.159,.103],[.192,.098],[.238,.112],[.269,.141],[.329,.148],[.37,.145],[.412,.161],[.475,.166],[.518,.188],[.575,.181],[.629,.217],[.695,.235],[.742,.227],[.796,.211],[.824,.227],[.844,.251],[.895,.270],[.917,.307],[.946,.352],[.951,.403],[.929,.451],[.940,.523],[.941,.568],[.923,.614],[.907,.702],[.909,.773],[.879,.840],[.848,.882],[.791,.88],[.733,.868],[.662,.876],[.595,.859],[.487,.867],[.375,.862],[.29,.845],[.205,.846],[.135,.842],[.113,.79],[.103,.737],[.071,.688],[.068,.636],[.060,.584],[.065,.517],[.061,.458],[.069,.402],[.079,.352],[.084,.288],[.085,.216]];
  const geo=new THREE.BufferGeometry(),p=[],uv=[],idx=[],groups=[],n=192,nFront=25,nSide=34,nBack=18;
  const front=sourceTexture(astronomyMedia.ahnFace),fragment=new THREE.TextureLoader().load(sceneImages.iron);
  fragment.wrapS=fragment.wrapT=THREE.RepeatWrapping;fragment.colorSpace=THREE.SRGBColorSpace;fragment.userData.localFloor=true;
  const frontM=new THREE.MeshStandardMaterial({map:front,bumpMap:front,bumpScale:.032,color:0xdad3c7,roughness:.84,metalness:.13,side:THREE.DoubleSide});
  const sideM=new THREE.MeshStandardMaterial({map:fragment,bumpMap:fragment,bumpScale:.055,color:0x817767,roughness:.86,metalness:.18,side:THREE.DoubleSide});
  const xy=(angle,t)=>{
    const k=((angle%1+1)%1)*outline.length,i=Math.floor(k),a=outline[i],b=outline[(i+1)%outline.length],f=k-i;
    const x=.49+(a[0]+(b[0]-a[0])*f-.49)*t,y=.50+(a[1]+(b[1]-a[1])*f-.50)*t;
    return {x:(x-.505)*3.36/.89,y:(.87-y)*2.08/.79,u:x,v:1-y};
  };
  function ring(layer,radius,z,zone,f){
    for(let i=0;i<=n;i++){
      const a=i/n,v=xy(a,radius),side=zone===1,back=zone===2;
      const wave=.051*Math.sin(v.x*5.12-v.y*4.11+z)*Math.cos(v.y*7.07+v.x)+.024*Math.sin(v.y*13.3-v.x*12+z*7.2);
      let x=v.x,y=v.y,depth=z-.13*x+.13*Math.cos(2.34*x+1.43*y)+wave;
      if(side||back){const t=back?1:f;x*=1-.13*t;y+=.07*t*Math.sin(a*6.28);depth+=.075*t*Math.cos(a*18.85+.5);}
      p.push(x,y,depth);
      if(zone===0)uv.push(v.u,v.v);else if(side)uv.push(a*4.6,1-f);else uv.push(v.x*.65,v.y*.65);
    }
    if(layer===0)return;
    const start=idx.length;for(let i=0;i<n;i++){const a=(layer-1)*(n+1)+i,b=a+n+1;idx.push(a,b,a+1,b,b+1,a+1);}
    groups.push([start,idx.length-start,zone===0?0:1]);
  }
  let layer=0;
  for(let i=0;i<=nFront;i++){const f=i/nFront;ring(layer++,Math.max(.0001,f),.83-.25*f*f,0,f);}
  for(let i=0;i<=nSide;i++){const f=i/nSide;ring(layer++,1+.027*Math.sin(Math.PI*f)-.14*f,.58-1.21*f,1,f);}
  for(let i=1;i<=nBack;i++){const f=i/nBack;ring(layer++,Math.max(.0001,.86*(1-f)),-.63-.15*Math.sin(Math.PI*.5*f),2,f);}
  geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
  const frontCount=groups[nFront-1][0]+groups[nFront-1][1];geo.addGroup(0,frontCount,0);geo.addGroup(frontCount,idx.length-frontCount,1);
  const m=new THREE.Mesh(geo,[frontM,sideM]);m.castShadow=m.receiveShadow=true;return m;
}
function addMeteorChamber(group){
  const g=new GalleryMesh(), r=catalog.get('meteorites'),roomH=6.1;
  const mat=(color,roughness=.75,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  const tread=mat(0x837a6b,.55),dark=mat(0x252624,.85),glow=new THREE.MeshBasicMaterial({color:new THREE.Color(2.8,2.58,1.99)});
  const quad=(a,b,c,d,col)=>{g.tri(a,b,c,col);g.tri(a,c,d,col);};
  const cyl=(radius,height,y,material,x=0,z=0)=>{
    const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,100),material);m.position.set(x,y,z);m.receiveShadow=true;group.add(m);return m;
  };
  for(let i=0;i<4;i++){
    const disk=cyl([5.90,5.55,5.20,4.86][i],.14,.07+i*.14,tread);disk.scale.x=1.09;
    const edge=cyl([5.90,5.55,5.20,4.86][i]+.002,.023,.13+i*.14,mat(0xa69c87));edge.scale.x=1.09;
  }
  // The ring of black theatrical tracks casts a pool of light on the iron.
  function ringTrack(radius,y,width,col){
    const m=new THREE.Mesh(new THREE.TorusGeometry(radius,width,7,90),mat(col));m.position.y=y;m.rotation.x=Math.PI*.5;group.add(m);
  }
  for(const rr of [4.4,9.7]){
    ringTrack(rr,roomH-.34,.036,0x363837);
    for(let k=0;k<16;k++){
      const a=(k+.5)*Math.PI/8,x=rr*Math.cos(a),z=rr*Math.sin(a);
      const center=new THREE.Vector3(x,roomH-.48,z),aim=new THREE.Vector3(x*.78,1.38,z*.78).sub(center).normalize();
      const h=new THREE.Mesh(new THREE.CylinderGeometry(.101,.094,.24,10),dark);
      h.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),aim);h.position.copy(center);group.add(h);
      const bulb=new THREE.Mesh(new THREE.CircleGeometry(.071,12),glow);
      bulb.position.copy(center).addScaledVector(aim,.123);bulb.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),aim);group.add(bulb);
    }
  }
  for(const angle of [-2.64,-.64,.73,2.58]){
    const dx=Math.cos(angle),dz=Math.sin(angle),point=(t,y)=>[dx*t*1.09,y,dz*t];
    g.rod(point(6.15,.84),point(4.62,1.57),.041,.041,'#8b816a');
    g.rod(point(5.99,.22),point(5.99,.9),.039,.039,'#676354');g.rod(point(4.79,.56),point(4.79,1.48),.039,.039,'#676354');
  }
  const region=[
    ['Origin of the Solar System','Dust and primitive meteorites','asteroid'],
    ['Building Planets','Iron, rock and planetary interiors','gibeon'],
    ['Meteorite Impacts','Collisions on Earth and the Moon','crater']
  ];
  for(let i=0;i<28;i++){
    const ang=(i+.5)*Math.PI/14,x=10.91*Math.cos(ang),z=11.36*Math.sin(ang);
    // Leave wide gaps on the paths to adjacent galleries, and by Cape York fragments.
    if(r.ports.some(port=>{const [dx,dz]=sideInfo[port.side];
      const lx=dx?dx*12:port.at/r.sx,lz=dz?dz*13:port.at/r.sz;return Math.hypot(x-lx,z-lz)<4.40;}))continue;
    const P=(off,height,radius)=>[(10.91+radius)*Math.cos(ang)-Math.sin(ang)*off,height,(11.36+radius)*Math.sin(ang)+Math.cos(ang)*off];
    const section=Math.floor(i*3/28),color=['#874d39','#9a6646','#745345'][section];
    quad(P(-1.19,.20,.44),P(1.19,.20,.44),P(1.19,2.83,.44),P(-1.19,2.83,.44),color);
    quad(P(-1.19,.22,-.22),P(1.19,.22,-.22),P(1.19,.98,-.22),P(-1.19,.98,-.22),'#4b4640');
    quad(P(-1.19,.98,-.29),P(1.19,.98,-.29),P(1.19,1.02,.30),P(-1.19,1.02,.30),'#a3a699');
    for(const j of [-.72,.04,.74]){
      const sz=.09+.055*Math.cos(i*7+j);g.ell(P(j,1.13,.07),[sz*1.4,sz,sz*1.2],['#7c6c5c','#92918c','#aaa68b'][section]);
    }
    const title=region[section],angle=Math.atan2(-Math.cos(ang),-Math.sin(ang));
    if(i%3===1){
      const loc=P(0,2.13,.39);sign(group,title[0],title[1],...loc,2.23,angle);
    }else{
      const data=(typeof meteorMedia!=='undefined'?meteorMedia[title[2]]:null)||astronomyMedia[title[2]];
      if(data){const m=new THREE.Mesh(new THREE.PlaneGeometry(1.65,1.02),imageMaterial(data));m.position.fromArray(P(0,2.04,.387));m.rotation.y=angle;group.add(m);}
    }
  }
  // A shallow, dark ceiling makes the lighting tracks legible from the entrance.
  g.box([0,roomH+.03,0],[23.95,.12,25.95],'#242624');group.add(g.finish());
}
