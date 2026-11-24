// These smaller galleries use freestanding interpretive displays.
// Coordinates are local to one hall and leave both door axes unobstructed.
function addCollection(g,name) {
  const stops=[], TAU=Math.PI*2;
  const nativeArt=typeof addCollectionDetails==='function';
  function station(title,x,z,height,width=4,depth=2.8,base=.4) {
    g.box([x,base*.5,z],[width,base,depth],'#403b33');
    g.box([x,base+.035,z],[width-.05,.07,depth-.05],'#b4a38a');
    stops.push({name:title,x,z:z+Math.sign(-z)*(depth/2+2.3),lookX:x,lookY:height,lookZ:z,width,depth});
    return (dx,y,dz)=>[x+dx,base+.07+y,z+dz];
  }
  const triangle=(a,b,c,color)=>g.tri(a,b,c,color);
  const quad=(a,b,c,d,color)=>{triangle(a,b,c,color);triangle(a,c,d,color);};
  const tip=(a,b,r,c)=>g.rod(a,b,r,.006,c);
  const tree=(at,x,z,h)=>{
    g.rod(at(x,0,z),at(x,h*.88,z),h*.045,h*.015,'#615541');
    for(let i=0;i<4;i++)g.rod(at(x,h*(.23+i*.16),z),at(x,h*(.6+i*.135),z),h*(.24-.043*i),.001,i%2?'#3a5343':'#415849');
  };
  function forest(){
    const at=station('Giant sequoia cross-section',-6,-5,2.9,6.8,2);
    if(nativeArt){station('Conifer forest',6,5,1.9,4,2.7);return;}
    const outer=3.04;
    // Faceted concentric surfaces preserve the irregular outline and bark thickness.
    const ringPoint=(a,r,z)=>{
      const irregular=1+.025*Math.sin(5*a+.6)+.018*Math.cos(3*a)+.012*Math.sin(11*a);
      return at(r*Math.cos(a)*irregular,3.05+r*Math.sin(a)*irregular*.94,z);
    };
    const rings=['#bd875c','#cb946a','#c9956d','#cf9c76','#bb8359','#d2a47e','#c78d62'];
    let inner=0;
    for(let k=1;k<=50;k++){
      const r=k*outer/50, color=k===50?'#594638':k===49?'#75543b':rings[k%rings.length];
      for(let i=0;i<64;i++){
        const a=TAU*i/64,b=TAU*(i+1)/64;
        quad(ringPoint(a,inner,.23),ringPoint(a,r,.23),ringPoint(b,r,.23),ringPoint(b,inner,.23),color);
        if(k===50)quad(ringPoint(a,r,.23),ringPoint(a,r,-.22),ringPoint(b,r,-.22),ringPoint(b,r,.23),i%4?'#654936':'#4c3c2e');
      } inner=r;
    }
    for(const [a,length] of [[.9,.33],[2.42,.25],[4.05,.58],[5.61,.34]]){
      triangle(ringPoint(a,outer*.97,.236),ringPoint(a+.018,outer*.97,.236),ringPoint(a+.052,outer*(1-length),.236),'#65503c');
    }
    const grove=station('Conifer forest',6,5,1.9,4,2.7);
    tree(grove,-.92,-.16,3.44);tree(grove,.4,.33,2.46);tree(grove,1.17,-.55,3.02);
  }
  function canoe(){
    const at=station('Great Canoe',-5.8,-6,1.8,8.6,2.65);
    for(const i of [-1,1])g.box(at(i*2.14,.37,0),[.28,.74,1.24],'#4a4236');
    const section=(t,s,level)=>{
      const u=2*t-1, beam=Math.pow(Math.max(0,1-u*u),.66);
      return at(3.92*u,.73+.89*Math.pow(Math.abs(u),3.6)+level*.57,s*beam*(.093+level*.71));
    };
    for(let i=0;i<32;i++){
      const a=i/32,b=(i+1)/32;
      for(const s of [-1,1]){
        for(const [lo,hi,c] of [[0,.36,'#755437'],[.36,.79,'#a8714d'],[.79,.92,'#bd8560'],[.92,1,'#644630']])
          quad(section(a,s,lo),section(b,s,lo),section(b,s,hi),section(a,s,hi),c);
        g.rod(section(a,s,1),section(b,s,1),.038,.038,'#503c2c');
      }
      if(i%5===2 && i>4 && i<28)g.rod(section(a,-1,.85),section(a,1,.85),.046,.046,'#8f6b48');
    }
  }
  function crystal(at,x,z,h,r,tilt,palette) {
    const points=Array.from({length:6},(_,i)=>[Math.cos(i*TAU/6)*r,Math.sin(i*TAU/6)*r]);
    for(let i=0;i<6;i++){
      const [u,v]=points[i],[w,q]=points[(i+1)%6];
      const a=at(x+u,0,z+v),b=at(x+w,0,z+q),c=at(x+w+tilt,h*.78,z+q),d=at(x+u+tilt,h*.78,z+v);
      quad(a,b,c,d,palette[i%palette.length]);triangle(c,d,at(x+tilt*1.28,h,z),palette[(i+1)%palette.length]);
    }
  }
  function gems(){
    const at=station('Crystal forms',-6,-5,1.67,4.1,2.8,.88);
    if(nativeArt){station('Star of India',6,5,1.29,2.1,1.85,1.00);return;}
    for(let i=0;i<20;i++){
      const a=i*2.4,r=.23*Math.sqrt(i);
      crystal(at,r*Math.cos(a),r*Math.sin(a)*.7,.55+1.14*(1-i/22)+.29*Math.sin(a),.17+.11*(1-i/20),.26*Math.cos(a),['#8f6cb1','#b99bce','#795a9a','#9d88ba','#c4a9d6','#8c78a8']);
    }
    const star=station('Star of India',6,5,1.68,2.1,1.85,1.29);
    g.box(star(0,.08,0),[.98,.15,.86],'#282f36');
    g.ell(star(0,.3,0),[.48,.31,.40],'#829ab4');
    for(let i=0;i<6;i++){
      const a=TAU*i/6, p=star(0,.59,0);
      triangle(p,star(.34*Math.cos(a),.50,.27*Math.sin(a)),star(.024*Math.cos(a+1.56),.59,.024*Math.sin(a+1.56)),'#c0d0de');
    }
  }
  function bison(){
    const at=station('American bison',-6,-5,1.7,5.2,3.2,.25);
    if(nativeArt)return;
    const hide='#6e513b',mane='#4a382c';
    g.ell(at(-.25,1.25,0),[1.24,.65,.46],hide);g.ell(at(.42,1.53,0),[.78,.79,.55],mane);
    g.ell(at(1.07,1.36,0),[.49,.52,.36],mane);g.ell(at(1.39,1.11,0),[.34,.23,.27],'#514338');
    tip(at(1.14,1.06,0),at(1.05,.69,0),.18,mane);
    for(const s of [-1,1]){
      const horn=at(1.03,1.78,s*.28),bend=at(1.0,1.81,s*.51);
      g.rod(horn,bend,.087,.066,'#8f8271');tip(bend,at(1.08,2.03,s*.57),.066,'#bbaa8a');
      g.ell(at(1.28,1.51,s*.267),[.048,.041,.027],'#171b18');
      for(const x of [-.87,.55]){
        const knee=at(x-.14*s,.53,s*.31),foot=at(x-.15*s+.045,.09,s*.31);
        g.rod(at(x,1.04,s*.28),knee,.176,.092,hide);g.rod(knee,foot,.092,.066,'#5b4738');
        g.ell(foot,[.125,.082,.082],'#39372f');
      }
    }
    g.rod(at(-1.36,1.43,0),at(-1.5,.66,.16),.04,.023,hide);
    g.ell(at(-1.5,.63,.16),[.075,.16,.067],mane);
  }
  function penguins(){
    const at=station('King penguin colony',-6,-5,1.47,4.8,3.0,.4);
    if(nativeArt)return;
    for(const [x,z,s] of [[-1.16,-.31,.94],[-.5,.53,.81],[.31,-.3,1.03],[1.25,.21,.89]]){
      const p=(a,b,c)=>at(x+a*s,b*s,z+c*s);
      g.ell(p(0,.66,0),[.29*s,.58*s,.30*s],'#353f45');
      g.ell(p(0,.64,.14),[.23*s,.48*s,.19*s],'#e6e5d8');
      g.ell(p(0,1.18,0),[.22*s,.25*s,.2*s],'#263237');
      g.ell(p(.144,1.10,.10),[.077*s,.115*s,.09*s],'#d19f40');
      tip(p(0,1.21,.15),p(0,1.19,.43),.082*s,'#886b48');
      for(const side of [-1,1]){
        g.rod(p(side*.235,.93,0),p(side*.34,.36,-.03),.081*s,.032*s,'#41494a');
        g.ell(p(side*.123,.055,.09),[.113*s,.05*s,.159*s],'#615647');
      }
    }
  }
  function bird(at,x,h,z,s,plume) {
    const p=(a,b,c)=>at(x+a*s,h+b*s,z+c*s);
    g.ell(p(0,0,0),[.43*s,.24*s,.2*s],plume);g.ell(p(.30,.15,0),[.19*s,.19*s,.147*s],plume);
    tip(p(.44,.16,0),p(.69,.10,0),.076*s,'#aa8965');
    for(const side of [-1,1]){
      g.ell(p(.36,.20,.112*side),[.033*s,.034*s,.025*s],'#141b19');
      triangle(p(.18,0,.19*side),p(-.34,.17,.22*side),p(-.38,-.12,.15*side),'#52564a');
      g.rod(p(0,-.19,.075*side),p(-.035,-.34,.08*side),.02*s,.012*s,'#7e634d');
    }
    triangle(p(-.30,.08,-.13),p(-.30,.08,.13),p(-.85,-.09,0),plume);
  }
  function songbirds(){
    const at=station('Birds at the forest edge',6,-5,1.8,4.2,2.8);
    if(nativeArt)return;
    g.rod(at(-1.3,0,.24),at(.82,2.6,-.12),.154,.066,'#665441');
    g.rod(at(-.52,1.1,.10),at(-1.43,1.53,.13),.06,.035,'#665441');
    g.rod(at(-.11,1.56,0),at(1.42,1.93,-.15),.08,.038,'#675744');
    bird(at,-1.2,1.77,.15,.86,'#a8714d');bird(at,1.15,2.16,-.14,.89,'#758da2');bird(at,.69,2.76,-.12,.74,'#8c904f');
  }
  function insects(butterflies){
    const at=station(butterflies?'Butterflies and host plants':'Insect anatomy',-6,-5,1.7,4.3,3,.71);
    if(butterflies){
      for(let i=0;i<12;i++){
        const x=1.48*Math.sin(i*2.31),z=.90*Math.cos(i*1.27),h=.9+.54*Math.cos(i*1.59);
        g.rod(at(x,0,z),at(x+.11,h,z),.027,.013,'#576e4b');
        for(let j=0;j<4;j++)triangle(at(x,h*j/5,z),at(x+(j%2?-.34:.35),h*j/5+.26,z+.14),at(x+.03,h*j/5+.13,z+.06),j%2?'#6d874e':'#526d46');
        if(i%2)continue;
        const y=h+.11,colors=['#4babc1','#df9c4d','#aaa1c7'],color=colors[(i/2)%3];
        g.ell(at(x,y,z),[.029,.097,.028],'#2a2d29');
        for(const s of [-1,1]){
          const center=at(x,y,z),wing=at(x+s*.22,y+.21,z-.04);
          triangle(center,wing,at(x+s*.29,y+.14,z+.05),'#413c39');
          triangle(center,at(x+s*.25,y+.14,z+.04),at(x+s*.17,y+.19,z-.02),color);
          triangle(center,at(x+s*.20,y+.07,z+.07),at(x+s*.13,y-.06,z+.11),color);
        }
      }
    }else{
      const p=(x,y,z)=>at(x,y+.45,z);
      g.ell(p(-.56,.06,0),[.48,.28,.29],'#85502e');g.ell(p(.02,.06,0),[.26,.21,.22],'#75482f');g.ell(p(.47,.15,0),[.255,.215,.235],'#88512e');
      for(const s of [-1,1]){
        g.ell(p(.57,.21,s*.18),[.079,.069,.045],'#2a2621');
        for(let j=0;j<3;j++){
          const x=(j-1)*.18,k=p(x+(j-1)*.30,.25,s*.46),end=p(x+(j-1)*.56,-.43,s*.79);
          g.rod(p(x,0,s*.12),k,.043,.034,'#774a32');g.rod(k,end,.034,.013,'#79533b');
        }
        const a=p(.60,.31,s*.09),b=p(.85,.59,s*.23);g.rod(a,b,.023,.020,'#77523a');g.rod(b,p(1.19,.51,s*.30),.02,.011,'#77523a');
      }
    }
  }
  function tusks(p,s){
    const points=[[.94,1.78,s*.23],[1.2,1.41,s*.35],[1.63,1.26,s*.50],[2.01,1.39,s*.64],[2.22,1.67,s*.68]];
    for(let i=1;i<points.length;i++)g.rod(p(...points[i-1]),p(...points[i]),.128*(5-i)/4,.128*(4-i)/4+.002,'#d6c5a0');
  }
  function elephant(){
    const p=station('Asian elephant',-6,-5,1.82,5.8,3.6,.25);
    const gray='#837f71';
    g.ell(p(-.33,1.55,0),[1.37,.89,.66],gray);g.ell(p(.85,1.97,0),[.58,.69,.56],gray);
    for(const s of [-1,1]){
      g.ell(p(.73,1.99,s*.46),[.38,.48,.145],'#897f70');
      g.ell(p(1.26,2.12,s*.33),[.049,.041,.034],'#2d302b');
      for(const x of [-1.07,.36]){
        const a=p(x,1.36,s*.39),b=p(x+.10*s,.14,s*.43);
        g.rod(a,b,.234,.159,gray);g.ell(b,[.21,.145,.18],gray);
      }
      tusks(p,s);
    }
    const trunk=[[1.26,1.96,0],[1.45,1.43,0],[1.43,.92,.08],[1.63,.51,.12],[1.85,.51,.17],[1.94,.68,.16]];
    for(let i=1;i<trunk.length;i++)g.rod(p(...trunk[i-1]),p(...trunk[i]),.26-.035*i,.235-.035*i,gray);
    g.rod(p(-1.54,1.81,0),p(-1.68,.62,-.17),.049,.023,gray);
  }
  function extinctMammal(primitive){
    const center=[-5.9,.48,-5.1];
    station(primitive?'Dimetrodon':'Mammoth',center[0],center[2],primitive?1.71:2.19,6.9,3.25,.41);
    const m=fossilSkeleton(g,center,1,1,['#8d7156','#967859','#a08162','#ad9271','#806b57']);
    const H=primitive?[-.93,.96,0]:[-1.06,2.36,0],S=primitive?[.69,.91,0]:[.78,2.65,0];
    m.spine([H,S],12,.12,.107,1.54);m.ribs(H,S,11,primitive?.63:1.14,primitive?.42:.65);
    m.spine([H,[-1.78,primitive?.72:2.02,.03],[primitive?-2.91:-2.1,primitive?.43:1.51,.16]],13,.106,.028,1.23);
    if(primitive){
      m.head([1.06,.74,0],.46,true);
      for(let i=0;i<21;i++){
        const t=i/20,x=-1.25+2.32*t,h=.13+1.17*Math.sin(Math.PI*t);
        m.rod([x,.93,0],[x-.15+h*.05,.95+h,.028*Math.sin(t*3)],.041,.016);
      }
      for(const s of [-1,1])for(const x of [-.81,.68]){
        const knee=[x-.18,.53,s*.54], foot=[x+.04,.09,s*.67];
        m.bone([x,.75,s*.30],knee,.088);m.bone(knee,foot,.064);m.toes(foot,s,.55,false);
      }
    }else{
      quadrupedLegs(m,H,S,.72,.163);
      m.ell([1.15,2.55,0],[.46,.56,.37]);
      for(const s of [-1,1]){
        m.rod([1.49,2.59,s*.25],[1.42,2.28,s*.29],.10,.08);
        m.rod([1.42,2.28,s*.29],[1.06,2.20,s*.27],.08,.075);
        m.curve([[1.39,2.41,s*.21],[1.67,1.88,s*.36],[2.13,1.60,s*.53],[2.58,1.73,s*.75],[2.79,2.03,s*.84],[2.68,2.33,s*.80]],[.128,.11,.094,.066,.038,.008]);
      }
    }
  }
  function armoredFish(){
    const p=station('Dunkleosteus skull armor',-6,-5,1.64,3.65,2.4,.86);
    const crowns=[[-.91,.41,.45],[-.52,.90,.5],[.30,.78,.43],[.66,.45,.35],[.85,.26,.22]];
    for(const s of [-1,1]){
      for(let i=0;i<crowns.length-1;i++){
        const [x,y,z]=crowns[i],[x2,y2,z2]=crowns[i+1];
        const c=i%2?'#967e62':'#a38a6a';
        quad(p(x,y,s*z),p(x2,y2,s*z2),p(x2,y2+.12,0),p(x,y+.12,0),c);
        triangle(p(x,y,s*z),p(x2,y2,s*z2),p(x+.05,y-.31,s*(z+.04)),c);
      }
      g.rod(p(-.44,.41,s*.4),p(.72,.10,s*.25),.10,.072,'#9c876a');
      tip(p(.66,.14,s*.24),p(.65,.32,s*.239),.066,'#b59e79');
    }
  }
  function rabbits(){
    const p=station('Small mammal forms',-6,-5,1.35,4.1,2.3,.85);
    if(nativeArt)return;
    for(const [x,z,s] of [[-.70,.18,1],[.73,-.20,.78]]){
      const a=(u,v,w)=>p(x+s*u,s*v,z+s*w);
      g.ell(a(0,.27,0),[.41*s,.28*s,.22*s],'#937864');
      g.ell(a(.28,.49,0),[.23*s,.22*s,.18*s],'#947a62');
      g.ell(a(-.34,.34,0),[.13*s,.14*s,.12*s],'#ccb79f');
      for(const side of [-1,1]){
        g.ell(a(.22,.78,.092*side),[.068*s,.255*s,.056*s],'#937c67');
        g.ell(a(.243,.80,.13*side),[.044*s,.183*s,.021*s],'#c49a85');
        g.ell(a(.40,.52,.133*side),[.037*s,.039*s,.026*s],'#292d26');
        g.ell(a(-.16,.09,side*.13),[.23*s,.078*s,.098*s],'#89745f');
      }
    }
  }
  function tortoise(){
    const p=station('Giant tortoise',-6,-5,1.52,4.3,2.6,.82);
    g.ell(p(-.13,.51,0),[1.12,.68,.69],'#646246');
    for(let i=-2;i<=2;i++)for(let j=-1;j<=1;j++){
      const x=.31*i,z=.30*j,y=.51+.68*Math.sqrt(Math.max(.02,1-(x/1.12)**2-(z/.69)**2));
      g.ell(p(x-.13,y-.071,z),[.229,.105,.20],(i+j)%2?'#747052':'#77785b');
    }
    for(const s of [-1,1])for(const x of [-.68,.58])
      g.rod(p(x,.49,s*.40),p(x+.12,.09,s*.56),.164,.13,'#777259');
    g.rod(p(.70,.46,0),p(1.03,.81,0),.168,.122,'#7b7b5e');
    g.ell(p(1.14,.86,0),[.238,.144,.144],'#8c8a69');
    for(const side of [-1,1])g.ell(p(1.23,.9,.106*side),[.03,.034,.02],'#242920');
  }
  function instruments(){
    const p=station('Drums and string instruments',-6,-5,1.72,4.8,2.3,.72);
    for(const [x,z,h,r] of [[-1.28,-.1,1.07,.37],[-.54,.42,.67,.29],[-.26,-.28,1.44,.39]]){
      g.rod(p(x,0,z),p(x,h*.43,z),r*.69,r*.62,'#885d43');
      g.rod(p(x,h*.43,z),p(x,h*.87,z),r*.62,r,'#966e4f');
      g.rod(p(x,h*.87,z),p(x,h,z),r,r*.97,'#c1a679');
      for(let j=0;j<12;j++){
        const a=TAU*j/12,b=TAU*(j+.5)/12;
        g.rod(p(x+r*.65*Math.cos(b),h*.39,z+r*.65*Math.sin(b)),p(x+r*Math.cos(a),h*.90,z+r*Math.sin(a)),.016,.013,'#c6a77c');
      }
    }
    g.ell(p(1.02,.41,0),[.47,.37,.14],'#946849');
    for(const side of [-1,1])g.rod(p(1.02+side*.27,.45,0),p(1.02+side*.53,1.72,0),.058,.044,'#9b7653');
    g.rod(p(.43,1.64,0),p(1.61,1.64,0),.05,.05,'#956b4a');
    for(let i=0;i<7;i++)g.rod(p(.78+i*.072,.43,.13),p(.66+i*.115,1.64,.027),.009,.009,'#d8c9a6');
  }
  function ceramics(){
    const p=station('Ceramic vessels',-6,-5,1.63,4.7,2.7,.85);
    for(const [x,z,h,r] of [[-1.12,.27,.73,.45],[-.1,-.22,1.34,.42],[.97,.17,1.02,.38]]){
      const rows=[[0,.5],[.13,.81],[.36,1],[.48,1],[.53,.99],[.58,.97],[.71,.76],[.78,.37],[.95,.31],[1,.42]];
      for(let j=1;j<rows.length;j++){
        const [a,ar]=rows[j-1],[b,br]=rows[j];
        g.rod(p(x,a*h,z),p(x,b*h,z),r*ar,r*br,j===4||j===6?'#6b4738':j===5?'#d0a274':'#b37a57');
      }
      g.rod(p(x,h+.001,z),p(x,h+.008,z),r*.28,r*.28,'#574031');
    }
  }
  function moai(){
    const p=station('Rapa Nui moai cast',-6,-5,2.25,3.4,2.5,.29),color='#888173',shade='#736f63';
    // A continuous polygonal head profile, from the jutting chin to the sloping forehead.
    const outline=[[0,.71,.53],[.31,.71,.54],[.54,.48,.48],[.87,.405,.35],[1.05,.52,.48],[1.25,.53,.59],[1.57,.54,.56],[2.10,.55,.51],[2.63,.53,.50],[3.04,.58,.56],[3.31,.55,.53],[3.50,.45,.45]];
    for(let j=1;j<outline.length;j++){
      const point=(row,i)=>p(row[1]*Math.cos(TAU*i/10),row[0],row[2]*Math.sin(TAU*i/10));
      for(let i=0;i<10;i++)quad(point(outline[j-1],i),point(outline[j-1],i+1),point(outline[j],i+1),point(outline[j],i),i%3?color:'#827c70');
    }
    g.ell(p(0,3.48,0),[.46,.11,.45],color);
    for(const s of [-1,1]){
      g.rod(p(.03*s,2.82,.51),p(.47*s,2.93,.39),.13,.078,color);
      g.ell(p(.22*s,2.72,.47),[.14,.044,.044],shade);
      g.ell(p(.51*s,2.38,-.11),[.092,.45,.16],shade);
    }
    g.rod(p(0,2.84,.46),p(0,2.17,.68),.074,.135,color);
    g.ell(p(0,2.16,.62),[.18,.1,.13],color);
    g.ell(p(0,1.71,.52),[.30,.061,.069],shade);
    g.ell(p(0,1.64,.53),[.25,.061,.062],color);
  }
  function planetEarth(){
    const p=station('Banded iron formation',-6,-5,1.5,3.9,2.7,.71);
    const slice=(i,j)=>{
      const t=i/22,a=TAU*j/19,r=(.77+.12*Math.cos(a*3)+.09*Math.sin(a*5))*(.87+.12*Math.sin(t*Math.PI));
      return p(1.46*r*Math.cos(a),.06+t*(1.40+.12*Math.cos(a*2))+.08*Math.cos(a*2.4)*Math.sin(t*Math.PI),r*Math.sin(a));
    };
    for(let j=0;j<19;j++){
      for(let i=0;i<22;i++)quad(slice(i,j),slice(i,j+1),slice(i+1,j+1),slice(i+1,j),['#854c3f','#6a4540','#55514c','#393c3b','#915242','#8b6251'][i%6]);
      triangle(slice(22,j),p(.10,1.54,.04),slice(22,j+1),'#74574c');
    }
  }
  function planets(){
    const p=station('Gas giant scale models',-6,-5,2.12,5.28,3.36,.45);
    const giant=(x,y,z,r,bands)=>{
      for(let i=0;i<24;i++){
        const point=(j,k)=>{const a=Math.PI*(j/24-.5),b=TAU*k/36;return p(x+r*Math.cos(a)*Math.cos(b),y+r*Math.sin(a),z+r*Math.cos(a)*Math.sin(b));};
        for(let k=0;k<36;k++)quad(point(i,k),point(i,k+1),point(i+1,k+1),point(i+1,k),bands[i%bands.length]);
      }g.rod(p(x,0,z),p(x,y-r,z),.029,.025,'#505357');
    };
    giant(-1.04,1.42,0,.84,['#b6a693','#c9b9a5','#c4a48c','#a47864','#c49e80','#cbb59a','#c8b3a4']);
    giant(1.10,1.35,0,.70,['#d3bb90','#cdb58c','#cab089','#d7c59c','#c9b28e']);
    const ring=(a,r)=>p(1.10+r*Math.cos(a),1.35+r*.24*Math.sin(a),r*Math.sin(a));
    for(let k=0;k<60;k++)for(let i=0;i<6;i++){
      const a=TAU*k/60,b=TAU*(k+1)/60,r=.83+i*.072;
      quad(ring(a,r),ring(b,r),ring(b,r+.064),ring(a,r+.064),['#b0a58d','#d4c7aa','#d0bfa0','#777875','#c3b79e','#b0a68e'][i]);
    }
  }
  function skeletonStudy(origins){
    const title=origins?'Hominin fossil casts':'Comparative primate anatomy';
    const p=station(title,-6,-5,1.72,3.61,2.3,.72);
    if(nativeArt)return;
    for(let j=0;j<2;j++){
      const x=(j-.5)*1.36,s=j===0?1:.80, tone=j===0?'#b9a58c':'#a19076';
      const at=(u,v,w)=>p(x+u*s,v*s,w*s);
      const bone=(a,b,r)=>g.rod(at(...a),at(...b),r*s,r*s*.81,tone);
      const joint=(a,r)=>g.ell(at(...a),[r*s,r*s,r*s],tone);
      g.ell(at(0,1.68,.013),[.10*s,.132*s,.107*s],tone);
      g.ell(at(0,1.59,.070),[.087*s,.074*s,.077*s],tone);
      for(let i=0;i<18;i++)joint([0,.85+.039*i,-.023*Math.sin(Math.PI*i/11)],.029);
      const hips=origins?.145:.174,reach=j===0?.77:.63;
      for(const side of [-1,1]){
        bone([0,.89,0],[side*hips,.85,0],.059);
        bone([hips*side,.85,0],[.11*side,.48,.047],.044);bone([.11*side,.48,.047],[.12*side,.09,-.013],.035);
        bone([.12*side,.09,-.013],[.12*side,.046,.13],.037);
        bone([0,1.43,0],[.22*side,1.40,0],.027);
        bone([.22*side,1.40,0],[.26*side,1.08,0],.033);bone([.26*side,1.08,0],[.30*side,reach,.059],.023);
        for(let k=0;k<8;k++){const y=1.15+.032*k,w=.135+.035*Math.sin(k*Math.PI/8);bone([0,y,-.02],[side*w,y-.04,.014],.014);bone([side*w,y-.04,.014],[.021*side,y-.065,.08],.011);}
      }
    }
  }
  if(/north.*forest/i.test(name)) forest();
  else if(/northwest coast/i.test(name)) canoe();
  else if(/gems?|minerals?/i.test(name)) gems();
  else if(/small.*mammal|new york state mammal/i.test(name)) rabbits();
  else if(/north american mammal/i.test(name)) bison();
  else if(/asian mammal/i.test(name)) elephant();
  else if(/primitive mammal/i.test(name)) extinctMammal(true);
  else if(/advanced mammal|extinct relatives/i.test(name)) extinctMammal(false);
  else if(/vertebrate origins/i.test(name)) armoredFish();
  else if(/birds of the world|world birds/i.test(name)) penguins();
  else if(/bird/i.test(name)) songbirds();
  else if(/butterfl|vivarium/i.test(name)) insects(true);
  else if(/insectarium/i.test(name)) insects(false);
  else if(/reptile|amphibian/i.test(name)) tortoise();
  else if(/african peoples/i.test(name)) instruments();
  else if(/south american peoples|mexico and central america/i.test(name)) ceramics();
  else if(/pacific peoples/i.test(name)) moai();
  else if(/planet earth/i.test(name)) planetEarth();
  else if(/scales of the universe|hall of the universe/i.test(name)) planets();
  else if(/hall of primates|hall of human origins/i.test(name)) skeletonStudy(/human origins/i.test(name));
  if(nativeArt){
    // Each case keeps its full collision footprint. Individual viewpoints aim at
    // the mounted specimens, whose printed labels already sit on the case edge.
    const specimens={
      'Crystal forms':[['Amethyst geode',-.70,2.23],['Azurite and malachite',.73,1.52]],
      'Birds at the forest edge':[['Blue jay',-1.08,2.15],['American robin',-.22,2.75],['Red-bellied woodpecker',.89,2.31]],
      'Small mammal forms':[['Eastern gray squirrel',-.72,1.39],['Raccoon cranium',1.04,1.43]],
      'Hominin fossil casts':[['Homo erectus cranium',-.78,1.48],['La Quina 5 Neanderthal cranium',.75,1.59]],
      'Comparative primate anatomy':[['Central chimpanzee cranium',-.80,1.48],['Cross River gorilla cranium',.76,1.64]]
    };
    const views=[];
    for(const s of stops){
      if(s.name==='Giant sequoia cross-section'){s.z=s.lookZ+7.25;s.lookY=3.42;}
      if(s.name==='Conifer forest'){s.name='Northern spruce–fir forest';s.wallLabel=true;}
      if(s.name==='King penguin colony')s.wallLabel=true;
      if(s.name==='Star of India'){s.z=s.lookZ-1.63;s.lookY=1.30;s.wallLabel=true;}
      if(specimens[s.name]){
        s.wallLabel=true;
        for(const [title,dx,y] of specimens[s.name]){
          const x=s.lookX+dx;
          views.push({name:title,x:x+dx*.31,z:s.lookZ+s.depth*.5+1.24,lookX:x,lookY:y,lookZ:s.lookZ,width:.82,depth:s.depth,wallLabel:true});
        }
        if(s.name==='Small mammal forms')s.name='Small mammal specimens';
      }
    }
    stops.push(...views);
  }
  return stops;
}
