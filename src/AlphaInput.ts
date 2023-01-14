// Input Version 1.2.130825
// usage:
// local input = Input:New(glwidget)
// input:SetMouseSensitivityX( .05 ) // defaults to .05
// input:SetMouseSensitivityY( .05 ) // defaults to .05

// inside of a timing.every function
// Camera:MoveForward( input:W() * elapsed );
// Camera:YawLeft( input:LeftMouseButton() * input:MouseLeft() )
// some non-obvious buttons are:
// LeftMouseButton, RightMouseButton, MiddleMouseButton, SPACE, RETURN, SHIFT
// MouseUp, MouseDown, MouseLeft, MouseRight

// for a simple if statement do:
//	if input:Q() > 0 then
// do stuff because Q is down
//	end

// MouseWheelUp() // returns 1 or more if you have scrolled up recently
// MouseWheelDegreesUp() // returns the number of degrees the wheel has scrolled recently

// add this to your code to make a command only work once per button push
/*
	if elapsed == 0 then
		done = false;
		return

	end
	if done then return end;
	done = true;
*/
import { AlphaCamera, BasicPhysical } from "parsegraph-physical";
import normalizeWheel from "parsegraph-normalizewheel";

function alpha_GetButtonName(buttonIndex: number) {
  switch (buttonIndex) {
    case 0:
      return "LeftMouseButton";
    case 2:
      return "RightMouseButton";
    case 1:
      return "MiddleMouseButton";
  }
  return null;
}

export default class AlphaInput {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  mouseWheelUp: number;
  mouseWheelDown: number;
  grabbed: any;
  camera: AlphaCamera;
  mouseSensitivityX: number;
  mouseSensitivityY: number;

  _keyDownListener: (button: string) => boolean;
  _keyDownThisObject: any;
  _buttons: { [button: string]: number };
  _done: boolean;

  constructor(camera: AlphaCamera) {
    this.SetMouseSensitivityX(0.005);
    this.SetMouseSensitivityY(0.005);

    this.camera = camera;
    this.startX = 0;
    this.endX = 0;
    this.startY = 0;
    this.endY = 0;
    this.mouseWheelUp = 0;
    this.mouseWheelDown = 0;
    this.grabbed = null;
    this._buttons = {};
  }

  onKeyup(event: KeyboardEvent) {
    this._buttons[event.key.toLowerCase()] = null;
    return true;
  }

  onKeydown(event: KeyboardEvent) {
    if (event.ctrlKey || event.altKey || event.metaKey) {
      return true;
    }
    this._buttons[event.key.toLowerCase()] = 1;
    if (this._keyDownListener) {
      return this._keyDownListener.call(this._keyDownThisObject, event);
    }
    return true;
  }

  onMousedown(event: MouseEvent) {
    let button;
    let x;
    let y;
    button = alpha_GetButtonName(event.button);
    x = event.x;
    y = event.y;
    this._buttons[button] = 1;

    // reset for a new drag
    this.startX = x;
    this.startY = y;
    this.endX = x;
    this.endY = y;
    return true;
  }

  onMouseup(event: MouseEvent) {
    let button;
    let x;
    let y;
    button = alpha_GetButtonName(event.button);
    x = event.clientX;
    y = event.clientY;
    this._buttons[button] = null;

    // new end point;
    this.endX = x;
    this.endY = y;
    return true;
  }

  onMousemove(event: MouseEvent) {
    let x;
    let y;
    x = event.x;
    y = event.y;
    this.endX = x;
    this.endY = y;
    return true;
  }

  onWheel(event: WheelEvent) {
    const wheel = normalizeWheel(event).spinY;
    if (wheel > 0) {
      this.mouseWheelUp = this.mouseWheelUp + wheel;
    } else {
      // keeping it positive!
      this.mouseWheelDown = this.mouseWheelDown - wheel;
    }
    return true;
  }

  SetOnKeyDown(listener: (button: string) => boolean, thisObject?: any) {
    this._keyDownListener = listener;
    this._keyDownThisObject = thisObject;
  }

  Get(key: string) {
    return this._buttons[key] ? 1 : 0;
  }

  SetMouseSensitivityX(sensitivity: number) {
    this.mouseSensitivityX = sensitivity;
  }

  GetMouseSensitivityX() {
    return this.mouseSensitivityX;
  }

  SetMouseSensitivityY(sensitivity: number) {
    this.mouseSensitivityY = sensitivity;
  }

  GetMouseSensitivityY() {
    return this.mouseSensitivityY;
  }

