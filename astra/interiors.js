// Casework and furniture are measured in world metres, independently of each
// gallery's plan aspect ratio. Place them on uninterrupted stretches of wall.
const roomFitOuts={
  cafe1:'cafe',cafe4:'cafe',foodCourt:'cafe',schoolLunch:'cafe',restaurant:'cafe',
  shop1:'shop',shop2:'shop',dinoStore:'shop',cosmicShop:'shop',giftShop:'shop',invisibleShop:'shop',
  giantScreen:'cinema',programs:'cinema',library:'library',invisible:'cinema',
  collections1:'cabinet',collections2:'cabinet',collections3:'cabinet',gems:'geology',
  planetEarth:'geology',universe:'astronomy',scales:'astronomy',
  cityBirds:'bird',birdsNA:'bird',worldBirds:'bird',reptiles:'reptile',butterflies:'forest',
  nyEnvironment:'forest',forests:'forest',biodiversity:'ecology',discovery:'ecology',
  ornith:'fossil',titan:'fossil',primitive:'fossil',advanced:'fossil',vertebrates:'fossil',
  northMammals:'zoology',nyMammals:'zoology',smallMammals:'zoology',primates:'zoology',
  asianMammals:'zoology',northwest:'culture',asianPeoples:'culture',africanPeoples:'culture',
  mexico:'culture',southAmerican:'culture',pacific:'culture',humanOrigins:'culture',
  terrace:'terrace',garage1:'garage',parkingLL:'garage',insectarium:'ecology',alcove:'archive'
};
const fitPalette={
  cafe:['#d8caba','#c4ad91','#bda481'],shop:['#c7c4ae','#756450','#b4a890'],
  library:['#ded4bd','#a08a68','#bcab8b'],cabinet:['#a7b4aa','#6d776d','#a8aaa0'],
  cinema:['#413e3d','#605449','#635a56'],astronomy:['#535e69','#8e989b','#738087'],
  geology:['#555855','#918a72','#807e73'],forest:['#a49f82','#c4b69a','#aba089'],
  ecology:['#b8b6a0','#b5b29b','#a8aa98'],bird:['#b8b9a2','#d0c5a9','#b7ac94'],
  fossil:['#dad6c5','#b5a991','#bcafa1'],culture:['#b5a48f','#725e47','#ae9a7d'],
  zoology:['#aba28c','#ac9b7b','#aa9c82'],garage:['#9eaaa9','#7e8988','#858b89']
};
const caseMaterials=new Map();
function imageMaterial(item){
  if(!caseMaterials.has(item.url)){
    const tex=new THREE.TextureLoader().load(item.data);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
    const material=new THREE.MeshStandardMaterial({map:tex,roughness:.82,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:.14});
    caseMaterials.set(item.url,material);
  }
  return caseMaterials.get(item.url);
}
function addGalleryInterior(host,r){
  if(r.id==='titan'){addOrientationHall(host,r);return;}
  if(architectural.has(r.id)||roseZone(r)||['gilder','gilder2','meteorites','akeley','mezzanine','northMammals','terrace','forecourt','universe','ornith'].includes(r.id))return;
  const type=roomFitOuts[r.id]||'passage',group=new THREE.Group(),batch=new GalleryMesh();
  group.scale.set(1/r.sx,1/r.sy,1/r.sz);host.add(group);
  const w=r.w,d=r.d,wood='#765a42',oak='#ad8963',bronze='#726757',metal='#6c7169';
  const seed=r.id.split('').reduce((v,c)=>(v*31+c.charCodeAt(0))>>>0,7);let state=seed;
  const rand=()=>((state=Math.imul(1664525,state)+1013904223>>>0)/4294967296);
  const units=[],blocks=[],where=(side,at,ins,y)=>{
    const [dx,dz]=sideInfo[side];return [dx?dx*(w/2-ins):at,y,dz?dz*(d/2-ins):at];
  };
  const box=(side,at,ins,y,len,dep,h,col)=>{const dx=sideInfo[side][0];batch.box(where(side,at,ins,y),dx?[dep,h,len]:[len,h,dep],col);};
  const block=(side,at,ins,len,dep)=>{const [x,,z]=where(side,at,ins,0),dx=sideInfo[side][0];blocks.push([x/r.sx,z/r.sz,(dx?dep:len)/r.sx,(dx?len:dep)/r.sz]);};
  const image=(side,at,ins,y,width,height,item)=>{
    const m=new THREE.Mesh(new THREE.PlaneGeometry(width,height),imageMaterial(item)),[dx,dz]=sideInfo[side];
    m.position.fromArray(where(side,at,ins,y));m.rotation.y=Math.atan2(-dx,-dz);group.add(m);
  };
  for(const [side,[dx]] of Object.entries(sideInfo)){
    const limit=(dx?d:w)/2;
    let previous=-limit+1.3;
    const spans=r.ports.filter(p=>p.side===side).map(p=>[p.at-p.width/2-1.15,p.at+p.width/2+1.15]).sort((a,b)=>a[0]-b[0]);
    for(const [next,end] of [...spans,[limit-1.3,limit]]){
      const length=next-previous;
      if(length>3.4)units.push({side,at:(next+previous)/2,length});
      previous=Math.max(previous,end);
    }
  }
  function bench(side,at,ins,len=2.6){
    for(let i=0;i<6;i++)box(side,at,ins+(i-2.5)*.095,.47,len,.08,.065,oak);
    for(const end of [-1,1]){
      box(side,at+end*(len/2-.29),ins,.24,.085,.42,.44,bronze);
      box(side,at+end*(len/2-.29),ins,.040,.31,.54,.07,bronze);
    }
    block(side,at,ins,len,.51);
  }
  function bookcase(side,at,len,high,kind='books'){
    const tiers=kind==='archive'?7:kind==='shop'?4:6,h=high/tiers;
    const back=kind==='archive'?'#74796f':wood;
    box(side,at,.34,high/2,len,.48,high,back);
    for(let i=0;i<=tiers;i++)box(side,at,.58,i*h+.05,len+.12,.48,.082,oak);
    for(const a of [-1,1])box(side,at+a*len/2,.55,high/2,.10,.53,high,oak);
    const palette=kind==='shop'?['#688a84','#c8b47c','#9b6958','#d5c6a7','#676c77']:['#766644','#747962','#7a5244','#a48a67','#4c5e57','#89765b'];
    for(let row=0;row<tiers;row++){
      let x=at-len/2+.13;
      while(x<at+len/2-.15){
        const width=kind==='archive'?.29+rand()*.24:kind==='shop'?.21+rand()*.26:.075+rand()*.11;
        if(x+width>at+len/2-.12)break;
        const height=(h-.14)*(.74+rand()*.24),k=palette[Math.floor(rand()*palette.length)],y=row*h+.10;
        box(side,x+width/2,.65,y+height/2,width-.012,.24,height,k);
        if(kind!=='shop')box(side,x+width/2,.775,y+height*.67,width*.74,.013,kind==='archive'?.065:.018,kind==='archive'?'#c8c4a5':'#bca578');
        x+=width+(kind==='shop'?.10:rand()*.032);
      }
    }
    block(side,at,.46,len,.92);
  }
  function table(side,at,ins,cafe=true){
    const len=cafe?1.50:2.45,dep=cafe?.92:1.08;
    box(side,at,ins,.76,len,dep,.085,oak);
    for(const end of [-1,1]){
      box(side,at+end*len*.36,ins,.38,.075,dep*.73,.74,metal);
      for(const j of [-1,1]){
        const x=at+end*len*.26,z=ins+j*(dep*.5+.35);
        box(side,x,z,.45,.42,.43,.065,cafe?wood:'#596856');
        box(side,x,z+j*.19,.67,.42,.055,.44,wood);
        for(const l of [-1,1])box(side,x+l*.16,z,.22,.05,.31,.42,bronze);
      }
    }block(side,at,ins,len,dep+.95);
  }
  const diagrams={bird:['birds','marineBirds'],forest:['trees','moss'],ecology:['marine','trees','moss'],reptile:['reptiles'],archive:['marine','reptiles','trees']};
  units.sort((a,b)=>b.length-a.length);
  let num=0;
  for(const {side,at,length} of units){
    if(type==='library'||type==='shop'||type==='cabinet'){
      const bays=Math.min(7,Math.floor(length/2.05));
      for(let i=0;i<bays;i++)bookcase(side,at+(i-(bays-1)/2)*2.05,1.99,(type==='library'?4.4:type==='cabinet'?3.10:2.22),type==='cabinet'?'archive':type==='shop'?'shop':'books');
      if((type==='library'||type==='shop')&&num<2&&length>8)table(side,at,3.05,false);
    }else if(type==='cafe'){
      const count=Math.min(6,Math.floor(length/3.0));
      for(let i=0;i<count;i++)table(side,at+(i-(count-1)/2)*3.05,2.12);
    }else if(diagrams[type]&&typeof naturalPrints!=='undefined'){
      const keys=diagrams[type],count=Math.min(3,Math.floor((length+.1)/4.1));
      for(let i=0;i<count;i++){
        const data=naturalPrints[keys[(i+num)%keys.length]];if(!data)continue;
        const h=2.09,wide=h*data.width/data.height,offset=at+(i-(count-1)/2)*3.8;
        box(side,offset,.23,2.12,wide+.25,.13,h+.28,wood);box(side,offset,.31,2.12,wide+.15,.047,h+.18,'#efe3c5');
        image(side,offset,.343,2.12,wide,h,data);
        box(side,offset,.50,3.62,.69,.28,.06,'#696756');
      }
      if(num<2&&length>7)bench(side,at,2.9);
    }else if(type==='fossil'){
      const panelW=Math.min(length-.42,11);
      // Clerestory with deep stone reveals and narrow steel-framed lights.
      const count=Math.max(1,Math.floor(panelW/2.05));
      for(let i=0;i<count;i++){
        const x=at+(i-(count-1)/2)*2.12,y=5.95*r.sy;
        box(side,x,.26,y,1.92,.32,2.35,'#b1a994');box(side,x,.44,y,1.68,.04,2.10,'#c7d6d5');
        box(side,x,.48,y,.055,.05,2.09,'#7f8781');box(side,x,.48,y+.16,1.69,.05,.048,'#7f8781');
      }
      box(side,at,.38,4.72*r.sy,Math.min(length,panelW+.23),.59,.13,'#c0b6a0');
      if(num<2&&length>6)bench(side,at,1.4);
    }else if(type==='culture'||type==='zoology'||type==='geology'){
      // Fitted storage for study samples below the display rail.
      const n=Math.min(4,Math.floor(length/2.28));
      for(let i=0;i<n;i++){
        const x=at+(i-(n-1)/2)*2.25;box(side,x,.49,.51,2.20,.9,.94,'#796951');
        for(let j=0;j<3;j++){
          box(side,x,.953,.23+j*.275,2.12,.055,.243,'#927a59');box(side,x,.997,.27+j*.275,.24,.045,.034,'#b4a484');
        }
        box(side,x,.55,1.02,2.23,1.02,.065,'#b3a98f');block(side,x,.50,2.22,1.04);
      }
      if(num===0&&length>8)bench(side,at,3.06);
    }else if(type==='passage'&&num<2&&length>6){
      bench(side,at,.96);
    }
    num++;
  }
  if(type==='cinema'&&units.length){
    const wall=units[0],side=wall.side,at=wall.at;
    const width=Math.min(wall.length*.78,12),depth=sideInfo[side][0]?w:d;
    box(side,at,.25,3.1,width+.46,.31,4.47,'#353b3d');box(side,at,.45,3.1,width,.065,4.05,'#b7bfba');
    const rows=Math.min(6,Math.floor((depth-7)/1.35)),each=Math.min(5,Math.floor((width-1)/1.38));
    for(let i=0;i<rows;i++)for(let j=-each;j<=each;j++){
      if(j===0)continue;const x=at+j*.68+Math.sign(j)*.25,z=4.1+i*1.35;
      box(side,x,z,.43,.61,.62,.18,'#835b52');box(side,x,z+.24,.78,.60,.15,.72,'#755346');
      box(side,x,z,.21,.30,.40,.43,'#4c4c49');block(side,x,z,.64,.74);
    }
  }
  if(type==='garage'){
    for(let i=-3;i<=3;i++)batch.box([i*3.3,.012,0],[.085,.018,5.3],'#e7dcae');
    for(const x of [-w*.28,w*.28])for(const z of [-d*.29,d*.29]){
      batch.box([x,3.4*r.sy,z],[.76,6.8*r.sy,.76],'#939b90');batch.box([x,1.1,z],[.79,.30,.79],'#c1ad66');blocks.push([x/r.sx,z/r.sz,.8/r.sx,.8/r.sz]);
    }
  }
  group.add(batch.finish(true));r.interiorBlocks=blocks;
}
