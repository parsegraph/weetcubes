#ifdef GL_ES
precision mediump float;
#endif

varying vec4 contentColor;

void main() {
gl_FragColor = contentColor;
}
