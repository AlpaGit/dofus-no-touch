precision mediump float;
varying mediump vec2 vTexCoord;
uniform float uRatio;
// uniform float uResolution;
uniform sampler2D uTexture;
void main() {
	vec2 res = vec2(1267.0, 865.5);
	// vec2 offsetToCenter = vTexCoord - 0.5;
	// float distToCenter = length(offsetToCenter);
	// float c1 = 2.0 * (0.5 - distToCenter * pow(uResolution - 1.0, 1.0));
	// float c2 = 2.0 * (0.5 - distToCenter * pow(uResolution - 1.0, 0.1));
	// vec2 textureCoord = vec2(0.5 + c1 * offsetToCenter.x, 0.5 + c1 * offsetToCenter.y);
	// if (vTexCoord.x < 0.5) { textureCoord.x = 0.5 - pow(2.0 * (0.5 - vTexCoord.x), uResolution) / 2.0; } else { textureCoord.x = 0.5 + pow(2.0 * (vTexCoord.x - 0.5), uResolution) / 2.0; }
    // if (vTexCoord.y < 0.5) { textureCoord.y = 0.5 - pow(2.0 * (0.5 - vTexCoord.y), uResolution) / 2.0; } else { textureCoord.y = 0.5 + pow(2.0 * (vTexCoord.y - 0.5), uResolution) / 2.0; }
	// vec2 textureCoord = pow(vTexCoord - vec2(1267.0, 865.5) / 2.0, vec2(uResolution, uResolution)) + vec2(1267.0, 865.5);
	// vec2 textureCoord = pow(2.0 * (vTexCoord - vec2(0.5, 0.5)), vec2(uResolution, uResolution)) / 2.0 + vec2(0.5, 0.5);
	
	vec4 color  = texture2D(uTexture, vTexCoord);
	vec4 color1 = texture2D(uTexture, vTexCoord + vec2(-0.7, -0.7) / res);
	vec4 color2 = texture2D(uTexture, vTexCoord + vec2(-0.7,  0.7) / res);
	vec4 color3 = texture2D(uTexture, vTexCoord + vec2( 0.7, -0.7) / res);
	vec4 color4 = texture2D(uTexture, vTexCoord + vec2( 0.7,  0.7) / res);
	gl_FragColor = color * (1.0 + 4.0 * uRatio) - uRatio * (color1 + color2 + color3 + color4);
}