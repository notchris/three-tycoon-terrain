import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

export default async function createSurfaceSampler(terrain: THREE.Mesh) {
  const count = 50;

  //   const model = await new GLTFLoader().loadAsync("tree.glb");
  //   console.log(model.scene.children[0]);
  //   const modelGeo = (model.scene.children[0] as THREE.Mesh).geometry;

  //   const modelMaterial = (model.children[0] as THREE.Mesh).material;
  //@ts-ignore
  //   modelMaterial.flatShading = true;
  //   modelGeo.rotateX(Math.PI / 2);
  //   modelGeo.translate(0.25, -1, 0.5);
  //   modelGeo.scale(0.005, 0.005, 0.005);

  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 2, 1),
    new THREE.MeshPhongMaterial({ color: "red" }),
    count
  );
  mesh.geometry.rotateX(-Math.PI / 2);

  const sampler = new MeshSurfaceSampler(terrain);

  const geometry = terrain.geometry;
  const numVertices = geometry.attributes.position.count;
  const weights = new Float32Array(numVertices);
  const minHeight = 0.5;
  const maxHeight = 2.0;

  for (let i = 0; i < numVertices; i++) {
    const z = geometry.attributes.position.getZ(i);

    if (z >= minHeight && z <= maxHeight) {
      weights[i] = 1.0;
    } else {
      weights[i] = 0.0;
    }
  }

  geometry.setAttribute("weight", new THREE.BufferAttribute(weights, 1));

  sampler.setWeightAttribute("weight");
  sampler.build();

  const position = new THREE.Vector3();
  const matrix = new THREE.Matrix4();

  for (let i = 0; i < count; i++) {
    sampler.sample(position);

    matrix.makeTranslation(position.x, position.y, position.z);

    mesh.setMatrixAt(i, matrix);
  }
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}
