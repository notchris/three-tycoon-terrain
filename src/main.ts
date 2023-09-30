import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { generateTerrain } from "./diamond-square";
import { DiamondSquareGeometry } from "./diamond-square.three";

let scene = new THREE.Scene();

let renderer = new THREE.WebGLRenderer({
  antialias: true,
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const aspect = innerWidth / innerHeight;
const d = 5;

const camera = new THREE.OrthographicCamera(
  -d * aspect,
  d * aspect,
  d,
  -d,
  0.1,
  1000
);

camera.position.set(20, 20, 20); // all components equal
camera.lookAt(scene.position); // or the origin

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxZoom = 4.0;
controls.minZoom = 0.3;
controls.enableRotate = false;

controls.mouseButtons.LEFT = THREE.MOUSE.PAN;

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

let light = new THREE.DirectionalLight(0xffffff, 0.75);
light.position.setScalar(1);
scene.add(light, new THREE.AmbientLight(0xffffff, 0.75));

const mapWidth = 80;
const mapHeight = 80;

const model = generateTerrain(mapWidth, mapHeight, 0.05);

const height = model.length - 1;
const width = model[0].length - 1;

console.log(model);

const geometry = new DiamondSquareGeometry(width, height, model);

const edges = new THREE.EdgesGeometry(geometry);
const line = new THREE.LineSegments(
  edges,
  new THREE.LineBasicMaterial({ color: 0x000000 })
);
scene.add(line);
line.rotation.x = -Math.PI / 2;

const texture = new THREE.TextureLoader().load("grass13.png");
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(20, 20);

let gu = {
  center: {
    value: new THREE.Vector3(),
  },
  lineHalfWidth: {
    value: 0.025,
  },
  size: {
    value: new THREE.Vector2(0.455, 0.455),
  },
  textureGrass: {
    value: texture,
  },
};

const colors = {
  water: `vec3(0.235, 0.702, 1.443)`,
  grass: `vec3(0.604, 0.804, 0.196)`,
  grass2: `vec3 (0.000, 0.502, 0.000)`,
  snow: `vec3(255.0, 255.0, 255.0)`,
  dirt: `vec3(0.410, 0.298, 0.152)`,
  sand: `vec3(1.00, 0.922, 0.480)`,
};

let shader = new THREE.MeshStandardMaterial({
  flatShading: true,
  // map: texture,
  //@ts-ignore
  onBeforeCompile: (shader) => {
    shader.uniforms.center = gu.center;
    shader.uniforms.lineHalfWidth = gu.lineHalfWidth;
    shader.uniforms.size = gu.size;
    shader.vertexShader = `
      varying float vAmount;
      varying vec2 vUV;
      varying vec3 vPos;
      varying float z;
      varying float y;
      varying float x;
      ${shader.vertexShader}
    `.replace(
      `#include <begin_vertex>`,
      `#include <begin_vertex>
        vUV = uv;
        vAmount = position.y;
        vPos = position;
        z = ( position.z + 0.1 ) * 5.0;
        y = ( position.y + 0.1 ) * 5.0;
        
        
      `
    );
    //console.log(shader.vertexShader);
    shader.fragmentShader = `
      #define ss(a, b, c) smoothstep(a, b, c)
      varying vec3 vPos;
      uniform vec3 center;
      uniform vec2 size;
      uniform float lineHalfWidth;
      uniform sampler2D textureGrass;
      varying float z;
      varying float y;

      varying vec2 vUV;
      
      varying float vAmount;
      
      vec3 col;

      
      ${shader.fragmentShader}
    `.replace(
      `#include <dithering_fragment>`,
      `#include <dithering_fragment>

      float cell = 1.0;
      vec2 coord = vPos.xz / cell;
      vec2 coordb = vPos.xy / cell;

      vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
      vec2 gridb = abs(fract(coordb - 0.5) - 0.5) / fwidth(coordb);
      float line = min(grid.x, grid.y);
      float lineb = min(gridb.y, gridb.x);

      float color = 1.0 - min(line, 1.0);
      float colorb = 1.0 - min(lineb, 1.0);
      float colorc = mix(color, colorb, 1.0);
      
      vec2 Ro = size;
      float cellSize = 1.0;
      vec2 snapped = vec2(center.x - (center.x - (cellSize * floor(center.x/cellSize)) - 0.5), center.y - (center.y - (cellSize * floor(center.y/cellSize)) - 0.5));
    
      vec2 Uo = abs( vPos.xy - snapped ) - Ro;
      
      vec3 c = mix(vec3(1.), vec3(255.,255.,0.), float(abs(max(Uo.x,Uo.y)) < lineHalfWidth));
      // gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0, 0, 0), colorc);
      // gl_FragColor.rgb *= c;

      float alpha = smoothstep(0.0, 1.0, z);

      float colorMixA = smoothstep(2.0, 10.0, z);
      float colorMixB = smoothstep(100.0, 200.0, z);
      col = z < -2. ? col * alpha : mix(${colors.sand}, ${colors.grass}, colorMixA);
      if (z > 1.0) {
        col = mix(${colors.grass}, ${colors.dirt}, colorMixB) * alpha;
      }
      // Add condition here to go from color to a texture2D(grassTexture, position);
      
      
      outgoingLight *= col;
      outgoingLight = mix(outgoingLight, vec3(0, 0, 0), colorc);
      outgoingLight *= c;

      gl_FragColor = vec4(outgoingLight, diffuseColor.a);

      `
    );
    console.log(shader.fragmentShader);
  },
});

let o = new THREE.Mesh(geometry, shader);
scene.add(o);

o.rotation.x = -Math.PI / 2;

let waterGeo = new THREE.PlaneGeometry(mapWidth, mapHeight);
let waterMaterial = new THREE.MeshStandardMaterial({
  color: 0x1ec8ff,
  transparent: true,
  opacity: 0.7,
});
let water = new THREE.Mesh(waterGeo, waterMaterial);
water.rotation.x = -Math.PI / 2;
water.position.y = 0.001;
scene.add(water);

let pointer = new THREE.Vector2();
let raycaster = new THREE.Raycaster();
let intersects;
let point = new THREE.Vector3();

window.addEventListener("pointermove", (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  intersects = raycaster.intersectObject(o, false);

  if (intersects.length > 0) {
    o.worldToLocal(point.copy(intersects[0].point));
    // point.x = point.x += 0.5;
    // point.y = point.y += 0.5;
    gu.center.value.copy(point);
  }
});

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
  controls.update();
});
