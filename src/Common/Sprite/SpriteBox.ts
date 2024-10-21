import Box from "../BoxBatch/Box.ts";
import TransformStates, {TransformState} from "../../Common/TransformStates/index.js.ts";
import GridFeedbackOverlay from "../../Engine/GridAnimator/GridFeedbackOverlay.ts";
import Tween from "../../Engine/TINAlight/Tween.ts";
import Easing from "../../Engine/TINAlight/Easing.ts";

export default class SpriteBox{
    // Color
    public r: number;
    public g: number;
    public b: number;
    public a: number;

    // Scale
    public sx: number;
    public sy: number;

    // Rotation (obviously)
    public rotation: number;

    public gridOverlay: GridFeedbackOverlay;

    private _cellId: number;

    private _translateX: number;
    private _translateY: number;

    public bbox: Box;
    private _vertexBuffer: Float32Array = new Float32Array(0);
    private _colorBuffer: Uint32Array = new Uint32Array(0);

    public transformState: TransformState;

    public tween: Tween;

    _x0: number = 0;
    _y0: number = 0;
    _x1: number = 0;
    _y1: number = 0;
    _x2: number = 0;
    _y2: number = 0;
    _x3: number = 0;
    _y3: number = 0;

    public get cellId(): number {
        return this._cellId;
    }

    constructor(cellId: number, box: Box, vertexBuffer: Float32Array, colorBuffer: Uint32Array, gridOverlay: GridFeedbackOverlay) {
        this._cellId = cellId;

        let emptyState = TransformStates.empty;

        this.r = emptyState.r;
        this.g = emptyState.g;
        this.b = emptyState.b;
        this.a = emptyState.a;

        this.sx = emptyState.sx;
        this.sy = emptyState.sy;

        this.rotation = 0.0;

        this.gridOverlay = gridOverlay;

        // The transformation point of the box is at its center, i.e point (x0, y1)
        this._translateX = box.x0;
        this._translateY = box.y1;

        this.bbox = box;
        this._vertexBuffer = vertexBuffer;
        this._colorBuffer = colorBuffer;

        this._restore();
        this._translate();
        this._fillVertexBuffer();

        this.tween = new Tween(this, ['sx', 'sy', 'r', 'g', 'b', 'a']);

        let self = this;
        this.tween.onUpdate(function () {
            self.setBuffer();
        });

        // Current transform state
        this.transformState = TransformStates.empty;
    }

    public animate(transformState: TransformState, delay: number) {
        this.transformState = transformState;

        const duration = 11;
        this.tween.reset().wait(delay).to(transformState, duration, Easing.backOut, 2.3).start();

        // Returning total animation duration
        return delay + duration;
    };

    private _restore() {
        this._x0 = 0.0;
        this._y0 = -21.5;

        this._x1 = -43;
        this._y1 = 0.0;

        this._x2 = 0.0;
        this._y2 = 21.5;

        this._x3 = 43;
        this._y3 = 0.0;
    };

    private _translate() {
        this._x0 += this._translateX;
        this._x1 += this._translateX;
        this._x2 += this._translateX;
        this._x3 += this._translateX;

        this._y0 += this._translateY;
        this._y1 += this._translateY;
        this._y2 += this._translateY;
        this._y3 += this._translateY;
    };

    private _rotate() {
        if (this.rotation !== 0) {
            const cos = Math.cos(this.rotation);
            const sin = Math.sin(this.rotation);

            const x0 = this._x0;
            const x1 = this._x1;
            const x2 = this._x2;
            const x3 = this._x3;

            this._x0 = cos * x0 - sin * this._y0;
            this._y0 = sin * x0 + cos * this._y0;

            this._x1 = cos * x1 - sin * this._y1;
            this._y1 = sin * x1 + cos * this._y1;

            this._x2 = cos * x2 - sin * this._y2;
            this._y2 = sin * x2 + cos * this._y2;

            this._x3 = cos * x3 - sin * this._y3;
            this._y3 = sin * x3 + cos * this._y3;
        }
    };

    private _scale() {
        this._x0 *= this.sx;
        this._x1 *= this.sx;
        this._x2 *= this.sx;
        this._x3 *= this.sx;

        this._y0 *= this.sy;
        this._y1 *= this.sy;
        this._y2 *= this.sy;
        this._y3 *= this.sy;
    };

    public setBuffer() {
        this._restore();
        this._scale();
        this._rotate();
        this._translate();
        this._fillVertexBuffer();

        this.gridOverlay._updated = true;
        this.gridOverlay.forceRefresh();
    };

    private _fillVertexBuffer() {
        const r = Math.max(-128, Math.min(127, this.r * 64));
        const g = Math.max(-128, Math.min(127, this.g * 64));
        const b = Math.max(-128, Math.min(127, this.b * 64));
        const a = Math.max(-128, Math.min(127, this.a * 64));
        const color = ((a << 24) & 0xff000000) + ((b << 16) & 0xff0000) + ((g << 8) & 0xff00) + (r & 0xff);

        // vertex 0
        this._vertexBuffer[0] = this._x0;
        this._vertexBuffer[1] = this._y0;
        this._colorBuffer[3] = color;

        //vertex 1
        this._vertexBuffer[5] = this._x1;
        this._vertexBuffer[6] = this._y1;
        this._colorBuffer[8] = color;

        //vertex 2
        this._vertexBuffer[10] = this._x2;
        this._vertexBuffer[11] = this._y2;
        this._colorBuffer[13] = color;

        //Triangle 2

        //vertex 0
        this._vertexBuffer[15] = this._x2;
        this._vertexBuffer[16] = this._y2;
        this._colorBuffer[18] = color;

        //vertex 1
        this._vertexBuffer[20] = this._x3;
        this._vertexBuffer[21] = this._y3;
        this._colorBuffer[23] = color;

        //vertex 2
        this._vertexBuffer[25] = this._x0;
        this._vertexBuffer[26] = this._y0;
        this._colorBuffer[28] = color;
    };
}