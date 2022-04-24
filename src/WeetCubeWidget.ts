/* eslint-disable require-jsdoc, new-cap, max-len */

import WeetCubePainter from "./WeetCubePainter";
import { elapsed } from "parsegraph-timing";
import { Projected, Projector } from "parsegraph-projector";
import Method from "parsegraph-method";
import {
  AlphaCamera,
  BasicPhysical,
  PhysicalMatrixMode,
  quaternionFromAxisAndAngle,
} from "parsegraph-physical";
import {Matrix4x4} from 'parsegraph-matrix';

const randomFrequencyNodeCreator =
  (minFreq: number, freqRange: number) => (audio: AudioContext) => {
    const osc = audio.createOscillator();
    const tRand = Math.random();
    if (tRand < 0.1) {
      osc.type = "triangle";
    } else if (tRand < 0.6) {
      osc.type = "sawtooth";
    } else if (tRand < 0.8) {
      osc.type = "sine";
    } else {
      osc.type = "square";
    }
    osc.frequency.value = minFreq + Math.random() * freqRange;
    osc.start();
    const g = audio.createGain();
    g.gain.setValueAtTime(0, audio.currentTime);
    g.gain.linearRampToValueAtTime(0.8, audio.currentTime + audioTransition);
    osc.connect(g);
    return g;
  };

const fixedFrequencyNodeCreator =
  (nodeType: OscillatorType, freq: number) => (audio: AudioContext) => {
    const osc = audio.createOscillator();
    osc.type = nodeType;
    osc.frequency.value = freq;
    osc.start();
    const g = audio.createGain();
    g.gain.setValueAtTime(0, audio.currentTime);
    g.gain.linearRampToValueAtTime(0.8, audio.currentTime + audioTransition);
    osc.connect(g);
    return g;
  };

const audioTransition = 1.2;
export default class WeetCubeWidget implements Projected {
  _modeSwitched: boolean;
  _audioCompressorOut: DynamicsCompressorNode;
  _xMax: number;
  _yMax: number;
  _zMax: number;
  _frozen: boolean;
  _lastPaint: Date;
  _cubePainters: Map<Projector, WeetCubePainter>;
  _elapsed: number;
  _freqs: number[];
  rotq: number;
  _currentAudioMode: number;
  _audioModes: ((audio: AudioContext) => GainNode)[];
  _audioOut: AudioNode;
  _audioNodes: PannerNode[];
  _modeAudioNodes: GainNode[];
  _nodesPainted: number;
  _audioNodePositions: number[];
  _onUpdate: Method;

  camera: AlphaCamera;
  // _input: AlphaInput;

