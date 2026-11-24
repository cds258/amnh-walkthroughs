/* World units are metres. Wall decorations use (along, height, depth into room). */
function addHalls(g, kind = 'all', openings = ['north', 'south', 'west', 'east'], portals) {
  const doorOn = name => !portals && openings.includes(name);
  const original = g;
  const center = kind === 'ocean' ? 24 : kind === 'fossil' ? -24 : 0;
  // Clip architectural detail along with the wall so off-center doors are clear
  // even when they coincide with a window sill, moulding, or column.
  const cutouts = (portals || []).map(({side, at, width}) => {
    const half = width / 2;
    if (side === 'north' || side === 'south') {
      const z = side === 'north' ? -13 : 13;
      return [[center+at-half, .022, z-1.6], [center+at+half, 6, z+1.6]];
    }
    const x = center + (side === 'west' ? -12 : 12);
    return [[x-1.6, .022, at-half], [x+1.6, 6, at+half]];
  });
  const axes = [0,1,2];
  function bounds(points) {
    return [axes.map(i => Math.min(...points.map(p=>p[i]))),
            axes.map(i => Math.max(...points.map(p=>p[i])))];
  }
  function intersects(a,b) {
    return axes.every(i=>a[1][i]>=b[0][i] && a[0][i]<=b[1][i]);
  }
  // Successively split off the pieces outside each face of the cutout.
  function cutBox(box, cut) {
    if (!intersects(box,cut)) return [box];
    const fragments=[], inside=box.map(v=>v.slice());
    for(const i of axes) {
      if(inside[0][i]<cut[0][i]) {
        const part=inside.map(v=>v.slice());
        part[1][i]=cut[0][i]; inside[0][i]=cut[0][i]; fragments.push(part);
      }
      if(inside[1][i]>cut[1][i]) {
        const part=inside.map(v=>v.slice());
        part[0][i]=cut[1][i]; inside[1][i]=cut[1][i]; fragments.push(part);
      }
    }
    return fragments;
  }
  function clip(poly,axis,value,sign) {
    const result=[];
    let prev=poly[poly.length-1];
    for(const point of poly) {
      const before=(prev[axis]-value)*sign, after=(point[axis]-value)*sign;
      if((before<0)!==(after<0)){
        const t=before/(before-after);
        result.push(axes.map(i=>prev[i]+(point[i]-prev[i])*t));
      }
      if(after>=0)result.push(point);
      prev=point;
    }
    return result;
  }
  function cutPoly(poly,cut) {
    if(!intersects(bounds(poly),cut)) return [poly];
    const outside=[];
    let inside=poly;
    for(const i of axes)for(const face of [0,1]) {
      if(inside.length<3)return outside;
      const sign=face===0?1:-1, value=cut[face][i];
      if(inside.some(p=>(p[i]-value)*sign<0)){
        const piece=clip(inside,i,value,-sign);
        if(piece.length>=3)outside.push(piece);
      }
      inside=clip(inside,i,value,sign);
    }
    return outside;
  }
  if(cutouts.length) g = {
    box(c,s,color) {
      const box=[axes.map(i=>c[i]-s[i]/2),axes.map(i=>c[i]+s[i]/2)];
      const cuts=cutouts.filter(cut=>intersects(box,cut));
      if(!cuts.length){original.box(c,s,color);return;}
      for(const [lo,hi] of cuts.reduce((parts,cut)=>parts.flatMap(part=>cutBox(part,cut)),[box])) {
        if(axes.every(i=>hi[i]-lo[i]>.0001))
          original.box(axes.map(i=>(lo[i]+hi[i])/2),axes.map(i=>hi[i]-lo[i]),color);
      }
    },
    tri(a,b,c,color) {
      const tri=[a,b,c], box=bounds(tri);
      const cuts=cutouts.filter(cut=>intersects(box,cut));
      if(!cuts.length){original.tri(a,b,c,color);return;}
      for(const poly of cuts.reduce((parts,cut)=>parts.flatMap(part=>cutPoly(part,cut)),[tri])){
        for(let j=1;j+1<poly.length;j++) {
          const u=axes.map(i=>poly[j][i]-poly[0][i]), v=axes.map(i=>poly[j+1][i]-poly[0][i]);
          const area=Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]);
          if(area>1e-10) original.tri(poly[0],poly[j],poly[j+1],color);
        }
      }
    },
    rod(a,b,r1,r2,color) {
      // Shaft and window ornament rods are either vertical or short accents.
      const radius=Math.max(r1,r2), box=bounds([a,b]);
      for(const i of axes){box[0][i]-=radius;box[1][i]+=radius;}
      if(!cutouts.some(cut=>intersects(box,cut)))original.rod(a,b,r1,r2,color);
    }
  };
  const {sin, cos, PI} = Math;
  const light='#ead9b7',trim='#dac4a2';
  function quad(a,b,c,d,color) { g.tri(a,b,c,color); g.tri(a,c,d,color); }
  function wall(cx,cz,ux,uz,nx,nz) {
    const p = (u,y,d) => [cx+ux*u+nx*d,y,cz+uz*u+nz*d];
    const slab = (u,y,d,w,h,t,col) => g.box(p(u,y,d),[Math.abs(ux)*w+Math.abs(nx)*t,h,Math.abs(uz)*w+Math.abs(nz)*t],col);
    const face = (u1,y1,u2,y2,u3,y3,d,col) => g.tri(p(u1,y1,d),p(u2,y2,d),p(u3,y3,d),col);
    const band = (u,y,inner,outer,a,b,d,col) => {
      const v=(r,t)=>p(u+r*cos(t),y+r*sin(t),d);
      quad(v(inner,a),v(outer,a),v(outer,b),v(inner,b),col);
    };
    return {p,slab,face,band};
  }
  // The four bays behind the round red marble columns are modelled around the
  // actual cardinal orientation: the entrance is on the Central Park West wall.
  function rotunda() {
    g.box([0,-.10,0],[24,.19,26],'#8c8477');

    const walls=[wall(0,-13,1,0,0,1),wall(0,13,-1,0,0,-1),
                 wall(-12,0,0,-1,1,0),wall(12,0,0,1,-1,0)];
    const pier='#d1c6b3',edge='#e1d7c7',joints='#aaa092';
    function torchiere(w,u) {
      const p=y=>w.p(u,y,1.00);
      const metal='#514635',highlight='#85775d';
      for(const [a,b,ra,rb,c] of [[.02,.09,.38,.4,metal],[.09,.18,.38,.36,highlight],
        [.18,.35,.34,.24,metal],[.35,.46,.23,.26,highlight],[.46,.60,.26,.19,metal],
        [.60,1.73,.16,.082,metal],[1.73,1.78,.16,.16,highlight],[1.78,1.95,.09,.17,metal],
        [1.95,2.10,.17,.32,metal],[2.10,2.19,.32,.40,highlight],[2.19,2.24,.40,.4,metal],
        [2.24,2.265,.33,.35,'#fff4c9']])g.rod(p(a),p(b),ra,rb,c);
      for(let j=0;j<8;j++){
        const a=j*Math.PI/4,pp=(y,r)=>w.p(u+Math.cos(a)*r,y,1+Math.sin(a)*r);
        g.rod(pp(.40,.16),pp(.7,.22),.026,.038,highlight);
        g.rod(pp(.70,.22),pp(.92,.13),.038,.022,highlight);
      }
    }
    function capital(w,u,base) {
      const c=w.p(u,base,1.02);
      const p=(a,y,r)=>[c[0]+cos(a)*r,base+y,c[2]+sin(a)*r];
      const lip=(y,h,r1,r2,col)=>g.rod([c[0],base+y,c[2]],[c[0],base+y+h,c[2]],r1,r2,col);
      lip(0,.09,.58,.60,'#a59c8c');lip(.09,.05,.61,.63,edge);
      lip(.14,.70,.53,.78,'#9d9381');lip(.81,.10,.76,.83,pier);
      // Two overlapping whorls of turned-out acanthus leaves. Each leaf has
      // raised central ribs, a folded crown and serrated margins.
      for(let row=0;row<2;row++)for(let leaf=0;leaf<8;leaf++) {
        const a=(leaf+row*.5)*PI/4;
        const radius=row?.62:.51,lo=row?.36:.11,h=row?.47:.54;
        for(let j=0;j<6;j++){
          const section=(k,s)=>{
            const f=k/6,wid=.32*sin(PI*(.08+.91*f))*(k%2?.91:1.08);
            return p(a+s*wid,lo+h*f,radius+.13*f+.12*Math.pow(f,4)+.05*(1-Math.abs(s)));
          };
          for(const s of [-1,1])quad(section(j,0),section(j,s),section(j+1,s),section(j+1,0),s>0?edge:'#bab09e');
        }
        g.rod(p(a,lo+.12,radius+.09),p(a,lo+h,radius+.28),.028,.014,edge);
      }
      for(let k=0;k<4;k++){
        const a=(k+.5)*PI/2,uu=[-sin(a),cos(a)];
        let last=null;
        for(let j=0;j<=15;j++){
          const f=j/15,t=PI*(.15+1.85*f),r=.17*(1-.72*f),pt=p(a,.79+r*sin(t),.83);
          pt[0]+=uu[0]*r*cos(t);pt[2]+=uu[1]*r*cos(t);
          if(last)g.rod(last,pt,.038,.035,edge);last=pt;
        }
      }
      w.slab(u,base+.99,1.02,1.72,.15,1.72,edge);
    }
    walls.forEach((w,i)=>{
      const length=i<2?24:26,half=length/2,side=['north','south','west','east'][i];
      const actual=portals?portals.some(p=>p.side===side):doorOn(side);
      // The luminous entrance screen belongs on the east face. Three recessed
      // canvas bays on the other faces carry the mural cycle.
      w.slab(0,6.4,-.23,length,12.8,.45,joints);
      w.slab(0,5.86,.026,13.35,10.82,.04,i===1?'#ac9d87':'#675c4b');
      for(const s of [-1,1]) {
        const bayWidth=half-6.46,u=s*(half+6.46)/2;
        for(let j=0;j<15;j++){
          const y=.69+j*.72;
          const divisions=j%3===0?2:1;
          for(let k=0;k<divisions;k++){
            const col=['#d7cebe','#d0c7b8','#d4cbbc','#ccc3b2','#d3cab9'][(j*7+k+i)%5];
            w.slab(u+((k+.5)/divisions-.5)*bayWidth,y,.26,bayWidth/divisions-.015,.710,.55,col);
          }
        }
        w.slab(u,.18,.31,bayWidth,.34,.70,'#beb4a4');
        w.slab(u,.42,.30,bayWidth,.12,.68,edge);
        w.slab(u,1.54,.32,bayWidth,.09,.69,edge);
        w.slab(u,8.92,.30,bayWidth,.09,.71,edge);
        w.slab(u,10.50,.32,bayWidth,.13,.67,edge);
        w.slab(s*6.46,5.62,.55,.47,10.60,.51,pier);
        w.slab(s*6.46,10.62,.48,.79,.23,.80,edge);
        // Heavy square responded pier on each side of the marble colonnade.
        w.slab(s*6.58,.38,.58,.95,.75,.85,pier);
        w.slab(s*6.58,.80,.61,1.03,.15,.92,edge);
        capital(w,s*6.52,9.79);
        // These are freestanding columns in front of the passages. Visitors
        // can pass on either side even when a gallery connection is off-center.
        const clipped=g;
        g=original;
        const colU=s*3.70;
        const base=(a,b,ra,rb,col)=>g.rod(w.p(colU,a,1.02),w.p(colU,b,1.02),ra,rb,col);
        w.slab(colU,.13,1.02,1.67,.26,1.67,'#bdb2a0');
        base(.26,.44,.83,.76,'#d4c9b6');base(.44,.53,.73,.74,edge);
        base(.53,.64,.72,.65,pier);base(.64,.70,.65,.65,edge);
        capital(w,colU,9.80);
        g=clipped;
        torchiere(w,s*(half-1.56));
      }
      if(i===1){
        // Broad decorated central bronze doors. The glazing is a separate
        // luminous surface so the dense ironwork reads against daylight.
        for(let j=-1;j<=1;j++){
          const u=j*1.53;
          w.slab(u,1.43,.20,1.47,2.86,.20,'#4f4538');
          for(const s of [-1,1]){
            w.slab(u+s*.35,1.46,.33,.64,2.65,.13,'#514a40');
            w.slab(u+s*.35,1.73,.42,.47,1.55,.07,'#929e98');
            w.slab(u+s*.35,.55,.42,.45,.58,.07,'#302e29');
            w.slab(u+s*.09,1.08,.49,.047,.42,.08,'#a39978');
          }
        }
        for(let j=0;j<48;j++){
          const a=j*PI/48,b=(j+1)*PI/48;
          w.band(0,5.30,5.26,5.37,a,b,.25,'#6d6354');
          w.band(0,5.30,5.37,5.59,a,b,.22,j%3===0?'#b9ab94':'#c6b8a2');
          w.band(0,5.30,5.59,5.69,a,b,.30,'#d1c4ad');
        }
        for(const side of [-1,1]){
          w.slab(side*5.42,2.72,.26,.32,5.45,.39,'#b3a58f');
          w.slab(side*5.42,5.23,.34,.55,.23,.51,'#d0c3ad');
        }
        w.slab(0,2.99,.23,5.4,.24,.45,'#625849');
        for(const s of [-1,1])w.slab(s*2.78,2.79,.18,.19,5.58,.40,'#575044');
      } else if(!actual){ w.slab(0,2.11,.24,4.24,4.22,.28,'#4e4941'); }
      // Entablature with a shadow reveal and alternating shallow modillions.
      for(const [y,ht,dep,col] of [[10.93,.18,.56,edge],[11.13,.22,.49,pier],[11.34,.17,.59,edge],
        [11.55,.22,.43,pier],[11.75,.10,.55,joints],[11.94,.24,.53,pier],[12.14,.10,.72,edge],
        [12.32,.17,.81,pier],[12.54,.23,.92,edge],[12.78,.16,1.00,pier]]){
        w.slab(0,y,dep*.48,length,ht,dep,col);
      }
      for(let u=-half+.20;u<half;u+=.36)w.slab(u,12.21,.69,.18,.13,.46,edge);
      for(let u=-half+.42;u<half;u+=.84){
        w.slab(u,12.42,.77,.39,.20,.48,'#c0b4a1');
        w.slab(u,12.46,.86,.46,.075,.45,edge);
      }
    });
    // The barrel runs toward 77th and 81st streets. Its octagons follow the
    // curvature; stepped splayed sides make the painted coffers genuinely deep.
    const barrel=(a,x,r=0)=>[x,12.86+(10.50-r)*sin(a),(13-r)*cos(a)];
    const rows=15,bays=11, rowAngle=PI/rows,bay=24/bays;
    const oct=[[-.21,-.5],[.21,-.5],[.5,-.21],[.5,.21],[.21,.5],[-.21,.5],[-.5,.21],[-.5,-.21]];
    for(let i=0;i<rows;i++)for(let j=0;j<bays;j++){
      const ac=(i+.5)*rowAngle,xc=-12+(j+.5)*bay;
      const p=(u,v,r)=>barrel(ac+v*rowAngle,xc+u*bay,r);
      quad(p(-.5,-.5,0),p(.5,-.5,0),p(.5,.5,0),p(-.5,.5,0),'#c9bda7');
      const rings=[[.94,.022,'#e2d8c6'],[.90,.115,'#ccbea6'],[.86,.125,'#eee4d0'],
                   [.78,.041,'#ab9c83'],[.70,.044,'#ded1b9'],[.67,.092,'#f1e7d5'],
                   [.59,.025,'#ad9f86']];
      for(let k=1;k<rings.length;k++)for(let n=0;n<8;n++){
        const h=(n,k)=>p(oct[n%8][0]*rings[k][0],oct[n%8][1]*rings[k][0],rings[k][1]);
        quad(h(n,k-1),h(n+1,k-1),h(n+1,k),h(n,k),rings[k][2]);
      }
      for(let n=0;n<8;n++)g.tri(p(0,0,.026),p(oct[n][0]*.59,oct[n][1]*.59,.026),p(oct[(n+1)%8][0]*.59,oct[(n+1)%8][1]*.59,.026),'#d4c8b1');
      // Eight-leaf rosette and a central boss.
      for(let n=0;n<8;n++){
        const t=n*PI/4,leaf=(angle,r,h)=>p(cos(angle)*r,sin(angle)*r,h);
        quad(leaf(t,.041,.072),leaf(t-.22,.115,.065),leaf(t,.19,.048),leaf(t,.12,.118),'#e6dbc6');
        quad(leaf(t,.041,.072),leaf(t,.12,.118),leaf(t,.19,.048),leaf(t+.22,.115,.065),'#b8a98e');
      }
    }
    for(const w of walls.slice(2)) {
      const spring=12.80;
      for(let n=0;n<54;n++){
        const a=n*PI/54,b=(n+1)*PI/54;
        const q=(t)=>w.p(13*cos(t),spring+10.55*sin(t),0);
        g.tri(w.p(0,spring,0),q(a),q(b),pier);
      }
      // Tripartite Diocletian window at each end of the vaulted room.
      const r=8.45;
      for(let j=0;j<56;j++){
        const a=j*PI/56,b=(j+1)*PI/56;
        w.band(0,spring,r,r+.13,a,b,.23,'#b8a88e');
        w.band(0,spring,r+.13,r+.46,a,b,.23,j%3===0?edge:pier);
        w.band(0,spring,r+.46,r+.54,a,b,.32,edge);
      }
      for(const u of [-2.83,2.83]){
        const h=Math.sqrt(r*r-u*u);
        w.slab(u,spring+h/2,.33,.39,h,.47,pier);
        w.slab(u,spring+.13,.40,.57,.26,.66,edge);
      }
      w.slab(0,spring-.02,.40,17.7,.35,.65,edge);
    }
  }
  function fossilHall(){
    const cx=-24,cream='#d6d4c8',white='#e4e2d8',wallColor='#c5c6bf';
    g.box([cx,-.09,0],[24,.17,26],'#969d99');
    const walls=[wall(cx,-13,1,0,0,1),wall(cx,13,-1,0,0,-1),wall(cx-12,0,0,-1,1,0),wall(cx+12,0,0,1,-1,0)];
    walls.forEach((w,i)=>{
      const len=i<2?24:26;
      w.slab(0,3.80,-.13,len,7.60,.26,wallColor);
      w.slab(0,.20,.018,len,.40,.10,'#a3a69d');
      w.slab(0,.436,.040,len,.067,.13,'#b5b9ae');
      for(const [y,h,t,c] of [[6.85,.09,.12,cream],[6.995,.19,.20,white],[7.15,.14,.29,white],[7.27,.12,.38,cream]])
        w.slab(0,y,t*.5,len,h,t,c);
      if(i===1){
        for(const u of [-7.7,0,7.7]){
          w.slab(u,3.34,.035,4.7,4.58,.06,'#828b87');
          for(const x of [-2.37,2.37])w.slab(u+x,3.34,.092,.14,4.84,.19,white);
          w.slab(u,5.70,.10,4.89,.18,.22,white);w.slab(u,1.02,.15,5.1,.13,.4,cream);
          for(const x of [-1.16,0,1.16])w.slab(u+x,3.34,.123,.047,4.57,.085,'#65726c');
          for(const y of [2.42,3.80,4.93])w.slab(u,y,.134,4.7,.048,.082,'#65726c');
        }
      }
      for(const u of [-len/2+.25,len/2-.25])w.slab(u,3.5,.12,.42,7,.3,cream);
    });
    // Plaster-edged shallow beams and small spot heads are visible between
    // the two rows of pendant bowls in the T. rex gallery.
    g.box([cx,7.60,0],[24.2,.22,26.15],'#d0d0c6');
    for(const x of [-7.25,0,7.25]){
      g.box([cx+x,7.38,0],[.41,.31,26],white);
      for(const s of [-1,1])g.box([cx+x+s*.25,7.45,0],[.11,.10,26],cream);
    }
    for(const z of [-11,-5.5,0,5.5,11]){
      g.box([cx,7.34,z],[24,.33,.42],white);
      for(const s of [-1,1])g.box([cx,7.41,z+s*.27],[24,.13,.13],cream);
      for(const x of [-9.1,-3.25,3.25,9.1]){
        const head=[cx+x,7.14,z+.11],aim=[cx+x+(x<0?.09:-.09),6.99,z+.16];
        g.rod(head,aim,.085,.10,'#9b9e97');
        g.rod(aim,[aim[0],aim[1]-.018,aim[2]],.079,.070,'#fff7db');
      }
    }
    for(const [x,z,w,l] of saurischianPlinths){
      g.box([cx+x,.07,z],[w,.14,l],'#a7aaa2');
      g.box([cx+x,.17,z],[w-.10,.06,l-.10],'#d7dad1');
      for(const side of [-1,1]){
        g.box([cx+x+side*w/2,.20,z],[.05,.045,l],'#727c77');
        g.box([cx+x,.20,z+side*l/2],[w,.045,.05],'#727c77');
        for(const step of [-.5,-.25,0,.25,.5])
          g.box([cx+x+side*w/2,.60,z+l*step],[.045,.80,.045],'#849089');
      }
    }
  }
  function oceanHall(){
    const cx=24,roof='#80838a',stone='#aba08d',light='#c0b4a1',lower='#272d37';
    g.box([cx,-.09,0],[24,.17,26],'#32373e');
    const walls=[wall(cx,-13,1,0,0,1),wall(cx,13,-1,0,0,-1),wall(cx-12,0,0,-1,1,0),wall(cx+12,0,0,1,-1,0)];
    walls.forEach((w,i)=>{
      const len=i<2?24:26,bay=len/3,r=bay*.438;
      w.slab(0,4.92,-.18,len,9.84,.36,lower);
      w.slab(0,.18,.025,len,.36,.09,'#222731');
      w.slab(0,3.005,.085,len,.19,.25,'#697075');
      // Back the recessed bays in front of the adjoining room's outside
      // face. The shared passage itself is still clipped by the portal bounds.
      w.slab(0,5.99,.196,len,5.95,.050,'#33383b');
      for(let j=0;j<3;j++){
        const u=(j-1)*bay, spring=5.54, rY=3.17;
        const a=(t,radius,extra,depth)=>w.p(u+radius*cos(t),spring+(rY+extra)*sin(t),depth);
        // The gallery arcade is a row of real recessed arches with soffits
        // between the lit mezzanine dioramas and its tall plaster piers.
        for(let k=0;k<36;k++){
          const t=k*PI/36,b=(k+1)*PI/36;
          quad(a(t,r,.0,.43),a(b,r,.0,.43),w.p(u+r*cos(b),9.49,.43),w.p(u+r*cos(t),9.49,.43),stone);
          quad(a(t,r,.0,.43),a(b,r,.0,.43),a(b,r,0,.045),a(t,r,0,.045),'#757970');
          quad(a(t,r,.0,.45),a(t,r+.10,.10,.45),a(b,r+.10,.10,.45),a(b,r,.0,.45),light);
        }
        for(const s of [-1,1]){
          const width=bay/2-r;
          w.slab(u+s*(r+width/2),6.253,.207,width,6.49,.46,stone);
          w.slab(u+s*(r+.045),4.285,.272,.09,2.56,.39,light);
          w.slab(u+s*(r+.10),5.50,.29,.38,.095,.40,light);
        }
      }
      for(const [y,h,d,c] of [[9.20,.10,.48,light],[9.39,.24,.53,stone],[9.55,.09,.61,'#c0bcae'],[9.70,.20,.63,roof]]){
        w.slab(0,y,d*.50,len,h,d,c);
      }
      // Slender lower colonnade sits underneath the existing walkable deck.
      const depth=i<2?2.94:2.48;
      const us=i<2?[-7.25,-2.6,2.6,7.25]:[-9.93,-5.0,0,5,9.93];
      for(const u of us){
        const col=(y1,y2,r1,r2,c)=>g.rod(w.p(u,y1,depth),w.p(u,y2,depth),r1,r2,c);
        col(.015,.12,.20,.20,'#6c7480');col(.12,.24,.16,.16,'#80888d');
        col(.24,2.63,.136,.119,'#9a9d99');col(2.63,2.71,.128,.165,'#9fa39d');
        col(2.71,2.76,.174,.174,'#cac5b5');col(2.76,2.91,.164,.231,'#a4a69d');
        w.slab(u,2.924,depth,.46,.064,.46,'#a5a69f');
      }
    });
    // Steep outside panels and nearly flat central panels of the historic
    // glazed laylight have a continuous metal frame and warm cove-trim.
    const profile=[[-12,9.78],[-9.9,9.78],[-6.4,11.14],[6.4,11.14],[9.9,9.78],[12,9.78]];
    function roofStrip(z,width,depth,col){
      for(let j=1;j<profile.length;j++){
        const [a,ay]=profile[j-1],[b,by]=profile[j],p=(x,y,ss,h)=>[cx+x,y+h,z+ss*width/2];
        quad(p(a,ay,-1,-depth),p(b,by,-1,-depth),p(b,by,1,-depth),p(a,ay,1,-depth),col);
        for(const s of [-1,1])quad(p(a,ay,s,0),p(b,by,s,0),p(b,by,s,-depth),p(a,ay,s,-depth),roof);
      }
    }
    for(const z of [-12.7,-8.58,-4.29,0,4.29,8.58,12.7])roofStrip(z,.28,.16,'#9ea5a2');
    function balconyRail(a,b){
      const len=Math.hypot(a[0]-b[0],a[1]-b[1]),n=Math.ceil(len/.29);
      const at=(t,h)=>[cx+a[0]+(b[0]-a[0])*t,h,a[1]+(b[1]-a[1])*t];
      for(const y of [3.15,3.61])g.rod(at(0,y),at(1,y),.015,.015,'#454a4b');
      for(let j=0;j<=n;j++)g.rod(at(j/n,3.02),at(j/n,3.64),.010,.010,'#434b4f');
    }
    for(const s of [-1,1]){
      balconyRail([s*9.5,-10],[s*9.5,10]);
      balconyRail([0,10],[s*9.5,10]);balconyRail([0,-10],[s*7.42,-10]);
    }
    for(const [x,h] of profile.slice(1,-1))g.box([cx+x,h-.066,0],[.21,.21,25.7],'#969e9b');
    for(const x of [-3.22,0,3.22])g.box([cx+x,11.07,0],[.12,.17,25.7],'#98a2a1');
    for(const s of [-1,1]){
      for(let j=1;j<profile.length;j++){
        const [x0,y0]=profile[j-1],[x1,y1]=profile[j];
        quad([cx+x0,9.70,s*12.98],[cx+x1,9.70,s*12.98],[cx+x1,y1,s*12.98],[cx+x0,y0,s*12.98],roof);
      }
      g.box([cx+s*10.94,9.79,0],[2.03,.19,26],'#8c9494');
      g.box([cx,9.75,s*12.32],[24,.18,1.24],'#929894');
      g.box([cx+s*11.70,9.68,0],[.28,.16,26],light);
    }
  }
  if(kind==='rotunda' || kind==='all') rotunda();
  if(kind==='fossil' || kind==='all') fossilHall();
  if(kind==='ocean' || kind==='all') oceanHall();
  // Stone jambs, a lintel and a recessed reveal frame every actual connection.
  for(const {side,at,width} of portals || []) {
    const frame=({north:()=>wall(center,-13,1,0,0,1),south:()=>wall(center,13,1,0,0,-1),
                  west:()=>wall(center-12,0,0,1,1,0),east:()=>wall(center+12,0,0,1,-1,0)})[side]();
    const color=kind==='ocean'?'#566d78':trim, cap=kind==='ocean'?'#788b91':light;
    g=original;
    for(const sign of [-1,1]){
      frame.slab(at+sign*(width/2+.10),3,.08,.20,6,.52,color);
      frame.slab(at+sign*(width/2+.15),.25,.13,.30,.50,.64,cap);
    }
    frame.slab(at,6.14,.08,width+.6,.28,.52,color);
    frame.slab(at,6.34,.12,width+.8,.13,.64,cap);
  }
}

