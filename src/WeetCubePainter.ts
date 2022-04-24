/* eslint-disable require-jsdoc */
import { GLProvider, compileProgram } from "parsegraph-compileprogram";
import Color from "parsegraph-color";
import { Matrix4x4 } from "parsegraph-matrix";
import alphaWeetPainterVertexShader from "./WeetPainter_VertexShader.glsl";
import alphaWeetPainterFragmentShader from "./WeetPainter_FragmentShader.glsl";

import { makeCubeVertices } from "./cube";
const CUBE_VERTICES = makeCubeVertices(1);

const CUBE_COLORS = [
  new Color(1, 1, 0), // 0
  new Color(0, 1, 1), // 5
  new Color(1, 0, 1), // 1
  new Color(0, 0, 1), // 2
  new Color(1, 0, 0), // 3
  new Color(0, 1, 0), // 4
];

/*
 * Draws 3d faces in a solid color.
 */
export default class WeetCubePainter {
  aPosition: number;
  aColor: number;
  uWorld: WebGLUniformLocation;
  faceProgram: WebGLProgram;
  _numCubes: number;
  _glProvider: GLProvider;
  _posBuffer: WebGLBuffer;
  _colorBuffer: WebGLBuffer;
  _data: Float32Array;
  _dataX: number;

  constructor(glProvider: GLProvider) {
    if (!glProvider) {
      throw new Error(
        "A GLProvider must be provided when creating a WeetCubePainter"
      );
    }
    this._glProvider = glProvider;
    this._numCubes = null;

    this.faceProgram = compileProgram(
      this._glProvider,
      "alpha_WeetPainter",
      alphaWeetPainterVertexShader,
      alphaWeetPainterFragmentShader
    );

    // Prepare attribute buffers.
    const gl = this.gl();
    this.aPosition = gl.getAttribLocation(this.faceProgram, "a_position");
    this.aColor = gl.getAttribLocation(this.faceProgram, "a_color");

    // Cache program locations.
    this.uWorld = gl.getUniformLocation(this.faceProgram, "u_world");
  }

  initBuffer(numCubes: number) {
    const gl = this.gl();
    if (!this._posBuffer) {
      this._posBuffer = gl.createBuffer();
    }
    this._data = new Float32Array(numCubes * 6 * 6 * 4);
    // console.log("Data is " + this._data.length + " floats large");
    this._dataX = 0;

    if (!this._colorBuffer) {
      this._colorBuffer = gl.createBuffer();
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this._colorBuffer);
    const colorData = this._data;
    let x = 0;
    for (let i = 0; i < numCubes; ++i) {
      // Cube
      for (let j = 0; j < 6; ++j) {
        // Face
        const col = CUBE_COLORS[j];
        for (let k = 0; k < 6; ++k) {
          // Vertex
          colorData[x++] = col.r();
          colorData[x++] = col.g();
          colorData[x++] = col.b();
          colorData[x++] = 1.0;
        }
      }
    }
    // console.log("color floats rendered = " + 4*x);
    gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
    this._numCubes = numCubes;
  }

  drawCube(m: Matrix4x4) {
    if (!this._data) {
      throw new Error("Init must be called first");
    }
    const drawFace = function (
      c1: number[],
      c2: number[],
      c3: number[],
      c4: number[]
    ) {
      const drawVert = function (v: number[]) {
        const x = m[0] * v[0] + m[1] * v[1] + m[2] * v[2] + m[12];
        const y = m[4] * v[0] + m[5] * v[1] + m[6] * v[2] + m[13];
        const z = m[8] * v[0] + m[9] * v[1] + m[10] * v[2] + m[14];
        this._data[this._dataX++] = x;
        this._data[this._dataX++] = y;
        this._data[this._dataX++] = z;
        this._data[this._dataX++] = 1.0;
        // console.log("(" + x + ", " + y + ", " + z+ ")");
      };

      drawVert.call(this, c1);
      drawVert.call(this, c2);
      drawVert.call(this, c3);
      drawVert.call(this, c1);
      drawVert.call(this, c3);
      drawVert.call(this, c4);
    };

    const cv = CUBE_VERTICES;
    const cc = CUBE_COLORS;
    // Front, COLOR
    drawFace.call(this, cv[0], cv[1], cv[2], cv[3], cc[0]);
    // Back
    drawFace.call(this, cv[4], cv[5], cv[6], cv[7], cc[5]);
    // Left
    drawFace.call(this, cv[8], cv[9], cv[10], cv[11], cc[1]);
    // Right
    drawFace.call(this, cv[12], cv[13], cv[14], cv[15], cc[2]);
    // Top
    drawFace.call(this, cv[16], cv[17], cv[18], cv[19], cc[3]);
    // Bottom
    drawFace.call(this, cv[20], cv[21], cv[22], cv[23], cc[4]);
  }

  clear() {
    if (!this._data) {
      return;
    }
    this._dataX = 0;
  }

  render(viewMatrix: Matrix4x4) {
    if (!viewMatrix) {
      throw new Error("A viewMatrix must be provided");
    }

    const arr = new Float32Array(viewMatrix.length);
    for (let i = 0; i < viewMatrix.length; ++i) {
      arr[i] = viewMatrix[i];
    }

    // Render faces.
    const gl = this.gl();
    // gl.disable(gl.CULL_FACE);
    gl.useProgram(this.faceProgram);
    gl.uniformMatrix4fv(this.uWorld, false, arr);

    gl.bindBuffer(gl.ARRAY_BUFFER, this._posBuffer);
    // console.log("dataX * sizeof(float = " + 4*this._dataX);
    gl.bufferData(gl.ARRAY_BUFFER, this._data, gl.STREAM_DRAW);
    gl.vertexAttribPointer(this.aPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.aPosition);

    gl.enableVertexAttribArray(this.aColor);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._colorBuffer);
    gl.vertexAttribPointer(this.aColor, 4, gl.FLOAT, false, 0, 0);

    // console.log("num rendered = " + (this._dataX / 4));
    gl.drawArrays(gl.TRIANGLES, 0, this._dataX / 4);

    gl.disableVertexAttribArray(this.aPosition);
    gl.disableVertexAttribArray(this.aColor);
  }

  gl() {
    return this._glProvider.gl();
  }
}
