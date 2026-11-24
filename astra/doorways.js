// A distant doorway occupies only a few pixels. A view rendered from the
// neighboring gallery supplies the distant detail until its 3D room is near.
function doorwayBackdrop(from,port){
  const id=from.id+'__'+port.id,src=typeof portalViews==='undefined'?null:portalViews[id];
  if(!src)return null;
  const n=catalog.get(port.id),[dx,dz]=sideInfo[port.side],x=from.x+(dx?dx*from.w/2:port.at),z=from.z+(dz?dz*from.d/2:port.at);
  const depth=Math.min(4.0,(dx?n.w:n.d)*.21),w=port.width;
  const group=new THREE.Group();
  group.position.set(x,0,z);group.rotation.y=Math.atan2(-dx,-dz);
  const map=new THREE.TextureLoader().load(src);map.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshBasicMaterial({map,toneMapped:false});
  // Floor, soffit and side returns enclose the image at oblique angles.
  const world=new GalleryMesh(),wide=w*1.6+depth*3.3;
  world.box([0,-.07,-depth/2],[wide,.14,depth+.1],'#8d897b');
  const backW=Math.max(w*2.3,depth*3.9),backH=backW/1.5;
  const image=new THREE.Mesh(new THREE.PlaneGeometry(backW,backH),material);
  image.position.set(0,1.73+depth*.05,-depth);group.add(image,world.finish());
  group.userData.portal=true;group.userData.from=from.id;group.userData.to=port.id;return group;
}
