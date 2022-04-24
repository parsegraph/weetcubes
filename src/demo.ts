import { BasicProjector, Projection } from "parsegraph-projector";
import TimingBelt from "parsegraph-timingbelt";
import WeetCubeWidget from "./WeetCubeWidget";
// import {IntervalTimer} from 'parsegraph-timing';

document.addEventListener("DOMContentLoaded", function () {
  const proj = new BasicProjector();
  document.body.appendChild(proj.container());
  const belt = new TimingBelt();
  top.window.addEventListener("resize", () => belt.scheduleUpdate());

  const widget = new WeetCubeWidget();
  belt.addRenderable(new Projection(proj, widget));

  /* const audioUpdate = null;
  const backgroundAudioForcer = new IntervalTimer();
  backgroundAudioForcer.setDelay(0);
  backgroundAudioForcer.setListener(function () {
    if (widget.tickIfNecessary()) {
      widget.paint();
      widget.render(
    }
  }, this);*/

  proj.container().addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      widget.toggleFrozen();
    }
  });

  let started = false;
  proj.container().addEventListener("click", () => {
    if (started) {
      return;
    }
    started = true;
    proj.audio();
    widget.scheduleUpdate();
  });
}); // DOMContentLoaded
