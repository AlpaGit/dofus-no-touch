import Graphic, {GraphicParams} from "../../Engine/Graphic/Graphic.ts";
import Zone from "../../Engine/Zone";
import LineBatch from "../LineBatch";
import BoxBatch from "../BoxBatch";

const COLOR_TACTICAL_BACKGROUND = [0, 0, 0, 1];
const COLOR_TACTICAL_TILE       = [0.569, 0.522, 0.38, 1];
const COLOR_GRID_LINE           = [0.8, 0.8, 0.8, 0.8];

export class BackgroundParams extends GraphicParams{

}
/*
* @class Background
* @desc  map background and grid rendering
*/
export default class Background extends Graphic{
    public zones: Zone[] = [];
    public displayGrid: boolean = false;
    public tacticalMode: boolean = false;
    public isFightMode: boolean = false;

    public gridLines: LineBatch | null = null;
    public tacticalBoxes: BoxBatch | null = null;
    public gridAnimator: any = null;


    constructor(params:BackgroundParams) {
        super(params, params.scene.renderer.getEmptyTexture());


    }
}