// Separate textured surfaces preserve the batching used for the stone shell.
// Art and optical surface textures are cached between visits to a floor.
const hallSurfaceMaterials = new Map();
function cachedHallMaterial(key,create){
  if(!hallSurfaceMaterials.has(key))hallSurfaceMaterials.set(key,create());
  return hallSurfaceMaterials.get(key);
}
function hallArtMap(key){
  const texture=new THREE.TextureLoader().load(rotundaArt[key]);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=6;
  return texture;
}
function hallCanvas(width,height,draw){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  draw(canvas.getContext('2d'),width,height);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=6;
  return texture;
}
function hallWindowMaterial(type){
  return cachedHallMaterial('daylight-'+type,()=>{
    const plain=type==='fossil';
    const texture=hallCanvas(1024,512,(ctx,w,h)=>{
      const sky=ctx.createLinearGradient(0,0,w*.49,h);
      sky.addColorStop(0,plain?'#b4c9d2':'#c9d9de');sky.addColorStop(.39,'#e7e8dd');sky.addColorStop(.66,'#fffbea');sky.addColorStop(1,'#e9e3cd');
      ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
      if(plain){
        // Muted distant tree canopy seen through the gallery glazing.
        let value=873;
        const random=()=>((value=Math.imul(value,1664525)+1013904223|0)>>>0)/4294967296;
        ctx.filter='blur(4px)';
        for(let layer=0;layer<3;layer++){
          for(let i=0;i<85;i++){
            const x=random()*w,base=h*(.78+.05*Math.sin(x*.015+layer));
            const r=9+random()*24,y=base+layer*16+random()*53;
            ctx.fillStyle=['#b7c3b4','#abc0a7','#97b096'][layer];ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
          }
        }
        ctx.filter='none';
      }else{
        const spacing=type==='screen'?22:27;
        // The leaded grille is made of repeating diamond and small circular
        // openings, with heavier structural rails across each group of lights.
        for(let y=-spacing;y<h+spacing;y+=spacing)for(let x=-spacing;x<w+spacing;x+=spacing){
          ctx.lineWidth=1.8;ctx.strokeStyle='#6f7267';ctx.beginPath();
          ctx.moveTo(x+spacing*.5,y);ctx.lineTo(x+spacing,y+spacing*.5);
          ctx.lineTo(x+spacing*.5,y+spacing);ctx.lineTo(x,y+spacing*.5);ctx.closePath();ctx.stroke();
          ctx.strokeStyle='#9a9c8e';ctx.beginPath();ctx.arc(x+spacing*.5,y+spacing*.5,spacing*.23,0,Math.PI*2);ctx.stroke();
          ctx.fillStyle='#b9baa6';ctx.fillRect(x+spacing*.41,y+spacing*.41,spacing*.18,spacing*.18);
        }
        for(let y=0;y<=h;y+=spacing*3){
          ctx.fillStyle='#666d64';ctx.fillRect(0,y,w,3);ctx.fillStyle='#b1ab8e';ctx.fillRect(0,y,w,1);
        }
      }
    });
    return new THREE.MeshBasicMaterial({map:texture,color:plain?0xe2ece3:0xfff7e6,side:THREE.DoubleSide,toneMapped:false});
  });
}
function hallGlowMaterial(){
  return cachedHallMaterial('lamp-wash',()=>{
    const map=hallCanvas(128,256,(ctx,w,h)=>{
      ctx.save();ctx.scale(w,h);const grad=ctx.createRadialGradient(.5,.9,.005,.5,.86,.55);
      grad.addColorStop(0,'rgba(255,217,142,.68)');grad.addColorStop(.28,'rgba(255,204,114,.46)');grad.addColorStop(.72,'rgba(253,189,103,.13)');grad.addColorStop(1,'rgba(255,180,100,0)');
      ctx.fillStyle=grad;ctx.fillRect(0,0,1,1);ctx.restore();
    });
    return new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending});
  });
}
function hallFlagMaterial(){
  return cachedHallMaterial('national-flag',()=>{
    const map=hallCanvas(760,400,(ctx,w,h)=>{
      const stripe=h/13;
      for(let i=0;i<13;i++){ctx.fillStyle=i%2?'#ece9d9':'#ad3c3e';ctx.fillRect(0,i*stripe,w,stripe+.5);}
      const unionW=.398*w,unionH=7*stripe;ctx.fillStyle='#35445b';ctx.fillRect(0,0,unionW,unionH);
      ctx.fillStyle='#fff4dd';
      for(let y=0;y<9;y++){
        const n=y%2?5:6;
        for(let x=0;x<n;x++){
          const xx=(x+(y%2?1:.5))*unionW/6,yy=(y+.5)*unionH/9,r=stripe*.30;
          ctx.beginPath();
          for(let k=0;k<10;k++){
            const t=k*Math.PI/5-Math.PI/2,rr=k%2?.39*r:r;
            const a=xx+Math.cos(t)*rr,b=yy+Math.sin(t)*rr;k?ctx.lineTo(a,b):ctx.moveTo(a,b);
          }ctx.closePath();ctx.fill();
        }
      }
    });
    return new THREE.MeshStandardMaterial({map,roughness:.88,side:THREE.DoubleSide});
  });
}

