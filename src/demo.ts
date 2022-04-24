import { BasicProjector, Projection } from "parsegraph-projector";
import TimingBelt from "parsegraph-timingbelt";
import WeetCubeWidget from "./WeetCubeWidget";
// import {IntervalTimer} from 'parsegraph-timing';

document.addEventListener("DOMContentLoaded", function () {
  const proj = new BasicProjector();
  const container = document.getElementById("demo");
  container.appendChild(proj.container());
  const belt = new TimingBelt();
  container.addEventListener("resize", () => belt.scheduleUpdate());

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

  proj.container().setAttribute("tabIndex", "0");
  proj.container().addEventListener("keydown", (event) => {
    console.log(event);
    if (event.key === "Escape") {
      widget.toggleFrozen();
    }
  });

  proj.container().addEventListener("click", () => {
    proj.audio();
    widget.scheduleUpdate();
  });
}); // DOMContentLoaded
