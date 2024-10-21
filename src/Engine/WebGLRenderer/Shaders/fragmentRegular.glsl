varying mediump vec2 vTexCoord;
varying mediump vec4 vColorMul;
varying mediump vec4 vColorAdd;
uniform sampler2D uTexture;

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
	
	// Bailing out if pixel is almost transparent
	if (color.a <= 0.05) { discard; }
	
	gl_FragColor = color;
}