  constructor() {
    this._onUpdate = new Method();

    this.camera = new AlphaCamera();
    this.camera.setFovX(60);
    this.camera.setFarDistance(1000);
    this.camera.setNearDistance(0.1);

    // this._input = new AlphaInput(proj, this.camera);
    // this._input.SetMouseSensitivity(0.4);
    this._lastPaint = new Date();

    // this._input.SetOnKeyDown(this.onKeyDown, this);

    this._cubePainters = new Map();
    this.rotq = 0;
    this._elapsed = 0;
    this._frozen = true;
    const amt = 7;
    this._xMax = amt;
    this._yMax = amt;
    this._zMax = amt;

    this._audioOut = null;

    const baseFreq = 293.665; // 391.995;//311.127;//440;
    this._freqs = [
      baseFreq * 1.33,
      baseFreq,
      baseFreq * 0.67,
      baseFreq * 0.67 * 0.67,
      baseFreq * 0.67 * 0.67 * 0.67,
    ];

    this._audioModes = [
      randomFrequencyNodeCreator(24, 64),
      fixedFrequencyNodeCreator("sine", this._freqs[0]),
      randomFrequencyNodeCreator(16, 128),
      randomFrequencyNodeCreator(64, 1024),
      fixedFrequencyNodeCreator("sawtooth", this._freqs[0]),
      fixedFrequencyNodeCreator("triangle", this._freqs[0]),
      randomFrequencyNodeCreator(320, 640),
      randomFrequencyNodeCreator(64, 96),
    ];

    this._currentAudioMode = 2;
    /* this._audioModes = [function(audio) {
        var osc=audio.createOscillator();
        osc.type='sawtooth';
        //osc.type = "square";
        //osc.type = "sine";
        if(osc.type === "sine" || osc.type === "triangle") {
            //osc.frequency.value=freqs[z%freqs.length];
            osc.frequency.value=Math.max(320, 320+Math.random()*980);//freqs[z%freqs.length];
        }
        else if (osc.type === "square") {
            osc.frequency.value=this._freqs[this._nodesPainted%this._freqs.length];
            //osc.frequency.value=Math.max(4, Math.random()*200);//freqs[z%freqs.length];
        }
        else if(osc.type === "sawtooth") {
            osc.frequency.value=Math.max(320, 320+Math.random()*200);//freqs[z%freqs.length];
        }else {
            osc.frequency.value=Math.min(1000, Math.random()*4000);//freqs[z%freqs.length];
            //osc.frequency.value=freqs[z%freqs.length];
        }
        //osc.type = "square";
        //osc.frequency.value=Math.max(8, Math.random()*100);
        osc.start();
        //console.log(c.position);

        var randZ = Math.random() * 30;
        var randY = Math.random() * 5;
        //console.log(i, j, k, randY, randZ);
        var g = audio.createGain();
        //g.gain.setValueAtTime(0.1, audio.currentTime);
        g.gain.setValueAtTime(0, audio.currentTime);
        g.gain.linearRampToValueAtTime(audio.currentTime + 0.8, .1);
        //g.gain.exponentialRampToValueAtTime(.01, audio.currentTime + randY);
        //g.gain.linearRampToValueAtTime(0, audio.currentTime + randY + randZ);
        osc.connect(g);
        return g;
    }
    //this.createSquareAudioNode,
    //this.createSineAudioNode,
    //this.createTriangleAudioNode,
    //this.createSawtoothAudioNode
];
    this._audioModes = [this.createSineAudioNode, this.createSawtoothAudioNode];
    */

    (this.camera.getParent() as BasicPhysical).setPosition(
      -1,
      -1,
      this._zMax * -5.0
    );
    this.camera
      .getParent()
      .setOrientation(quaternionFromAxisAndAngle(0, 1, 0, Math.PI));
  }

  /* handleEvent(eventType: string, eventData?: any) {
    if (eventType === "tick") {
      this.tick();
      return true;
    } else if (eventType === "wheel") {
      return this._input.onWheel(eventData);
    } else if (eventType === "mousemove") {
      return this._input.onMousemove(eventData);
    } else if (eventType === "mousedown") {
      return this._input.onMousedown(eventData);
    } else if (eventType === "mouseup") {
      return this._input.onMouseup(eventData);
    } else if (eventType === "keydown") {
      return this._input.onKeydown(eventData);
    } else if (eventType === "keyup") {
      return this._input.onKeyup(eventData);
    }
    return false;
  }*/

  private createAudioNode(audio: AudioContext) {
    const creator = this._audioModes[this._currentAudioMode];
    const n = creator.call(this, audio);
    // console.log("Creating audio node: ", this._currentAudioMode, n);
    return n;
  }

  onKeyDown(key: string) {
    // console.log(key);
    switch (key) {
      case "Enter":
      case "Return":
        this.switchAudioMode();
        return true;
      default:
        // Key unhandled.
        return false;
    }
  }

  switchAudioMode() {
    this._currentAudioMode =
      (this._currentAudioMode + 1) % this._audioModes.length;
    this._modeSwitched = true;
  }

  tickIfNecessary() {
    // console.log("Necessary?", parsegraph_elapsed(this._lastPaint));
    if (elapsed(this._lastPaint) > 20) {
      console.log("Necessary:" + elapsed(this._lastPaint));
      this.tick();
      return true;
    }
    return false;
  }

