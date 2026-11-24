// The central elevation uses a frontal photograph projected onto modeled Ionic
// shafts, capitals, entablatures, parapet and an open barrel-vaulted arch.
const entranceCredits=[
 {title:'American Museum of Natural History – Entrance',artist:'Ajay Suresh',url:'https://commons.wikimedia.org/wiki/File:American_Museum_of_Natural_History_-_Entrance_(48269593036).jpg',license:'CC BY 2.0',licenseUrl:'https://creativecommons.org/licenses/by/2.0/',changes:'The stonework was cropped, retouched and projected onto the exterior geometry. Tree crowns were isolated from the photograph.'},
 {title:'Museo Americano de Historia Natural (2023)',artist:'Alberto-g-rovi',url:'https://commons.wikimedia.org/wiki/File:Museo_Americano_de_Historia_Natural-2023_01.jpg',license:'CC BY 3.0',licenseUrl:'https://creativecommons.org/licenses/by/3.0/',changes:'The Gilder Center entrance banner was cropped and perspective-corrected.'}
];
const memorialFloor=z=>z<=16.2?0:z>=25.17?-3.42:-Math.min(19,Math.ceil((z-16.2)/.472))*.18;
function buildMemorialEntrance(r){
  const parent=new THREE.Group();parent.scale.set(1/r.sx,1/r.sy,1/r.sz);parent.position.set(-r.x/r.sx,0,-r.z/r.sz);
  const g=new GalleryMesh(),lightStone='#c0bbaf',bronze='#454540',project=.0744,frontZ=13.55;
  const xWorld=u=>(u-498)*project,yWorld=v=>(435-v)*project;
  const mat=new THREE.MeshStandardMaterial({map:sourceTexture({url:'entry-stone',data:entranceMedia.stone}),color:0xe5dfd7,roughness:.85,side:THREE.DoubleSide});
  mat.emissiveMap=mat.map;mat.emissive.set(0xffffff);mat.emissiveIntensity=.16;
  const outer=[[185,204],[205,204],[205,185],[268,185],[268,162],[240,136],[255,135],[245,113],[271,112],[271,61],[260,44],[271,44],[271,38],[383,38],[383,34],[409,34],[409,37],[587,37],[587,33],[610,33],[610,37],[712,38],[726,40],[726,45],[732,45],[723,64],[724,111],[752,113],[742,137],[755,137],[728,166],[728,185],[787,185],[787,202],[812,203],[789,221],[789,435],[735,435],[735,438],[255,438],[255,435],[205,435],[205,220]];
  function isInside(x,y){
    let inside=false;for(let i=0,j=outer.length-1;i<outer.length;j=i++){
      const a=outer[i],b=outer[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
    }
    const arch=(x-498)/64,ay=(y-294)/69;
    return inside&&!(Math.abs(arch)<1&&y>223&&(y>294||arch*arch+ay*ay<1));
  }
  const smooth=(a,b,x)=>THREE.MathUtils.smoothstep(x,a,b);
  function relief(u,v){
    let z=.04;
    const tiers=[[34,44,.63],[45,52,.53],[91,96,.27],[110,116,.87],[118,134,.27],[134,140,1.03],[142,148,.52],[150,157,.36],[159,165,.24],[183,191,.14],[420,428,.28],[430,435,.43]];
    for(const [a,b,d] of tiers)z+=d*(smooth(a-1.1,a,v)-smooth(b,b+1.1,v));
    const side=(Math.abs(u-498)>236);if(side)z-=1.06;
    for(const col of [282.9,391.5,603.6,711.6]){
      const rad=12.1+2.2*smooth(200,417,v),q=(u-col)/rad;
      if(Math.abs(q)<1&&v>190&&v<421)z+=(.37+1.35*Math.sqrt(1-q*q))*smooth(190,196,v)*(1-smooth(416,422,v));
      const dx=Math.abs(u-col);
      if(dx<21&&v>110&&v<196)z+=(1-smooth(18,22,dx))*(.61+.27*Math.cos((v-131)*.14));
      if(dx<20&&v>416)z+=(1-smooth(17,21,dx))*.73;
      if(dx<14&&v>44&&v<109)z+=(1-smooth(8,15,dx))*.34;
    }
    const rx=(u-498)/64,ry=Math.min(0,(v-294)/69),s=Math.hypot(rx,ry);
    if(v>203&&v<434)z+=.29*(1-smooth(1.0,1.20,s));
    return z;
  }
  const nx=352,ny=221,positions=[],uv=[],indices=[];
  for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){
    const u=182+634*x/nx,v=31+409*y/ny;
    positions.push(xWorld(u),yWorld(v),frontZ+relief(u,v));uv.push(u/980,1-v/551);
  }
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
    const u=182+634*(x+.5)/nx,v=31+409*(y+.5)/ny;if(!isInside(u,v))continue;const a=y*(nx+1)+x,b=a+nx+1;
    indices.push(a,b,a+1,a+1,b,b+1);
  }
  const shell=new THREE.BufferGeometry();shell.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));shell.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));shell.setIndex(indices);shell.computeVertexNormals();
  const facade=new THREE.Mesh(shell,mat);facade.castShadow=facade.receiveShadow=true;parent.add(facade);
  const quad=(a,b,c,d,col)=>{g.tri(a,b,c,col);g.tri(a,c,d,col);};
  // Solid return faces give the facade volume as the visitor walks past it.
  for(let i=0;i<outer.length;i++){
    const a=outer[i],b=outer[(i+1)%outer.length],A=[xWorld(a[0]),yWorld(a[1]),frontZ+relief(...a)-.02],B=[xWorld(b[0]),yWorld(b[1]),frontZ+relief(...b)-.02];
    quad(A,B,[B[0],B[1],frontZ-3.1],[A[0],A[1],frontZ-3.1],i%3===0?'#a29e92':'#bab4a9');
  }
  const R=64*project,spring=yWorld(294),x0=xWorld(498),face=frontZ+.24;
  for(let j=0;j<56;j++){
    const a=j*Math.PI/56,b=(j+1)*Math.PI/56,pt=(t,z)=>[x0+R*Math.cos(t),spring+69*project*Math.sin(t),z];
    quad(pt(a,face),pt(b,face),pt(b,12.77),pt(a,12.77),j%5?'#a9a49b':'#b4afa5');
  }
  const bannerPts=[],bannerUvs=[];
  for(let j=0;j<64;j++){
    const at=t=>[R*Math.cos(t),spring+69*project*Math.sin(t),13.54],uv=t=>[.5+.5*Math.cos(t),Math.sin(t)];
    const a=j*Math.PI/64,b=(j+1)*Math.PI/64;bannerPts.push(0,spring,13.54,...at(a),...at(b));bannerUvs.push(.5,0,...uv(a),...uv(b));
  }
  const bannerGeo=new THREE.BufferGeometry();bannerGeo.setAttribute('position',new THREE.Float32BufferAttribute(bannerPts,3));bannerGeo.setAttribute('uv',new THREE.Float32BufferAttribute(bannerUvs,2));
  const banner=new THREE.Mesh(bannerGeo,new THREE.MeshBasicMaterial({map:sourceTexture({url:'entry-banner',data:entranceMedia.banner}),side:THREE.DoubleSide}));parent.add(banner);
  for(const side of [-1,1]){
    g.box([side*(R+.063),spring/2,13.14],[.15,spring,.85],lightStone);
    // Bronze screen above the doors and two flank bays leave the center open.
    g.box([side*3.74,2.48,13.15],[1.59,4.96,.18],'#373a35');
    for(let j=0;j<5;j++)g.box([side*(3.03+j*.31),2.42,13.28],[.047,4.49,.06],'#777365');
  }
  g.box([0,7.79,13.22],[9.24,4.96,.13],'#3c403c');
  for(let j=-15;j<=15;j++){
    const x=j*.30;g.box([x,7.54,13.33],[.03,4.49,.04],'#76756b');
    for(let k=0;k<4;k++){
      const y=5.47+k*1.02;g.rod([x,y,13.36],[x+.147,y+.43,13.36],.016,.016,'#938976');g.rod([x+.147,y+.43,13.36],[x,y+.86,13.36],.016,.016,'#938976');
    }
  }
  g.box([0,5.19,13.29],[9.29,.18,.22],bronze);
  // Neighboring museum wings and the long stone terrace flank the triumphal arch.
  for(const side of [-1,1]){
    const start=20.66,end=72;
    g.box([side*(start+end)/2,8.63,11.36],[end-start,17.26,2.8],'#b6a797');
    for(let floor=0;floor<3;floor++){
      for(let i=0;i<16;i++){
        const x=side*(22+i*3.13),y=2.47+floor*4.82;
        g.box([x,y,12.81],[2.05,3.35,.24],'#bcae9f');g.box([x,y,13.01],[1.65,2.9,.17],'#566363');
        g.box([x,y,13.14],[.073,2.89,.065],'#b6b5a9');g.box([x,y+.31,13.14],[1.64,.072,.065],'#b6b5a9');
        g.box([x,y-1.73,13.03],[2.29,.17,.49],'#d1c3b1');
      }
    }
    for(const y of [5,9.94,15.13,16.77,17.18])g.box([side*(start+end)/2,y,12.9],[end-start,.18,.72],'#cbbb9e');
  }
  g.box([0,-.16,14.57],[92,.32,3.29],'#bbb7a8');
  for(let i=0;i<19;i++){
    const z=16.2+(i+.5)*.472,h=3.42-(i+1)*.18;
    if(h>.002)g.box([0,-3.42+h*.5,z],[84,h,.477],i%3?'#ada99e':'#b5b1a3');
    g.box([0,-(i+1)*.18-.003,z-.214],[84,.034,.048],'#ccccba');
  }
  for(const x of [-18.3,-7.75,7.75,18.3]){
    g.rod([x,.91,15.82],[x,.91,16.2],.036,.036,bronze);
    g.rod([x,.91,16.2],[x,-2.52,25.2],.036,.036,bronze);
    for(let i=0;i<=7;i++){const z=16.2+i*8.94/7;g.rod([x,memorialFloor(z),z],[x,.91-i*3.42/7,z],.029,.029,bronze);}
  }
  g.box([0,-3.53,29.6],[94,.21,9.03],'#a7a8a4');
  g.box([0,-3.6,41.86],[112,.21,15.5],'#5e6467');
  g.box([0,-3.51,53.8],[112,.20,8.5],'#a4a6a0');
  for(let i=-7;i<=7;i++){
    const x=i*3.09;g.box([x,-3.408,29.52],[.019,.01,8.74],'#6d716c');
  }
  for(const z of [26.9,28.96,31.02,33.13])g.box([0,-3.405,z],[94,.012,.019],'#767b74');
  for(let i=0;i<11;i++)g.box([0,-3.484,34.60+i*1.35],[4.52,.013,.46],'#d9d7c8');
  for(const x of [-28,-17,17,28])g.box([x,-3.481,42.03],[5.3,.013,.078],'#d5c99f');
  for(const z of [34.08,49.59])g.box([0,-3.47,z],[100,.22,.23],'#a8a8a0');
  for(const x of [-20.7,20.7,-36,36])lantern(x,33.52);
  function lantern(x,z){
    const y=-3.41;
    g.rod([x,y,z],[x,y+.23,z],.35,.23,bronze);g.rod([x,y+.23,z],[x,y+1.11,z],.20,.086,bronze);
    g.rod([x,y+.95,z],[x,y+5.05,z],.10,.068,bronze);
    g.rod([x,y+5.02,z],[x,y+5.24,z],.11,.26,bronze);g.rod([x,y+5.22,z],[x,y+6.1,z],.257,.233,'#f2d9a4');
    for(let k=0;k<6;k++){const a=k*Math.PI/3;g.rod([x+.249*Math.cos(a),y+5.22,z+.249*Math.sin(a)],[x+.225*Math.cos(a),y+6.1,z+.225*Math.sin(a)],.024,.024,bronze);}
    g.rod([x,y+6.1,z],[x,y+6.33,z],.285,.075,bronze);g.ell([x,y+6.35,z],[.068,.078,.068],bronze);
  }
  const crown=sourceTexture({url:'entry-tree',data:entranceMedia.crown});
  const leaves=new THREE.MeshBasicMaterial({map:crown,alphaTest:.40,side:THREE.DoubleSide,color:0xc5c7a4});
  for(const side of [-1,1])for(let i=0;i<5;i++){
    const x=side*(25.7+i*7.41),z=16.57+(i%2)*1.5,ground=memorialFloor(z);
    const h=8.4+1.2*Math.sin(i*1.7+side);
    g.rod([x,ground,z],[x+.2,h*.74,z],.215,.12,'#726554');
    for(let k=0;k<5;k++){
      const a=k*2.39+.7*i,gx=x+Math.cos(a)*1.67,gz=z+Math.sin(a)*1.24;
      g.rod([x,h*.4,z],[gx,h*.81,gz],.099,.035,'#726554');
      const m=new THREE.Mesh(new THREE.PlaneGeometry(6.55+i%2,5.43+i%2),leaves);m.rotation.y=a*.6;m.position.set(gx,h*.82+.52*Math.sin(a),gz);parent.add(m);
    }
  }
  sign(parent,'Theodore Roosevelt Memorial','Central Park West',5.38,.93,16.05,1.45,0);
  parent.add(g.finish(true));return parent;
}
