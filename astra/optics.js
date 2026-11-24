// A single geometry pass supplies a depth texture for small contact shadows.
// Render occlusion at half resolution, then use depth-aware upsampling to avoid
// painting thin bones onto the wall behind them.
function museumOptics(gl,camera){
  if(!gl.extensions.has('EXT_color_buffer_float'))return null;
  const depth=new THREE.DepthTexture(1,1,THREE.UnsignedIntType);
  const color=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,
    depthTexture:depth,samples:Math.min(4,gl.capabilities.maxSamples)});
  const occlusion=new THREE.WebGLRenderTarget(1,1,{depthBuffer:false});
  const passScene=new THREE.Scene(),passCamera=new THREE.Camera();
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
  const plane=new THREE.Mesh(geometry);plane.frustumCulled=false;passScene.add(plane);
  const uniforms={image:{value:color.texture},zMap:{value:depth},aoMap:{value:occlusion.texture},
    inverseProj:{value:camera.projectionMatrixInverse},pixel:{value:new THREE.Vector2()},ocPixel:{value:new THREE.Vector2()}};
  const vertexShader='varying vec2 uvp;void main(){uvp=position.xy*.5+.5;gl_Position=vec4(position.xy,0.,1.);}';
  const material=fragmentShader=>new THREE.ShaderMaterial({uniforms,vertexShader,fragmentShader,depthWrite:false,depthTest:false});
  const preamble=`varying vec2 uvp; uniform sampler2D zMap;uniform vec2 pixel;uniform mat4 inverseProj;
    vec3 pointAt(vec2 uv){vec4 p=inverseProj*vec4(uv*2.-1.,texture2D(zMap,uv).r*2.-1.,1.);return p.xyz/p.w;}`;
  const ao=material(preamble+`
    void main(){
      vec3 p=pointAt(uvp);
      if(-p.z>90.){gl_FragColor=vec4(1.);return;}
      vec3 l=p-pointAt(uvp-vec2(pixel.x,0.)),r=pointAt(uvp+vec2(pixel.x,0.))-p;
      vec3 b=p-pointAt(uvp-vec2(0.,pixel.y)),t=pointAt(uvp+vec2(0.,pixel.y))-p;
      vec3 n=normalize(cross(abs(l.z)<abs(r.z)?l:r,abs(b.z)<abs(t.z)?b:t));
      float occ=0.;float phase=fract(dot(floor(gl_FragCoord.xy),vec2(.75487767,.56984029)))*6.2831853;
      for(int j=0;j<16;j++){
        float i=float(j),rad=.12+.86*(i+.5)/16.,a=i*2.399963+phase;
        vec2 shift=vec2(cos(a),sin(a))*rad*.56/max(-p.z,.3);
        shift.x*=pixel.x/pixel.y;
        vec3 v=pointAt(clamp(uvp+shift,.001,.999))-p;float len=length(v);
        float contact=max(0.,dot(n,v)/max(.001,len)-.065);
        occ+=contact*(1.-smoothstep(.05,1.25,len));
      }
      float visibility=clamp(1.-1.85*occ/16.,.48,1.);
      gl_FragColor=vec4(visibility,visibility,visibility,1.);
    }`);
  const combine=material(preamble+`
    uniform sampler2D image,aoMap;uniform vec2 ocPixel;
    void main(){
      vec3 rgb=texture2D(image,uvp).rgb;float z=pointAt(uvp).z;
      float v=0.,w=0.;
      for(int i=0;i<9;i++){
        vec2 offset=vec2(float(i-3*(i/3))-1.,float(i/3)-1.)*ocPixel;
        vec2 at=uvp+offset;float d=abs(pointAt(at).z-z);
        float k=(i==4?2.:1.)/(1.+d*30.);v+=k*texture2D(aoMap,at).r;w+=k;
      }
      rgb*=mix(vec3(.87,.90,.95),vec3(1.),v/w)*mix(.10,1.,v/w);
      gl_FragColor=vec4(rgb,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`);
  return {
    resize(){const v=gl.getDrawingBufferSize(new THREE.Vector2());color.setSize(v.x,v.y);
      const w=Math.max(1,Math.ceil(v.x/2)),h=Math.max(1,Math.ceil(v.y/2));occlusion.setSize(w,h);
      uniforms.pixel.value.set(1/v.x,1/v.y);uniforms.ocPixel.value.set(1/w,1/h);},
    draw(scene){gl.setRenderTarget(color);gl.render(scene,camera);
      plane.material=ao;gl.setRenderTarget(occlusion);gl.render(passScene,passCamera);
      plane.material=combine;gl.setRenderTarget(null);gl.render(passScene,passCamera);}
  };
}
