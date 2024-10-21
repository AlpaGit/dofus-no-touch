import { MapGrid } from "./MapGrid.ts";
import Constants from "../../Common/Constants";
//import Color from "../../Common/Colors/Color.ts";
import EventEmitter from "events";
import Scene from "../../Common/Scene";
import Graphic from "../Graphic/Graphic.ts";
import SpriteBatch from "../../Common/SpriteBatch";

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

//const BLOCK_PADDING = 2;
const BLOCK_WIDTH   = Constants.CELL_WIDTH;
const BLOCK_HEIGHT  = Math.round(CELL_HEIGHT * 1.5);
//const BLOCK_TEXTURE_WIDTH  = BLOCK_WIDTH  + BLOCK_PADDING;
//const BLOCK_TEXTURE_HEIGHT = BLOCK_HEIGHT + BLOCK_PADDING;

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
    public mapId: number;
    public mapScene: Scene;
    public mapGrid: MapGrid;

    public graphics: SpriteBatch[] = [];
    public tacticGraphics: Graphic[] = [];
    public statedElements = [];

    public interactiveElements: any;
    public identifiedElements: any;
    public objects: any;
    public animatedElements: any;

    public textureTacticBlock: any;

    public isReady: boolean;
    public isFightMode: boolean;

    //map:
    constructor(mapScene: Scene) {
        super();

        this.mapId = 0;
        this.mapScene = mapScene;
        this.mapGrid = new MapGrid();

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

}