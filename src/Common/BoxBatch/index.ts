import Sprite from "../Sprite";
import SpriteParams from "../SpriteAbstract/SpriteParams.ts";
import Box from "./Box.ts";



/** @class BoxBatch
 *
 * @param {Object} params  - properties of the graphic
 * @param {Object} texture - position of graphic in atlas image
 */
export default class BoxBatch extends Sprite{
    private readonly _boxes: Box[];
    private readonly _boxByteSize: number;
    private readonly _bbox: number[];

    private _vertexBuffer: ArrayBuffer = new ArrayBuffer(0);
    private _positions: Float32Array = new Float32Array(0);
    private _colorView: Uint32Array = new Uint32Array(0);

    constructor(params: SpriteParams & { boxes: Box[] }) {
        super(params);

        this._boxes = params.boxes;
        this._boxByteSize = this.renderer.getNbBytesPerBox();
        this._bbox = [Infinity, -Infinity, Infinity, -Infinity];

        this._createVertexBuffer();
    }

    private  _createVertexBuffer() {
        let nBoxes = this._boxes.length;

        this._vertexBuffer = new ArrayBuffer(nBoxes * this._boxByteSize);
        this._positions    = new Float32Array(this._vertexBuffer);
        this._colorView    = new Uint32Array(this._vertexBuffer);

        let color = 0x40404040;
        for (let b = 0; b < nBoxes; b += 1) {
            let box = this._boxes[b];
            this._expandToFitBox(box);

            let boxBuffPos = b * this._boxByteSize / 4;

            // Triangle 1
            this._positions[boxBuffPos + 0] = box.x0;
            this._positions[boxBuffPos + 1] = box.y0;
            this._colorView[boxBuffPos + 3] = color;

            this._positions[boxBuffPos + 5] = box.x2;
            this._positions[boxBuffPos + 6] = box.y2;
            this._colorView[boxBuffPos + 8] = color;

            this._positions[boxBuffPos + 10] = box.x3;
            this._positions[boxBuffPos + 11] = box.y3;
            this._colorView[boxBuffPos + 13] = color;

            // Triangle 2
            this._positions[boxBuffPos + 15] = box.x0;
            this._positions[boxBuffPos + 16] = box.y0;
            this._colorView[boxBuffPos + 18] = color;

            this._positions[boxBuffPos + 20] = box.x1;
            this._positions[boxBuffPos + 21] = box.y1;
            this._colorView[boxBuffPos + 23] = color;

            this._positions[boxBuffPos + 25] = box.x2;
            this._positions[boxBuffPos + 26] = box.y2;
            this._colorView[boxBuffPos + 28] = color;
        }

        this._bbox[0] += this._x;
        this._bbox[1] += this._x;
        this._bbox[2] += this._y;
        this._bbox[3] += this._y;

        // Vertex buffer will have to be reloaded
        // Releasing the currently loaded one
        this.renderer.releaseBuffer(this.id);

        // Making sure the sprite will be updated
        this.forceRefresh();

    }

    /** Render method of the sprite grid consists in rendering a batch of boxes
     */
    public draw() {
        this.renderer.drawBoxBatch(this.id);
    };

    /** Self expand bounding box to cover contents
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


    private _expandToFitBox(box: Box) {
        this._expandToFitPoint(box.x0, box.y0);
        this._expandToFitPoint(box.x1, box.y1);
        this._expandToFitPoint(box.x2, box.y2);
        this._expandToFitPoint(box.x3, box.y3);
    };


    /** Render method of Sprite overridden for performance
     */
    public override generateCurrentFrameData() {
        // Checking whether the vertex buffer is already loaded on the GPU
        let batchData = this.renderer.getBufferData(this.id);
        if (batchData === undefined) { // batchData should never be null
            // Loading the vertex buffer onto the GPU
            let batchId      = this.id;
            let vertexBuffer = this._positions;
            let prerender    = false;
            this.renderer.loadSpriteBuffer(batchId, vertexBuffer, null, this._bbox, prerender);
            this.renderer.lockBuffer(this.id);
        }

        return this._bbox;
    };

    /* Box batch stops being used, buffer is release */
    public override clear() {
        this.renderer.releaseBuffer(this.id);
    };

}