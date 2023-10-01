import * as THREE from "three";

export function terrainShader(gu: any) {
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
            // uniform sampler2D textureGrass;
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
            vec2 snapped = vec2(center.x - (center.x - (cellSize * floor(center.x/cellSize)) - cellSize / 2.0), center.y - (center.y - (cellSize * floor(center.y/cellSize)) - cellSize / 2.0));
          
            vec2 Uo = abs( vPos.xy - snapped ) - Ro;
            
            vec3 c = mix(vec3(1.), vec3(255.,255.,0.), float(abs(max(Uo.x,Uo.y)) < lineHalfWidth));
      
            float alpha = smoothstep(-10.0, 0.0, z);
            float colorMixA = smoothstep(0.0, 1.0, z);
            float colorMixB = smoothstep(1.0, 2.0, z);
            float colorMixC = smoothstep(2.0, 4.0, z);
            
            //col = z < -2. ? col * alpha : mix(${colors.sand}, ${colors.grass}, colorMixA);
      
            if (z < -2.0) {
              col = mix(${colors.sand}, ${colors.grass}, colorMixA);
            } else if (z >= -2.0 && z < 1.5) {
              col = mix(${colors.sand}, ${colors.sand}, colorMixA);
            } else if (z >= 1.5) {
              col = mix(${colors.sand}, ${colors.grass}, colorMixB) * alpha;
            } else {
              col = mix(${colors.dirt}, ${colors.snow}, colorMixC) * alpha;
            }
            
            
            outgoingLight *= col;
            outgoingLight = mix(outgoingLight, vec3(0, 0, 0), colorc);
            outgoingLight *= c;
      
            gl_FragColor = vec4(outgoingLight, diffuseColor.a);
      
            `
      );
    },
  });
  return shader;
}
