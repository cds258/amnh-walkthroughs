// Batch many small bones, masonry blocks and diorama elements into a few draws.
class GalleryMesh {
  constructor() {
    this.boxes=[]; this.ellipsoids=[]; this.vertices=[]; this.normals=[]; this.colors=[];
    this.palette=new Map(); this.up=new THREE.Vector3(0,1,0);
  }
  color(hex) {
    if (!this.palette.has(hex)) this.palette.set(hex,new THREE.Color(hex));
    return this.palette.get(hex);
  }
  box(p,s,c) { this.boxes.push([p,s,c]); }
  ell(p,s,c) { this.ellipsoids.push([p,s,c]); }
  tri(a,b,c,color) {
    const u=new THREE.Vector3().fromArray(b).sub(new THREE.Vector3().fromArray(a));
    const v=new THREE.Vector3().fromArray(c).sub(new THREE.Vector3().fromArray(a));
    const n=u.cross(v).normalize(), tint=this.color(color);
    for(const p of [a,b,c]){
      this.vertices.push(...p); this.normals.push(n.x,n.y,n.z); this.colors.push(tint.r,tint.g,tint.b);
    }
  }
  rod(a,b,rA,rB,color) {
    const axis=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
    if(axis.lengthSq()<1e-12)return;
    axis.normalize();
    const u=new THREE.Vector3().crossVectors(axis,Math.abs(axis.y)<.9?this.up:new THREE.Vector3(1,0,0)).normalize();
    const v=new THREE.Vector3().crossVectors(axis,u);
    const sides=Math.max(rA,rB)>.3?16:7;
    const ring=(p,r,i)=>{const t=i*Math.PI*2/sides,x=r*Math.cos(t),y=r*Math.sin(t);return [p[0]+x*u.x+y*v.x,p[1]+x*u.y+y*v.y,p[2]+x*u.z+y*v.z];};
    let l=ring(a,rA,0),h=ring(b,rB,0);
    for(let i=1;i<=sides;i++) {
      const ll=ring(a,rA,i),hh=ring(b,rB,i);
      this.tri(l,ll,h,color);this.tri(ll,hh,h,color);
      this.tri(a,ll,l,color);this.tri(b,h,hh,color);
      l=ll;h=hh;
    }
  }
  finish(shadows=false) {
    const group=new THREE.Group();
    for(const [geo,rows] of [[GalleryMesh.cube,this.boxes],[GalleryMesh.sphere,this.ellipsoids]]){
      if(!rows.length)continue;
      const m=new THREE.InstancedMesh(geo,shadows?GalleryMesh.artSolid:GalleryMesh.solid,rows.length);
      const mat=new THREE.Matrix4();
      rows.forEach(([p,s,c],i)=>{mat.makeScale(...s).setPosition(...p);m.setMatrixAt(i,mat);m.setColorAt(i,this.color(c));});
      group.add(m);
    }
    if(this.vertices.length){
      const geo=new THREE.BufferGeometry();
      for(const [name,values] of [['position',this.vertices],['normal',this.normals],['color',this.colors]])geo.setAttribute(name,new THREE.Float32BufferAttribute(values,3));
      group.add(new THREE.Mesh(geo,shadows?GalleryMesh.artColored:GalleryMesh.colored));
    }
    group.children.forEach(m=>{m.castShadow=shadows;m.receiveShadow=true;});
    return group;
  }
}
GalleryMesh.cube=new THREE.BoxGeometry();
GalleryMesh.sphere=new THREE.SphereGeometry(1,12,9);
GalleryMesh.solid=new THREE.MeshStandardMaterial({roughness:.82,side:THREE.DoubleSide});
GalleryMesh.colored=GalleryMesh.solid.clone();GalleryMesh.colored.vertexColors=true;
