/**
 * Generate fractal terrain.
 * @param {number} width - Width of rectangle.
 * @param {number} height - Height of rectangle.
 * @param {number} smoothness - Higher this value, smoother the terrain.
 *      recommended value is 1.
 * @return {Array.<Array.<int>>} A two-dimensional array holding the elevations
 *     of the vertices of the terrain.
 */
export function generateTerrain(
  width: number,
  height: number,
  smoothness: number
) {
  var smoothness = typeof smoothness === "undefined" ? 1 : smoothness;
  var size = smallestPowerOfTwoAfter(Math.max(width, height));

  var squareTerrain = generateSquareTerrain(size, smoothness);
  var terrain = [];
  // terrain is a matrix of size (width + 1) x (height + 1)
  for (var i = 0; i <= height; ++i) {
    terrain.push(squareTerrain[i].slice(0, width + 1));
  }

  return terrain;
}

function smallestPowerOfTwoAfter(n: number) {
  var ret = 1;
  while (ret < n) {
    ret <<= 1;
  }
  return ret;
}

/**
 * Generate a square fractal terrain.
 * @param {number} size - Size of terrain, MUST be a power of 2.
 * @param {number} smoothness - Higher this value, smoother the terrain.
 *      recommended value is 1.
 * @return {Array.<Array.<int>>} A two-dimensional array holding the elevations
 *     of the vertices of the terrain. Each elevation will be between -1 and 1.
 */
function generateSquareTerrain(size: number, smoothness: number) {
  // throw error if size is not a power of two.
  if (size & (size - 1)) {
    throw new Error(
      "Expected terrain size to be a power of 2, received " + size + " instead."
    );
  }

  // generate a square matrix
  var mat = generateMatrix(size + 1);

  // iterate on the matrix using the square-diamond algorithm
  iterate(mat, smoothness);

  return mat;
}

/**
 * Generate a square matrix
 * @param {number} size - Width and length of the square.
 * @return {Array.<Array.<int>>} The vertices matrix of the square
 */
function generateMatrix(size: number) {
  var matrix = [];

  for (var i = 0; i < size; i++) {
    var row = [];
    for (var j = 0; j < size; ++j) {
      row.push(0);
    }
    matrix.push(row);
  }

  return matrix;
}
function applyTerrainConstraints(terrain: number[][]) {
  const numRows = terrain.length;
  const numCols = terrain[0].length;

  // Helper function to round a number to the nearest integer
  const roundToInteger = (value: number) => Math.round(value);

  // Helper function to get the neighboring heights of a point
  const getNeighborHeights = (row: number, col: number) => {
    const neighbors = [];
    if (row > 0) neighbors.push(terrain[row - 1][col]);
    if (row < numRows - 1) neighbors.push(terrain[row + 1][col]);
    if (col > 0) neighbors.push(terrain[row][col - 1]);
    if (col < numCols - 1) neighbors.push(terrain[row][col + 1]);
    return neighbors;
  };

  // Iterate through each point in the terrain
  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      const currentHeight = terrain[row][col];
      const neighbors = getNeighborHeights(row, col);

      // Calculate the average of neighboring heights
      const averageHeight =
        neighbors.reduce((sum, height) => sum + height, currentHeight) /
        (neighbors.length + 1);

      // Round the average to the nearest integer
      const roundedHeight = roundToInteger(averageHeight);

      // Update the terrain point with the rounded height
      terrain[row][col] = roundedHeight;
    }
  }
}

/**
 * Iterate on the matrix using Diamond-Square algorithm.
 * @param {Array.<Array.<int>>} matrix - Matrix to be iterated on.
 * @param {number} smoothness - Smoothness of terrain.
 */
function iterate(matrix: number[][], smoothness: number) {
  // the count of iterations applied so far
  var counter = 0;
  // the total number of iterations to apply is log_2^(size of matrix)
  var numIteration = Math.log(matrix.length - 1) / Math.LN2;
  while (counter++ < numIteration) {
    diamond(matrix, counter, smoothness);
    square(matrix, counter, smoothness);
  }
  applyTerrainConstraints(matrix);
}

/**
 * Diamond step of iteration.
 * @param {Array.<Array.<int>>} matrix - Matrix to iterate on.
 * @param {number} depth - Depth of current iteration(starts from 1).
 * @param {number} smoothness - Smoothness of terrain.
 */
