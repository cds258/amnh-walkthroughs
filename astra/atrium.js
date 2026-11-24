// Entrance glass is recessed behind the limestone-colored shotcrete. The
// photograph-based garden panorama is sampled in camera space through the glass.
const atriumCache=new Map();
function shotcreteMaterial(){
  if(atriumCache.has('shotcrete'))return atriumCache.get('shotcrete');
  const mat=new THREE.MeshStandardMaterial({color:0xe8e1d5,roughness:.92,side:THREE.DoubleSide});
  const t=sourceTexture(atriumSurfaces.concrete);t.wrapS=t.wrapT=THREE.RepeatWrapping;
  mat.onBeforeCompile=shader=>{
    shader.uniforms.concreteGrain={value:t};
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 localP;varying vec3 localN;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nlocalP=position;localN=normal;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D concreteGrain;varying vec3 localP;varying vec3 localN;')
      .replace('#include <color_fragment>',`#include <color_fragment>
        vec3 w=pow(abs(normalize(localN)),vec3(4.));w/=max(dot(w,vec3(1.)),.001);
        vec3 grain=w.x*texture2D(concreteGrain,localP.zy*.82).rgb+w.y*texture2D(concreteGrain,localP.xz*.82).rgb+w.z*texture2D(concreteGrain,localP.xy*.82).rgb;
        float grainHeight=dot(grain,vec3(.3,.5,.2));
        diffuseColor.rgb*=mix(vec3(.55),grain*1.65,.78);`)
      .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
        float microHeight=(grainHeight-.51)*.012;
        vec3 sx=dFdx(-vViewPosition),sy=dFdy(-vViewPosition),rx=cross(sy,normal),ry=cross(normal,sx);float det=dot(sx,rx);
        normal=normalize(normal-sign(det)*(dFdx(microHeight)*rx+dFdy(microHeight)*ry)/max(.0000001,abs(det)));`);
  };
  atriumCache.set('shotcrete',mat);return mat;
}
function glassGarden(){
  const geometry=new THREE.PlaneGeometry(22,15.6),uniforms={panorama:{value:galleryLight.park}};
  const material=new THREE.ShaderMaterial({uniforms,side:THREE.DoubleSide,
    vertexShader:'varying vec3 wp;void main(){wp=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.);}',
    fragmentShader:`uniform sampler2D panorama;varying vec3 wp;
      void main(){vec3 d=normalize(wp-cameraPosition);float u=atan(d.z,d.x)*.159155+.61;
        float v=asin(clamp(d.y,-1.,1.))*.31831+.5;vec3 c=texture2D(panorama,vec2(fract(u),v)).rgb;
        gl_FragColor=vec4(c*.87+vec3(.12,.16,.16),1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  const pane=new THREE.Mesh(geometry,material);pane.position.set(0,7.76,-12.33);return pane;
}
const stairWest=-6.80,stairEast=1.34,stairLeft=-4.6,stairRight=4.05,stairCount=30;
function atriumStep(x,z){
  if(x<stairLeft||x>stairRight||z<stairWest||z>stairEast+.34)return 0;
  return Math.min(stairCount,Math.ceil((z-stairWest)/(stairEast-stairWest)*stairCount))*5/stairCount;
}
function makeAtriumSteps(group){
  const geo=new GalleryMesh(),run=(stairEast-stairWest)/stairCount,dy=5/stairCount;
  const walnut=sourceTexture(atriumSurfaces.walnut);walnut.wrapS=walnut.wrapT=THREE.RepeatWrapping;
  const seats=new THREE.MeshStandardMaterial({map:walnut,color:0xcbbaa1,roughness:.57});
  const edges=new THREE.MeshStandardMaterial({color:0xbcb4a7,roughness:.83});
  const rows=[];
  function block(x,y,z,w,h,d,material){
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;group.add(m);
  }
  for(let i=0;i<stairCount;i++){
    const z=stairWest+(i+.5)*run,y=(i+1)*dy;
    // A straight walking flight alongside deeper walnut spectator treads.
    geo.box([1.47,y-.115,z],[stairRight+.04-(-1.12),.23,run+.006],'#c6bcae');
    geo.box([1.47,y+.006,z-run*.5+.035],[5.12,.018,.071],'#8b877d');
    if(i%2===0){
      const seatY=(i+2)*dy;
      block(-2.86,seatY-.20,z+.5*run,3.48,.40,run*2+.006,edges);
      rows.push([-2.86,seatY+.023,z+.52*run]);
    }
  }
  for(const x of [stairLeft+.12,-1.16,stairRight-.12]){
    const side=.12,point=(v,edge,y)=>[x+edge,v*5+y,stairWest+v*(stairEast-stairWest)];
    for(let i=0;i<30;i++){
      const a=i/30,b=(i+1)/30;
      for(const k of [-1,1]){const A=point(a,k*side,-.52),B=point(b,k*side,-.52),C=point(b,k*side,-.06),D=point(a,k*side,-.06);
        geo.tri(A,B,C,'#bbac97');geo.tri(A,C,D,'#bbac97');}
    }
    geo.box([x,2.26,stairEast-.12],[.26,4.52,.42],'#bbad98');
  }
  if(rows.length){
    const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(3.50,.055,run*2-.034),seats,rows.length),matrix=new THREE.Matrix4();
    rows.forEach((p,i)=>mesh.setMatrixAt(i,matrix.makeTranslation(...p)));mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);
  }
  for(const x of [-4.52,-1.14,3.93]){
    const first=[x,.92,stairWest-.15],last=[x,5.91,stairEast+.18];
    geo.rod(first,last,.034,.034,'#807e71');
    for(let i=0;i<=6;i++){
      const f=i/6,z=stairWest+(stairEast-stairWest)*f,h=atriumStep(x,z);
      geo.rod([x,h,z],[x,.95+5*f,z],.030,.030,'#8f8a7a');
    }
  }
  geo.box([-.28,4.86,stairEast+.31],[8.67,.28,.64],'#cbbfac');
  group.add(geo.finish(true));
}
function roundedAtriumBridges(group,concrete){
  for(const [height,z,tilt] of [[5,-4.6,-.16],[8.9,2.2,.21],[12.3,-6.7,.10]]){
    const pos=[],idx=[],uv=[],n=82,frame=new GalleryMesh();
    for(let i=0;i<=n;i++){
      const u=i/n,x=(u-.5)*22.2,edge=Math.abs(2*u-1),h=height-.28*Math.sin(u*Math.PI);
      const c=z+x*tilt+.38*Math.sin(u*Math.PI*2),w=.91+.25*Math.cos(u*Math.PI*2)+.39*edge**3;
      const parapet=.81+.14*edge,under=-.40-1.62*edge**5;
      const section=[[-w+.14,0],[-w+.12,parapet-.08],[-w+.087,parapet],[-w-.025,parapet+.015],
        [-w-.080,parapet-.05],[-w-.11,.18],[-w-.12,under+.16],[-w-.07,under+.056],[-w+.055,under],
        [w-.055,under],[w+.07,under+.056],[w+.12,under+.16],[w+.11,.18],[w+.08,parapet-.05],
        [w+.025,parapet+.015],[w-.087,parapet],[w-.12,parapet-.08],[w-.14,0]];
      for(let j=0;j<section.length;j++){
        const [s,dy]=section[j];pos.push(x,h+dy,c+s);uv.push(x*.5,(c+s)*.5);
        if(i<n){const a=i*section.length+j,b=i*section.length+(j+1)%section.length,cc=b+section.length,d=a+section.length;idx.push(a,b,d,b,cc,d);}
      }
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    geo.setIndex(idx);geo.computeVertexNormals();const bridge=new THREE.Mesh(geo,concrete);bridge.castShadow=bridge.receiveShadow=true;group.add(bridge);
  }
}
function atriumEnds(group,concrete){
  const beam=new GalleryMesh(),glass=glassGarden();group.add(glass);
  const face=new THREE.Shape();face.moveTo(-12.16,-.03);face.lineTo(12.16,-.03);face.lineTo(12.16,15.6);face.lineTo(-12.16,15.6);face.closePath();
  // A tall, slightly pinched portal and two galleries open toward the park.
  const hole=new THREE.Path();hole.moveTo(-6.42,.055);hole.bezierCurveTo(-6.71,2.11,-6.02,4.61,-5.39,5.42);
  hole.bezierCurveTo(-4.44,6.77,-3.60,9.5,-3.02,12.03);hole.bezierCurveTo(-2.77,13.28,-2.25,14.58,-.79,14.68);
  hole.bezierCurveTo(1.37,14.73,2.36,14.53,3.07,13.24);hole.bezierCurveTo(4.32,10.68,4.06,8.24,5.29,5.63);
  hole.bezierCurveTo(6.63,3.61,7.07,1.32,6.69,.055);hole.closePath();face.holes.push(hole);
  for(const x of [-8.43,8.35])for(const y of [6.25,11.67]){const p=new THREE.Path();p.absellipse(x,y,1.62,1.14,0,Math.PI*2,true,.18*Math.sign(x));face.holes.push(p);}
  const wall=new THREE.Mesh(new THREE.ExtrudeGeometry(face,{depth:.75,bevelEnabled:true,bevelSegments:4,bevelThickness:.20,bevelSize:.235,curveSegments:32}),concrete);
  wall.position.z=-12.04;wall.castShadow=wall.receiveShadow=true;group.add(wall);
  for(let i=-6;i<=6;i++){
    const x=i*1.73;
    beam.box([x,7.63,-12.22],[.081,15.2,.11],'#66716d');
    if(i%2===0)beam.rod([x,0,-12.14],[x,15.23,-12.14],.055,.055,'#5c6763');
  }
  for(let j=0;j<=8;j++)beam.box([0,j*1.89,-12.22],[21.26,.075,.13],'#67736e');
  beam.box([0,2.35,-12.01],[13.8,.19,.34],'#696e64');
  for(let i=-2;i<=2;i++){
    const x=i*1.49;beam.box([x,1.17,-12.03],[.067,2.32,.09],'#625f56');beam.box([x+.51,.98,-11.93],[.047,.38,.043],'#817c6a');
  }
  for(const side of [-1,1])for(const y of [5,8.9,12.32]){
    beam.box([side*10.73,y-.14,0],[2.45,.29,25.57],'#aba397');
    for(let k=-2;k<=2;k++){
      const z=k*4.91;
      beam.box([side*11.62,y+1.65,z],[.13,2.9,4.83],k%2?'#8e8171':'#948670');
      for(let j=0;j<3;j++)beam.box([side*11.50,y+1.56,z+(j-1)*1.18],[.17,2.85,.13],'#776f64');
      beam.box([side*11.48,y+2.99,z],[.16,.11,4.81],'#c1aa89');
    }
    beam.rod([side*9.43,y+.90,-12],[side*9.43,y+.90,12],.029,.029,'#867d6e');
    for(let k=-8;k<=8;k++)beam.rod([side*9.43,y,k*1.49],[side*9.43,y+.90,k*1.49],.024,.024,'#868072');
  }
  group.add(beam.finish(true));
  const surface=sourceTexture(atriumSurfaces.terrazzo);surface.wrapS=surface.wrapT=THREE.RepeatWrapping;surface.repeat.set(9,10);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(23.9,25.85),new THREE.MeshStandardMaterial({map:surface,color:0xd7d0bf,roughness:.36,metalness:.045}));
  floor.rotation.x=-Math.PI/2;floor.position.y=.013;floor.receiveShadow=true;group.add(floor);
}
