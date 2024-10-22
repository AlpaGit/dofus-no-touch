attribute vec2 aPosition;
attribute vec4 aColorMul;
attribute vec4 aColorAdd;

uniform   mat4 uMatrix;
varying   vec4 vColor;

void main() {
	// transform for point x
	vec4 tx = uMatrix[0];
	// transform for point y
	vec4 ty = uMatrix[1];
	// color multiplication
	vec4 cm = uMatrix[2];
	// color addition
	vec4 ca = uMatrix[3];
	vec4 colorMul = aColorMul * cm * 2.0;
	vec4 colorAdd = aColorAdd * cm + ca;
	vColor = colorMul + colorAdd;
	
	vColor.rgb *= colorMul.a;
	gl_Position = vec4(
		aPosition.x * tx.x + aPosition.y * tx.y + tx.z,
		aPosition.x * ty.x + aPosition.y * ty.y + ty.z,
		0.0, 1.0
	);
}