function diamond(matrix: number[][], depth: number, smoothness: number) {
  var len = matrix.length;
  var terrainSize = len - 1;
  var numSegs = 1 << (depth - 1);
  var span = terrainSize / numSegs;
  var half = span / 2;

  // enumerate sub-squares
  // for each sub-square, the height of the center is caculated
  // by averaging the height of its four vertices plus a random offset.
  for (var x = 0; x < terrainSize; x += span) {
    for (var y = 0; y < terrainSize; y += span) {
      //  (x, y)
      //    \
      //     a---b---c
      //     |   |   |
      //     d---e---f
      //     |   |   |
      //     g---h---i
      //
      //     \___ ___/
      //         V
      //       span
      //
      var va = [x, y];
      var vc = [x + span, y];
      var ve = [x + half, y + half];
      var vg = [x, y + span];
      var vi = [x + span, y + span];

      // heights of vertices
      var heights = [va, vc, vg, vi].map(function (v) {
        return matrix[v[1]][v[0]];
      });

      // average height
      var avg = average(heights);

      // random offset
      var offset = getH(smoothness, depth);

      // set center height
      matrix[ve[1]][ve[0]] = avg + offset;
    }
  }
}

/**
 * Square step of iteration.
 * @param {Array.<Array.<int>>} matrix - Matrix to iterate on.
 * @param {number} depth - Depth of current iteration(starts from 1).
 * @param {number} smoothness - Smoothness of terrain.
 */
function square(matrix: number[][], depth: number, smoothness: number) {
  var len = matrix.length;
  var terrainSize = len - 1;
  var numSegs = 1 << (depth - 1);
  var span = terrainSize / numSegs;
  var half = span / 2;

  // enumerate sub-dimaonds
  for (var x = 0; x < terrainSize; x += span) {
    for (var y = 0; y < terrainSize; y += span) {
      // for each sub-square, the height of the center is caculated
      // by averaging the height of its four vertices plus a random offset.
      // for example,
      //       h = avg(g, c, i, m) + random;
      //       f = avg(a, g, k, i) + random;
      //       j = f;
      //
      //  (x, y)
      //    \
      //     a---b---c---d---e
      //     | \ | / | \ | / |
      //     f---g---h---i---j
      //     | / | \ | / | \ |
      //     k---l---m---n---o
      //     | \ | / | \ | / |
      //     p---q---r---s---t
      //     | / | \ | / | \ |
      //     u---v---w---x---y
      //
      //     \___ ___/
      //         V
      //       span
      //
      var va = [x, y];
      var vb = [x + half, y];
      var vc = [x + span, y];
      var vf = [x, y + half];
      var vg = [x + half, y + half];
      var vh = [x + span, y + half];
      var vk = [x, y + span];
      var vl = [x + half, y + span];
      var vm = [x + span, y + span];

      // right of h
      var vhr = [x + half * 3, y + half];
      if (vhr[0] > terrainSize) vhr[0] = half;

      // left of f
      var vfl = [x - half, y + half];
      if (vfl[0] < 0) vfl[0] = terrainSize - half;

      // under l
      var vlu = [x + half, y + half * 3];
      if (vlu[1] > terrainSize) vlu[1] = half;

      // above b
      var vba = [x + half, y - half];
      if (vba[1] < 0) vba[1] = terrainSize - half;

      squareHelper(matrix, depth, smoothness, va, vg, vk, vfl, vf);
      squareHelper(matrix, depth, smoothness, va, vba, vc, vg, vb);
      squareHelper(matrix, depth, smoothness, vc, vhr, vm, vg, vh);
      squareHelper(matrix, depth, smoothness, vk, vg, vm, vlu, vl);
    }
  }

  // set the elevations of the rightmost and bottom vertices to
  // equal the leftmost and topmost ones'.
  for (var y = 0; y < terrainSize; y += span) {
    matrix[y][terrainSize] = matrix[y][0];
  }
  for (var x = 0; x < terrainSize; x += span) {
    matrix[terrainSize][x] = matrix[0][x];
  }
}

function squareHelper(
  matrix: number[][],
  depth: number,
  smoothness: number,
  a: any,
  b: any,
  c: any,
  d: any,
  t: any
) {
  var heights = [a, b, c, d].map((v) => {
    return matrix[v[1]][v[0]];
  });
  var avg = average(heights);
  var offset = getH(smoothness, depth);
  matrix[t[1]][t[0]] = avg + offset;
}

/**
 * Get a random offset.
 * @param {number} smoothness - Higher the value, smoother the terrain.
 *      recommended value is 1.
 * @param {number} depth - Depth of current iteration(starts from 1).
 */
function getH(smoothness: number, depth: number) {
  var sign = Math.random() > 0.5 ? 1 : -1;
  var reduce = 1;
  for (var i = 0; i < depth; ++i) {
    reduce *= Math.pow(2, -smoothness);
  }
  return sign * Math.random() * reduce;
}

function average(numbers: number[]) {
  var sum = 0;
  numbers.forEach(function (v) {
    sum += v;
  });
  return sum / numbers.length;
}