// Positions follow the lower-level plan in the museum's Ocean Life educator
// guide, with the Andros reef at +Z and the deep-sea confrontation at +X.
const oceanSideCases=[
  ['Diving for Pearls','diving for pearls','west',-9.74,3.44],
  ['Polar Bear','polar bear','west',-6.03,3.43],
  ['Sargasso Sea','sargasso sea','west',-2.32,3.40],
  ['Walrus','walrus','west',1.47,3.59],
  ['West Indian Manatee','west indian manatee','west',5.46,3.60],
  ['Northern Elephant Seal','elephant seal','north',-6.37,6.55],
  ['Northern Sea Lion','sea lion','north',6.43,6.43],
  ['Diving Birds','diving birds','east',-10.90,3.02],
  ['Harbor Seal','harbor seal','east',-7.65,3.03],
  ['Dolphin and Tuna','dolphin tuna','east',-4.32,3.12],
  ['Sea Otter','sea otter','east',-1.09,2.92],
  ['Tiger Shark','tiger shark','east',2.08,3.01]
];
const oceanSideStops=oceanSideCases.map(([name,art,side,u])=>{
  const end=side==='north',sign=side==='west'?-1:1;
  const lookX=end?u:sign*11.67,lookZ=end?-12.56:u*sign;
  const x=end?u:sign*6.83,z=end?-8.92:Math.max(-9.02,Math.min(9.02,lookZ));
  return {name,x,z,lookX,lookZ,lookY:1.58,wallLabel:true,
          markerLocal:[end?u:sign*11.41,.85,end?-12.4:lookZ]};
});

