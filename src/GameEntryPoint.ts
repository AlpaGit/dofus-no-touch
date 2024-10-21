import WebGLRenderer from "./Engine/WebGLRenderer";
import IsoEngine from "./Engine/IsoEngine";
import Engine from "./Engine/Engine.ts";
import Gui from "./Engine/Gui/Gui.ts";
import Foreground from "./Common/Foreground";
import Dimensions from "./Common/DimensionsHelper";

export function Start(){
	let dofusBody = document.createElement('div');
	dofusBody.id = 'dofusBody';
	document.body.appendChild(dofusBody);

	if(!WebGLRenderer.isWebGlSupported()){
		document.getElementById('dofusBody')!.innerHTML = 'WebGL is not supported on your browser';
		return;
	}

	Engine.gui = new Gui();
	Engine.isoEngine = new IsoEngine();
	Engine.foreground = new Foreground();

	Engine.isoEngine.updateDimensions(Dimensions);
	// Create the renderer

}