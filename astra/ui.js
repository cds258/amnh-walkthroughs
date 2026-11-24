'use strict';
const icons={
  map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16m6-14v16"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="m16.5 7.5-3 6-6 3 3-6z"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 4.5 2.6c-1.2.6-1.5 1.2-1.5 2.5m0 2.5v.1"/>',
  pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0z"/><circle cx="12" cy="10" r="2"/>',
  mouse:'<rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 5v4"/>',
  view:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/>',
  expand:'<path d="M14 3h7v7M21 3l-7 7M10 21H3v-7m0 7 7-7"/>',
  close:'<path d="m5 5 14 14M19 5 5 19"/>'
};
document.querySelectorAll('[data-icon]').forEach(i=>i.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+icons[i.dataset.icon]+'</svg>');
// Draw a chambered ammonite for the atlas mark.
const seal=$('seal').getContext('2d');seal.translate(46,46);seal.rotate(-.65);seal.strokeStyle='#ffe5b7';seal.lineWidth=2.3;
const spiral=t=>[Math.cos(t)*3.1*Math.exp(.154*t),Math.sin(t)*3.1*Math.exp(.154*t)];
seal.beginPath();for(let t=0;t<=16.25;t+=.025){const p=spiral(t);seal.lineTo(...p);}seal.stroke();
for(let t=7;t<16.3;t+=.28){const a=spiral(t),b=spiral(t-6.28);seal.beginPath();seal.moveTo(...a);seal.quadraticCurveTo((a[0]+b[0])/2+(a[1]-b[1])*.22,(a[1]+b[1])/2-(a[0]-b[0])*.22,...b);seal.stroke();}
const dlg=$('dialog'), content=$('content');
const el=(tag,txt,cls)=>{const e=document.createElement(tag);if(txt)e.textContent=txt;if(cls)e.className=cls;return e;};
function button(label,fn,cls){const b=el('button',label,cls);b.onclick=fn;return b;}
function panel(title){
  keys.clear();if(document.pointerLockElement)document.exitPointerLock();
  $('dialogTitle').textContent=title;content.replaceChildren();const body=el('div',null,'panelBody');content.append(body);
  if(!dlg.open)dlg.showModal();return body;
}
function go(r,s){if(!renderer)return;dlg.close();visit(r,s);$('world').focus();}
const levelName=n=>n?'Floor '+n:'Lower level';
function listing(list,r,s,prefix){
  const b=button('',()=>go(r,s));b.append(el('span',prefix,'num'));const detail=el('span',s?s.name:r.display);
  detail.append(el('small',s?r.display+' · '+levelName(r.level):levelName(r.level)));b.append(detail);list.append(b);return b;
}
// Thumbnails show the arrival view in this reconstruction.
const featuredHalls=[
  ['rotunda','Barosaurus'],['akeley','African elephant herd'],['ocean','Blue whale'],
  ['fossil','Tyrannosaurus rex'],['titan','The Titanosaur'],['ornith','Triceratops and Stegosaurus'],
  ['meteorites','Ahnighito'],['rose','Hayden Sphere'],['gilder','Griffin Exploration Atrium'],['northMammals','North American mammals'],['terrace','Arthur Ross Terrace'],['forecourt','Central Park West entrance']
];
function plate(id){
  if(typeof tourPlates==='undefined'||!tourPlates[id])return null;
  const img=el('img');img.src=tourPlates[id];img.alt='';img.decoding='async';return img;
}
function destinations(){
  const body=panel('Destinations'),input=el('input');input.type='search';input.id='directory';
  input.placeholder='Search halls and exhibits…';input.setAttribute('aria-label','Search all halls and exhibits');
  const tools=el('div',null,'destTools'),tabs=el('div',null,'floortabs'),list=el('div');
  let mode='Highlights';
  function draw(){
    list.replaceChildren();
    const query=input.value.trim().toLowerCase(),q=/^t[. -]*rex$/.test(query)?'tyrannosaurus':query;
    for(const tab of tabs.children){const selected=tab.textContent===mode&&!q;tab.classList.toggle('chosen',selected);tab.setAttribute('aria-pressed',String(selected));}
    if(mode==='Highlights'&&!q){
      list.className='plateGrid';
      for(const [id,label] of featuredHalls){
        const r=catalog.get(id),card=button('',()=>go(r),'plateCard'),img=plate(id);
        if(img)card.append(img);card.append(el('small',levelName(r.level)),el('strong',label));list.append(card);
      }
      return;
    }
    list.className='list';
    const ranked=rooms.slice().sort((a,b)=>Number(!!highlights[b.id])-Number(!!highlights[a.id])||a.level-b.level||a.display.localeCompare(b.display));
    for(const r of ranked){
      if((mode==='Halls'||q)&&(r.name+' '+r.display).toLowerCase().includes(q))listing(list,r,null,r.level||'LL');
      if(mode==='Exhibits'||q)for(const s of r.stops)if((s.name+' '+r.name+' '+r.display).toLowerCase().includes(q))listing(list,r,s,r.level||'LL');
    }
    if(!list.children.length)list.append(el('p','No matching destinations.'));
  }
  for(const type of ['Highlights','Exhibits','Halls'])tabs.append(button(type,()=>{mode=type;input.value='';draw();}));
  input.oninput=draw;tools.append(tabs,input);body.append(tools,list);draw();
  if(!matchMedia('(pointer:coarse)').matches)input.focus();
}
const svgNS='http://www.w3.org/2000/svg';
function svgEl(tag,props,txt){const n=document.createElementNS(svgNS,tag);for(const [k,v] of Object.entries(props))n.setAttribute(k,v);if(txt)n.textContent=txt;return n;}
const cartographicNames={rotunda:'Rotunda',forecourt:'Memorial steps',akeley:'Akeley',mezzanine:'Balcony',ocean:'Ocean Life',gilder:'Gilder',meteorites:'Meteorites',northMammals:'N. American Mammals',rose:'Rose Center',titan:'Titanosaur',ornith:'Ornithischians',fossil:'Saurischians',universe:'Universe',gems:'Gems',library:'Library',terrace:'Terrace'};
function mapSpecimenShape(group,r){
  // Interpretive silhouettes share the room and object coordinate system.
  const art=svgEl('g',{transform:'translate('+r.x+' '+r.z+') scale('+r.sx+' '+r.sz+')',fill:'#737d69',stroke:'#63715b','stroke-width':.065,'pointer-events':'none'});
  function ell(x,z,rx,rz,angle=0){art.append(svgEl('ellipse',{cx:x,cy:z,rx,ry:rz,transform:'rotate('+angle+' '+x+' '+z+')'}));}
  if(r.id==='ocean'){
    const axis=svgEl('g',{transform:'rotate(-21)'});axis.append(svgEl('path',{d:'M 0 -8.6 C -1.65 -8.35 -1.73 -4.9 -1.12 -1.8 L -2.25 -.22 Q -2.60 .79 -2 .44 L -.96 -.50 C -1 2.2 -.40 4.45 -.18 6.4 Q -1.1 6.65 -2.18 7.81 Q -.95 7.53 0 6.94 Q 1.23 7.62 2.15 7.80 Q 1.2 6.79 .2 6.38 C .57 3.93 .99 1.23 1.0 -.50 L 2.19 .50 Q 2.56 .66 2.28 .10 L 1.2 -1.78 C 1.69 -4.5 1.63 -7.95 0 -8.6 Z'}));art.append(axis);
  }else if(r.id==='rose'||roseUpper(r)){
    const base=catalog.get('rose'),circle=svgEl('ellipse',{cx:(base.x-r.x)/r.sx,cy:(base.z-r.z)/r.sz,rx:9.46*roseScale/r.sx,ry:9.46*roseScale/r.sz,fill:'#b7c5c2',stroke:'#6c8282','stroke-width':.14});art.append(circle);
  }else if(r.id==='akeley'||r.id==='mezzanine'){
    for(const [x,z,a,sc] of [[0,3.9,4,.98],[-1,1.4,16,.80],[.70,.35,-12,.85],[-.85,-1.13,-12,.74],[.70,-2.0,15,.68],[-1.1,-3.51,12,.65],[.45,-4.35,-9,.57],[.85,2.24,12,.41]]){ell(x,z,.58*sc,1.03*sc,a);ell(x,z+.78*sc,.50*sc,.40*sc,a);}
  }else if(r.id==='meteorites'){ell(0,0,5.56,5.08);art.append(svgEl('ellipse',{cx:0,cy:0,rx:1.77,ry:.97,fill:'#485046'}));}
  else if(r.id==='gilder'){
    for(let i=0;i<17;i++){const z=stairWest+(stairEast-stairWest)*i/16;art.append(svgEl('line',{x1:stairLeft,x2:stairRight,y1:z,y2:z,stroke:'#8b8976','stroke-width':.17}));}
  }
  group.append(art);
}
function mapPanel(f=room.level,detail=null){
  const body=panel('Floor map'),tabs=el('div',null,'floortabs');
  for(let i=0;i<=4;i++){const tab=button(i?'F'+i:'LL',()=>mapPanel(i),i===f?'chosen':'');tab.setAttribute('aria-pressed',String(i===f));tabs.append(tab);}
  const tools=el('div',null,'mapTools'),choose=el('select');choose.setAttribute('aria-label','Map view');
  const overview=el('option','Entire floor');overview.value='';choose.append(overview);
  for(const r of floors[f].filter(q=>q.stops.length).sort((a,b)=>a.display.localeCompare(b.display))){const item=el('option',r.display);item.value=r.id;choose.append(item);}
  choose.value=detail?.id||'';choose.onchange=()=>mapPanel(f,choose.value?catalog.get(choose.value):null);
  tools.append(tabs,choose);body.append(tools);
  const layout=el('div',null,'mapLayout'),area=el('div',null,'mapArea'),list=el('div',null,'list mapIndex');
  const tip=el('div',null,'mapKey'),defaultTip=detail?detail.display:levelName(f)+' · '+floors[f].length+' spaces';tip.textContent=defaultTip;
  const bounds=floors[f].reduce((box,r)=>[Math.min(box[0],r.x-r.w/2),Math.min(box[1],r.z-r.d/2),Math.max(box[2],r.x+r.w/2),Math.max(box[3],r.z+r.d/2)],[Infinity,Infinity,-Infinity,-Infinity]);
  const mapBox=detail?[detail.x-detail.w/2-3,detail.z-detail.d/2-3,detail.w+6,detail.d+6]:[bounds[0]-12,bounds[1]-12,bounds[2]-bounds[0]+24,bounds[3]-bounds[1]+24];
  const svg=svgEl('svg',{viewBox:mapBox.join(' '),role:'group','aria-label':(detail?.display||levelName(f))+' walkable floor plan'});
  area.append(svg,tip);layout.append(area,list);body.append(layout);
  function wire(node,row,name){
    const on=()=>{node.classList.add('mapFocus');row.classList.add('mapFocus');tip.textContent=name;};
    const off=()=>{node.classList.remove('mapFocus');row.classList.remove('mapFocus');tip.textContent=defaultTip;};
    for(const item of [node,row]){item.addEventListener('pointerenter',on);item.addEventListener('pointerleave',off);item.addEventListener('focus',on);item.addEventListener('blur',off);}
  }
  const label=(text,x,y,rotate=0)=>svg.append(svgEl('text',{x,y,'text-anchor':'middle','font-size':3.35,fill:'#57695b','letter-spacing':.78,transform:'rotate('+rotate+' '+x+' '+y+')'},text));
  if(!detail){const midX=(bounds[0]+bounds[2])/2,midZ=(bounds[1]+bounds[3])/2;label('COLUMBUS AVENUE',midX,bounds[1]-4);label('CENTRAL PARK WEST',midX,bounds[3]+7.1);label('77TH STREET',bounds[0]-4.7,midZ,-90);label('81ST STREET',bounds[2]+7.2,midZ,90);}
  floors[f].forEach((r,i)=>{
    if(detail&&detail!==r)return;
    const group=svgEl('g',detail?{}:{class:'mapRoom',tabindex:0,role:'button','aria-label':'Visit '+r.name}),active=r===room;
    group.append(svgEl('title',{},r.name),svgEl('rect',{x:r.x-r.w/2,y:r.z-r.d/2,width:r.w,height:r.d,fill:detail?'#d9d9c2':active?'#a8643b':highlights[r.id]?'#b5c7ab':'#f9f7eb',stroke:'#65735d','stroke-width':detail?.34:.64}));
    if(!detail){
      const short=cartographicNames[r.id],ink=active?'#fffaf0':'#334a38';
      group.append(svgEl('text',{x:r.x,y:r.z+(short?-1.1:1.4),'text-anchor':'middle','font-size':4.35,'font-weight':'600',fill:ink},String(i+1)));
      if(short)group.append(svgEl('text',{x:r.x,y:r.z+3.12,'text-anchor':'middle','font-size':Math.min(2.75,r.w/(short.length*.66)),'font-weight':'600',fill:ink},short));
      group.onclick=()=>go(r);group.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go(r);}};
      wire(group,listing(list,r,null,String(i+1)),r.display);
    }else{
      const shapes=r.blocks.length?r.blocks:(blockers[r.id]||(r.id==='northMammals'?americanBounds():[]));
      for(const [x,z,w,d] of shapes){const c=localToWorld(r,x,0,z),rw=w*r.sx,rd=d*r.sz;group.append(svgEl('rect',{x:c.x-rw/2,y:c.z-rd/2,width:rw,height:rd,rx:.17,fill:'#b8bba4','pointer-events':'none'}));}
      mapSpecimenShape(group,r);
    }
    svg.append(group);
    if(detail)for(const [index,s] of r.stops.entries()){
      const v=localToWorld(r,s.lookX,0,s.lookZ),mark=svgEl('g',{tabindex:0,role:'button',class:'mapStop','aria-label':'Visit '+s.name});
      const radius=r.id==='northMammals'&&americanCases[index]?.small ? .76 : Math.min(1.36,Math.max(.94,Math.min(r.w,r.d)*.037));
      mark.append(svgEl('title',{},s.name),svgEl('circle',{cx:v.x,cy:v.z,r:radius,fill:'#3d5a49',stroke:'#fff3d9','stroke-width':.12}),svgEl('text',{x:v.x,y:v.z+.01,'font-size':radius*1.28,'font-weight':650,fill:'white','text-anchor':'middle','dominant-baseline':'central'},String(index+1)));
      mark.onclick=()=>go(r,s);mark.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();go(r,s);}};svg.append(mark);wire(mark,listing(list,r,s,String(index+1)),s.name);
    }
    for(const p of r.ports){const [dx,dz]=sideInfo[p.side],px=r.x+(dx?dx*r.w/2:p.at),pz=r.z+(dz?dz*r.d/2:p.at);
      svg.append(svgEl('line',{x1:px-(dz?p.width/2:0),x2:px+(dz?p.width/2:0),y1:pz-(dx?p.width/2:0),y2:pz+(dx?p.width/2:0),stroke:'#faf6e9','stroke-width':.99,'pointer-events':'none'}));}
  });
  if(room.level===f&&(!detail||detail===room)){
    const p=svgEl('g',{transform:'translate('+pos.x+' '+pos.z+') rotate('+(-yaw*180/Math.PI)+') scale('+(detail?.47:1)+')','pointer-events':'none'});
    p.append(svgEl('circle',{r:3.4,fill:'#814c2a',stroke:'#fff8dc','stroke-width':.7}),svgEl('path',{d:'M 0 -2.2 L 1.5 1.5 L 0 .7 L -1.5 1.5 Z',fill:'white'}));svg.append(p);
  }
  const caption=el('p',detail?'Select a numbered exhibit to visit. ':'Select a room to visit, or choose a hall above for its exhibit map. ','credit');
  const source=el('a','Official visitor map');source.href='https://www.amnh.org/plan-your-visit/museum-map';source.target='_blank';source.rel='noopener';
  caption.append(source);body.append(caption);
}
function help(){
  const body=panel('Walking the museum');const t=el('div',null,'controlTable');
  for(const [k,d] of [['W A S D','Walk forward, left, back, or right'],['Drag','Look around with a mouse or finger'],['Double-click','Capture the mouse for continuous looking'],['←  →','Turn with the keyboard'],['Shift','Walk faster'],['M  /  T','Open the floor map or destinations'],['E','Use a nearby elevator or read a visible placard'],['H','Hide or show the walking interface'],['Esc','Release the mouse or close a panel']])t.append(el('kbd',k),el('span',d));
  const select=el('select');select.setAttribute('aria-label','Rendering detail');
  for(const [id,label] of [['auto','Automatic'],['high','Full detail'],['low','Lower detail']]){const option=el('option',label);option.value=id;select.append(option);}
  select.value=quality;select.onchange=()=>setDetail(select.value);t.append(el('span','Rendering detail'),select);
  body.append(t,el('h3','About this reconstruction'),el('p','This independent, interpretive tour uses the museum’s published visitor map for floor and wing placement. Gallery footprints, connections, heights, and specimen models are approximations. Upper-level views share the main exhibits where indicated.'));
  const link=(title,url)=>{const a=el('a',title);a.href=url;a.target='_blank';a.rel='noopener';return a;};
  body.append(link('AMNH visitor maps','https://www.amnh.org/plan-your-visit/museum-map'));
  const details=el('details',null,'sourceList');details.append(el('summary','Photography, models and materials'));
  const credits=el('ul');details.append(credits);body.append(details);
  const credit=(text,links=[])=>{const li=el('li',text);for(const [title,url] of links)li.append(' ',link(title,url));credits.append(li);};
  credit('The mounts and architecture are interpretive models. Twenty-five Akeley cases use cropped photographs of the installations. The chimpanzee, lesser kudu and gerenuk, and leopard and bush pig cases use original relief artwork. The upper Andros seascape is also an interpretation. Illustrations in secondary halls are period natural-history plates.');
  credit('Three.js is distributed under the MIT license. DM Sans and Instrument Serif are distributed under the SIL Open Font License.',[['Three.js','https://threejs.org/'],['DM Sans','https://github.com/google/fonts/tree/main/ofl/dmsans'],['Instrument Serif','https://github.com/google/fonts/tree/main/ofl/instrumentserif']]);
  credit('Surface and environment scans from Poly Haven, CC0.',[['Marble','https://polyhaven.com/a/marble_01'],['Clay plaster','https://polyhaven.com/a/clay_plaster'],['Diagonal parquet','https://polyhaven.com/a/diagonal_parquet'],['Museum interior','https://polyhaven.com/a/museum_of_history'],['Autumn park','https://polyhaven.com/a/autumn_park']]);
  credit('Mike Cassano’s photograph of Ahnighito was cropped and processed into a repeating iron texture.',[['Original photograph','https://commons.wikimedia.org/wiki/File:Ahnighito_AMNH,_34_tons_meteorite.jpg'],['CC BY 2.0','https://creativecommons.org/licenses/by/2.0/']]);
  for(const item of typeof habitatCredits==='undefined'?[]:habitatCredits)credit(item.artist+'. '+item.changes,[[item.title,item.url],[item.license,item.licenseUrl]]);
  if(typeof naturalPrints!=='undefined')for(const item of Object.values(naturalPrints))credit(item.artist+' · '+item.title+'. Cropped museum interpretation panel.',[['Source · '+item.license,item.url]]);
  credit('Solar System Scope planetary imagery was resized and projected onto the hanging planet models.',[['Texture maps','https://www.solarsystemscope.com/textures/'],['CC BY 4.0','https://creativecommons.org/licenses/by/4.0/']]);
  if(typeof meteorMedia!=='undefined')for(const item of Object.values(meteorMedia))credit(item.artist+'. Photograph adapted as a geology or astronomy panel.',[[item.title+' · '+item.license,item.url]]);
  if(typeof astronomyMedia!=='undefined'&&astronomyMedia.asteroid)credit(astronomyMedia.asteroid.artist+'. Bennu image resized for the meteorite gallery.',[[astronomyMedia.asteroid.title,astronomyMedia.asteroid.url]]);
  for(const a of Object.values(americanMedia))credit(a.artist+'. Cropped exhibit photograph rendered in the gallery.',[[a.title,a.url],[a.license,'https://creativecommons.org/licenses/by/'+(a.license.match(/[0-9]+\.[0-9]+/)?.[0]||'2.0')+'/']]);
  for(const a of hallPhotoCredits)credit(a.author+'. '+a.changes,[[a.title,a.url],[a.license,a.license==='CC0'?'https://creativecommons.org/publicdomain/zero/1.0/':a.license==='Public domain'?'https://creativecommons.org/publicdomain/mark/1.0/':a.license.includes('4.0')?'https://creativecommons.org/licenses/by/4.0/':'https://creativecommons.org/licenses/by/2.0/']]);
  credit('Rotunda murals are original interpretations of William Andrew Mackay’s subjects. Marble, aggregate and walnut textures were tinted for the architecture.',[['Poly Haven materials · CC0','https://polyhaven.com/textures']]);
  for(const [key,a] of Object.entries(universeMedia))if(key!=='willFace')credit(a.artist+'. Photographs cropped for gallery display or projected onto the model.',[[a.title,a.url],[a.license,a.licenseUrl]]);
  if(typeof terraceArtCredits!=='undefined')for(const item of terraceArtCredits)credit(item.author+'. Terrace textures and vegetation.',[[item.title,item.url],[item.license,'https://creativecommons.org/publicdomain/zero/1.0/']]);
  for(const item of entranceCredits)credit(item.artist+'. '+item.changes,[[item.title,item.url],[item.license,item.licenseUrl]]);
  if(typeof museumCollectionCredits!=='undefined')for(const item of museumCollectionCredits)credit(item.author+'. '+item.changes,[[item.title,item.source],[item.license,item.licenseURL]]);
  if(typeof extraModelCredits!=='undefined')for(const item of extraModelCredits)credit(item.text,[[item.label,item.url]]);

}
const exhibitNotes={
 'Barosaurus':['An adult Barosaurus rears above its young while an Allosaurus approaches. Walk to the side to see how the long tail counterbalances the raised neck.','Late Jurassic · Sauropod dinosaur'],
 'Juvenile Barosaurus':['The smaller sauropod stands between the rearing adult and the approaching theropod. The three mounts form a single scene.','Roosevelt Rotunda'],
 'Allosaurus':['Look along the line between the theropod’s open jaws and the juvenile Barosaurus. This encounter introduces the museum’s fossil collections.','Late Jurassic · Theropod dinosaur'],
 'Apatosaurus':['A long, narrowing tail balances the heavy hips. The small head at the far end of the neck gives a sense of the scale of the entire animal. This digital mount is an anatomical reconstruction.','Late Jurassic · Diplodocid sauropod'],
 'Tyrannosaurus rex':['AMNH 5027 is the museum’s Tyrannosaurus skeleton. Its deep skull and large hind limbs are especially clear from the side. This digital mount uses a scan made in the gallery.','Late Cretaceous · Theropod dinosaur'],
 'Allosaurus feeding on a sauropod':['The second mount portrays a theropod feeding on the remains of a long-necked dinosaur. Follow the skull down toward the quarry bed.','Late Jurassic · Theropod dinosaur'],
 'The Titanosaur':['Patagotitan mayorum was a plant-eating sauropod from present-day Patagonia. The museum’s 122-foot cast stretches from one end of the orientation gallery into its entrance.','Late Cretaceous · Patagonia'],
 'Titanosaur skull':['Walk under the projecting skull and turn back toward the long series of neck vertebrae inside the darkened gallery.','Patagotitan mayorum · Sauropod dinosaur'],
 'Diplodocus femur':['This display represents the thigh bone of Diplodocus longus from Como Bluff, Wyoming. The 1897 discovery was the museum’s first dinosaur fossil excavation.','Late Jurassic · Wyoming'],
 'Triceratops':['Two long brow horns, a short nose horn and a broad bony frill distinguish this Late Cretaceous herbivore.','Late Cretaceous · Horned dinosaur'],
 'Edmontosaurus mummy (AMNH 5060)':['The animal lies on its back. Impressions preserve the skin around the trunk and limbs. The reconstruction follows photographs published by the museum in 1912.','AMNH 5060 · Late Cretaceous'],
 'Edmontosaurus comparative skull':['This comparative duckbill skull uses a scan of a specimen in the Science Museum of Minnesota. Look down the snout to see the broad, flattened beak.','Comparative study · Hadrosaur'],
 'Willamette Meteorite':['This 15.5-ton iron meteorite is also known as Tomanowos. Its deeply pitted surface is visible from the low circular rail in the Planets Zone.','Cullman Hall of the Universe · Oregon'],
 'Ecosphere':['The glass sphere represents a sealed aquatic ecosystem displayed in the Planets Zone.','Cullman Hall of the Universe'],
 'Astro Bulletin':['A wide screen at the center of the hall presents astronomical discoveries. This reconstruction shows a still from the Hubble Ultra Deep Field.','Cullman Hall of the Universe'],
 'Interacting galaxies':['Tidal forces bend and pull the Antennae galaxies as they merge. Bright clusters mark places where new stars are forming.','Galaxies Zone · Hubble Space Telescope'],
 'Our star, the Sun':['The Solar Dynamics Observatory observes the Sun in several wavelengths. Extreme ultraviolet imagery reveals hot gas in the solar atmosphere.','Stars Zone · Solar Dynamics Observatory'],
 'Hayden Sphere from the terrace':['The terrace looks across the reflecting fountain toward the glass pavilion and its suspended planetarium.','Arthur Ross Terrace · Rose Center'],
 'Arthur Ross Terrace Fountain':['A shallow water court and planted lawns occupy the outdoor terrace alongside the Rose Center.','Arthur Ross Terrace · Floor 2'],
 'Griffin Atrium overlook':['The upper bridge crosses the sculpted atrium above the staircase. Look down through the openings to see how the two gallery levels connect.','Gilder Center · Floor 2'],
 'End-Cretaceous extinction':['A globe marks the Chicxulub impact site on the Yucatán Peninsula. The adjacent layered section represents the rock record across the Cretaceous–Paleogene boundary, about 66 million years ago.','Koch Dinosaur Wing · Extinction'],
 'Ornithischian family tree':['The heavy line on the floor continues the family tree through the fossil halls. Armored dinosaurs occupy one branch, and the duckbills and horned dinosaurs belong to another.','Koch Dinosaur Wing · Dinosaur relationships'],
 'Stegosaurus':['The plates along the back and the pairs of spikes near the end of the tail are easiest to compare in profile.','Late Jurassic · Armored dinosaur'],
 'Blue Whale':['The museum’s 94-foot suspended model spans the hall. From the lower floor you can see the long throat pleats. The entrance balcony gives a view along the body toward the flukes.','Balaenoptera musculus · Marine mammal'],
 'Andros Coral Reef Diorama':['The museum’s Bahamian reef display shows life below the surface at Andros Island. Compare the illuminated corals near the front with the blue water behind.','Andros Island · The Bahamas'],
 'Sperm Whale and Giant Squid':['The dark scene depicts a sperm whale encountering a giant squid in deep water. The animals appear at the edge of the case lighting.','Deep ocean'],
 'Ahnighito':['Ahnighito is the largest of the three Cape York fragments on display. The 34-ton iron meteorite rests on supports extending down to Manhattan bedrock.','Cape York · Greenland'],
 'Woman · Cape York meteorite':['Woman is a smaller fragment of the same iron meteorite as Ahnighito and Dog.','Cape York · Greenland'],
 'Dog · Cape York meteorite':['Dog is one of three named fragments of the Cape York meteorite displayed together in the Arthur Ross hall.','Cape York · Greenland'],
 'Hayden Sphere':['The 87-foot aluminum-clad sphere houses the Hayden Space Theater and the Big Bang Theater. The ramp winds around it inside the glass pavilion.','Rose Center for Earth and Space'],
 'Heilbrunn Cosmic Pathway':['The spiral walkway uses its length to represent cosmic time. Its slope connects the upper exhibition level with the lower space around the Hayden Sphere.','Rose Center for Earth and Space'],
 'African Elephant':['Eight elephants stand on the central island. From the entrance, turn clockwise around the herd to follow the main-floor habitat cases.','Akeley Hall · Central group'],
 'Kenneth C. Griffin Exploration Atrium':['Studio Gang designed the Gilder Center’s central atrium around bridges and large openings. Its textured walls come from concrete sprayed over a steel framework.','Richard Gilder Center · Studio Gang'],
 'Atrium bridges':['Look through the arching walls to see the bridges and upper levels. The broad staircase links the atrium floor with the second-level galleries.','Richard Gilder Center'],
 'Theodore Roosevelt Memorial entrance':['John Russell Pope designed this entrance as a Roman triumphal arch. Above the columns stand Daniel Boone, John James Audubon, William Clark and Meriwether Lewis.','Central Park West · John Russell Pope'],
 'American bison and pronghorn':['This plains scene presents the North American prairie in the mid-1800s, before commercial hunting devastated the bison herds.','Bernard Family Hall · Diorama 19']
};
const officialHallPages={
 rotunda:'theodore-roosevelt-memorial/roosevelt-rotunda',forecourt:'theodore-roosevelt-memorial',akeley:'african-mammals',mezzanine:'african-mammals',
 fossil:'saurischian-dinosaurs',ornith:'ornithischian-dinosaurs',titan:'orientation-center',ocean:'ocean-life',meteorites:'meteorites',
 universe:'the-universe',gilder:'gilder-center',gilder2:'gilder-center',rose:'rose-center',cosmicPath:'heilbrunn-cosmic-pathway',northMammals:'north-american-mammals'
};
function objectPlate(r,s){
  let src=null;
  if(r.id==='universe'){const item=universeMedia[{'Willamette Meteorite':'will','Astro Bulletin':'astro','Interacting galaxies':'galaxy','Our star, the Sun':'sun'}[s.name]];src=item?.data;}
  if(r.id==='northMammals'){const c=americanCases.find(c=>c.name===s.name);if(c)src=americanMedia[c.key]?.data;}
  if(r.id==='akeley'||r.id==='mezzanine'){const c=akeleyCases.find(c=>c.name===s.name);if(c)src=habitatMedia[c.key];}
  if(r.id==='ocean'){const c=oceanSideCases.find(c=>c[0]===s.name);src=c?rotundaArt[c[1]]:habitatMedia[{'Andros Coral Reef Diorama':'reef','Kelp Forests':'kelp','Sperm Whale and Giant Squid':'squid'}[s.name]];}
  if(!src){const img=plate(s.name)||((r.stops[0]===s)?plate(r.id):null);if(img)img.className='plateHero';return img;}
  const img=el('img');img.className='plateHero';img.src=src;img.alt=s.name;return img;
}
function exhibit(s){
  if(!s)return;const r=room,body=panel(s.name);
  const img=objectPlate(r,s);if(img)body.append(img);
  const notes=exhibitNotes[s.name];body.append(el('p',notes?.[1]||r.display+' · '+levelName(r.level),'objectMeta'));
  const observation=notes?.[0]||dioramaNotes[s.name];if(observation)body.append(el('p',observation,'objectNote'));
  const actions=el('div',null,'objectActions');actions.append(button('Stand at this exhibit',()=>go(r,s),'visit'));
  if(officialHallPages[r.id]){
    const source=el('a','Museum gallery guide ↗');source.href='https://www.amnh.org/exhibitions/permanent/'+officialHallPages[r.id];source.target='_blank';source.rel='noopener';actions.append(source);
  }
  body.append(actions);
}
function elevator(){
  const body=panel('Elevators');body.append(el('p',room.core?'Choose a level served by this elevator.':'Choose a level at the Central Park West elevator lobby.'));const tabs=el('div',null,'floortabs');body.append(tabs);
  for(let i=0;i<=4;i++){
    const r=floors[i].find(q=>room.core?q.core===room.core:q.lift);
    if(!r)continue;
    tabs.append(button(i?'Floor '+i:'LL',()=>{go(r);if(r.liftPoint){pos.x=r.liftPoint.x;pos.z=r.liftPoint.z+1.9;yaw=0;pitch=0;}},i===room.level?'chosen':''));
  }
}
$('near').onclick=elevator;$('hotspot').onclick=()=>exhibit(nearest);
function clearView(){const on=document.body.classList.toggle('clear-view');$('restoreUI').hidden=!on;$('world').focus();}
$('hideUI').onclick=$('restoreUI').onclick=clearView;$('locator').onclick=()=>mapPanel();
$('mapBtn').onclick=()=>mapPanel();$('helpBtn').onclick=help;$('places').onclick=destinations;$('close').onclick=()=>dlg.close();
dlg.addEventListener('click',e=>{if(e.target===dlg){const r=dlg.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dlg.close();}});
dlg.addEventListener('close',()=>{if(!dlg.open)$('world').focus();});
addEventListener('keydown',e=>{
  if(dlg.open)return;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
  keys.add(e.code);if(e.repeat)return;
  if(e.code==='KeyH')clearView();if(e.code==='KeyM')mapPanel();if(e.code==='KeyT')destinations();
  if(e.code==='KeyE'){if($('near').textContent)elevator();else exhibit(nearest);}
  if(e.key==='?')help();
});
addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();});
const world=$('world');let pointer=null,prevX=0,prevY=0;
world.onpointerdown=e=>{if(pointer!==null)return;pointer=e.pointerId;world.setPointerCapture(pointer);prevX=e.clientX;prevY=e.clientY;world.focus();};
world.onpointerup=world.onpointercancel=e=>{if(pointer===e.pointerId)pointer=null;};
function look(dx,dy){yaw-=dx*.0032;pitch=THREE.MathUtils.clamp(pitch-dy*.003,-1.42,1.42);}
world.onpointermove=e=>{if(document.pointerLockElement===world||pointer!==e.pointerId)return;look(e.clientX-prevX,e.clientY-prevY);prevX=e.clientX;prevY=e.clientY;};
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===world)look(e.movementX,e.movementY);});
world.ondblclick=()=>world.requestPointerLock?.()?.catch?.(()=>{});
for(const b of $('pad').children){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys.delete(b.dataset.key);}
const mini=$('miniPlan').getContext('2d');
function updateLocator(){
  $('miniLabel').textContent=levelName(room.level);
  if(innerWidth<=470||document.body.classList.contains('clear-view'))return;
  const cw=mini.canvas.width,ch=mini.canvas.height,k=3.05;
  const x=v=>cw/2+(v-pos.x)*k,z=v=>ch/2+(v-pos.z)*k;
  mini.fillStyle='#1c2b27';mini.fillRect(0,0,cw,ch);
  mini.lineWidth=.6;mini.strokeStyle='#425047';mini.beginPath();
  for(let i=(cw/2-pos.x*k)%(10*k);i<cw;i+=10*k){mini.moveTo(i,0);mini.lineTo(i,ch);}
  for(let i=(ch/2-pos.z*k)%(10*k);i<ch;i+=10*k){mini.moveTo(0,i);mini.lineTo(cw,i);}mini.stroke();
  for(const r of floors[room.level]){
    const left=x(r.x-r.w/2),top=z(r.z-r.d/2),w=r.w*k,d=r.d*k;
    mini.fillStyle=r===room?'#675f45':'#34453b';mini.fillRect(left,top,w,d);
    mini.strokeStyle=r===room?'#d3b37f':'#82917e';mini.lineWidth=r===room?1.9:1.15;mini.strokeRect(left,top,w,d);
  }
  for(const r of floors[room.level])for(const p of r.ports){
    const [dx,dz]=sideInfo[p.side],a=x(r.x+(dx?dx*r.w/2:p.at)),b=z(r.z+(dz?dz*r.d/2:p.at)),d=p.width*k*.46;
    mini.strokeStyle='#758775';mini.lineWidth=2.3;mini.beginPath();mini.moveTo(a-d*Math.abs(dz),b-d*Math.abs(dx));mini.lineTo(a+d*Math.abs(dz),b+d*Math.abs(dx));mini.stroke();
  }
  mini.save();mini.translate(cw/2,ch/2);mini.rotate(-yaw);
  const glow=mini.createRadialGradient(0,0,1,0,0,35);glow.addColorStop(0,'#ffd696a6');glow.addColorStop(1,'#ffd69608');
  mini.fillStyle=glow;mini.beginPath();mini.moveTo(0,0);mini.arc(0,0,35,-Math.PI*.70,-Math.PI*.30);mini.closePath();mini.fill();
  mini.fillStyle='#ffd798';mini.strokeStyle='#393829';mini.lineWidth=1.6;mini.beginPath();mini.moveTo(0,-7);mini.lineTo(5,5);mini.lineTo(0,3.3);mini.lineTo(-5,5);mini.closePath();mini.fill();mini.stroke();mini.restore();
}
requestAnimationFrame(startMuseum);
