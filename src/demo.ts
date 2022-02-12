document.addEventListener("DOMContentLoaded", function (event) {
  parsegraph_initialize();
  const window = new parsegraph_Window();
  const world = new parsegraph_World();
  document.body.appendChild(window.container());
  const belt = new parsegraph_TimingBelt();
  belt.addWindow(window);
  parsegraph_addEventMethod(top.window, "resize", belt.scheduleUpdate, belt);

  const widget = new alpha_WeetCubeWidget(window);
  WIDGET = widget;
  window.addWidget(widget);

  const audioUpdate = null;
  const backgroundAudioForcer = new parsegraph_IntervalTimer();
  backgroundAudioForcer.setDelay(0);
  backgroundAudioForcer.setListener(function () {
    if (widget.TickIfNecessary()) {
      widget.paint();
      window.render();
    }
  }, this);

  parsegraph_addEventListener(document, "keydown", function (event) {
    if (event.key === "Escape") {
      widget._frozen = !widget._frozen;
    }
  });

  let started = false;
  document.addEventListener("click", function (event) {
    if (started) {
      return;
    }
    started = true;
    window.startAudio();
    backgroundAudioForcer.schedule();
  });
}); // DOMContentLoaded
