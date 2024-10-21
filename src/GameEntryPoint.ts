import WebGLRenderer from "./Engine/WebGLRenderer";
import IsoEngine from "./Engine/IsoEngine";
import Engine from "./Engine/Engine.ts";

export function Start(){
	let dofalpaBody = document.createElement('div');
	dofalpaBody.id = 'dofalpa-body';
	document.body.appendChild(dofalpaBody);

	if(!WebGLRenderer.isWebGlSupported()){
		document.getElementById('dofalpa-body')!.innerHTML = 'WebGL is not supported on your browser';
		return;
	}

	Engine.isoEngine = new IsoEngine();

	// Create the renderer

}