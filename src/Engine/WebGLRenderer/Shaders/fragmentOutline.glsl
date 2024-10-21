precision mediump float;
varying mediump vec2 vTexCoord;
varying mediump vec4 vColorOutline;
uniform sampler2D uTexture;

void main() {
    // Fetching texture color value & Applying color multiplication
	vec4 color = texture2D(uTexture, vTexCoord);
	if (color.a == 1.0) {
		discard;
	} else {
		// Computing outline color with respect to alpha gradients
		float gradX = texture2D(uTexture, vTexCoord + vec2(0.05, 0.0)).a - texture2D(uTexture, vTexCoord - vec2(0.05, 0.0)).a;
		float gradY = texture2D(uTexture, vTexCoord + vec2(0.0, 0.05)).a - texture2D(uTexture, vTexCoord - vec2(0.0, 0.05)).a;
		vec4 outlineColor = 0.5 * vColorOutline * (abs(gradX) + abs(gradY));
		// Outputting outline color
		gl_FragColor = outlineColor * outlineColor.a;
	}
	
}
