precision mediump float;
varying mediump vec2 vTexCoord;
uniform float uRatio;
uniform sampler2D uTexture;

void main() {
	float u = 2.0 * (vTexCoord.x - 0.5);
    float v = 2.0 * (vTexCoord.y - 0.5);
    float r = uRatio * (pow(1.0 - max(abs(u), abs(v)), 2.0));
    vec2 uv = vTexCoord + vec2(u, v) * r;
    vec4 color = texture2D(uTexture, uv) + 0.8 * vec4(1.0, 1.0, 1.0, 0.0) * r;
    gl_FragColor = color;
	
	// vec4 color0 = texture2D(uTexture, vTexCoord);
    // vec4 color1 = texture2D(uTexture, vTexCoord + uRatio * vec2(0.01, 0.0));
    // vec4 color2 = texture2D(uTexture, vTexCoord - uRatio * vec2(0.01, 0.0));
    // vec4 color3 = texture2D(uTexture, vTexCoord + uRatio * vec2(0.0, 0.01));
    // vec4 color4 = texture2D(uTexture, vTexCoord - uRatio * vec2(0.0, 0.01));
    // gl_FragColor = color0 * 0.6 + 0.15 * (color1 + color2 + color3 + color4);

    // vec4 color = texture2D(uTexture, vTexCoord);
    // float noise = uRatio * 0.3 * fract(sin(dot(vTexCoord.xy ,vec2(uRatio + 1.0, 78.233))) * 43758.5453);
    // gl_FragColor = color * (1.0 - noise);

    // float resolution = 1000.0 - 900.0 * uRatio;
    // vec4 colorPixel = texture2D(uTexture, floor(vTexCoord * resolution) / resolution);
    // vec4 colorOriginal = texture2D(uTexture, vTexCoord);
	
    // gl_FragColor = colorOriginal * (1.0 - uRatio) + colorPixel * uRatio;
}