  toggleFrozen() {
    this._frozen = !this._frozen;
    if (!this._frozen) {
      this._lastPaint = new Date();
    }
    this.scheduleUpdate();
  }

  tick() {
    const e = elapsed(this._lastPaint) / 500;
    // this._input.Update(e);
    if (!this._frozen) {
      this._elapsed += e;
    }
    return false;
  }

  setMax(max: number) {
    this._xMax = max;
    this._yMax = max;
    this._zMax = max;
    this.refresh();
  }

  setXMax(xMax: number) {
    this._xMax = xMax;
    this.refresh();
  }

  setYMax(yMax: number) {
    this._yMax = yMax;
    this.refresh();
  }

  setZMax(zMax: number) {
    this._zMax = zMax;
    this.refresh();
  }

  setRotq(rotq: number) {
    this.rotq = rotq;
  }

  setOnScheduleUpdate(func: Function, obj?: object) {
    this._onUpdate.set(func, obj);
  }

  refresh() {
    this.scheduleUpdate();
  }

  scheduleUpdate() {
    this._onUpdate.call();
  }

  paint(proj: Projector) {
    const audio = proj.hasAudio() ? proj.audio() : null;
    let painter: WeetCubePainter;
    if (!this._cubePainters.has(proj)) {
      painter = new WeetCubePainter(proj.glProvider());
      painter.initBuffer(this._xMax * this._yMax * this._zMax);
      this._cubePainters.set(proj, painter);
    } else {
      painter = this._cubePainters.get(proj);
      painter.clear();
    }

    if (audio && !this._audioOut) {
      // console.log("Creating audio out");
      this._audioOut = audio.createGain();
      const compressor = audio.createDynamicsCompressor();
      compressor.threshold.value = -50;
      compressor.knee.value = 10;
      compressor.ratio.value = 24;
      compressor.attack.value = 0;
      compressor.release.value = 0.25;
      compressor.connect(audio.destination);
      this._audioCompressorOut = compressor;
      this._audioOut.connect(compressor);
      this._modeAudioNodes = [];
      this._audioNodes = [];
      this._audioNodePositions = [];
    } else if (this._modeSwitched) {
      const oldModeNodes = [].concat(this._modeAudioNodes);
      setTimeout(function () {
        oldModeNodes.forEach(function (node) {
          node.disconnect();
        });
      }, 1000 * (audioTransition + 0.1));
    }
    const createAudioNodes = audio && this._audioNodes.length == 0;

    const c = new BasicPhysical(this.camera);
    let az = 0;

    this._nodesPainted = 0;
    let panner;

    const cubeSize = 1;
    // console.log("Painting", elapsed);
    for (let i = 0; i < this._xMax; ++i) {
      for (let j = 0; j < this._yMax; ++j) {
        for (let k = 0; k < this._zMax; ++k) {
          c.modelMode = PhysicalMatrixMode.ROTATE_TRANSLATE_SCALE;
          c.setScale(1, 1, 1);
          c.orientation.set(0, 0, 0, 1);
          c.position.set(0, 0, 0);
          c.scale.set(1, 1, 1);
          c.rotate((this.rotq * 2 * k) / 10, 0, 1, 1);
          c.rotate((this.rotq * 2 * i) / 15, 1, 0, 0);
          c.rotate((this.rotq * 2 * j) / 10, 1, 0, 1);
          c.setPosition(3 * i, 3 * j, 3 * k);
          c.setScale(cubeSize, cubeSize, cubeSize);
          // XXX Could be problems if this conversion is bad
          painter.drawCube(c.getModelMatrix().toArray());
          const makeAudio = Math.random() < 0.05;
          if (createAudioNodes && makeAudio) {
            const node = this.createAudioNode(audio);
            panner = audio.createPanner();
            panner.panningModel = "HRTF";
            panner.distanceModel = "exponential";
            panner.rolloffFactor = 2;
            panner.coneInnerAngle = 360;
            panner.coneOuterAngle = 0;
            panner.coneOuterGain = 0;
            panner.connect(this._audioOut);
            node.connect(panner);
            this._modeAudioNodes.push(node);
            this._audioNodes.push(panner);
            this._audioNodePositions.push(this._nodesPainted);
          } else if (
            audio &&
            this._nodesPainted === this._audioNodePositions[az]
          ) {
            panner = this._audioNodes[az];
            if (this._modeSwitched) {
              this._modeAudioNodes[az].gain.linearRampToValueAtTime(
                0,
                audio.currentTime + audioTransition
              );
              const node = this.createAudioNode(audio);
              this._modeAudioNodes[az] = node;
              node.connect(panner);
            }
            az++;
          } else {
            panner = null;
          }

          if (panner) {
            const wv = c.getModelMatrix();
            let cx;
            let cy;
            let cz;
            cx = c.position[0] + cubeSize / 2;
            cy = c.position[1] + cubeSize / 2;
            cz = c.position[2] + cubeSize / 2;
            cx = wv[12];
            cy = wv[13];
            cz = wv[14];
            // console.log(cx, cy, cz);
            if (panner.positionX) {
              panner.positionX.value = cx;
              panner.positionY.value = cy;
              panner.positionZ.value = cz;
            } else {
              panner.setPosition(cx, cy, cz);
            }
          }
          ++this._nodesPainted;
        }
      }
    }
    this.rotq = this._elapsed;
    // console.log("dataX=" + this.cubePainter._dataX);

    this._modeSwitched = false;
    this._lastPaint = new Date();
    return false;
  }

