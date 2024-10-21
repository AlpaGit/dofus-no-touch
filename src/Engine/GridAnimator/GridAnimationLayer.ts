import GridFeedbackOverlay from "./GridFeedbackOverlay.ts";
import CellInfo from "../../Common/Cell/CellInfo.ts";
import Delay from "../TINAlight/Delay.ts";
import SpriteBox from "../../Common/Sprite/SpriteBox.ts";
import {ListNode} from "../DoublyList";

export default class GridAnimationLayer{
    public cellInfos: { [key: number]: CellInfo };
    private _gridOverlay: GridFeedbackOverlay;
    public bbox: number[];
    public _listReference: ListNode | null;

    constructor(cellInfos: any, gridOverlay: GridFeedbackOverlay) {
        this.cellInfos = cellInfos;
        this._gridOverlay = gridOverlay;
        this.bbox = [Infinity, -Infinity, Infinity, -Infinity];
        this._listReference = null;
    }

    public playAnimation(cb: Function | undefined = undefined) {
        let maxDuration = -Infinity;

        let spriteBoxes = this._gridOverlay.spriteBoxes;
        let cellIds: number[] = Object.keys(this.cellInfos) as unknown as number[];
        for (let c = 0; c < cellIds.length; c++) {
            let cellId    = cellIds[c];
            let cellInfo  = this.cellInfos[cellId];
            let spriteBox = spriteBoxes[cellId];

            let transformState = cellInfo.transformState;
            if (spriteBox.transformState !== transformState) {
                // Using the distance to player to compute the animation delay
                let duration = spriteBox.animate(transformState, cellInfo.distanceToPlayer * 0.6);
                if (maxDuration < duration) {
                    maxDuration = duration;
                }

                this._expandToFitBox(spriteBox);
            }
        }

        if (cb) {
            if (maxDuration <= 0) {
                cb();
            } else {
                new Delay(maxDuration, cb).start();
            }
        }
    };

    private _expandToFitPoint(x: number, y: number) {
        if (this.bbox[0] > x) {
            this.bbox[0] = x;
        }

        if (this.bbox[2] > y) {
            this.bbox[2] = y;
        }

        if (this.bbox[1] < x) {
            this.bbox[1] = x;
        }

        if (this.bbox[3] < y) {
            this.bbox[3] = y;
        }
    };

    private _expandToFitBox(spriteBox: SpriteBox) {
        this._expandToFitPoint(spriteBox._x0, spriteBox._y0);
        this._expandToFitPoint(spriteBox._x1, spriteBox._y1);
        this._expandToFitPoint(spriteBox._x2, spriteBox._y2);
        this._expandToFitPoint(spriteBox._x3, spriteBox._y3);
    };

}