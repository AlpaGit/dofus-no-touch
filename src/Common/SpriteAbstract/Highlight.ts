import SpriteAbstract from "./index.ts";

export default class Highlight{
    public sprite: SpriteAbstract;

    public _red: number = 1;
    public _green: number = 1;
    public _blue: number = 1;
    public _alpha: number = 1;

    public get red() {
        return this._red;
    }

    public set red(value: number) {
        this._red = value;

        let sprite = this.sprite;
        sprite.tint[0] = sprite.hue[0] * value;
        sprite.forceRefresh();
    }

    public get green() {
        return this._green;
    }

    public set green(value: number) {
        this._green = value;

        let sprite = this.sprite;
        sprite.tint[1] = sprite.hue[1] * value;
        sprite.forceRefresh();
    }

    public get blue() {
        return this._blue;
    }

    public set blue(value: number) {
        this._blue = value;

        let sprite = this.sprite;
        sprite.tint[2] = sprite.hue[2] * value;
        sprite.forceRefresh();
    }

    public get alpha() {
        return this._alpha;
    }

    public set alpha(value: number) {
        this._alpha = value;

        let sprite = this.sprite;
        sprite.tint[3] = sprite.hue[3] * value;
        sprite.forceRefresh();
    }

    constructor(sprite: SpriteAbstract) {
        this.sprite = sprite;
    }
}