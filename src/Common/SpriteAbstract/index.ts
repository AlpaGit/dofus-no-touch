import Highlight from "./Highlight.ts";
import SpriteParams from "./SpriteParams.ts";


export default abstract class SpriteAbstract {
    public id: string;
    public bbox: number[];
    public tint: number[];
    public isOutdated: boolean;
    public isDisplayed: boolean;

    private _position: number;
    private _highlight: Highlight;
    private _hue: number[];
    private _alpha: number;

    protected constructor(params:SpriteParams) {
        this.id = params.id;
        this._position = params.position || 0;
        this.bbox = [Infinity, -Infinity, Infinity, -Infinity];

        this._highlight = new Highlight(this); // highlight tint of the sprite

        this._hue = params.hue || [1, 1, 1, 1]; // default tint of the sprite
        this.tint = this.hue.slice(); // final tint of the sprite (hue * highlight)

        this._alpha = 1;
        this.alpha = params.alpha === undefined ? 1 : params.alpha;

        this.isOutdated = false;
        this.isDisplayed = false;
    }

    public get position() {
        return this._position;
    }

    public set position(position: number) {
        if (position !== this._position) {
            this._position = position;
            if (this.isDisplayed) { this._show(); } // TODO: remove this hack
            this.forceRefresh();
        }
    }

    public get hue() {
        return this._hue;
    }

    public set hue(hue: number[]) {
        if(this._hue !== hue) {
            this._hue = hue;
            this.tint[0] = hue[0] * this._highlight.red;
            this.tint[1] = hue[1] * this._highlight.green;
            this.tint[2] = hue[2] * this._highlight.blue;
            this.tint[3] = hue[3] * this._highlight.alpha;

            if(this.isDisplayed) { this._show(); }
            this.forceRefresh();
        }
    }

    public get highlight() {
        return this._highlight;
    }

    public set highlight(highlight: Highlight) {
        this.setHighlight(highlight);
    }

    public get alpha() {
        return this._alpha;
    }

    public set alpha(alpha: number) {
        if(this._alpha !== alpha) {
            this._alpha = alpha;
            this.tint[3] = this.hue[3] * this._highlight.alpha;

            if(this.isDisplayed) { this._show(); }
            this.forceRefresh();
        }
    }



    public setHighlight(highlight: Highlight | null) {
        if(highlight === null){
            this.removeHighlight();
            return;
        }

        this._highlight._red   = highlight.red;
        this._highlight._green = highlight.green;
        this._highlight._blue  = highlight.blue;
        this._highlight._alpha = highlight.alpha;

        this.tint[0] = this.hue[0] * highlight.red;
        this.tint[1] = this.hue[1] * highlight.green;
        this.tint[2] = this.hue[2] * highlight.blue;
        this.tint[3] = this.hue[3] * highlight.alpha * this._alpha;

        this.forceRefresh();
    }

    public removeHighlight() {
        this.tint[0] = this.hue[0];
        this.tint[1] = this.hue[1];
        this.tint[2] = this.hue[2];
        this.tint[3] = this.hue[3] * this._alpha;

        this.forceRefresh();
    };

    public forceRefresh() { }

    protected _show() { }
}