attribute vec2 aPosition;
attribute vec2 aTexCoord;
attribute vec4 aColorMul;
attribute vec4 aColorAdd;

uniform   mat4 uMatrix;
varying   vec2 vTexCoord;
varying   vec4 vColorMul;
varying   vec4 vColorAdd;

void main() {
	// transform for point x
	vec4 tx = uMatrix[0];
	// transform for point y
	vec4 ty = uMatrix[1];
	// color multiplication
	vec4 cm = uMatrix[2];
	// color addition
	vec4 ca = uMatrix[3];
	
	vTexCoord = aTexCoord;
	vColorMul = aColorMul * cm * 2.0;
	vColorAdd = aColorAdd * cm + ca;
	vColorMul.rgb *= vColorMul.a;
	gl_Position = vec4(
		aPosition.x * tx.x + aPosition.y * tx.y + tx.z,
		aPosition.x * ty.x + aPosition.y * ty.y + ty.z,
		0.0, 1.0
	);
}