import Sprite from "../Sprite";
import Constants from "../Constants";
import SpriteParams from "../SpriteAbstract/SpriteParams.ts";
import {ElementHandle} from "../../Engine/Cache3State/ElementHandle.ts";
import SpriteStatic from "./SpriteStatic.ts";
import SpriteAbstract from "../SpriteAbstract";

const LAST_CELL_POSITION = Constants.NB_CELLS;

export default class SpriteBatch extends Sprite{
    public override holdsStatics: boolean = true;

    public updatedSprites: SpriteAbstract[] = [];
    _atlasTexture: ElementHandle | null = null;

    private _spriteByteSize: number;

    private _vertexBuffer: ArrayBuffer | null;
    private _floatView: ArrayBuffer | null;
    private _longView: Uint32Array | null;

    private _sprites: SpriteStatic[];
    private _vertexBufferCreated: boolean;

    private _vertexBufferIndexPerPosition: number[];

    constructor(params: SpriteParams){
        super(params);

        // Size of an icon in bytes, in the vertex buffer
        this._spriteByteSize = this.renderer.getNbBytesPerSprite();
        // Vertex buffer
        this._vertexBuffer = null;
        this._floatView    = null;
        this._longView     = null;

        // Graphics composing the batch
        this._sprites = [];

        this._vertexBufferCreated = false;

        // Position in the vertex buffer where elements are for a given z-index position
        this._vertexBufferIndexPerPosition = new Array(LAST_CELL_POSITION + 1);
    }

    public setTexture(texture: ElementHandle){
        this._atlasTexture = texture;
        this.updatedSprites.push(this);
        this.forceRefresh();
    }

    public override draw(fromElement: Sprite, toElement: Sprite){
        if (this._atlasTexture === null) {
            return;
        }

        if (fromElement.layer > this.layer || toElement.layer < this.layer) {
            return;
        }

        let fromPosition;
        if (fromElement.layer < this.layer) {
            fromPosition = 0;
        } else {
            fromPosition = Math.round(fromElement.position);
            if (fromPosition < 0) {
                fromPosition = 0;
            } else if (fromPosition > LAST_CELL_POSITION) {
                fromPosition = LAST_CELL_POSITION;
            }
        }

        let toPosition;
        if (toElement.layer > this.layer) {
            toPosition = LAST_CELL_POSITION;
        } else {
            toPosition = Math.round(toElement.position);
            if (toPosition < 0) {
                toPosition = 0;
            } else if (toPosition > LAST_CELL_POSITION) {
                toPosition = LAST_CELL_POSITION;
            }
        }

        let fromVertex = this._vertexBufferIndexPerPosition[fromPosition];
        let toVertex   = this._vertexBufferIndexPerPosition[toPosition];
        if (fromVertex !== toVertex) {
            this.renderer.drawSpriteSubBatch(this.id, fromVertex, toVertex);
        }
    }

    public refreshAnimation(areasToRefresh: any[]) {
        this.isOutdated = false;
        if (this.updatedSprites.length === 0) {
            // animation does not need to be refreshed
            return;
        }

        for (let s = 0; s < this.updatedSprites.length; s += 1) {
            let sprite = this.updatedSprites[s];
            if(sprite instanceof SpriteStatic) {
                this._updateSpriteHighlight(sprite);
            }
            if (areasToRefresh !== undefined) {
                areasToRefresh.push(sprite.bbox.slice());
            }
            sprite.isOutdated = false;
        }

        // Checking whether the vertex buffer is already loaded on the GPU
        let batchId   = this.id;
        let batchData = this.renderer.getBufferData(batchId);
        if (batchData === undefined) { // batchData should never be null
            let texture = this._atlasTexture;
            if (texture !== null && this._vertexBufferCreated) {
                // Loading the vertex buffer onto the GPU
                let vertexBuffer = this._floatView;
                let prerender    = false;
                this.renderer.loadSpriteBuffer(batchId, vertexBuffer!, texture, this.bbox, prerender);
                this.renderer.lockBuffer(batchId);
            }
        }

        this.updatedSprites.length = 0;
    };

    public addSprite(spriteData: SpriteParams, graphicInAtlas: { sx: number, sy: number, sw: number, sh: number }) {
        let sprite = new SpriteStatic(spriteData, graphicInAtlas, this);
        this._sprites.push(sprite);
        return sprite;
    };

    public finalize(atlasWidth: number, atlasHeight: number) {
        this._createVertexBuffer(atlasWidth, atlasHeight);
        this.updatedSprites.push(this);
        this.forceRefresh();
    };


    private _updateSpriteHighlight(sprite: SpriteStatic) {
        let byteOffset   = sprite.spriteIndex * this._spriteByteSize;
        let spriteOffset = byteOffset / 4;
        let colorView    = this._longView!.subarray(spriteOffset, spriteOffset + this._spriteByteSize / 4);
        let tint         = sprite.tint;

        // Clamping color components in [-128, 127]
        let cmr = Math.max(-128, Math.min(127, tint[0] * 64));
        let cmg = Math.max(-128, Math.min(127, tint[1] * 64));
        let cmb = Math.max(-128, Math.min(127, tint[2] * 64));
        let cma = Math.max(-128, Math.min(127, tint[3] * 64));

        let cm = ((cma << 24) & 0xff000000) + ((cmb << 16) & 0xff0000) + ((cmg << 8) & 0xff00) + (cmr & 0xff);

        colorView[3]  = colorView[8]  = colorView[13] = cm;
        colorView[18] = colorView[23] = colorView[28] = cm;

        this.renderer.updateVertexBuffer(this.id, colorView, byteOffset);
    };

