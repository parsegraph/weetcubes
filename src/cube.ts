export const makeCubeVertices = (cubeSize: number) => {
  const width = cubeSize;
  const length = cubeSize;
  const height = cubeSize;
  return [
    // Front
    [-width, length, height], // v0
    [width, length, height], // v1
    [width, length, -height], // v2
    [-width, length, -height], // v3

    // Back
    [width, -length, height], // v4
    [-width, -length, height], // v5
    [-width, -length, -height], // v6
    [width, -length, -height], // v7

    // Left
    [width, length, height], // v1
    [width, -length, height], // v4
    [width, -length, -height], // v7
    [width, length, -height], // v2

    // Right
    [-width, -length, height], // v5
    [-width, length, height], // v0
    [-width, length, -height], // v3
    [-width, -length, -height], // v6

    // Top
    [width, length, height], // v1
    [-width, length, height], // v0
    [-width, -length, height], // v5
    [width, -length, height], // v4

    // Bottom
    [width, -length, -height], // v7
    [-width, -length, -height], // v6
    [-width, length, -height], // v3
    [width, length, -height], // v2
  ];
};
