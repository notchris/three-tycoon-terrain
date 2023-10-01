import * as THREE from "three";

export function raiseTerrain(
  terrain: THREE.Mesh,
  face: THREE.Face,
  faceIndex: number,
  amount: number = 0.5,
  scene: THREE.Scene
) {
  const positionAttribute = terrain.geometry.getAttribute("position");
  const positions = positionAttribute.array;
  const indices = (terrain.geometry.getIndex() as THREE.BufferAttribute).array;

  const faceVertices = [
    indices[faceIndex * 3],
    indices[faceIndex * 3 + 1],
    indices[faceIndex * 3 + 2],
  ];

  const neighboringFaces = [];

  for (let i = 0; i < indices.length; i += 3) {
    if (i === faceIndex * 3) {
      continue; // Skip the same face
    }

    const otherFaceVertices = [indices[i], indices[i + 1], indices[i + 2]];

    // Check if the faces share at least two vertices
    const sharedVertices = faceVertices.filter((vertexIndex) =>
      otherFaceVertices.includes(vertexIndex)
    );

    if (sharedVertices.length >= 2) {
      neighboringFaces.push(i / 3); // Add the index of the neighboring face
    }
  }

  console.log(neighboringFaces);

  neighboringFaces.forEach((index) => {
    const faceVertices = [
      indices[faceIndex * 3],
      indices[faceIndex * 3 + 1],
      indices[faceIndex * 3 + 2],
    ];

    const a = indices[faceIndex * 3];
    const b = indices[faceIndex * 3 + 1];
    const c = indices[faceIndex * 3 + 2];

    positions[a * 3 + 2] = amount;
    positions[b * 3 + 2] = amount;
    positions[c * 3 + 2] = amount;
  });

  positionAttribute.needsUpdate = true;

  //   const a = face.a;
  //   const b = face.b;
  //   const c = face.c;

  //   // Get the position attribute buffer
  //   const positionAttribute = terrain.geometry.getAttribute("position");
  //   const positions = positionAttribute.array;

  //   // Update the vertices' positions

  //   //   positions[a * 3] // x1
  //   //   positions[a * 3 + 1] // y1
  //   positions[a * 3 + 2] += amount; // z1

  //   //   positions[b * 3] // x2
  //   //   positions[b * 3 + 1] // y2
  //   positions[b * 3 + 2] += amount; // z2

  //   //   positions[c * 3] // x3
  //   //   positions[c * 3 + 1] // y3
  //   positions[c * 3 + 2] += amount; // z3

  //   positionAttribute.needsUpdate = true;
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