    private _createVertexBuffer(atlasWidth: number, atlasHeight: number) {
        this._vertexBuffer = new ArrayBuffer(this._spriteByteSize * this._sprites.length);
        this._floatView    = new Float32Array(this._vertexBuffer);
        this._longView     = new Uint32Array(this._vertexBuffer);

        let positions     = this._floatView;
        let textCoordView = this._longView;
        let colorView     = this._longView;

        let xMin =  Infinity;
        let xMax = -Infinity;
        let yMin =  Infinity;
        let yMax = -Infinity;

        let position = 0;
        let s = 0;
        for (s = 0; s < this._sprites.length; s += 1) {
            let sprite = this._sprites[s];
            let graphicInAtlas = sprite.graphicInAtlas;
            let spriteOffset = s * this._spriteByteSize / 4;

            sprite.spriteIndex = s;
            while (position < sprite.position) {
                this._vertexBufferIndexPerPosition[position] = s * 6;
                position += 1;
            }
            this._vertexBufferIndexPerPosition[position] = s * 6 + 6;

            // Updating bounds of sprite batch
            let bbox = sprite.bbox;
            if (bbox[0] < xMin) { xMin = bbox[0]; }
            if (bbox[1] > xMax) { xMax = bbox[1]; }
            if (bbox[2] < yMin) { yMin = bbox[2]; }
            if (bbox[3] > yMax) { yMax = bbox[3]; }

            //@ts-ignore
            positions[spriteOffset + 0]  = sprite.x0;
            //@ts-ignore
            positions[spriteOffset + 1]  = sprite.y0;
            //@ts-ignore
            positions[spriteOffset + 5]  = sprite.x2;
            //@ts-ignore
            positions[spriteOffset + 6]  = sprite.y2;
            //@ts-ignore
            positions[spriteOffset + 10] = sprite.x3;
            //@ts-ignore
            positions[spriteOffset + 11] = sprite.y3;
            //@ts-ignore
            positions[spriteOffset + 15] = sprite.x0;
            //@ts-ignore
            positions[spriteOffset + 16] = sprite.y0;
            //@ts-ignore
            positions[spriteOffset + 20] = sprite.x3;
            //@ts-ignore
            positions[spriteOffset + 21] = sprite.y3;
            //@ts-ignore
            positions[spriteOffset + 25] = sprite.x1;
            //@ts-ignore
            positions[spriteOffset + 26] = sprite.y1;

            let tx0 = (graphicInAtlas.sx / atlasWidth) * 0xffff & 0xffff;
            let ty0 = (graphicInAtlas.sy / atlasHeight) * 0xffff0000 & 0xffff0000;
            let tx1 = ((graphicInAtlas.sx + graphicInAtlas.sw) / atlasWidth) * 0xffff & 0xffff;
            let ty1 = ((graphicInAtlas.sy + graphicInAtlas.sh) / atlasHeight) * 0xffff0000 & 0xffff0000;

            textCoordView[spriteOffset + 2]  = tx0 + ty0;
            textCoordView[spriteOffset + 7]  = tx0 + ty1;
            textCoordView[spriteOffset + 12] = tx1 + ty1;
            textCoordView[spriteOffset + 17] = tx0 + ty0;
            textCoordView[spriteOffset + 22] = tx1 + ty1;
            textCoordView[spriteOffset + 27] = tx1 + ty0;

            let tint = sprite.tint;

            // Clamping color components in [-128, 127]
            let cmr = Math.max(-128, Math.min(127, tint[0] * 64));
            let cmg = Math.max(-128, Math.min(127, tint[1] * 64));
            let cmb = Math.max(-128, Math.min(127, tint[2] * 64));
            let cma = Math.max(-128, Math.min(127, tint[3] * 64));

            let cm = ((cma << 24) & 0xff000000) + ((cmb << 16) & 0xff0000) + ((cmg << 8) & 0xff00) + (cmr & 0xff);

            colorView[spriteOffset + 3]  = colorView[spriteOffset + 8]  = colorView[spriteOffset + 13] = cm;
            colorView[spriteOffset + 18] = colorView[spriteOffset + 23] = colorView[spriteOffset + 28] = cm;

            // Color addition set to 0
            colorView[spriteOffset + 4]  = colorView[spriteOffset + 9]  = colorView[spriteOffset + 14] = 0;
            colorView[spriteOffset + 19] = colorView[spriteOffset + 24] = colorView[spriteOffset + 29] = 0;
        }

        while (position <= LAST_CELL_POSITION) {
            this._vertexBufferIndexPerPosition[position] = s * 6;
            position += 1;
        }

        this.bbox[0] = xMin;
        this.bbox[1] = xMax;
        this.bbox[2] = yMin;
        this.bbox[3] = yMax;

        this._vertexBufferCreated = true;
    };

    /* Graphic batch stops being used, buffer is release */
    public clear() {
        this.renderer.releaseBuffer(this.id);

        if (this._atlasTexture) {
            this._atlasTexture.release();
        }
    };
}