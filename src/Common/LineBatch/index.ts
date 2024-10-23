import Line from "../Line";
import Sprite from "../Sprite";
import SpriteParams from "../SpriteAbstract/SpriteParams.ts";
import Constants from "../../Common/Constants";
import Scene from "../Scene";

export class LineBatchParams extends  SpriteParams{
    public lines: Line[];
    public lineWidth: number;

    constructor(id: string, scene: Scene, params: Partial<LineBatchParams> = {}) {
        super(id, scene, params);
        this.lines = [];
        this.lineWidth = 0;

        Object.assign(this, params);
    }
}

/** @class LineBatch
 *
 * @param {Object} params  - properties of the graphic
 * @param {Object} texture - position of graphic in atlas image
 */
export default class LineBatch extends Sprite{
    private _lines: Line[];
    private _lineWidth: number;
    private _lineByteSize: number;
    private _bbox: number[];

    private _vertexBuffer: ArrayBuffer = new ArrayBuffer(0);
    private _positions: Float32Array = new Float32Array(0);
    private _colorView: Uint32Array = new Uint32Array(0);

    constructor(params: LineBatchParams){
        super(params);

        this._lines        = params.lines;
        this._lineWidth    = params.lineWidth * Constants.PIXEL_RATIO;
        this._lineByteSize = this.renderer.getNbBytesPerLine();
        this._bbox         = [Infinity, -Infinity, Infinity, -Infinity];

        this._createVertexBuffer();
    }

    private _createVertexBuffer() {
        let nLines = this._lines.length;

        this._vertexBuffer = new ArrayBuffer(nLines * this._lineByteSize);
        this._positions    = new Float32Array(this._vertexBuffer);
        this._colorView    = new Uint32Array(this._vertexBuffer);

        for (let l = 0; l < nLines; l += 1) {
            let line = this._lines[l];
            this._expandToFitLine(line);

            let lineBuffPos = l * this._lineByteSize / 4;

            // Position of the line in the scene
            this._positions[lineBuffPos + 0] = line.x0;
            this._positions[lineBuffPos + 1] = line.y0;

            this._positions[lineBuffPos + 5] = line.x1;
            this._positions[lineBuffPos + 6] = line.y1;

            // Color multipliers set to 1
            // 0x40404040 === (64 << 24) + (64 << 16) + (64 << 8) + 64 where 64 corresponds to a color multiplier of 1
            this._colorView[lineBuffPos + 3] = this._colorView[lineBuffPos + 8] = 0x40404040;
        }

        // Vertex buffer will have to be reloaded
        // Releasing the currently loaded one
        this.renderer.releaseBuffer(this.id);

        // Making sure the sprite will be updated
        this.forceRefresh();
    };

    /**
    * Render method of the sprite grid consists in rendering a batch of lines
    **/
    public draw() {
        this.renderer.drawLineBatch(this.id, this._lineWidth);
    };

    /**
     * Self expand bounding box to cover contents
     */
    private _expandToFitPoint(x: number, y: number) {
        // The bounding box is organized in
        // x1, x2, y1, y2 format
        if (this._bbox[0] > x) {
            this._bbox[0] = x;
        }

        if (this._bbox[2] > y) {
            this._bbox[2] = y;
        }

        if (this._bbox[1] < x) {
            this._bbox[1] = x;
        }

        if (this._bbox[3] < y) {
            this._bbox[3] = y;
        }
    };

    private _expandToFitLine(line: Line) {
        this._expandToFitPoint(line.x0, line.y0);

        this._expandToFitPoint(line.x1, line.y1);
    };

    /**
     *  Render method of Sprite overridden for performance
     */
    public  override generateCurrentFrameData() {
        // Checking whether the vertex buffer is already loaded on the GPU
        let batchData = this.renderer.getBufferData(this.id);
        if (batchData === undefined) { // batchData should never be null
            // Loading the vertex buffer onto the GPU
            let vertexBuffer = this._positions;
            let prerender    = false;
            this.renderer.loadLineBuffer(this.id, vertexBuffer!, this._bbox, prerender);
            this.renderer.lockBuffer(this.id);
        }

        return this._bbox;
    };

    /* Line batch stops being used, buffer is release */
    public override clear() {
        this.renderer.releaseBuffer(this.id);
    };
}