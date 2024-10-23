import SpriteAbstract from "../SpriteAbstract";
import SpriteBatch from "./index.ts";
import SpriteParams from "../SpriteAbstract/SpriteParams.ts";
import WebGLRenderer from "../../Engine/WebGLRenderer";

export default class SpriteStatic extends SpriteAbstract {
    public batch: SpriteBatch;
    public renderer: WebGLRenderer;

    public spriteIndex: number;

    public x0: number;
    public y0: number;
    public x1: number;
    public y1: number;
    public x2: number;
    public y2: number;
    public x3: number;
    public y3: number;

    public graphicInAtlas: { sx: number, sw: number, sy: number, sh: number };

    constructor(params:SpriteParams, graphicInAtlas: { sx: number, sw: number, sy: number, sh: number }, batch: SpriteBatch){
        super(params);

        this.batch = batch;
        this.renderer = batch.renderer;

        // Computing position of the 4 corners of the graphic on the scene
        let cx = params.cx || 0;
        let cy = params.cy || 0;

        let x = params.x!;
        let y = params.y!;

        let sx = params.sx || 1;
        let sy = params.sy || 1;

        let w = params.cw!;
        let h = params.ch!;

        let x0 = -cx * sx;
        let y0 = -cy * sy;

        let x1 = (w - cx) * sx;
        let y1 = -cy * sy;

        let x2 = -cx * sx;
        let y2 = (h - cy) * sy;

        let x3 = (w - cx) * sx;
        let y3 = (h - cy) * sy;

        let rotation = params.rotation || 0;
        if (rotation !== 0) {
            let cos = Math.cos(rotation);
            let sin = Math.sin(rotation);

            let x0tmp = x0;
            let x1tmp = x1;
            let x2tmp = x2;
            let x3tmp = x3;

            x0 = x0 * cos - y0 * sin;
            y0 = x0tmp * sin + y0 * cos;

            x1 = x1 * cos - y1 * sin;
            y1 = x1tmp * sin + y1 * cos;

            x2 = x2 * cos - y2 * sin;
            y2 = x2tmp * sin + y2 * cos;

            x3 = x3 * cos - y3 * sin;
            y3 = x3tmp * sin + y3 * cos;
        }

        this.x0 = x0 + x;
        this.y0 = y0 + y;

        this.x1 = x1 + x;
        this.y1 = y1 + y;

        this.x2 = x2 + x;
        this.y2 = y2 + y;

        this.x3 = x3 + x;
        this.y3 = y3 + y;

        // Computing bounding box of the graphic
        this.bbox[0] = Math.min(this.x0, this.x1, this.x2, this.x3);
        this.bbox[1] = Math.max(this.x0, this.x1, this.x2, this.x3);
        this.bbox[2] = Math.min(this.y0, this.y1, this.y2, this.y3);
        this.bbox[3] = Math.max(this.y0, this.y1, this.y2, this.y3);

        // Position of the graphic in the atlas texture
        this.graphicInAtlas = graphicInAtlas;

        this.spriteIndex = 0;

    }

    public isWithinBounds(x: number, y: number): boolean {
        return (this.bbox[0] <= x) && (x <= this.bbox[1]) && (this.bbox[2] <= y) && (y <= this.bbox[3]);
    }

    public render() {
        if (this.batch._atlasTexture === null) {
            return;
        }

        this.renderer.drawSpriteSubBatch(this.batch.id, this.spriteIndex * 6, this.spriteIndex * 6 + 6);
    };

    public forceRefresh() {
        if (!this.isOutdated) {
            this.isOutdated = true;
            this.batch.updatedSprites.push(this);
            this.batch.forceRefresh();
        }
    };



}