// Adapted from https://github.com/mrdoob/three.js/blob/master/src/geometries/PlaneGeometry.js

import * as THREE from "three";

export class DiamondSquareGeometry extends THREE.BufferGeometry {
  type: string;
  parameters: {
    width: number;
    height: number;
    heightmap: number[][];
  };
  constructor(width = 1, height = 1, heightmap: number[][]) {
    super();

    this.type = "DiamondSquareGeometry";

    this.parameters = {
      width,
      height,
      heightmap,
    };

    const width_half = width / 2;
    const height_half = height / 2;

    const gridX = heightmap[0].length - 1;
    const gridY = heightmap.length - 1;

    const gridX1 = gridX + 1;
    const gridY1 = gridY + 1;

    const segment_width = width / gridX;
    const segment_height = height / gridY;

    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];

    for (let iy = 0; iy < gridY1; iy++) {
      const y = iy * segment_height - height_half;

      for (let ix = 0; ix < gridX1; ix++) {
        const x = ix * segment_width - width_half;

        vertices.push(x, -y, heightmap[iy][ix] * 0.5);

        normals.push(0, 0, 1);

        uvs.push(ix / gridX);
        uvs.push(1 - iy / gridY);
      }
    }

    for (let iy = 0; iy < gridY; iy++) {
      for (let ix = 0; ix < gridX; ix++) {
        const a = ix + gridX1 * iy;
        const b = ix + gridX1 * (iy + 1);
        const c = ix + 1 + gridX1 * (iy + 1);
        const d = ix + 1 + gridX1 * iy;

        const ah = heightmap[iy][ix];
        const bh = heightmap[iy + 1][ix];
        const ch = heightmap[iy + 1][ix + 1];
        const dh = heightmap[iy][ix + 1];

        const reverseCrease = (ah === bh && ah === dh) || ah !== ch;

        if (reverseCrease) {
          indices.push(a, b, d);
          indices.push(b, c, d);
        } else {
          indices.push(b, c, a);
          indices.push(a, c, d);
        }
      }
    }

    this.setIndex(indices);
    this.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    this.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    this.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  }

  copy(source: any) {
    super.copy(source);

    this.parameters = Object.assign({}, source.parameters);

    return this;
  }
}
