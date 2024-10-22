import {ElementHandle} from "../Cache3State/ElementHandle.ts";
import Sprite from "../../Common/Sprite";
import SpriteParams from "../../Common/SpriteAbstract/SpriteParams.ts";
import LineBatch from "../../Common/LineBatch";

export class GraphicParams extends SpriteParams {
    w: number | undefined ;
    h: number | undefined;
    g: number | undefined;
}

/** @class Graphic
 *
 * @param {Object} params  - properties of the graphic
 * @param {Object} texture - position of graphic in atlas image
 */
export default class Graphic extends Sprite {
    public w: number = 0;
    public h: number = 0;

    public texture: ElementHandle | null = null;
    public gridLines: LineBatch | null = null;


    constructor(params: GraphicParams, texture: ElementHandle | null)
    {
        super(params);

        this.w = params.w || 0;
        this.h = params.h || 0;

        this.texture = texture;
    }

    /** Render method of Sprite overridden for performance
     *
     */
    public override render() {
        this.renderer.save();

        // Applying tint
        this.renderer.multiplyColor(this.tint[0], this.tint[1], this.tint[2], this.tint[3]);

        // Applying transformation
        this.renderer.drawImage(this.texture, this._x, this._y, this.w * this._scaleX, this.h);
        this.renderer.restore();
    }

    public override generateCurrentFrameData() {
        return [0, this.w, 0, this.h];
    };

    public override clear(){
        if (this.texture) {
            this.texture.release();
            this.texture = null;
        } else {
            console.warn('[Background.clear] Clearing background although no texture was ever set');
        }
    };
}