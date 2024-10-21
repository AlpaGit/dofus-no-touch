precision mediump float;
varying mediump vec2 vTexCoord;
varying mediump vec4 vColorMul;
uniform float uRatio;
uniform sampler2D uTexture;

void main() {
	vec2 offsetToCenter = vTexCoord - 0.5;
	float distToCenter = length(offsetToCenter);
	float c1 = 2.0 * (0.5 - distToCenter * pow(uRatio, 2.0) * 0.02);
	vec2 textureCoord = vec2(0.5 + c1 * offsetToCenter.x, 0.5 + c1 * offsetToCenter.y);
	
	vec4 color = texture2D(uTexture, textureCoord);
	float avg = (color.r + color.g + color.b) / 3.0;
	float greyRatio = uRatio * 1.0;
	vec4 greyedColor = color * (1.0 - greyRatio) + vec4(avg) * greyRatio;
	
	float blackRatio = uRatio * 0.2;
	gl_FragColor = vec4((greyedColor * (1.0 - blackRatio)).rgb, 1.0) * vColorMul;
}