const saurischianPlinths=[[-5.50,.80,3.75,7.60],[5.55,.12,3.95,11.65]];
const fossilStudyCases=[
  ['Coelophysis bauri','coelophysis-slab','east',5.45,.81,1.68,'GHOST RANCH, NEW MEXICO · CAST STUDY'],
  ['Nesting oviraptorid','citipati-nest','west',6.02,.58,1.57,'GOBI DESERT, MONGOLIA · NEST STUDY']
];
const fossilStudyStops=fossilStudyCases.map(([name,key,side,u])=>{
  const sign=side==='west'?-1:1,z=u*sign;
  return {name,x:sign*8.58,z,lookX:sign*11.46,lookY:1.73,lookZ:z,
    wallLabel:true,markerLocal:[sign*11.10,1.12,z]};
});

function framedArt(label,key,illuminated=false){
  return cachedHallMaterial(label+'-'+key,()=>{
    const texture=hallArtMap(key);
    if(illuminated)return new THREE.MeshBasicMaterial({map:texture,color:0xf3f2e8,side:THREE.DoubleSide,toneMapped:false});
    return new THREE.MeshStandardMaterial({map:texture,roughness:.84,metalness:.01,side:THREE.DoubleSide});
  });
}
function wallCaption(title,subtitle,color='#dad9c9'){
  return cachedHallMaterial('caption-'+title,()=>{
    const map=hallCanvas(768,152,(ctx,w,h)=>{
      ctx.fillStyle='#20292b';ctx.fillRect(0,0,w,h);
      ctx.fillStyle=color;ctx.fillRect(0,0,w,4);
      ctx.fillStyle='#aeb7af';ctx.font='15px Arial,sans-serif';ctx.fillText(subtitle,22,43,w-44);
      ctx.fillStyle='#f4f0df';ctx.font='42px Georgia,serif';ctx.fillText(title,21,105,w-44);
    });
    return new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide,toneMapped:false});
  });
}
function floorSurface(group,key,color,roughness,repeat){
  const mat=cachedHallMaterial('pavement-'+key,()=>{
    const map=hallArtMap('fossil-floor');map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(repeat,repeat*1.04);
    return new THREE.MeshPhysicalMaterial({map,color,roughness,metalness:.035,clearcoat:.22,clearcoatRoughness:roughness,envMapIntensity:.50});
  });
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(23.99,25.99),mat);
  floor.rotation.x=-Math.PI/2;floor.position.y=.006;floor.receiveShadow=true;group.add(floor);return floor;
}