  render(proj: Projector) {
    if (!this._cubePainters.has(proj)) {
      return true;
    }
    proj.render();
    const gl = proj.glProvider().gl();
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, proj.width(), proj.height());
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    const audio = proj.hasAudio() ? proj.audio() : null;

    const cm = this.camera.getParent().getModelMatrix();
    const xPos = cm[12];
    const yPos = cm[13];
    const zPos = cm[14];
    /*if (audio) {
      const listener = audio.listener;
      if (listener.positionX) {
        listener.positionX.value = xPos;
        listener.positionY.value = yPos;
        listener.positionZ.value = zPos;
      } else {
        listener.setPosition(xPos, yPos, zPos);
      }
      if (listener.forwardX) {
        const forV = cm.transform(0, 0, 1);
        const upV = cm.transform(0, 1, 0);
        // console.log("UP", upV[0], upV[1], upV[2]);
        listener.forwardX.setValueAtTime(forV[0], audio.currentTime);
        listener.forwardY.setValueAtTime(forV[1], audio.currentTime);
        listener.forwardZ.setValueAtTime(forV[2], audio.currentTime);
        listener.upX.setValueAtTime(upV[0], audio.currentTime);
        listener.upY.setValueAtTime(upV[1], audio.currentTime);
        listener.upZ.setValueAtTime(upV[2], audio.currentTime);
        // console.log("Setting orientation:" + forV[0] + ", " + forV[1] + ", " + forV[2]);
      }
    }*/
    // console.log(xPos + ", " + yPos + ", " + zPos);

    gl.clear(gl.DEPTH_BUFFER_BIT);
    const projection = this.camera.updateProjection(
      proj.width(),
      proj.height()
    );
    //console.log("projection is" + projection.toString());
    console.log("cam parent", this.camera.parent);
    const viewMatrix = this.camera.getViewMatrix(null).multiplied(projection);
    this.camera.getViewMatrix(null);
    //console.log("CameraViewMatrix is" + this.camera.getViewMatrix(null).toString());
    //console.log("viewMatrix is " + viewMatrix.toString());
    this._cubePainters.get(proj).render(viewMatrix);
    return !this._frozen;
  }

  unmount(proj: Projector) {
    if (this._cubePainters.has(proj)) {
      const painter = this._cubePainters.get(proj);
      painter.clear();
      this._cubePainters.delete(proj);
    }
  }

  dispose() {
    this._cubePainters.forEach((painter) => painter.clear());
    this._cubePainters.clear();
  }
}
