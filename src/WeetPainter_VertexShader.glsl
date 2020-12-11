uniform mat4 u_world;

attribute vec4 a_position;
attribute vec4 a_color;

varying vec4 contentColor;

void main() {
gl_Position = u_world * a_position
contentColor = a_color
}