function addHallFinishes(host,kind,portals=[]){
  if(!['rotunda','ocean','fossil','ornith'].includes(kind))return;
  // wall-space u increases to the right when facing that facade from inside.
  const faces=[
    {name:'north',o:[0,-13],t:[1,0],n:[0,1],direction:1,art:'expedition'},
    {name:'south',o:[0,13],t:[-1,0],n:[0,-1],direction:-1,art:null},
    {name:'west',o:[-12,0],t:[0,-1],n:[1,0],direction:-1,art:'treaty'},
    {name:'east',o:[12,0],t:[0,1],n:[-1,0],direction:1,art:'canal'}
  ];
  const root=new THREE.Group();host.add(root);
  if(kind==='ocean')root.position.y=-3;

  for(const wall of faces){
    wall.p=(u,y,depth)=>[wall.o[0]+u*wall.t[0]+depth*wall.n[0],y,wall.o[1]+u*wall.t[1]+depth*wall.n[1]];
    wall.cuts=portals.filter(p=>p.side===wall.name).map(p=>[p.at*wall.direction-p.width/2,p.at*wall.direction+p.width/2]);
  }
  function mesh(geometry,mat){
    const object=new THREE.Mesh(geometry,mat);root.add(object);return object;
  }
  function surface(points,uv,index,material){
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv.flat(),2));
    geo.setIndex(index);geo.computeVertexNormals();return mesh(geo,material);
  }
  function panel(w,a,b,low,high,depth,mat){
    const stops=[a,b,...w.cuts.flat().filter(v=>v>a&&v<b)].sort((x,y)=>x-y);
    const p=[],uv=[],indices=[];
    for(let j=1;j<stops.length;j++){
      const lo=stops[j-1],hi=stops[j],mid=(lo+hi)/2;
      const bottom=w.cuts.some(([l,r])=>mid>=l&&mid<=r)?Math.max(low,6.012):low;
      if(bottom>=high||hi-lo<.001)continue;
      const offset=p.length;
      for(const [u,y] of [[lo,bottom],[hi,bottom],[hi,high],[lo,high]]){
        p.push(w.p(u,y,depth));uv.push([(u-a)/(b-a),(y-low)/(high-low)]);
      }
      indices.push(offset,offset+1,offset+2,offset,offset+2,offset+3);
    }
    if(p.length)return surface(p,uv,indices,mat);
  }
  function arc(w,middle,spring,r,depth,mat,topRatio=1){
    const p=[w.p(middle,spring,depth)],uv=[[.5,0]],index=[];
    for(let i=0;i<=72;i++){
      const a=i*Math.PI/72;
      p.push(w.p(middle+r*Math.cos(a),spring+r*topRatio*Math.sin(a),depth));
      uv.push([.5+.5*Math.cos(a),Math.sin(a)]);if(i)index.push(0,i,i+1);
    }
    return surface(p,uv,index,mat);
  }
  if(kind==='ocean'){addOceanHallSurfaces(root,faces,panel,surface);return;}
  if(kind==='fossil'||kind==='ornith'){addFossilHallSurfaces(root,faces,panel,surface,kind==='ornith');return;}
  const marble=cachedHallMaterial('rotunda-red-marble',()=>{
    const map=hallArtMap('marble');map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(1.5,3.2);
    return new THREE.MeshPhysicalMaterial({map,roughness:.32,metalness:.04,clearcoat:.27,clearcoatRoughness:.25});
  });
  const trim=cachedHallMaterial('bright-bronze',()=>new THREE.MeshStandardMaterial({color:0x776350,roughness:.31,metalness:.67}));
  function tube(a,b,rad,mat){
    const dir=new THREE.Vector3().fromArray(b).sub(new THREE.Vector3().fromArray(a));
    const rod=mesh(new THREE.CylinderGeometry(rad,rad,dir.length(),12),mat);
    rod.position.fromArray(a).addScaledVector(dir,.5);rod.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());return rod;
  }
  function flag(w,u,s){
    const mount=w.p(u,4.80,.62),top=w.p(u+s*.19,7.22,2.35);
    tube(mount,top,.036,trim);
    const finial=mesh(new THREE.SphereGeometry(.09,12,8),trim);finial.position.fromArray(top);
    const points=[],uv=[],idx=[],cols=26,rows=14;
    for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
      const across=i/cols,down=j/rows;
      const flute=Math.sin((across*2.8+.36*down)*Math.PI*2);
      const along=u+s*(.19+.64*across+.18*flute*across);
      const height=7.17-1.35*down-1.36*across-.10*Math.sin(across*Math.PI);
      const depth=2.32-.96*down+.20*across+.22*flute*across;
      points.push(w.p(along,height,depth));uv.push([across,1-down]);
      if(j&&i){const k=j*(cols+1)+i;idx.push(k-cols-2,k-cols-1,k,k-cols-2,k,k-1);}
    }
    const cloth=surface(points,uv,idx,hallFlagMaterial());cloth.castShadow=true;cloth.receiveShadow=true;
  }
  const transom=cachedHallMaterial('inner-transom',()=>{
    const map=hallCanvas(640,320,(ctx,w,h)=>{
      const shade=ctx.createLinearGradient(0,0,w,h);
      shade.addColorStop(0,'#333934');shade.addColorStop(.52,'#636660');shade.addColorStop(1,'#403e35');
      ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
      for(let y=-26;y<h+26;y+=13)for(let x=-26;x<w+26;x+=13){
        ctx.strokeStyle='#252921';ctx.lineWidth=2.5;ctx.beginPath();
        ctx.moveTo(x+6.5,y);ctx.lineTo(x+13,y+6.5);ctx.lineTo(x+6.5,y+13);ctx.lineTo(x,y+6.5);ctx.closePath();ctx.stroke();
        ctx.strokeStyle='#8c8c75';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y+6.5);ctx.lineTo(x+6.5,y);ctx.stroke();
      }
    });
    return new THREE.MeshStandardMaterial({map,color:0xd6cfb9,roughness:.42,metalness:.18,side:THREE.DoubleSide});
  });
  // Each inscription is cut into a side panel of the eastern or western wall.
  // The short excerpts are from the four historical Roosevelt inscriptions.
  const inscriptions={
    'NATURE':['THE HARDY LIFE','OF THE OPEN'],
    'MANHOOD':['LIVING UP TO','HIS IDEALS'],
    'YOUTH':['KEEP YOUR EYES','ON THE STARS'],
    'THE STATE':['WORTHY IDEALS WITH','PRACTICAL GOOD SENSE']
  };
  function inscription(w,u,title){
    const mat=cachedHallMaterial('inscription-'+title,()=>{
      const map=hallCanvas(1024,768,(ctx,x,y)=>{
        ctx.textAlign='center';ctx.textBaseline='middle';
        function carve(words,yy,font){
          ctx.font=font;
          ctx.fillStyle='rgba(245,235,212,.79)';ctx.fillText(words,x/2+1,yy+2);
          ctx.fillStyle='rgba(80,75,65,.73)';ctx.fillText(words,x/2,yy);
        }
        carve(title,260,'68px Georgia,serif');
        inscriptions[title].forEach((line,i)=>carve(line,430+i*57,'34px Georgia,serif'));
        ctx.lineWidth=2;ctx.strokeStyle='rgba(110,100,80,.5)';ctx.beginPath();
        ctx.moveTo(x*.275,333);ctx.lineTo(x*.725,333);ctx.stroke();
        ctx.save();ctx.translate(x*.50,333);ctx.rotate(Math.PI/4);ctx.fillStyle='#847e6e';ctx.fillRect(-6,-6,12,12);ctx.restore();
      });
      return new THREE.MeshStandardMaterial({map,transparent:true,depthWrite:false,roughness:.92});
    });
    panel(w,u-2.10,u+2.10,2.72,7.02,.546,mat);
  }
  for(const w of faces){
    // The shaft has a slight entasis and a polished red marble surface.
    for(const u of [-3.7,3.7]){
      const profile=[[.62,.70],[.64,.74],[.62,.80],[.62,2.3],[.615,3.8],[.59,6.35],[.56,8.60],[.54,9.68],[.56,9.79],[.56,9.82]];
      const shaft=mesh(new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),48),marble);
      shaft.position.fromArray(w.p(u,0,1.02));shaft.castShadow=true;shaft.receiveShadow=true;
    }
    if(w.art){
      const mat=cachedHallMaterial('mural-'+w.art,()=>{
        const texture=hallArtMap(w.art);
        return new THREE.MeshStandardMaterial({map:texture,roughness:.96,metalness:0,color:0xf7efdd,side:THREE.DoubleSide});
      });
      const work=panel(w,-6.26,6.26,1.16,10.57,.31,mat);if(work)work.receiveShadow=true;
      const titles={expedition:'African Expedition',treaty:'Treaty of Portsmouth',canal:'Panama Canal'};
      const u=w.name==='east'?4.93:-4.93;
      panel(w,u-.87,u+.87,.74,1.10,.35,wallCaption(titles[w.art],'WILLIAM ANDREW MACKAY · MURAL INTERPRETATION'));
    }else{
      panel(w,-5.26,5.26,3.10,5.30,.12,hallWindowMaterial('screen'));
      arc(w,0,5.30,5.26,.14,hallWindowMaterial('screen'));
      for(let j=-6;j<=6;j++){
        const u=j*.78,top=5.30+Math.sqrt(5.26**2-u*u);
        tube(w.p(u,3.1,.19),w.p(u,top,.19),j%3?.025:.055,trim);
      }
    }
    if(w.art){
      // The head of each passage is framed in dark metal, with a rectangular
      // transom. Keep the walking aperture below the lintel completely open.
      for(const [lo,hi] of w.cuts){
        const interior={...w,cuts:[]};
        panel(interior,lo+.115,hi-.115,3.50,5.73,.355,transom);
        for(const u of [lo+.095,(lo+hi)/2,hi-.095])
          tube(w.p(u,3.46,.38),w.p(u,5.80,.38),.048,trim);
        for(const y of [3.48,4.49,5.79])
          tube(w.p(lo+.04,y,.37),w.p(hi-.04,y,.37),y===4.49?.035:.085,trim);
      }
    }
    if(w.name==='north'||w.name==='south'){
      const titles=w.name==='north'?['MANHOOD','YOUTH']:['NATURE','THE STATE'];
      for(const sign of [-1,1])inscription(w,sign*9.18,titles[sign>0?1:0]);
    }
    if(w.name==='west'||w.name==='east'){
      arc(w,0,12.80,8.45,.12,hallWindowMaterial('lunette'));
      for(let j=-8;j<=8;j++){
        if(j===-3||j===3)continue;
        const u=j*.94,top=12.80+Math.sqrt(8.45**2-u*u);
        tube(w.p(u,12.80,.17),w.p(u,top,.17),.025,trim);
      }
    }
    const half=w.t[0]?12:13;
    for(const sign of [-1,1]){
      const u=sign*(half-1.56);
      panel(w,u-1.55,u+1.55,2.15,5.30,.59,hallGlowMaterial());
    }
    if(w.name==='north'||w.name==='south')flag(w,w.name==='north'?-9.0:9.0,w.name==='north'?-1:1);
  }
  addRotundaBeds(root);
  addRotundaPavement(root);
}

