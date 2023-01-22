DIST_NAME = weetcubes

SCRIPT_FILES = \
	src/AlphaController.ts \
	src/index.ts \
	src/WeetCubePainter.ts \
	src/glsl.d.ts \
	src/AlphaInput.ts \
	src/WeetCubeWidget.ts \
	src/cube.ts \
	src/demo.ts \
	test/test.ts

EXTRA_SCRIPTS = \
	src/WeetPainter_FragmentShader.glsl \
	src/WeetPainter_VertexShader.glsl

include ./Makefile.microproject
