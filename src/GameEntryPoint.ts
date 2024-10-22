import WebGLRenderer from "./Engine/WebGLRenderer";
import IsoEngine from "./Engine/IsoEngine";
import Engine from "./Engine/Engine.ts";
import Gui from "./Engine/Gui/Gui.ts";
import Foreground from "./Common/Foreground";
import Dimensions from "./Common/DimensionsHelper";
import MapRequest from "./Engine/MapRenderer/MapRequest.ts";
import CellData from "./Engine/MapRenderer/CellData.ts";
import Constants from "./Common/Constants";

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
	let cells: CellData[] = [];
	for (let i = 0; i < Constants.NB_CELLS; i++) {
		let cellData = new CellData();
		cellData.l = 11;
		cells.push(cellData);
	}

	Engine.isoEngine.initialize()
	Engine.isoEngine.mapRenderer.setMap(new MapRequest({},
		{
			id: 0,
			cells: cells
		}), () => { });
	Engine.background.changeGameContext(false);
	Engine.background.toggleGrid(true);
	Engine.background.toggleDebugMode();
	// Create the renderer

}