// The mother and calf share one rock bed; the approaching theropod stands on
// its own. Both thin black display bases follow the irregular stone outlines.
function addRotundaBeds(root){
  const rock=cachedHallMaterial('mount-rock',()=>{
    const map=hallArtMap('bedrock');map.wrapS=map.wrapT=THREE.RepeatWrapping;
    return new THREE.MeshStandardMaterial({map,bumpMap:map,bumpScale:.065,roughness:.95,vertexColors:true,side:THREE.DoubleSide});
  });
  const black=cachedHallMaterial('mount-lip',()=>new THREE.MeshStandardMaterial({color:0x242729,metalness:.12,roughness:.39,side:THREE.DoubleSide}));
  function build(cx,cz,rx,rz,seed){
    const count=84,rings=19,points=[],uv=[],colors=[],indices=[],lip=[],lipIndex=[];
    function outline(t){
      const c=Math.cos(t),s=Math.sin(t);
      const irregular=1+.027*Math.sin(7*t+seed)+.023*Math.cos(5*t-seed)+.012*Math.sin(13*t+seed);
      return [rx*Math.sign(c)*Math.pow(Math.abs(c),.64)*irregular,
              rz*Math.sign(s)*Math.pow(Math.abs(s),.64)*irregular];
    }
    for(let i=0;i<=rings;i++)for(let j=0;j<count;j++){
      const t=j*Math.PI*2/count,f=i/rings;
      const [u,v]=outline(t+(i===0||i===rings?0:Math.sin(j*8.1+i*2.62)*.013));
      const x=cx+u*f,z=cz+v*f;
      const band=.021*Math.sin(3.3*x+1.4*z)+.012*Math.cos(5.0*z-x)+.006*Math.sin(j*.81+i*1.27);
      const rim=Math.pow(f,9),y=.272+band-.073*rim;
      points.push(x,y,z);uv.push(x*.63+.16*z,z*.67);
      const tint=.92+.06*Math.cos(1.6*x-.9*z)+.018*Math.sin(j*1.78+i*3.11);
      colors.push(tint,tint*.986,tint*.957);
      if(i===0)continue;
      const k=i*count+j,n=i*count+(j+1)%count;
      indices.push(k-count,n,k,n-count,n,k-count);
      if(i===rings){
        for(const [r,h] of [[.982,.020],[1.002,.056],[1.011,.125],[1.006,y-.004]]){
          lip.push(cx+u*r,h,cz+v*r);
        }
        const a=j*4,b=((j+1)%count)*4;
        for(let k=0;k<3;k++)lipIndex.push(a+k,b+k,a+k+1,b+k,b+k+1,a+k+1);
      }
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geo.setIndex(indices);geo.computeVertexNormals();
    const stone=new THREE.Mesh(geo,rock);stone.castShadow=true;stone.receiveShadow=true;root.add(stone);
    const edge=new THREE.BufferGeometry();
    edge.setAttribute('position',new THREE.Float32BufferAttribute(lip,3));edge.setIndex(lipIndex);edge.computeVertexNormals();
    const footing=new THREE.Mesh(edge,black);footing.castShadow=true;footing.receiveShadow=true;root.add(footing);
  }
  build(-2.46,.02,5.10,2.43,1.6);
  build(5.18,-.29,2.33,1.63,4.4);
}

// Real-time reflection of the current mount, masonry and windows, limited to
// the polished floor in the entrance hall. The oblique near plane removes the
// geometry underneath the stone from the reflected camera's field of view.
// Projection method adapted from THREE.Reflector, Three.js (MIT).
function addRotundaPavement(parent){
  const compact=typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;
  const dimension=compact?320:576;
  const floatColor=typeof renderer!=='undefined'&&renderer?.extensions.has('EXT_color_buffer_float');
  const reflected={value:0};
  const target=new THREE.WebGLRenderTarget(dimension,dimension,{
    type:floatColor?THREE.HalfFloatType:THREE.UnsignedByteType,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:true
  });
  const material=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.32,metalness:.05});
  const matrix=new THREE.Matrix4(), sunTone=new THREE.Color(0xffe3a4);
  const scan=typeof galleryLight!=='undefined'?galleryLight.finishes.value:null;
  material.onBeforeCompile=shader=>{
    shader.uniforms.floorReflection={value:target.texture};
    shader.uniforms.floorMirrorReady=reflected;
    shader.uniforms.floorMatrix={value:matrix};
    shader.uniforms.floorStone={value:scan};
    shader.uniforms.floorLight={value:sunTone};
    shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
      varying vec4 rotReflect;
      varying vec2 rotFloorUV;
      uniform mat4 floorMatrix;`);
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      rotFloorUV=position.xy;rotReflect=floorMatrix*vec4(position,1.0);`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
      varying vec4 rotReflect;
      varying vec2 rotFloorUV;
      uniform sampler2D floorReflection, floorStone;
      uniform vec3 floorLight;
      uniform float floorMirrorReady;
      float strip(float v,float width,float aa){return 1.-smoothstep(width-aa,width+aa,v);}
      float glazed(vec2 p) {
        float lens=step(0.,p.y)*(1.-smoothstep(8.0,8.65,length(p)));
        vec2 iron=min(fract(p/vec2(.95,1.29)),1.-fract(p/vec2(.95,1.29)))*vec2(.95,1.29);
        float bar=max(strip(iron.x,.056,.055),strip(iron.y,.062,.051));
        float pier=strip(abs(abs(p.x)-2.83),.21,.13);
        return lens*(1.-.66*bar)*(1.-.84*pier);
      }`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec2 pos=vec2(rotFloorUV.x,-rotFloorUV.y);
      vec2 module=vec2(3.0,3.25);
      vec2 f=fract(pos/module+.5);
      vec2 margin=min(f,1.-f)*module;
      float edge=min(margin.x,margin.y), aa=max(.007,.56*fwidth(edge));
      float mainBand=strip(edge,.205,aa);
      float pinstripe=strip(abs(edge-.315),.022,aa);
      float crossing=(strip(margin.x,.29,aa)*strip(margin.y,.29,aa));
      float brass=strip(abs(edge-.231),.009,aa)*(1.-crossing);
      vec2 cell=floor(pos/module+.5);
      float cellTint=fract(sin(dot(cell,vec2(37.71,48.24)))*1245.34);
      vec2 tilePos=pos*(mod(cell.x+cell.y,2.)>.5?vec2(.37,.55):vec2(-.47,.42))+.31*cell;
      vec3 grain=texture2D(floorStone,tilePos).rgb;
      float chips=texture2D(floorStone,pos*3.7).g;
      vec3 lightStone=mix(vec3(.40,.365,.292),vec3(.59,.55,.46),cellTint*.55+.12);
      lightStone*=.86+.22*grain.r+.065*grain.g+.065*chips;
      vec3 darkStone=vec3(.036,.043,.041)*(.58+1.05*grain.r+.21*grain.g);
      vec3 pavement=mix(lightStone,darkStone,max(mainBand,pinstripe));
      pavement=mix(pavement,vec3(.10,.09,.073),crossing*.73);
      pavement=mix(pavement,vec3(.46,.33,.16),brass*.68);
      diffuseColor.rgb=pavement;
      // Late morning light from the tall windows, softened by the stone's
      // roughness. The shadow-pass still contributes fossil contact shadows.
      vec2 projected=vec2(pos.y+.30*(pos.x+12.),1.38*(pos.x+12.)-12.80);
      float sunlight=glazed(projected);
      diffuseColor.rgb*=mix(vec3(1.),vec3(1.38,1.29,1.11),sunlight);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      roughnessFactor=mix(.37,.205,mainBand)+.035*(grain.r-.50);`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
      vec2 rr=rotReflect.xy/rotReflect.w;
      vec2 jitter=(grain.rg-.5)*.0024;
      vec2 blur=vec2(.0033)*(1.-mainBand*.53);
      vec3 reflection=texture2D(floorReflection,rr+jitter).rgb*.32;
      reflection+=texture2D(floorReflection,rr+jitter+blur).rgb*.17;
      reflection+=texture2D(floorReflection,rr+jitter-blur).rgb*.17;
      reflection+=texture2D(floorReflection,rr+jitter+vec2(blur.x,-blur.y)).rgb*.17;
      reflection+=texture2D(floorReflection,rr+jitter-vec2(blur.x,-blur.y)).rgb*.17;
      float graz=pow(1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.),2.35);
      float spec=mix(.085,.16,mainBand)+graz*mix(.16,.26,mainBand);
      outgoingLight=mix(outgoingLight,reflection,spec*floorMirrorReady);
      outgoingLight+=floorLight*pavement*sunlight*.28;
      #include <opaque_fragment>`);
  };
  material.customProgramCacheKey=()=>'rotunda-terrazzo-with-reflection-v3';
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(23.996,25.996),material);
  plane.rotation.x=-Math.PI/2;plane.position.y=.012;plane.receiveShadow=true;parent.add(plane);
  const mirror=new THREE.PerspectiveCamera(),world=new THREE.Vector3(),cameraPos=new THREE.Vector3();
  const normal=new THREE.Vector3(0,1,0),dir=new THREE.Vector3(),up=new THREE.Vector3(),to=new THREE.Vector3();
  const lastPos=new THREE.Vector3(Infinity,Infinity,Infinity),lastRot=new THREE.Quaternion();
  const cut=new THREE.Plane(),coeff=new THREE.Vector4(),q=new THREE.Vector4();
  let last=0,rendering=false;
  plane.onBeforeRender=(renderer,scene,cam)=>{
    if(rendering||!cam.isPerspectiveCamera||cam===mirror||scene.overrideMaterial)return;
    if(typeof quality!=='undefined'&&quality==='low'){reflected.value=0;return;}
    world.setFromMatrixPosition(plane.matrixWorld);cam.getWorldPosition(cameraPos);
    if(Math.abs(cameraPos.x-world.x)>15.15||Math.abs(cameraPos.z-world.z)>13.15||cameraPos.y<=world.y)return;
    const now=performance.now(),changed=cameraPos.distanceToSquared(lastPos)>.0001||1-Math.abs(lastRot.dot(cam.quaternion))>.000001;
    if(now-last<(compact?110:62)||(!changed&&now-last<720))return;
    last=now;lastPos.copy(cameraPos);lastRot.copy(cam.quaternion);
    mirror.near=cam.near;mirror.far=cam.far;
    mirror.position.copy(cameraPos);mirror.position.y=2*world.y-cameraPos.y;
    cam.getWorldDirection(dir);dir.reflect(normal);to.copy(mirror.position).add(dir);
    up.set(0,1,0).applyQuaternion(cam.quaternion).reflect(normal);mirror.up.copy(up);
    mirror.lookAt(to);mirror.updateMatrixWorld(true);
    mirror.projectionMatrix.copy(cam.projectionMatrix);
    matrix.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse).multiply(plane.matrixWorld);
    cut.setFromNormalAndCoplanarPoint(normal,world).applyMatrix4(mirror.matrixWorldInverse);
    coeff.set(cut.normal.x,cut.normal.y,cut.normal.z,cut.constant);
    const proj=mirror.projectionMatrix.elements;
    q.set((Math.sign(coeff.x)+proj[8])/proj[0],(Math.sign(coeff.y)+proj[9])/proj[5],-1,(1+proj[10])/proj[14]);
    coeff.multiplyScalar(2/coeff.dot(q));
    proj[2]=coeff.x;proj[6]=coeff.y;proj[10]=coeff.z+1-.002;proj[14]=coeff.w;
    mirror.projectionMatrixInverse.copy(mirror.projectionMatrix).invert();
    const previous=renderer.getRenderTarget(),face=renderer.getActiveCubeFace(),level=renderer.getActiveMipmapLevel();
    const shadow=renderer.shadowMap.autoUpdate,needsShadow=renderer.shadowMap.needsUpdate,xr=renderer.xr.enabled;
    const visibility=plane.visible,hidden=[];
    const hallHost=parent.parent;
    for(const sibling of hallHost?.parent?.children||[]){
      if(sibling!==hallHost&&sibling.isGroup&&sibling.visible){sibling.visible=false;hidden.push(sibling);}
    }
    rendering=true;plane.visible=false;renderer.xr.enabled=false;
    renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;
    try{
      renderer.setRenderTarget(target);renderer.state.buffers.depth.setMask(true);renderer.clear();
      renderer.render(scene,mirror);reflected.value=1;
    }finally{
      renderer.setRenderTarget(previous,face,level);renderer.xr.enabled=xr;
      renderer.shadowMap.autoUpdate=shadow;renderer.shadowMap.needsUpdate=needsShadow;
      if(cam.viewport)renderer.state.viewport(cam.viewport);
      for(const sibling of hidden)sibling.visible=true;
      plane.visible=visibility;rendering=false;
    }
  };
  plane.geometry.addEventListener('dispose',()=>target.dispose());
}

