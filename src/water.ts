import * as THREE from "three";

export function justAddWater(width: number, height: number) {
  let waterGeo = new THREE.PlaneGeometry(width, height);
  let waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x1ec8ff,
    transparent: true,
    opacity: 0.7,
  });
  let water = new THREE.Mesh(waterGeo, waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.1;
  return water;
}
