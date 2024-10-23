import WebGLRenderer from "./Engine/WebGLRenderer";
import IsoEngine from "./Engine/IsoEngine";
import Engine from "./Engine/Engine.ts";
import Gui from "./Engine/Gui/Gui.ts";
import Foreground from "./Common/Foreground";
import Dimensions from "./Common/DimensionsHelper";
import MapRequest from "./Engine/MapRenderer/MapRequest.ts";
import MapLoader from "./Engine/Assets/Maps/MapLoader.ts";
import TilesLoader from "./Engine/Assets/Tiles/TilesLoader.ts";

export async function Start() {
	let dofusBody = document.createElement('div');
	dofusBody.id = 'dofusBody';
	document.body.appendChild(dofusBody);

	if (!WebGLRenderer.isWebGlSupported()) {
		document.getElementById('dofusBody')!.innerHTML = 'WebGL is not supported on your browser';
		return;
	}

	Engine.gui = new Gui();
	Engine.isoEngine = new IsoEngine();
	Engine.foreground = new Foreground();

	Engine.isoEngine.updateDimensions(Dimensions);
	Engine.isoEngine.initialize()

	await TilesLoader.initialize();

	const map = await MapLoader.loadMap(191105026);
	// load every assets
	await Engine.isoEngine.mapRenderer.setMap(new MapRequest({}, map));
	Engine.background.changeGameContext(false);
	Engine.background.toggleGrid(true);
	Engine.isoEngine.mapRenderer.enableTacticMode();

	// Engine.isoEngine.mapScene.toggleDebugMode();
}