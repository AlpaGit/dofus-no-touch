import Graphic, {GraphicParams} from "../../Engine/Graphic";
import Constants from "../Constants";
import Engine from "../../Engine/Engine.ts";
import Atouin from "../../Engine/Atouin";

const CELL_WIDTH           = Constants.CELL_WIDTH;
const CELL_HEIGHT          = Constants.CELL_HEIGHT;
const GRID_ALTITUDE_OFFSET = Constants.GRID_ALTITUDE_OFFSET;
const CELL_HALF_WIDTH      = CELL_WIDTH / 2;

export default class CellIdOverlay extends Graphic {
    public indexText: HTMLCanvasElement;
    public indexTextContext: CanvasRenderingContext2D;

    constructor(params: GraphicParams)
    {
        super(params, null);

        this.indexText        = document.createElement('canvas');
        this.indexText.width  = params.w!;
        this.indexText.height = params.h!;
        this.indexTextContext = this.indexText.getContext('2d')!;
        this.indexTextContext.font = '12px Arial';
        this.indexTextContext.fillStyle = 'rgba(0,0,0,0.6)';
        this.indexTextContext.textAlign = 'center';
    }

    /**
     * @param {string} fillStyle - overRide default fillStyle, ex: 'blue'
     */
    public generateOverlay(fillStyle: string | null = null) {
        this._generateOverlay(fillStyle);
    };

    private _generateOverlay(fillStyle: string | null, colorCells : number[] | null = null, color : string | null = null) {
        let mapRenderer = Engine.isoEngine.mapRenderer;
        if (!mapRenderer.map || !mapRenderer.map.cells) { return; }

        let cells = mapRenderer.map.cells;
        if (typeof fillStyle === 'string') {
            this.indexTextContext.fillStyle = fillStyle;
        }

        this.indexTextContext.clearRect(0, 0, this.indexText.width, this.indexText.height);

        for (let cellId = 0; cellId < Constants.NB_CELLS; cellId++) {
            let walkable = mapRenderer.isWalkable(cellId, Engine.background.isFightMode);
            if (!walkable) { continue; }

            let cell = cells[cellId];
            let coord = Atouin.getCellCoords()[cellId];

            let altitude = cell.floor ? cell.floor + GRID_ALTITUDE_OFFSET : GRID_ALTITUDE_OFFSET; // if it has alt, add it
            let x = coord.x;
            let y = coord.y - altitude - 3;

            if (colorCells && colorCells.indexOf(cellId) >= 0) {
                let origFillStyle = this.indexTextContext.fillStyle;
                this.indexTextContext.fillStyle = color!;
                this.indexTextContext.fillText(cellId.toString(), x + CELL_HALF_WIDTH + 10, y + CELL_HEIGHT);
                this.indexTextContext.fillStyle = origFillStyle;
            } else {
                this.indexTextContext.fillText(cellId.toString(), x + CELL_HALF_WIDTH + 10, y + CELL_HEIGHT);
            }
        }

        if (this.texture) {
            this.texture.release();
        }
        this.texture = Engine.isoEngine.mapScene.createTexture(this.indexText as unknown as HTMLImageElement);
        this.show();
    };

    public clear() {
        if (this.texture) {
            this.texture.release();
            this.texture = null;
        } else {
            console.warn('[CellIdOverlay.clear] Clearing CellIdOverlay although no texture was ever set');
        }
        this.hide();
    };


    /**
     * @param {array} cells - array of cellids to override color on
     * @param {string} color - canvas 2d context fillStyle
     */
    public colorCells(cells: number[], color: string) {
        this._generateOverlay(null, cells, color);
    };

}