// The museum's 2003 restoration relit its original glass laylight from above.
// A slowly changing light pattern is confined to the glazing, so the marine
// dioramas and the dark whale floor retain their own exhibition lighting.
function addOceanHallSurfaces(root,walls,panel,surface){
  const floor=floorSurface(root,'ocean',0x414750,.32,9);
  // Intersect the reflected sight ray with a low-resolution atlas of the
  // perimeter lights. This reproduces the coloured reflections at the whale
  // floor without rendering the entire room a second time.
  const inv=new THREE.Matrix4();
  const material=floor.material;
  if(!material.userData.perimeter){
    material.userData.perimeter={inverse:{value:inv},map:{value:hallArtMap('ocean-case-reflection')}};
    material.onBeforeCompile=shader=>{
      shader.uniforms.oceanInverse=material.userData.perimeter.inverse;
      shader.uniforms.oceanWallMap=material.userData.perimeter.map;
      shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
        varying vec2 oceanFloor;`).replace('#include <begin_vertex>',`#include <begin_vertex>
        oceanFloor=vec2(position.x,-position.y);`);
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
        varying vec2 oceanFloor;
        uniform mat4 oceanInverse;
        uniform sampler2D oceanWallMap;`).replace('#include <opaque_fragment>',`
        vec3 viewer=(oceanInverse*vec4(cameraPosition,1.)).xyz;
        vec2 lateral=oceanFloor-viewer.xz;
        vec2 directions=sign(lateral+vec2(.000001));
        vec2 hits=(vec2(12.,13.)-directions*oceanFloor)/max(abs(lateral),vec2(.00001));
        float dist=min(hits.x,hits.y);
        vec2 point=oceanFloor+lateral*dist;
        float height=viewer.y*dist;
        bool end=hits.y<hits.x, positive=end?lateral.y>0.:lateral.x>0.;
        float wall=end?(positive?1.:0.):(positive?3.:2.);
        float along=end?(positive?-point.x:point.x):(positive?point.y:-point.y);
        vec2 atlasUv=vec2((wall+.5+along/(end?24.:26.))*.25,clamp(height/3.,.003,.997));
        vec3 coloredReflection=texture2D(oceanWallMap,atlasUv).rgb;
        float fresnel=1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.);
        float gloss=(.069+.23*pow(fresnel,2.3))*(1.-smoothstep(2.62,3.08,height));
        outgoingLight=mix(outgoingLight,coloredReflection,gloss);
        #include <opaque_fragment>`);
    };
    material.customProgramCacheKey=()=>'ocean-polished-case-lights-v1';
  }
  floor.onBeforeRender=()=>material.userData.perimeter.inverse.value.copy(root.matrixWorld).invert();
  const caustic=cachedHallMaterial('ocean-laylight',()=>{
    const time={value:0};
    const material=new THREE.ShaderMaterial({
      side:THREE.DoubleSide,uniforms:{elapsed:time},
      vertexShader:`varying vec2 roofUv;void main(){roofUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`varying vec2 roofUv;uniform float elapsed;
        void main(){
          vec2 p=roofUv;
          float ripple=sin(2.2*p.x+.8*sin(p.y*.84+elapsed*.14)+elapsed*.32)
                       +.70*sin(1.46*p.y-1.28*p.x+elapsed*.19)
                       +.36*cos(3.14*p.x+2.18*p.y-elapsed*.25);
          float water=1.-smoothstep(.06,.48,abs(ripple));
          float cloud=.5+.5*sin(.45*p.x+.61*p.y+.43*sin(p.y*.83)+elapsed*.10);
          vec3 glow=mix(vec3(.044,.190,.47),vec3(.135,.48,.84),cloud*.70+water*.26);
          vec2 cell=abs(fract((p+vec2(.38,.04))/vec2(.807,.858))-.5);
          float grille=smoothstep(.458,.493,max(cell.x,cell.y));
          glow=mix(glow,vec3(.045,.100,.137),grille*.91);
          gl_FragColor=vec4(glow,1.);
          #include <colorspace_fragment>
        }`
    });
    material.userData.lightTime=time;return material;
  });
  const section=[[-9.93,9.765],[-6.40,11.125],[6.40,11.125],[9.93,9.765]];
  const points=[],uv=[],idx=[];
  for(let j=1;j<section.length;j++){
    const [x0,y0]=section[j-1],[x1,y1]=section[j],n=points.length;
    for(const a of [[x0,y0,-12.70],[x1,y1,-12.70],[x1,y1,12.70],[x0,y0,12.70]]){points.push(a);uv.push([a[0],a[2]]);}
    idx.push(n,n+1,n+2,n,n+2,n+3);
  }
  const glass=surface(points,uv,idx,caustic);
  glass.onBeforeRender=()=>{caustic.userData.lightTime.value=performance.now()*.001;};
  function alcove(w,u,width){
    const hw=width/2,low=.435,top=2.47,spring=1.89;
    const arc=(t,height,d,extend=0)=>w.p(u+(hw+extend)*Math.cos(t),spring+(top+height-spring)*Math.sin(t),d);
    const p=[],uv=[],ind=[];
    // Inset five centimetres leaves a broad dark arched reveal at the glass.
    for(let j=0;j<=26;j++){
      const theta=(1-j/26)*Math.PI;
      const x=Math.cos(theta),ty=spring+(top-spring)*Math.sin(theta);
      p.push(w.p(u+hw*x,low,.352),arc(theta,0,.352));uv.push([.5+.5*x,0],[.5+.5*x,(ty-low)/(top-low)]);
      if(j){const k=j*2;ind.push(k-2,k,k+1,k-2,k+1,k-1);}
    }
    return {p,uv,ind};
  }
  for(const [title,key,side,u,width] of oceanSideCases){
    // The main hall is entered on its mezzanine; lower display windows do
    // not open into the neighbouring gallery even when they are below a door.
    const w={...walls.find(x=>x.name===side),cuts:[]};
    const surround=cachedHallMaterial('ocean-case-trim',()=>new THREE.MeshStandardMaterial({color:0x202833,roughness:.65,metalness:.16}));
    panel(w,u-width/2-.08,u+width/2+.08,.265,2.64,.302,surround);
    const box=alcove(w,u,width);
    surface(box.p,box.uv,box.ind,framedArt('marine-diorama',key,true));
    const caption=wallCaption(title,'MILSTEIN HALL OF OCEAN LIFE');
    const labelWidth=Math.min(2.38,width*.79);
    panel(w,u-labelWidth/2,u+labelWidth/2,.066,.381,.384,caption);
  }
  // Low ecosystem displays stand inside the tall shadowed arches on the
  // mezzanine. The two-storey Andros and Kelp cases occupy the far end wall.
  const upper=[
    ['east',-8.70,'mangrove-ocean','Mangrove Forests'],
    ['east',0,'coral-ocean','Coral Reefs'],
    ['east',8.67,'seafloor-ocean','Sea Floor'],
    ['north',-7.82,'estuary-ocean','Ocean Exploration'],
    ['north',0,'seafloor-ocean','Marine Invertebrates'],
    ['north',7.82,'kelp-ocean','Marine Vertebrates'],
    ['west',8.70,'vent-ocean','Deep Sea'],
    ['west',0,'estuary-ocean','Estuaries'],
    ['west',-8.67,'polar-ocean','Polar Seas']
  ];
  const border=cachedHallMaterial('upper-case-border',()=>new THREE.MeshStandardMaterial({color:0x303a3d,roughness:.57}));
  for(const [side,center,key,title] of upper){
    const w=walls.find(x=>x.name===side);
    // Where a passage opens in an arcade, place its projection screen above
    // the lintel or alongside the door. Every existing doorway stays clear.
    const u0=center-3.04,u1=center+3.04;
    const stops=[u0,u1,...w.cuts.flat().filter(v=>v>u0&&v<u1)].sort((a,b)=>a-b);
    let lo=center,hi=center;
    for(let j=1;j<stops.length;j++){
      const a=stops[j-1],b=stops[j],mid=(a+b)/2;
      if(!w.cuts.some(([l,r])=>mid>l&&mid<r)&&b-a>hi-lo){lo=a;hi=b;}
    }
    const above=hi-lo<2.95;
    const u=above?center:(lo+hi)/2,half=above?1.90:Math.min(2.25,(hi-lo)*.445);
    const y=above?6.66:side==='east'&&center>7?4.83:3.62,ht=above?1.36:1.72;
    panel(w,u-half-.11,u+half+.11,y-.12,y+ht+.13,.252,border);
    panel(w,u-half,u+half,y,y+ht,.276,framedArt('marine-panel',key,true));
    if(!above)panel(w,u-.91,u+.91,y-.45,y-.14,.280,wallCaption(title,'MARINE ECOSYSTEMS'));
  }
  for(const w of walls){
    const half=w.t[0]?12:13;
    for(const u of [-half/3,half/3]){
      panel(w,u-.84,u+.84,3.22,7.48,.465,hallGlowMaterial());
    }
  }

}

function addFossilHallSurfaces(root,walls,panel,surface,ornith=false){
  floorSurface(root,'fossil',0xe3e9df,.34,10);
  const plaster=cachedHallMaterial('ceiling-plaster',()=>new THREE.MeshStandardMaterial({
    color:0xd6d4ca,roughness:.92,emissive:0xb9b4a3,emissiveIntensity:.47,side:THREE.DoubleSide
  }));
  const ceiling=new THREE.Mesh(new THREE.PlaneGeometry(24,26),plaster);
  ceiling.rotation.x=Math.PI/2;ceiling.position.y=7.478;root.add(ceiling);
  const paint=cachedHallMaterial('fossil-gallery-paint',()=>new THREE.MeshStandardMaterial({
    color:0xc7c9be,roughness:.90,emissive:0xaaad9e,emissiveIntensity:.115
  }));
  for(const w of walls){
    if(w.name==='south')continue;
    const half=w.t[0]?12:13;
    panel(w,-half,half,.51,6.85,.068,paint);
  }
  const beam=cachedHallMaterial('fossil-beam-paint',()=>new THREE.MeshStandardMaterial({
    color:0xd6d3c7,roughness:.88,emissive:0xaea897,emissiveIntensity:.40,side:THREE.DoubleSide
  }));
  const beamFaces=[],beamUV=[],beamIndex=[];
  function underside(a,b,y,c,d){
    const k=beamFaces.length;beamFaces.push([a,y,b],[c,y,b],[c,y,d],[a,y,d]);
    beamUV.push([0,0],[1,0],[1,1],[0,1]);beamIndex.push(k,k+1,k+2,k,k+2,k+3);
  }
  for(const x of [-7.25,0,7.25])underside(x-.202,-13,7.222,x+.202,13);
  for(const z of [-11,-5.5,0,5.5,11])underside(-12,z-.207,7.172,12,z+.207);
  surface(beamFaces,beamUV,beamIndex,beam);
  const far=walls.find(w=>w.name==='south'),day=hallWindowMaterial('fossil');
  if(ornith){
    const room=catalog.get('ornith'),form=new GalleryMesh();
    for(const side of [far,walls.find(w=>w.name==='north')])for(const u of [-10.0,-7.1,-4.2,-1.3,1.6,4.5,7.4,10.3]){
      if(side.cuts.some(([lo,hi])=>u+1>lo&&u-1<hi))continue;
      panel(side,u-.98,u+.98,1.11,6.72,.24,day);
      const frame='#92988d';for(const v of [-.99,0,.99])form.rod(side.p(u+v,1.05,.27),side.p(u+v,6.76,.27),v?.058:.026,v?.058:.026,frame);
      for(const y of [1.08,2.95,4.82,6.77])form.rod(side.p(u-1,y,.28),side.p(u+1,y,.28),.042,.042,frame);
      form.box(side.p(u,1.02,.24),[2.14,.115,.35],'#b8b9ac');
    }
    form.box([0,7.39,0],[23.97,.16,25.95],'#dadbd3');
    for(const x of [-9.14,-6.12,-3.08,0,3.08,6.12,9.14])form.box([x,7.20,0],[.17,.30,25.98],'#c6c8bc');
    for(const z of [-8.7,0,8.7])form.box([0,7.22,z],[23.98,.31,.36],'#c9cbbf');
    root.add(form.finish());buildOrnithResearch(root,room);
  }else for(const u of [-7.7,0,7.7])panel(far,u-2.32,u+2.32,1.06,5.60,.080,day);
  const glass=cachedHallMaterial('fossil-clear-glass',()=>new THREE.MeshPhysicalMaterial({
    color:0x9bc9b6,roughness:.18,metalness:.04,transparent:true,opacity:.125,
    clearcoat:.56,envMapIntensity:.9,side:THREE.DoubleSide,depthWrite:false
  }));
  const rim=cachedHallMaterial('vitrine-polished-edge',()=>new THREE.MeshStandardMaterial({color:0x698c7d,metalness:.35,roughness:.31}));
  const metal=cachedHallMaterial('pendant-bronze',()=>new THREE.MeshStandardMaterial({color:0x423d33,metalness:.69,roughness:.32}));
  const porcelain=cachedHallMaterial('pendant-opaline',()=>new THREE.MeshBasicMaterial({color:0xfff3d8,toneMapped:false,side:THREE.DoubleSide}));
  function rod(a,b,r,material){
    const dir=new THREE.Vector3().fromArray(b).sub(new THREE.Vector3().fromArray(a));
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,dir.length(),8),material);
    mesh.position.fromArray(a).addScaledVector(dir,.50);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());root.add(mesh);return mesh;
  }
  // The glass edge is visible end-on but the skull and feet remain legible
  // through the front of the low case.
  const stages=ornith?Object.values(ornithLayout).map(([x,z])=>[x,z,4.48,3.24]):saurischianPlinths;
  const sections=stages.flatMap(([x,z,w,d])=>{
    const l=x-w/2,r=x+w/2,t=z-d/2,b=z+d/2;
    return [[l,t,r,t],[r,t,r,b],[r,b,l,b],[l,b,l,t]];
  });
  for(const [x0,z0,x1,z1] of sections){
    surface([[x0,.185,z0],[x1,.185,z1],[x1,1.015,z1],[x0,1.015,z0]],[[0,0],[1,0],[1,1],[0,1]],[0,1,2,0,2,3],glass);
    rod([x0,1.018,z0],[x1,1.018,z1],.012,rim);
  }
  // Use one instance batch per part of the historic three-chain pendants.
  const lamps=[];for(const x of (ornith?[-9,-4.5,0,4.5,9]:[-5.66,5.66]))for(const z of (ornith?[-6.3,6.3]:[-9.9,-4.95,0,4.95,9.9]))lamps.push([x,z]);
  const pieces=[
    [new THREE.LatheGeometry([[.01,0],[.13,.018],[.27,.063],[.39,.13],[.48,.235],[.505,.305]].map(p=>new THREE.Vector2(...p)),44),porcelain,5.27],
    [new THREE.LatheGeometry([[.474,.275],[.516,.284],[.532,.310],[.532,.344],[.504,.355],[.485,.334]].map(p=>new THREE.Vector2(...p)),44),metal,5.27],
    [new THREE.CylinderGeometry(.178,.110,.072,24),metal,7.345],
    [new THREE.SphereGeometry(.060,14,9),metal,5.237]
  ];
  for(const [geometry,material,y] of pieces){
    const batch=new THREE.InstancedMesh(geometry,material,lamps.length);
    lamps.forEach(([x,z],i)=>batch.setMatrixAt(i,new THREE.Matrix4().makeTranslation(x,y,z)));
    root.add(batch);
  }
  const links=[],up=new THREE.Vector3(0,1,0);
  function link(a,b,r){
    const vec=new THREE.Vector3().fromArray(b).sub(new THREE.Vector3().fromArray(a));
    const mid=new THREE.Vector3().fromArray(a).addScaledVector(vec,.5);
    links.push(new THREE.Matrix4().compose(mid,new THREE.Quaternion().setFromUnitVectors(up,vec.clone().normalize()),new THREE.Vector3(r,vec.length(),r)));
  }
  for(const [x,z] of lamps){
    for(let j=0;j<3;j++){
      const theta=j*Math.PI*2/3,c=Math.cos(theta),s=Math.sin(theta);
      link([x,7.30,z],[x+c*.48,5.59,z+s*.48],.0125);
      let before=[x,5.26,z];
      for(let j=1;j<=9;j++){
        const a=(Math.PI/2)*j/9,n=[x+.506*Math.sin(a)*c,5.27+.312*(1-Math.cos(a)),z+.506*Math.sin(a)*s];
        link(before,n,.012);before=n;
      }
    }
  }
  const rods=new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1,1,6),metal,links.length);
  links.forEach((m,i)=>rods.setMatrixAt(i,m));root.add(rods);
  // The thick black cladogram line and its branch points are part of the
  // actual floor design throughout the fourth-floor fossil circuit.
  const path=cachedHallMaterial('cladogram-path',()=>new THREE.MeshStandardMaterial({color:0x404b4b,roughness:.33,metalness:.05}));
  const route=[[0,-13],[0,-10.70],[2.80,-8.40],[4.15,-7.92],[4.15,-6.52],[2.75,-4.13],[0,-2.70],[0,13]];
  function stripe(a,b,width){
    const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
    const nx=-dz*width/len*.5,nz=dx*width/len*.5;
    const p=[[a[0]+nx,.018,a[1]+nz],[b[0]+nx,.018,b[1]+nz],[b[0]-nx,.018,b[1]-nz],[a[0]-nx,.018,a[1]-nz]];
    surface(p,[[0,0],[1,0],[1,1],[0,1]],[0,1,2,0,2,3],path);
  }
  if(ornith){
    stripe([-12,.66],[12,.66],.28);
    for(const [x,to] of [[-9.95,5.40],[-4.68,2.41],[-1.14,-7.8],[7.56,2.6],[7.87,-5.80]]){
      stripe([x,.66],[x,to],.15);
      const dot=new THREE.Mesh(new THREE.CircleGeometry(.24,32),path);dot.position.set(x,.032,.66);dot.rotation.x=-Math.PI/2;root.add(dot);
    }
    return;
  }
  for(let i=1;i<route.length;i++)stripe(route[i-1],route[i],.43);
  stripe([0,2.55],[-3.62,2.55],.19);stripe([0,-1.54],[3.58,-1.54],.19);
  for(const [x,z] of [[0,2.55],[0,-1.54]]){
    const disc=new THREE.Mesh(new THREE.CircleGeometry(.39,48),path);disc.rotation.x=-Math.PI/2;disc.position.set(x,.024,z);root.add(disc);
  }
  const back=walls.find(w=>w.name==='north');
  for(const [u,key] of [[-7.22,'hell-creek-a'],[7.22,'hell-creek-b']]){
    panel(back,u-4.34,u+4.34,3.72,6.68,.18,framedArt('excavation-panorama',key));
    panel(back,u-2.13,u+2.13,3.25,3.62,.20,wallCaption('Hell Creek Formation','FIELD LOCALITIES'));
  }
  for(const [side,u,key,title] of [['west',-3.82,'brontosaurus','Sauropoda'],['east',-4.02,'ceratosaurus','Theropoda']]){
    const w=walls.find(x=>x.name===side);
    const backing=cachedHallMaterial('fossil-plate-frame',()=>new THREE.MeshStandardMaterial({color:0x69786d,roughness:.54}));
    panel(w,u-3.5,u+3.5,1.16,4.41,.14,backing);
    const mat=cachedHallMaterial('archival-mountboard',()=>new THREE.MeshStandardMaterial({color:0xe3e2d9,roughness:.86}));
    panel(w,u-3.44,u+3.44,1.22,4.36,.162,mat);
    const half=key==='brontosaurus'?2.16:1.27;
    panel(w,u-half,u+half,1.27,4.31,.172,framedArt('archival-plate',key));
    panel(w,u-1.62,u+1.62,.71,1.1,.18,wallCaption(title,'HISTORICAL SKELETAL STUDIES'));
  }
  // Slab casts in shallow, glazed cases. The photographed slab outlines and
  // tonality are retained while the gently convex surface catches light.
  const backing=cachedHallMaterial('small-case-back',()=>new THREE.MeshStandardMaterial({color:0xb1b5aa,roughness:.8,emissive:0x979b88,emissiveIntensity:.19}));
  const dark=cachedHallMaterial('small-case-side',()=>new THREE.MeshStandardMaterial({color:0x54605e,roughness:.47,metalness:.13}));
  const silver=cachedHallMaterial('small-case-sill',()=>new THREE.MeshStandardMaterial({color:0xa3aaa0,roughness:.33,metalness:.27}));
  function wallBlock(w,u,y,depth,width,height,t,mat){
    const size=[Math.abs(w.t[0])*width+Math.abs(w.n[0])*t,height,Math.abs(w.t[1])*width+Math.abs(w.n[1])*t];
    const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat);m.position.fromArray(w.p(u,y,depth));m.receiveShadow=true;root.add(m);
  }
  for(const [title,key,side,u,half,height,subtitle] of fossilStudyCases){
    const w=walls.find(x=>x.name===side),h=1.64,caseHalf=half+.36;
    wallBlock(w,u,.34,.37,caseHalf*2+.13,.68,.71,dark);
    wallBlock(w,u,.704,.41,caseHalf*2+.18,.055,.81,silver);
    wallBlock(w,u,1.77,.18,caseHalf*2,2.09,.11,backing);
    for(const sign of [-1,1])wallBlock(w,u+sign*caseHalf,1.77,.45,.039,2.14,.58,rim);
    wallBlock(w,u,2.84,.45,caseHalf*2+.09,.063,.60,silver);
    const mat=cachedHallMaterial('slab-'+key,()=>new THREE.MeshStandardMaterial({
      map:hallArtMap(key),roughness:.88,alphaTest:.43,emissive:0x756c58,emissiveIntensity:.09,side:THREE.DoubleSide
    }));
    const p=[],tex=[],idx=[],cols=24,rows=17;
    for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){
      const xx=x/cols,yy=y/rows;
      const relief=.055+.12*((1-(2*xx-1)**2)*(1-(2*yy-1)**2));
      p.push(w.p(u+half*(xx*2-1),h+(yy-.5)*height,.29+relief));tex.push([xx,yy]);
      if(x&&y){const n=y*(cols+1)+x;idx.push(n-cols-2,n-cols-1,n,n-cols-2,n,n-1);}
    }
    const slab=surface(p,tex,idx,mat);slab.castShadow=true;slab.receiveShadow=true;
    panel(w,u-caseHalf,u+caseHalf,.74,2.81,.765,glass);
    panel(w,u-Math.min(.84,caseHalf-.08),u+Math.min(.84,caseHalf-.08),.303,.611,.782,wallCaption(title,subtitle));
  }

}
