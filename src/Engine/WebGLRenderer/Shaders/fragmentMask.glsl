varying mediump vec2 vPosition;
varying mediump vec2 vTexCoord;
varying mediump vec4 vColorMul;
varying mediump vec4 vColorAdd;
uniform sampler2D uTexture;
uniform sampler2D uMask;

void main() {
	// Fetching texture color value
	mediump vec4 color = texture2D(uTexture, vTexCoord);
	
	// Computing color addition alpha
	mediump float colorAddAlpha = vColorAdd.a * color.a;
	
	// Applying color multiplication
	color *= vColorMul;
	
	// Applying color addition & Writing pixel
    // Depremultiplying by alpha
	color.rgb /= color.a;
	
    // Applying color addition
	color.rgb += vColorAdd.rgb;
	color.a += colorAddAlpha;
	
	// Repremultiplying by alpha
	color.rgb *= color.a;
	
	// Bailing out if mask is almost transparent
	mediump float mask = texture2D(uMask, vPosition).a;
	if (mask == 0.0) { discard; }
	
    // Applying transparency if mask is almost transparent
	if (mask <= 0.2) {
		color *= mask * 5.0;
	}
	
	// Writing pixel because overlapping with mask
	gl_FragColor = color;

}