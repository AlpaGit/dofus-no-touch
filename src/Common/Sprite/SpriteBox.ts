import GridFeedbackOverlay from "../GridAnimator/GridFeedbackOverlay.ts";
import Box from "../BoxBatch/Box.ts";
import TransformStates, {TransformState} from "../../Common/TransformStates/index.js.ts";

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

    private _box: Box;
    private _vertexBuffer: ArrayBuffer = new ArrayBuffer(0);
    private _colorBuffer: Uint32Array = new Uint32Array(0);

    private _transformState: TransformState;

    public get cellId(): number {
        return this._cellId;
    }

    constructor(cellId: number, box: Box, vertexBuffer: ArrayBuffer, colorBuffer: Uint32Array, gridOverlay: GridFeedbackOverlay) {
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

        this._box = box;
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
        this._transformState = TransformStates.empty;
    }

    public animate(transformState: TransformState, delay: number) {
        this._transformState = transformState;

        let duration = 11;
        this.tween.reset().wait(delay).to(transformState, duration, eases.backOut, 2.3).start();

        // Returning total animation duration
        return delay + duration;
    };


}