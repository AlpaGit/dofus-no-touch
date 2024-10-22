import { MapGrid } from "./MapGrid.ts";
import Constants from "../../Common/Constants";
//import Color from "../../Common/Colors/Color.ts";
import EventEmitter from "events";
import Scene from "../../Common/Scene";
import Background from "../../Common/Background";
import Graphic from "../Graphic";
import MapRequest, {MapData} from "./MapRequest.ts";
import Atouin from "../Atouin";

/*const HIGHLIGHT_DEFAULT_FILL: Color   = { r: 255, g: 0, b: 0, a: 0.75 };
const HIGHLIGHT_DEFAULT_STROKE: Color = { r: 0,   g: 0, b: 0, a: 1 };

const OBSTACLE_OPENED = 1;
const OBSTACLE_CLOSED = 2;

const DROPPED_OBJECT_SIZE = 52;
//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// We offset dropped objects a bit "above" the cell they are on to give an impression of perspective...
// It cannot be perfect because all object images are squares of the same size
// while the size of the object varies (e.g. small feather, big dofus, etc.)
const DROPPED_OBJECT_OFFSET_Y = -Constants.CELL_HEIGHT / 4;*/

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * Map change data informations are stored on each cell of the map.
 * It is a bit flag storing which cell on neighbour map are walkable.
 * There are 8 flags, first bit is for the right cell then going clockwise.
 *
 * So, for instance, to know if we can go to the upward map from a cell,
 * we should test if one of the flags 6, 7 or 8 are set.
 * Or equivalent, testing the value (mapChangeData & 224)
 * (224 is the bit mask with bit 6, 7 and 8 sets)
 *
 * Following are the bit mask for all 4 directions:
 */
//const CHANGE_MAP_MASK_RIGHT  =  1 |  2 | 128;
//const CHANGE_MAP_MASK_BOTTOM =  2 |  4 | 8;
//const CHANGE_MAP_MASK_LEFT   =  8 | 16 | 32;
//const CHANGE_MAP_MASK_TOP    = 32 | 64 | 128;

//const NB_CELLS     = Constants.NB_CELLS;
const CELL_HEIGHT  = Constants.CELL_HEIGHT;

