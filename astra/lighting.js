// Shared scanned surface atlas: marble veining, plaster grain, and parquet grain.
// Project the scans in world units so both instanced stonework and custom meshes
// have a consistent texture scale across adjoining sections.
const galleryLight = {
  origin:{value:new THREE.Vector3()}, scales:{value:new THREE.Vector3(1,1,1)},
  mood:{value:0}, finishes:{value:null}, wood:{value:0}
};
function installSurfaceShader(material,artifact){
  material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,{atlasMap:galleryLight.finishes,roomOrigin:galleryLight.origin,
      roomScales:galleryLight.scales,galleryMood:galleryLight.mood,woodFloor:galleryLight.wood});
    shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
      varying vec3 atlasPosition;
      varying vec3 atlasNormal;`).replace('#include <project_vertex>',`#include <project_vertex>
      vec4 ap=vec4(transformed,1.);
      #ifdef USE_INSTANCING
        ap=instanceMatrix*ap;
      #endif
      atlasPosition=(modelMatrix*ap).xyz;
      atlasNormal=inverseTransformDirection(normalize(transformedNormal),viewMatrix);`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
      varying vec3 atlasPosition;
      varying vec3 atlasNormal;
      uniform vec3 roomOrigin,roomScales;
      uniform float galleryMood,woodFloor;
      uniform sampler2D atlasMap;
      float aperture(vec2 q, float r, float spring){
        float outer=max(abs(q.x)-r,max(1.9-q.y,length(vec2(q.x,max(q.y-spring,0.)))-r));
        float inside=1.-smoothstep(-.26,.26,outer);
        vec2 grid=abs(fract((q+vec2(.1,0.))/vec2(.91,1.10))-.5);
        float frame=smoothstep(.355,.48,max(grid.x,grid.y));
        return inside*(1.-frame*.83);
      }`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec3 an=normalize(atlasNormal);
      vec3 P=atlasPosition;
      vec3 roomP=(P-roomOrigin)/roomScales;
      vec3 axes=pow(abs(an),vec3(8.));axes/=max(dot(axes,vec3(1.)),.0001);
      vec2 uv=(axes.y>.52?P.xz:axes.x>axes.z?P.zy:P.xy);
      vec3 grain=texture2D(atlasMap,uv*.415).rgb;
      vec3 fine=texture2D(atlasMap,uv*2.7).rgb;
      float ground=step(.88,an.y)*step(abs(P.y),.045);
      float polished=ground*(1.-woodFloor);
      float wood=ground*woodFloor;
      float grainTone=mix(grain.g-.52,grain.r-.48,polished);
      grainTone=mix(grainTone,grain.b-.47,wood);
      diffuseColor.rgb*=clamp(1.+grainTone*${artifact?'.16':'.38'}+(fine.g-.5)*.07,.53,1.5);
      diffuseColor.rgb*=mix(vec3(1.),vec3(.91,.77,.57),wood*.72);
      // Daylight transmitted by the high windows in the rotunda. The projected
      // mullions travel across the floor and bases in the same world coordinates.
      float sunWash=0.;
      if(abs(roomP.x)<12.1 && abs(roomP.z)<13.1 && galleryMood==1.){
        float path=roomP.x+12.;
        vec2 q=vec2(roomP.z+.32*path,roomP.y+1.18*path);
        sunWash=aperture(q-vec2(0.,10.9),8.45,1.9)*smoothstep(12.2,13.1,q.y);
        vec2 fan=vec2(roomP.x-.29*(roomP.z+13.),roomP.y+1.22*(roomP.z+13.));
        float top=aperture(vec2(fan.x,fan.y-9.1),5.7,2.4);
        sunWash=max(sunWash,top*smoothstep(10.8,11.9,fan.y)*.72);
        sunWash*=max(.0,dot(an,normalize(vec3(-1.,.83,.32))));
      }
      float coarse=texture2D(atlasMap,uv*.071).g;
      float patina=clamp(1.+(coarse-.5)*.17,.90,1.1);
      diffuseColor.rgb*=patina;`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      roughnessFactor=clamp(roughnessFactor + (grain.r-.5)*.14 - polished*.51 - wood*.29,.16,.97);`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      float micro=(grainTone+(fine.g-.5)*.25)*${artifact?'.0016':'.0025'};
      vec3 sx=dFdx(-vViewPosition),sy=dFdy(-vViewPosition);
      vec3 rx=cross(sy,normal),ry=cross(normal,sx);float det=dot(sx,rx);
      normal=normalize(normal-sign(det)*(dFdx(micro)*rx+dFdy(micro)*ry)/max(.0000001,abs(det)));`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
      outgoingLight+=diffuseColor.rgb*sunWash*vec3(2.10,1.51,.83);
      #include <opaque_fragment>`);
  };
  material.customProgramCacheKey=()=>artifact?'specimen-surface-v1':'gallery-stone-v1';
}
function prepareLight(renderer,scene){
  const tex=new THREE.TextureLoader().load(surfaceAtlasURL);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());galleryLight.finishes.value=tex;
  GalleryMesh.artSolid=GalleryMesh.solid.clone();GalleryMesh.artColored=GalleryMesh.colored.clone();
  GalleryMesh.artSolid.roughness=GalleryMesh.artColored.roughness=.65;
  installSurfaceShader(GalleryMesh.solid,false);installSurfaceShader(GalleryMesh.colored,false);
  installSurfaceShader(GalleryMesh.artSolid,true);installSurfaceShader(GalleryMesh.artColored,true);
  const raw=Uint8Array.from(atob(museumProbeRGBE),c=>c.charCodeAt(0));
  const hdr=new MuseumHDRLoader().parse(raw.buffer);
  const probe=new THREE.DataTexture(hdr.data,hdr.width,hdr.height,THREE.RGBAFormat,hdr.type);
  probe.mapping=THREE.EquirectangularReflectionMapping;probe.colorSpace=THREE.LinearSRGBColorSpace;
  probe.flipY=true;probe.needsUpdate=true;
  const pmrem=new THREE.PMREMGenerator(renderer);
  const environment=pmrem.fromEquirectangular(probe);scene.environment=environment.texture;
  pmrem.dispose();probe.dispose();
  galleryLight.park=new THREE.TextureLoader().load(sceneImages.park);
  galleryLight.park.mapping=THREE.EquirectangularReflectionMapping;galleryLight.park.colorSpace=THREE.SRGBColorSpace;
  galleryLight.spots=Array.from({length:2},()=>{
    const light=new THREE.SpotLight(0xffe8c8,0,75,.58,.68,2);scene.add(light,light.target);return light;
  });
}
function setGalleryLight(r){
  const night=['akeley','mezzanine','meteorites','universe','invisible','northMammals','titan'].includes(r.id);
  const sea=r.id==='ocean',glass=roseZone(r)||r.id==='gilder'||r.id==='gilder2';
  const rotunda=r.id==='rotunda';
  galleryLight.origin.value.set(r.x,0,r.z);galleryLight.scales.value.set(r.sx,r.sy,r.sz);
  galleryLight.mood.value=rotunda?1:0;
  galleryLight.wood.value=!night&&!glass&&!sea&&!rotunda&&/mammal|peoples|bird|forest/i.test(r.name)?1:0;
  if(roseZone(r)||r.id==='terrace'||r.id==='forecourt'){scene.background=galleryLight.park;scene.backgroundIntensity=.95;scene.backgroundRotation.y=1.25;}
  const spots=galleryLight.spots;
  const focus=[[0,1.7,0],[0,2.9,0]];
  if(r.id==='titan'){focus[0]=[0,2.3,1.5];focus[1]=[0,3.75,9.5];}
  if(r.id==='meteorites')focus[1]=[-6.1,.9,-7.4];
  if(r.id==='gilder'||r.id==='gilder2'){focus[0]=[-7.2,4.3,-6];focus[1]=[6.9,7.0,.5];}
  for(let i=0;i<spots.length;i++){
    const l=spots[i],[x,y,z]=focus[i];l.target.position.copy(localToWorld(r,x,y,z));
    l.position.copy(localToWorld(r,x+(i?-4.8:5.9),y+(night?5.9:9.4),z+(i?-5.3:6.7)));
    l.intensity=(night?(r.id==='meteorites'?480:350):sea?320:145)*r.sy*r.sy;
    l.angle=night?.61:.78;l.color.set(i?0xc1def1:sea?0xa7e3ff:0xffe0b5);
  }
  scene.environmentIntensity=sea?.23:night?.22:glass?.58:.39;
  hemi.intensity=sea?.79:night?.58:glass?1.12:.80;
  hemi.color.set(sea?0xb7dbee:night?0xffe9c2:0xfff2d9);
  hemi.groundColor.set(sea?0x395a68:night?0x594a41:0x897769);
  sun.intensity=sea?2.45:night?2.05:rotunda?2.13:2.65;
  sun.color.set(sea?0xc5edfc:night?0xffce97:0xffe4bd);
  sun.position.set(r.x-14,23,r.z+9);
  bounce.intensity=sea?.63:night?.35:.60;
  scene.fog.color.set(sea?0x426477:night?0x474439:0xcabea8);
  if(r.id==='forecourt'){hemi.color.set(0xd4e6ff);hemi.groundColor.set(0x9c9081);hemi.intensity=1.35;sun.color.set(0xffedce);sun.intensity=2.1;sun.position.set(-22,31,45);scene.environmentIntensity=.66;spots.forEach(l=>l.intensity=0);}
  if(r.id==='universe'){hemi.color.set(0xe0edff);hemi.groundColor.set(0x92938b);hemi.intensity=1.10;sun.color.set(0xfff2df);sun.intensity=1.65;bounce.intensity=.73;scene.environmentIntensity=.48;scene.fog.color.set(0x8e9ba4);}
  if(r.id==='titan'){hemi.color.set(0xf5ecdb);hemi.intensity=.78;sun.color.set(0xffebd1);sun.intensity=2.05;bounce.intensity=.57;}
  if(r.id==='northMammals'){sun.color.set(0xdcdccb);sun.intensity=.85;hemi.color.set(0xe8eadd);hemi.intensity=.68;bounce.intensity=.32;scene.environmentIntensity=.25;spots.forEach(l=>l.intensity=22);scene.fog.color.set(0x383b34);}
  scene.fog.density=sea?.014:night?.011:.0048;
}