  // quick set both of them
  SetMouseSensitivity(sensitivity: number) {
    this.SetMouseSensitivityX(sensitivity);
    this.SetMouseSensitivityY(sensitivity);
  }

  MouseLeft() {
    if (this.endX < this.startX) {
      const change = this.startX - this.endX;
      // console.log("mouse has moved right " + change);
      return change * this.GetMouseSensitivityX();
    }

    return 0;
  }

  MouseRight() {
    if (this.endX > this.startX) {
      const change = this.endX - this.startX;
      // console.log("mouse has moved left " + change);
      return change * this.GetMouseSensitivityX();
    }

    return 0;
  }

  MouseUp() {
    if (this.endY > this.startY) {
      const change = this.endY - this.startY;
      // console.log("mouse has moved down " + change);
      return change * this.GetMouseSensitivityY();
    }

    return 0;
  }

  MouseDown() {
    if (this.endY < this.startY) {
      const change = this.endY - this.startY;
      // console.log("mouse has moved up " + change);
      return change * this.GetMouseSensitivityY();
    }

    return 0;
  }

  // mouse wheel data is stored in 1/8 of a degree
  // this returns how many ticks of a mousewheel of standard resolution
  // has been seen before an Input:Update()
  MouseWheelUp() {
    return this.mouseWheelUp / 120;
  }

  MouseWheelDown() {
    return this.mouseWheelDown / 120;
  }

  MouseWheelDegreesUp() {
    return this.mouseWheelUp / 8;
  }

  MouseWheelDegreesDown() {
    return this.mouseWheelDown / 8;
  }

  /**
   * Sets the start to the end, and clears mousewheel totals.
   */
  Update(elapsed: number) {
    // console.log("Updating with elapsed: " + elapsed);
    if (this.Get("Shift") > 0) {
      elapsed = elapsed * 10;
    }

    if (this.Get("Shift") > 0) {
      elapsed = elapsed / 10;
    }

    // console.log("LeftMouseButton: " + this.Get("LeftMouseButton"));
    // console.log("MouseLeft: " + this.MouseLeft() * elapsed);
    // console.log(
    // "MouseLeft: " + this.Get("LeftMouseButton") * this.MouseLeft() * elapsed
    // );
    // console.log("LeftMouse: " + this.Get("LeftMouseButton"));
    // console.log("TurnLeft: " + this.MouseLeft() * elapsed);
    const phys = this.camera.getParent() as BasicPhysical;
    phys.turnLeft(this.Get("LeftMouseButton") * this.MouseLeft() * elapsed);
    phys.turnRight(this.Get("LeftMouseButton") * this.MouseRight() * elapsed);
    phys.pitchUp(-this.Get("LeftMouseButton") * this.MouseUp() * elapsed);
    phys.pitchDown(this.Get("LeftMouseButton") * this.MouseDown() * elapsed);
    this.camera.moveForward(this.MouseWheelDegreesUp() * elapsed);
    this.camera.moveBackward(this.MouseWheelDegreesDown() * elapsed);
    // this.camera.ZoomIn(this.Get("y"), elapsed);
    // this.camera.ZoomOut(this.Get("h"), elapsed);

    phys.moveForward(100 * this.Get("t") * elapsed);
    phys.moveBackward(100 * this.Get("g") * elapsed);
    phys.moveLeft(100 * this.Get("f") * elapsed);
    phys.moveRight(100 * this.Get("h") * elapsed);

    phys.moveForward(this.Get("w") * elapsed);
    phys.moveBackward(this.Get("s") * elapsed);
    phys.moveLeft(this.Get("a") * elapsed);
    phys.moveRight(this.Get("d") * elapsed);
    phys.moveUp(this.Get(" ") * elapsed);
    phys.moveDown(this.Get("Shift") * elapsed);

    phys.yawLeft(this.Get("j") * elapsed);
    phys.yawRight(this.Get("l") * elapsed);
    phys.pitchUp(this.Get("k") * elapsed);
    phys.pitchDown(this.Get("i") * elapsed);
    phys.rollLeft(this.Get("u") * elapsed);
    phys.rollRight(this.Get("o") * elapsed);

    if (this.Get("RightMouseButton") > 0) {
      if (!this._done) {
        this.camera.alignParentToMy(0, 1);
        this._done = true;
      }
    } else {
      this._done = false;
    }
    this.startX = this.endX;
    this.startY = this.endY;
    this.mouseWheelUp = 0;
    this.mouseWheelDown = 0;
  }
}
