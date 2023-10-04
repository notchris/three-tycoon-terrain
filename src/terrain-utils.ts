import * as THREE from "three";

export function raiseTerrain(
  terrain: THREE.Mesh,
  face: THREE.Face,
  faceIndex: number,
  amount: number = 0.5,
  scene: THREE.Scene,
  selector: THREE.Mesh
) {
  const positionAttribute = terrain.geometry.getAttribute("position");

  const verticesInUpdatedBox = [];

  const box3 = new THREE.Box3().setFromObject(selector);
  box3.applyMatrix4(terrain.matrixWorld);
  const helper = new THREE.Box3Helper(box3);
  scene.add(helper);

  // Iterate through all the vertices
  for (let i = 0; i < positionAttribute.count; i++) {
    // Get the vertex position
    const vertex = new THREE.Vector3();
    vertex.fromBufferAttribute(positionAttribute, i);

    // Check if the vertex is within the updated Box3
    if (box3.containsPoint(vertex)) {
      verticesInUpdatedBox.push(i); // Store the index of the vertex
    }
  }

  // Now, 'verticesInUpdatedBox' contains the indices of vertices within the updated Box3
  console.log(verticesInUpdatedBox);
}

export function lowerTerrain(
  terrain: THREE.Mesh,
  face: THREE.Face,
  amount: number = 0.5
) {
  console.log(terrain, face);

  const a = face.a;
  const b = face.b;
  const c = face.c;

  // Get the position attribute buffer
  const positionAttribute = terrain.geometry.getAttribute("position");
  const positions = positionAttribute.array;

  // Update the vertices' positions

  //   positions[a * 3] // x1
  //   positions[a * 3 + 1] // y1
  positions[a * 3 + 2] -= amount; // z1

  //   positions[b * 3] // x2
  //   positions[b * 3 + 1] // y2
  positions[b * 3 + 2] -= amount; // z2

  //   positions[c * 3] // x3
  //   positions[c * 3 + 1] // y3
  positions[c * 3 + 2] -= amount; // z3

  positionAttribute.needsUpdate = true;
}

export function flattenTerrain(terrain: THREE.Mesh, face: THREE.Face) {
  console.log(terrain, face);

  const a = face.a;
  const b = face.b;
  const c = face.c;

  // Get the position attribute buffer
  const positionAttribute = terrain.geometry.getAttribute("position");
  const positions = positionAttribute.array;

  // Update the vertices' positions
  // Math.round(value/interval) * interval
  const lowest = Math.min(
    ...[positions[a * 3 + 2], positions[b * 3 + 2], positions[c * 3 + 2]]
  );
  const lowestRounded = Math.round(lowest / 0.5) * 0.5;
  //   positions[a * 3] // x1
  //   positions[a * 3 + 1] // y1
  positions[a * 3 + 2] = lowestRounded; // z1

  //   positions[b * 3] // x2
  //   positions[b * 3 + 1] // y2
  positions[b * 3 + 2] = lowestRounded; // z2

  //   positions[c * 3] // x3
  //   positions[c * 3 + 1] // y3
  positions[c * 3 + 2] = lowestRounded; // z3

  positionAttribute.needsUpdate = true;
}
