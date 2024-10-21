precision mediump float;
varying mediump vec2 vTexCoord;
uniform float uResolution;
uniform sampler2D uTexture;

void main() {
	vec4 color = texture2D(uTexture, floor(vTexCoord * uResolution) / uResolution);
	color.rgb = floor(color.rgb * 8.0) / 8.0;
	gl_FragColor = color;
}