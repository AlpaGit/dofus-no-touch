attribute vec2 aPosition;
attribute vec2 aTexCoord;
attribute vec4 aColorMul;
attribute vec4 aColorAdd;
uniform   mat4 uMatrix;
varying   vec2 vTexCoord;
varying   vec4 vColorOutline;

void main() {
	vec4 tx = uMatrix[0];
	vec4 ty = uMatrix[1];
	
	// outline color
	vColorOutline = uMatrix[2] * aColorMul + aColorAdd;
	
	vTexCoord = aTexCoord;
	gl_Position = vec4(
		aPosition.x * tx.x + aPosition.y * tx.y + tx.z,
		aPosition.x * ty.x + aPosition.y * ty.y + ty.z,
		0.0, 1.0
	);
}
