import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { generateTerrain } from "./diamond-square";
import { DiamondSquareGeometry } from "./diamond-square.three";
import { terrainShader } from "./terrain-shader";
import { justAddWater } from "./water";
import { flattenTerrain, lowerTerrain, raiseTerrain } from "./terrain-utils";
import createSurfaceSampler from "./surface-sample";

// Scene
const scene = new THREE.Scene();

// Renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Camera
const aspect = innerWidth / innerHeight;
const d = 10;
const camera = new THREE.OrthographicCamera(
  -d * aspect,
  d * aspect,
  d,
  -d,
  0.1,
  1000
);
camera.position.set(30, 30, 30); // all components equal
camera.lookAt(scene.position); // or the origin

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxZoom = 4.0;
controls.minZoom = 0.3;
controls.enableRotate = false;
controls.mouseButtons.LEFT = THREE.MOUSE.PAN;

// Lights
const light = new THREE.DirectionalLight(0xffffff, 0.75);
light.position.setScalar(1);
scene.add(light, new THREE.AmbientLight(0xffffff, 0.75));

// Generate Terrain Model
const mapWidth = 80;
const mapHeight = 80;
const model = generateTerrain(mapWidth, mapHeight, 0.05);

// Generate Terrain Geometry
const height = model.length - 1;
const width = model[0].length - 1;
const geometry = new DiamondSquareGeometry(width, height, model);

const texture = new THREE.TextureLoader().load("grass13.png");
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(20, 20);

// Terrain Shader

let selectionSize = 3;
const selector = new THREE.Mesh(
  new THREE.BoxGeometry(3, 3, 10),
  new THREE.MeshBasicMaterial({ wireframe: true })
);
scene.add(selector);
selector.geometry.computeBoundingBox();

// Terrain Shader
let lineWidth = 0.025;
let uniforms = {
  center: {
    value: new THREE.Vector3(),
  },
  lineHalfWidth: {
    value: lineWidth,
  },
  size: {
    value: new THREE.Vector2(
      selectionSize / 2 - lineWidth,
      selectionSize / 2 - lineWidth
    ),
  },
};
const shader = terrainShader(uniforms);

// Terrain Mesh
const o = new THREE.Mesh(geometry, shader);
o.geometry.computeBoundingBox();
scene.add(o);
o.rotation.x = -Math.PI / 2;

// const surface = await createSurfaceSampler(o);
// scene.add(surface);

// Water
const water = justAddWater(width, height);
scene.add(water);

// Raycast
const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let intersects;
const point = new THREE.Vector3();
let face = {
  a: 0,
  b: 0,
  c: 0,
  normal: new THREE.Vector3(),
  materialIndex: 0,
};
let faceIndex: number = 0;

let hasIntersect = false;

window.addEventListener("pointermove", (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  intersects = raycaster.intersectObject(o, false);

  if (intersects.length > 0) {
    o.worldToLocal(point.copy(intersects[0].point));
    face = intersects[0].face as THREE.Face;
    faceIndex = intersects[0].faceIndex as number;
    uniforms.center.value.copy(point);
    const cellSize = 1;
    const center = point;

    const snapped = {
      x:
        center.x -
        (center.x -
          cellSize * Math.floor(center.x / cellSize) -
          cellSize / 2.0),
      y:
        center.y -
        (center.y -
          cellSize * Math.floor(center.y / cellSize) -
          cellSize / 2.0),
    };

    selector.position.set(snapped.x, 0, -snapped.y);

    hasIntersect = true;
  } else {
    hasIntersect = false;
  }
});

window.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "q":
      if (event.repeat) return;
      if (!hasIntersect) return;
      raiseTerrain(o, face, faceIndex, 0.5, scene, selector);
      break;
    case "w":
      if (event.repeat) return;
      if (!hasIntersect) return;
      lowerTerrain(o, face);
      break;
    case "e":
      if (event.repeat) return;
      if (!hasIntersect) return;
      flattenTerrain(o, face);
      break;
    default:
      break;
  }
});

window.addEventListener("resize", (event) => {
  const { width, height } = document.body.getBoundingClientRect();
  const aspect = width / height;
  const d = 5;

  camera.left = -d * aspect;
  camera.right = d * aspect;
  camera.top = d;
  camera.bottom = -d;

  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
  controls.update();
});
