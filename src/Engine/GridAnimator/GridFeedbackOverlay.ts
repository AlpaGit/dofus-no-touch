import Constants from "../../Common/Constants";
import Engine from "../Engine.ts";
import Atouin from "../Atouin";
import SpriteBox from "../../Common/Sprite/SpriteBox.ts";
import SpriteParams from "../../Common/SpriteAbstract/SpriteParams.ts";
import Sprite from "../../Common/Sprite";
import Box from "../../Common/BoxBatch/Box.ts";

const CELL_WIDTH           = Constants.CELL_WIDTH;
const CELL_HEIGHT          = Constants.CELL_HEIGHT;
const CELL_HALF_WIDTH      = CELL_WIDTH / 2;
const CELL_HALF_HEIGHT     = CELL_HEIGHT / 2;

// The GridFeedbackOverlay is a single sprite.
// It draws the result state of all of the spriteboxes it contains.
// All spriteboxes get a chunk of the GridFeedbackOverlays's vertex buffer.
// SpriteBox transforms are all calculated internally, in SpriteBox.

export default class GridFeedbackOverlay extends Sprite {
    public spriteBoxes: SpriteBox[] = [];

    private _bbox: number[] = [];
    private _boxByteSize: number;
    private _updated: boolean;
    private _vertexBuffer: ArrayBuffer = new ArrayBuffer(0);

    constructor() {
        const params = new SpriteParams('gridFeedbackOverlay', Engine.isoEngine.mapScene);
        params.position = 1;
        params.hue = [0.0, 0.0, 0.0, 0.0];
        params.layer = -1;

        super(params);

        this._bbox = [Infinity, -Infinity, Infinity, -Infinity];  // is often directly controlled by GridAnimator
        this._boxByteSize = this.renderer.getNbBytesPerBox();
        this.createGrid();
        this.forceRefresh();

        this._updated = false;
    }

    private createGrid() {
        this.spriteBoxes = [];
        this._vertexBuffer = new ArrayBuffer(Constants.NB_CELLS * this._boxByteSize);
        for (let cellId = 0; cellId < Constants.NB_CELLS; cellId++) {
            let coord = Atouin.getCellCoords()[cellId];
            let x0 = coord.x;
            let x1 = x0 - CELL_HALF_WIDTH;
            let x2 = x0 + CELL_HALF_WIDTH;
            let y0 = coord.y - Constants.GRID_ALTITUDE_OFFSET;
            let y1 = y0 + CELL_HALF_HEIGHT;
            let y2 = y0 + CELL_HEIGHT;

            let box = new Box(x0, y0, x2, y1, x0, y2, x1, y1); // wacky use of x y notation.
            //bbox is handled by GridAnimator
            let arrayOffset = cellId * this._boxByteSize;
            let vertexBuffer = new Float32Array(this._vertexBuffer, arrayOffset, this._boxByteSize / 4);
            let colorBuffer = new Uint32Array(this._vertexBuffer, arrayOffset, this._boxByteSize / 4);
            let spriteBox = new SpriteBox(cellId, box, vertexBuffer, colorBuffer, this);
            this.spriteBoxes[spriteBox.cellId] = spriteBox;
        }
    };

    //TODO: do this faster
    //TODO: only do for visible boxes
    private _expandToFitPoint(x: number, y: number) {
        // x1, x2, y1, y2 format
        if (this._bbox[0] > x) {
            this._bbox[0] = x;
        }

        if (this._bbox[1] < x) {
            this._bbox[1] = x;
        }

        if (this._bbox[2] > y) {
            this._bbox[2] = y;
        }

        if (this._bbox[3] < y) {
            this._bbox[3] = y;
        }
    };

    public expandToFitBox(box: Box) {
        this._expandToFitPoint(box.x0, box.y0);
        this._expandToFitPoint(box.x1, box.y1);
        this._expandToFitPoint(box.x2, box.y2);
        this._expandToFitPoint(box.x3, box.y3);
    };

    public override draw() {
        this.renderer.drawBoxBatch(this.id);
    };

    // we have to override this because we handle our own transforms
    public override render() {
        this.renderer.save();
        // Rendering
        this.draw();
        this.renderer.restore();
    };

    public override remove() {

    }

    public override generateCurrentFrameData() {
        if (this._updated) {
            this.renderer.releaseBuffer(this.id);
            this._updated = false;
        }

        // Checking whether the vertex buffer is already loaded on the GPU
        let batchData = this.renderer.getBufferData(this.id);
        if (batchData === undefined) { // batchData should never be null
            // Loading the vertex buffer onto the GPU
            let batchId      = this.id;
            let prerender    = false;
            this.renderer.loadSpriteBuffer(batchId, this._vertexBuffer, null, this._bbox, prerender);
            this.renderer.lockBuffer(this.id);
        }

        return this._bbox;
    }

    public override clear(){
        this.renderer.releaseBuffer(this.id);
    }
}