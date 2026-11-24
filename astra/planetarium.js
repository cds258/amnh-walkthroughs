// Suspended planets on the second-level Scales of the Universe walkway use
// the published nine-foot Jupiter and seventeen-foot Saturn ring diameters.
function addRoseDetails(group,aluminum){
  for(const mesh of aluminum.children){
    if(mesh.isInstancedMesh)continue;
    const geo=mesh.geometry,p=geo.getAttribute('position'),n=geo.getAttribute('normal');
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i)-haydenCenterY,z=p.getZ(i),r=Math.hypot(x,y,z);
      if(Math.abs(r-haydenRadius)<.030)n.setXYZ(i,x/r,y/r,z/r);
    }
    mesh.material.roughness=.49;mesh.material.metalness=.42;mesh.material.color.set(0xe9f1f7);
    mesh.material.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 sphereLocal;')
        .replace('#include <begin_vertex>','#include <begin_vertex>\nsphereLocal=position;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 sphereLocal;')
        .replace('#include <color_fragment>',`#include <color_fragment>
          vec3 offset=sphereLocal-vec3(0.,10.5,0.);
          if(abs(length(offset)-9.46)<.045){
            vec3 unit=normalize(offset);
            float v=asin(clamp(unit.y,-1.,1.))/3.141593+.5;
            float u=atan(unit.z,unit.x)/6.283185+.5;
            vec2 grid=vec2(u*52.+.5*mod(floor(v*28.),2.),v*28.);
            vec2 seam=min(fract(grid),1.-fract(grid))/max(fwidth(grid),vec2(.0001));
            float line=1.-smoothstep(.0,1.05,min(seam.x,seam.y));
            diffuseColor.rgb*=1.-.18*line;
            // The dark theater entry set into the front lower half of the sphere.
            if(sphereLocal.z>4.&&sphereLocal.y>4.62&&sphereLocal.y<5.91&&abs(sphereLocal.x)<1.37){
              float arch=length(vec2(sphereLocal.x/1.37,max(0.,sphereLocal.y-5.18)/.73));
              if(arch<1.)diffuseColor.rgb*=mix(.026,.15,smoothstep(.91,1.,arch));
            }
          }`);
    };
    mesh.material.customProgramCacheKey=()=> 'hayden-metal-panels-v2';
  }
  const bodies=[['jupiter',-4.22,9.85,10.24,.98],['saturn',2.17,11.10,10.93,.82],['earth',-7.12,6.95,9.08,.107],
    ['mars',-7.91,6.84,8.25,.058],['neptune',8.47,8.65,7.63,.35],['uranus',9.76,7.83,5.19,.36]];
  const frame=new GalleryMesh();
  for(const [key,x,y,z,r] of bodies){
    if(!astronomyMedia[key])continue;
    const m=new THREE.Mesh(new THREE.SphereGeometry(r,56,32),new THREE.MeshStandardMaterial({map:sourceTexture(astronomyMedia[key]),roughness:.71,emissive:0x292723,emissiveIntensity:.22}));
    m.position.set(x,y,z);m.rotation.set(.012,key==='jupiter'?2.50:.5,key==='saturn'?-.24:.07);m.castShadow=m.receiveShadow=true;group.add(m);
    frame.rod([x,y+r*.90,z],[x,roseFrame.roof-.2,z],.008,.008,'#708089');
    if(key==='saturn'){
      const inner=.96,outer=1.85,geo=new THREE.RingGeometry(inner,outer,120,12),pos=geo.attributes.position,uv=geo.attributes.uv;
      for(let i=0;i<pos.count;i++){const rad=Math.hypot(pos.getX(i),pos.getY(i));uv.setXY(i,(rad-inner)/(outer-inner),.5);}
      const rings=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:sourceTexture(astronomyMedia.rings),transparent:true,alphaTest:.12,side:THREE.DoubleSide,roughness:.75}));
      rings.rotation.set(1.25,.05,-.12);m.add(rings);
    }
  }
  // Tubular braces and gusset plates are much deeper than glass mullions.
  for(const side of [-1,1])for(const direction of [-1,1]){
    const x=side*10.76,z=direction*11.86;
    frame.rod([x,0,z],[side*11.47,16.51,direction*6.36],.244,.191,'#c3cbd0');
    frame.rod([x,.18,z],[side*6.69,18.30,direction*12.15],.23,.175,'#bac7cb');
    frame.ell([x,.15,z],[.37,.19,.37],'#82939a');
    for(const h of [3.8,8.3,14]){
      const f=h/16.51;frame.ell([x+(side*11.47-x)*f,h,z+(direction*6.36-z)*f],[.22,.10,.24],'#93a2a4');
    }
  }
  group.add(frame.finish(true));
}
