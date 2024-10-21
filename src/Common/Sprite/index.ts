import SpriteAbstract from "../SpriteAbstract";
import SpriteParams from "../SpriteAbstract/SpriteParams.ts";
import Scene from "../../Common/Scene";
import WebGLRenderer from "../WebGLRenderer";
import IList from "../OrderedList/IList.ts";
import {ElementHandle} from "../Cache3State/ElementHandle.ts";



/**
 * @class Sprite
 * @desc  Element that is meant to be renderer on screen.
 * Everytime one of its attribute that affects its aspect
 * is modified then the sprite becomes isOutdated and its
 * renderer is notified.
 *
 * @author Brice Chevalier
 *
 * @param {Object} params - parameters object
 */

export default class Sprite extends SpriteAbstract {
    public isWhiteListed: boolean;
    public scene: Scene;
    public renderer: WebGLRenderer;
    public updateList: Sprite[];
    public displayList: IList;
    public holdsStatics: boolean = false;

    private _layer: number;
    protected _x: number;
    protected _y: number;

    protected _scaleX: number;
    protected _scaleY: number;
    private _rotation: number;
    private _spriteRef: any | null = null;

    private _cleared: boolean = false;

    constructor(params: SpriteParams) {
        super(params);

        this._layer = params.layer || 0; // position layer

        this._x = params.x || 0; // x coordinate on screen
        this._y = params.y || 0; // y coordinate on screen

        // TODO: try to optim out scaleX and scaleY
        this._scaleX    = params.sx || 1;
        this._scaleY    = params.sy || 1;
        this._rotation  = params.rotation || 0;
        this._spriteRef = null;

        this.isDisplayed = false;

        // Whether the sprite is white-listed for removal
        this.isWhiteListed = false;

        // Scene holding the sprite
        this.scene = params.scene;

        // Scene attributes, localized for faster access
        this.renderer    = this.scene.renderer;
        this.updateList  = this.scene.updateList;
        this.displayList = this.scene.displayList;

        if (this.holdsStatics) {
            this.displayList = this.scene.staticElements;
        }

        if (params.isHudElement) {
            this.displayList = this.scene.hudDisplayList;
        }

        // Whether the sprite has already been cleared
        this._cleared = false;
        this.show();
    }

    public get x() {
        return this._x;
    }

    public set x(x: number) {
        this._x = x;
        this.forceRefresh();
    }

    public get y() {
        return this._y;
    }

    public set y(y: number) {
        this._y = y;
        this.forceRefresh();
    }

    public get scaleX() {
        return this._scaleX;
    }

    public set scaleX(sx: number) {
        this._scaleX = sx;
        this.forceRefresh();
    }

    public get scaleY() {
        return this._scaleY;
    }

    public set scaleY(sy: number) {
        this._scaleY = sy;
        this.forceRefresh();
    }

    public get rotation() {
        return this._rotation;
    }

    public set rotation(rotation: number) {
        this._rotation = rotation;
        this.forceRefresh();
    }

    public get layer() {
        return this._layer;
    }

    public set layer(layer: number) {
        if (layer !== this._layer) {
            this._layer = layer;
            if (this.isDisplayed) { this._show(); } // TODO: remove this hack
            this.forceRefresh();
        }
    }

    //▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
    /** Render element
     *
     */
    public render() {
        this.renderer.save();

        // Applying tint
        this.renderer.multiplyColor(this.tint[0], this.tint[1], this.tint[2], this.tint[3]);

        // Applying transformations
        this.renderer.translate(this._x, this._y);
        if (this._rotation !== 0) {
            this.renderer.rotate(this._rotation);
        }
        this.renderer.scale(this._scaleX, this._scaleY);

        // Rendering
        this.draw(this.renderer, null);

        this.renderer.restore();
    };

    protected _show() {
        if (this._spriteRef === null) {
            // Adding it to the list
            this._spriteRef = this.displayList.add(this);
        } else {
            // Repositioning at correct position in the list
            this._spriteRef = this.displayList.reposition(this._spriteRef);
        }
    };

    private _hide() {
        if (this._spriteRef !== null) {
            if (!this.displayList.removeByRef(this._spriteRef)) {
                console.warn('[Sprite.remove] Sprite not found in display list', this, this.displayList);
            }

            this._spriteRef = null;
        }
    };

    public show() {
        this._show();
        this.isDisplayed = true;
        this.forceRefresh();
    };

    public hide() {
        this._hide();
        this.isDisplayed = false;
        this.forceRefresh();
    }

    public forceRefresh () {
        if (!this.isOutdated) {
            this.updateList.push(this);
            this.isOutdated = true;
        }
    }

