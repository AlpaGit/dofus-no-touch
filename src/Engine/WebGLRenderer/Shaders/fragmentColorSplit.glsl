precision mediump float;
varying mediump vec2 vTexCoord;

uniform sampler2D uTexture;

void main() {
	vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
	color.r = texture2D(uTexture, vTexCoord + vec2(-0.007, - 0.007)).r;
    color.g = texture2D(uTexture, vTexCoord + vec2(0.007, - 0.007)).g;
    color.b = texture2D(uTexture, vTexCoord + vec2(0.0, 0.01)).b;
    gl_FragColor = color;
}