const BLOCK_PADDING = 2;
const BLOCK_WIDTH   = Constants.CELL_WIDTH;
const BLOCK_HEIGHT  = Math.round(CELL_HEIGHT * 1.5);
const BLOCK_TEXTURE_WIDTH  = BLOCK_WIDTH  + BLOCK_PADDING;
const BLOCK_TEXTURE_HEIGHT = BLOCK_HEIGHT + BLOCK_PADDING;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function createTacticBlockImage() {
    let blockImage = document.createElement('canvas');
    blockImage.width  = BLOCK_WIDTH;
    blockImage.height = BLOCK_HEIGHT;

    let ctx = blockImage.getContext('2d');

    if(!ctx) {
        throw new Error('Could not get 2d context from canvas');
    }

    ctx.clearRect(0, 0, BLOCK_WIDTH, BLOCK_HEIGHT);
    ctx.fillStyle   = '#5A523C';
    ctx.strokeStyle = '#CCCCCC';

    let px = [BLOCK_WIDTH / 2, BLOCK_WIDTH, BLOCK_WIDTH, BLOCK_WIDTH / 2,  0,  0];
    let py = [0,  CELL_HEIGHT / 2, CELL_HEIGHT, BLOCK_HEIGHT, CELL_HEIGHT, CELL_HEIGHT / 2];

    ctx.beginPath();
    ctx.moveTo(0, CELL_HEIGHT / 2);
    for (let i = 0; i < px.length; i++) {
        ctx.lineTo(px[i], py[i]);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.lineTo(BLOCK_WIDTH / 2, CELL_HEIGHT);
    ctx.lineTo(BLOCK_WIDTH, CELL_HEIGHT / 2);
    ctx.moveTo(BLOCK_WIDTH / 2, CELL_HEIGHT);
    ctx.lineTo(BLOCK_WIDTH / 2, BLOCK_HEIGHT);
    ctx.stroke();

    return blockImage as unknown as HTMLImageElement;
}

//███████████████████████████████████████████████████████████
//███████████████████████████▄░██████████████████████████████
//█▄░▀▄▄▄█▀▄▄▄▄▀█▄░▀▄▄▀██▀▄▄▄▀░██▀▄▄▄▄▀█▄░▀▄▄▄█▀▄▄▄▄▀█▄░▀▄▄▄█
//██░█████░▄▄▄▄▄██░███░██░████░██░▄▄▄▄▄██░█████░▄▄▄▄▄██░█████
//█▀░▀▀▀██▄▀▀▀▀▀█▀░▀█▀░▀█▄▀▀▀▄░▀█▄▀▀▀▀▀█▀░▀▀▀██▄▀▀▀▀▀█▀░▀▀▀██
//███████████████████████████████████████████████████████████

/**▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
 * @class MapRenderer
 */
export default class MapRenderer extends EventEmitter {
    public mapId: number | null;
    public mapScene: Scene;
    public grid: MapGrid;
    public background: Background;

    public graphics: Graphic[] = [];
    public tacticGraphics: Graphic[] = [];
    public statedElements = [];

    public interactiveElements: any;
    public identifiedElements: any;
    public objects: any;
    public animatedElements: any;

    public textureTacticBlock: any;

    public isReady: boolean;
    public isFightMode: boolean;

    public map: MapData | null = null;

    constructor(mapScene: Scene, background: Background) {
        super();

        this.mapId = 0;
        this.mapScene = mapScene;
        this.grid = new MapGrid();
        this.background = background;

        this.graphics       = [];
        this.tacticGraphics = [];
        this.statedElements = [];

        this.interactiveElements = {};
        this.identifiedElements  = {};
        this.objects             = {};
        this.animatedElements    = [];

        this.textureTacticBlock = this.mapScene.createTexture(
            createTacticBlockImage(), 'roleplayTacticBlock', 'linear', 'permanent');

        this.isReady     = false;
        this.isFightMode = false;

    }

    public initialize() {
        // TODO: Implement this method
        //tapFeedback.initialize();
    };

    /** setMap
     * @param mapRequest
     * @param cb
     */
    public setMap(mapRequest: MapRequest, cb: Function) {
        let mapData = mapRequest.mapData;
        this.map   = mapData;
        this.mapId = mapData.id;

        this.grid.initialize(mapData.cells, !this.isFightMode);
        this.loadMap(mapRequest, cb);
    };

    /** Prepare the assets to display map layer
     *
     * @param _mapRequest
     * @param cb
     */
    public loadMap(_mapRequest: MapRequest, cb: Function) {
        // TODO: Implement this method

        cb();
    }

    /** Remove reference to map and assets to be garbage collected
     *  while we load assets of the next map.
     *
     * @param {number} newMapId - new map id
     */
    public releaseMap(newMapId: number) {
        if (newMapId === this.mapId) {
            // Map remains unchanged
            return;
        }

        this.mapScene.clean();

        this.isReady = false;

        this.graphics            = [];
        this.tacticGraphics      = [];
        this.statedElements      = [];
        this.interactiveElements = {};
        this.identifiedElements  = {};
        this.objects             = {};
        this.animatedElements    = [];
        this.mapId               = null;
        this.map                 = null;
    };

    /** Stop animation of animated elements on the map */
    public stopAnimatedElements() {
        let animatedElements = this.animatedElements;
        for (let i = 0; i < animatedElements.length; i++) {
            animatedElements[i].stop();
        }
    };

    /** Start animation of all animated elements on the map */
    public startAnimatedElements() {
        let animatedElements = this.animatedElements;
        for (let i = 0; i < animatedElements.length; i++) {
            animatedElements[i].animate();
        }
    };

    /** Return if players can walk on cell with specified id
     *
     * @param {number}  cellId      - a cell id, integer in the range [0..559]
     * @param {boolean} isFightMode - if set, check that flag 3 (nonWalkableDuringFight) is not set
     * @return {boolean} true if the cell is walkable, false otherwise
     */
    public isWalkable(cellId: number, isFightMode: boolean) {
        let mask = isFightMode ? 5 : 1;
        return (this.map!.cells[cellId].l & mask) === 1;
    };

    /** Get cell id from coordinates in scene.
     *
     * @param  {number} x - Scene x coordinate in pixel
     * @param  {number} y - Scene y coordinate in pixel
     * @return {number} cellId - Cell id, a number between 0 and 559.
     */
    public getCellId(x: number, y: number) {
        return this.grid.getCellAtSceneCoordinate({ x: x, y: y });
    };

    /** Toggle tactic mode */
    public enableTacticMode() {
        this.hideGraphics(this.graphics);
        this.hideGraphics(this.statedElements);

        // map is not ready yet (e.g. reconnection in fight)
        if (!this.map || !this.map.cells) {
            this.once('ready', this.enableTacticMode);
            return;
        }

        this.tacticGraphics = [];

        let cells = this.map.cells;
        for (let cellId = 0; cellId < Constants.NB_CELLS; cellId++) {
            if (cells[cellId].l & 7) {
                // Not a block cell
                continue;
            }

            let coord = Atouin.getCellCoords()[cellId];
            this.tacticGraphics.push(new Graphic(
                {
                    position: cellId,
                    hue: [1, 1, 1, 1],
                    x: coord.x - BLOCK_TEXTURE_WIDTH / 2,
                    y: coord.y - CELL_HEIGHT,
                    g: 1,
                    w: BLOCK_TEXTURE_WIDTH,
                    h: BLOCK_TEXTURE_HEIGHT,
                    scene: this.mapScene,
                    id: 'tacticBlock_' + cellId,
                    isHudElement: false,
                    alpha: undefined,
                    layer: undefined,
                    rotation: undefined,
                    sx: undefined,
                    sy: undefined
                },
                this.textureTacticBlock
            ));
        }

        this.showGraphics(this.tacticGraphics);
        this.background.toggleTacticMode(true);
    };

    /** Hide all graphics in the display list */
    public hideGraphics(graphics: Graphic[]) {
        for (let i = 0; i < graphics.length; i++) {
            graphics[i].hide();
        }
    };

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
    /** Show all graphics in the display list */
    public showGraphics(graphics: Graphic[]) {
        for (let i = 0; i < graphics.length; i++) {
            graphics[i].show();
        }
    };

}