    public setWhiteListedness(whiteListedness: boolean) {
        this.isWhiteListed = whiteListedness;
    };

    public remove() {
        this.hide();
        if (!this.isWhiteListed) {
            if (this._cleared) {
                // Already cleared
                return;
            }
            this._cleared = true;
            this.clear();
        }
    };


    public isWithinBounds(x: number, y: number) {
        return (this.bbox[0] <= x) && (x <= this.bbox[1]) && (this.bbox[2] <= y) && (y <= this.bbox[3]);
    };

    public refreshAnimation(areasToRefresh: number[][] | undefined = undefined) {
        this.isOutdated = false;

        if (!this.isDisplayed) {
            // Current bounding box will be returned as the area to refresh
            if (areasToRefresh !== undefined) {
                areasToRefresh.push(this.bbox);
            }

            // And replacing current bounding box by an empty box
            this.bbox = [Infinity, -Infinity, Infinity, -Infinity];
            return;
        }

        // Fetching bounding box for the current frame
        let bboxInterval = this.bbox;
        let relativeBBox = this.generateCurrentFrameData();

        // Setting the bounding box for the current animation relative to its position
        if (this._rotation === 0) {
            // Fast case (optimisation), the sprite has no rotation
            this.bbox = [
                this._x + this._scaleX * (this._scaleX > 0 ? relativeBBox[0] : relativeBBox[1]),
                this._x + this._scaleX * (this._scaleX > 0 ? relativeBBox[1] : relativeBBox[0]),
                this._y + this._scaleY * relativeBBox[2],
                this._y + this._scaleY * relativeBBox[3]
            ];
        } else {
            const cos = Math.cos(this._rotation);
            const sin = Math.sin(this._rotation);

            const l = this._scaleX * relativeBBox[0];
            const r = this._scaleX * relativeBBox[1];
            const t = this._scaleY * relativeBBox[2];
            const b = this._scaleY * relativeBBox[3];

            const x0 = (cos * l - sin * t);
            const y0 = (sin * l + cos * t);

            const x1 = (cos * r - sin * t);
            const y1 = (sin * r + cos * t);

            const x2 = (cos * l - sin * b);
            const y2 = (sin * l + cos * b);

            const x3 = (cos * r - sin * b);
            const y3 = (sin * r + cos * b);

            this.bbox = [
                this._x + Math.min(x0, x1, x2, x3),
                this._x + Math.max(x0, x1, x2, x3),
                this._y + Math.min(y0, y1, y2, y3),
                this._y + Math.max(y0, y1, y2, y3)
            ];
        }

        // Computing total surface to refresh
        bboxInterval[0] = Math.floor(Math.min(bboxInterval[0], this.bbox[0]));
        bboxInterval[1] =  Math.ceil(Math.max(bboxInterval[1], this.bbox[1]));
        bboxInterval[2] = Math.floor(Math.min(bboxInterval[2], this.bbox[2]));
        bboxInterval[3] =  Math.ceil(Math.max(bboxInterval[3], this.bbox[3]));

        if (areasToRefresh !== undefined) {
            areasToRefresh.push(bboxInterval);
        }
    };

    static PLACEHOLDER_TEXTURE : ElementHandle | null = null;
    static PLACEHOLDER_DIM = 32;

    static initTexture(renderer: WebGLRenderer) {
        let canvas = document.createElement('canvas');
        canvas.width  = Sprite.PLACEHOLDER_DIM;
        canvas.height = Sprite.PLACEHOLDER_DIM;

        let ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('Unable to get 2d context');
        }

        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, Sprite.PLACEHOLDER_DIM, Sprite.PLACEHOLDER_DIM);

        Sprite.PLACEHOLDER_TEXTURE = renderer.createTexture(canvas, null, 'nearest', 'permanent');
        return Sprite.PLACEHOLDER_TEXTURE;
    }

    // Methods that will be overridden by the animation manager
    public draw(_renderer: WebGLRenderer, _a:any) {
        /*if (window.isoEngine.debug) {
            this.renderer.drawImage(
                Sprite.PLACEHOLDER_TEXTURE || Sprite.initTexture(this.renderer),
                -Sprite.PLACEHOLDER_DIM / 2,
                -Sprite.PLACEHOLDER_DIM / 2,
                Sprite.PLACEHOLDER_DIM,
                Sprite.PLACEHOLDER_DIM
            );
        }*/
    };

    public generateCurrentFrameData() {
        return [
            -Sprite.PLACEHOLDER_DIM / 2,
            Sprite.PLACEHOLDER_DIM / 2,
            -Sprite.PLACEHOLDER_DIM / 2,
            Sprite.PLACEHOLDER_DIM / 2
        ];
    };

    public clear() { }
    public releaseBuffer() { };
}