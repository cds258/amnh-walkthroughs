// Viewpoints use a local origin at the middle of the blue whale gallery.
const oceanStops = [
  {name:'Blue Whale',x:6.85,z:-6.49,lookX:-1.06,lookZ:.20,lookY:6.11},
  {name:'Andros Coral Reef Diorama',x:8.56,z:9.53,lookX:7.70,lookZ:12.35,lookY:1.50},
  {name:'Kelp Forests',x:-7.24,z:10.04,lookX:-7.70,lookZ:12.35,lookY:1.70},
  {name:'Sperm Whale and Giant Squid',x:7.85,z:7.13,lookX:10.90,lookZ:7.65,lookY:1.49}
];
// The two lower displays fit underneath the mezzanine fascia; the kelp
// ecosystem is viewed from its deck. Coordinates are in local gallery space.
const oceanHabitatWindows=[
  {key:'reef',x:31.7,z:12.35,direction:-1,width:5.46,caseWidth:5.74,lo:.39,hi:2.74,back:.19,front:.54,relief:.33},
  {key:'kelp',x:16.3,z:12.35,direction:-1,width:5.65,caseWidth:5.93,lo:.62,hi:3.18,back:.22,front:.58,relief:.32,sideY:3},
  {key:'squid',x:35.04,z:7.68,alongX:false,direction:-1,width:6.74,caseWidth:7.02,lo:.39,hi:2.72,back:.18,front:.65,relief:.43}
];
const blueWhaleSections = [
    [-9.55,7.95,.19,.14,.11],[-8.8,7.91,.24,.31,.3],[-7.8,7.65,.34,.46,.42],
    [-6.3,7.35,.68,.64,.58],[-4.5,7.24,1.02,.81,.81],[-2.25,7.16,1.35,1,1.13],
    [0,7.05,1.64,1.18,1.32],[2.2,6.89,1.77,1.16,1.32],[3.8,6.75,1.73,1.05,1.18],
    [5.25,6.6,1.58,.82,1.01],[6.7,6.48,1.38,.62,.75],[8,6.36,1.16,.46,.55],
    [8.9,6.27,.80,.31,.39],[9.4,6.22,.43,.20,.20],[9.62,6.21,.025,.035,.035]
  ];

// Monotone cubic interpolation avoids creases at station boundaries without
// letting a curved section overshoot the taper at the rostrum or tail.
function blueWhaleSurface(z,theta,offset=0){
  const s=blueWhaleSections;
  let j=1;
  while(j<s.length-1 && z>s[j][0])j++;
  const a=s[j-1],b=s[j],dz=b[0]-a[0],t=THREE.MathUtils.clamp((z-a[0])/dz,0,1);
  const slope=(k,i)=>(s[k+1][i]-s[k][i])/(s[k+1][0]-s[k][0]);
  function tangent(k,i){
    if(k===0)return slope(0,i);
    if(k===s.length-1)return slope(k-1,i);
    const left=slope(k-1,i),right=slope(k,i);
    return left*right<=0?0:2*left*right/(left+right);
  }
  function coordinate(i){
    const l=t*t*(3-2*t);
    return a[i]*(1-l)+b[i]*l+dz*(t*(1-t)*(1-t)*tangent(j-1,i)-t*t*(1-t)*tangent(j,i));
  }
  const sn=Math.sin(theta);
  // The lip turns up near the corner of the eye. Its narrow groove and
  // slightly raised upper edge continue almost to the end of the rostrum.
  const mouthLine=blueWhaleMouth(z),d=sn-mouthLine;
  const mask=THREE.MathUtils.smoothstep(z,4.72,5.21)*(1-THREE.MathUtils.smoothstep(z,9.43,9.63));
  const detail=mask*(-.046*Math.exp(-(d*d)/.0011)+.025*Math.exp(-((d-.048)**2)/.0021));
  return [24+(coordinate(2)+offset+detail)*Math.cos(theta),coordinate(1)+(coordinate(sn>0?3:4)+offset)*sn,z];
}
function blueWhaleMouth(z){
  return -.17+.24*Math.exp(-(((z-5.64)/1.07)**2))-.075*THREE.MathUtils.smoothstep(z,7.4,9.4);
}

// Ocean Life gallery, in museum coordinates (metres, Y up).
function addOcean(gallery, whale=gallery) {
  const g=whale;
  const mix = (a,b,t) => a + (b-a)*t;
  function line(points,r,c) {
    for (let i=1;i<points.length;i++) g.rod(points[i-1],points[i],r,r,c);
  }
  const surface=blueWhaleSurface;
  for(const side of [-1,1]) {
    const eyeAngle=side===1?.07:Math.PI-.07;
    const p=surface(4.71,eyeAngle,.008);
    g.ell(p,[.061,.095,.125],'#657986');
    g.ell([p[0]+side*.033,p[1],p[2]+.009],[.042,.038,.056],'#172a31');
    const blow=[];
    for(let j=0;j<=8;j++) {
      const f=j/8,z=mix(4.87,5.34,f), t=Math.PI/2+side*(.09+.054*Math.sin(Math.PI*f)-.025*f);
      blow.push(surface(z,t,.012));
    }
    line(blow,.032,'#364c56');
  }
  // A modest falcate dorsal fin sits well aft on the back.
  const fin=[[-4.6,8.07],[-5.18,8.16],[-5.65,8.40],[-6.10,8.80],[-6.03,8.44],[-5.89,8.16],[-6.46,7.91],[-5.5,7.96]];
  for(let i=0;i<fin.length;i++) {
    const [z,y]=fin[i], [zz,yy]=fin[(i+1)%fin.length];
    for(const s of [-1,1])g.tri([24+s*.14,8.12,-5.58],[24,y,z],[24,yy,zz],s<0?'#49636f':'#526e79');
  }

  // Inset case fronts have dark returns and a low grey plinth. Their reliefs
  // are added separately so the glass apertures can remain unobstructed.
  for(const c of oceanHabitatWindows){
    const alongX=c.alongX!==false,sideY=c.sideY||0,style=c.key==='squid'?'#303942':'#485452';
    const box=(u,y,d,width,height,depth,col)=>{
      const p=alongX?[c.x-u,y+sideY,c.z-d]:[c.x-d,y+sideY,c.z+u];
      gallery.box(p,alongX?[width,height,depth]:[depth,height,width],col);
    };
    box(0,c.lo/2,.05,c.caseWidth+.14,c.lo,.97,style);
    box(0,c.lo-.025,.08,c.caseWidth+.24,.086,1.02,'#7b817b');
    box(0,c.hi+.069,.05,c.caseWidth+.18,.13,.97,style);
    for(const side of [-1,1])box(side*(c.caseWidth/2+.065),(c.lo+c.hi)/2,.045,.14,c.hi-c.lo,1,style);
  }
}
