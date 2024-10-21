import Constants from "../../Common/Constants";
import Outline from "./Outline.ts";
import LineBatch from "../LineBatch";
import ColorHelper from "../ColorHelper";
import Atouin from "../Atouin";
import BoxBatch from "../BoxBatch";
import Engine from "../Engine.ts";

const GRID_ALTITUDE_OFFSET = Constants.GRID_ALTITUDE_OFFSET;
const CELL_WIDTH           = Constants.CELL_WIDTH;
const CELL_HEIGHT          = Constants.CELL_HEIGHT;
const CELL_HALF_WIDTH      = CELL_WIDTH / 2;
const CELL_HALF_HEIGHT     = CELL_HEIGHT / 2;

let NextZoneId = 1;

/** @class
 *
 * @param {number[]} cellIds         - cell ids of zone
 * @param {Object}   options         - options
 * @param {string}   options.color   - fill color
 * @param {string}   options.outline - outline color
 */
export default class Zone {
    public id: number | null = null;
    public outline: string | boolean;
    public color: string;
    public data: any;
    public gfx: any | null = null;
    private _boxBatch: any;
    private _lineBatch: LineBatch | null = null;

    constructor(cellIds: number[], options: { color: string, outline: string | boolean | null, data: any | undefined }) {
        this.id = null;
        this.outline = options.outline || false;
        this.color = options.color;
        this.data = options.data || null;
        this.gfx = null;
        this._boxBatch = null;
        this._lineBatch = null;

        // --- Empty Zone Check
        if (!this.outline && !this.color) {
            console.error('[Zone] It is not possible to create a zone without colors and outline');
            return;
        }

        // --- Generate Visuals
        if (this.outline) {
            let lines = Outline.getZoneOutlines(cellIds);
            this._lineBatch = new LineBatch({
                scene: Engine.isoEngine.mapScene,
                x: 0,
                y: 0,
                position: 5,
                lines: lines,
                lineWidth: 4,
                hue: ColorHelper.anyToColorArray(this.outline as string),
                layer: Constants.MAP_LAYER_BACKGROUND,
                id: 'zoneOutline' + NextZoneId++,
                sx: undefined,
                sy: undefined,
                alpha: undefined,
                rotation: undefined,
                isHudElement: false
            });
        }

        if (this.color) {
            let boxes = [];
            for (let i = 0; i < cellIds.length; i++) {
                let coord = Atouin.getCellCoords()[cellIds[i]];

                let altitude = GRID_ALTITUDE_OFFSET;

                let x = coord.x;
                let y = coord.y - altitude;

                boxes.push(
                    {
                        x0: x, y0: y,
                        x1: x + CELL_HALF_WIDTH, y1: y + CELL_HALF_HEIGHT,
                        x2: x, y2: y + CELL_HEIGHT,
                        x3: x - CELL_HALF_WIDTH, y3: y + CELL_HALF_HEIGHT
                    }
                );
            }

            this._boxBatch = new BoxBatch({
                scene: Engine.isoEngine.mapScene,
                x: 0,
                y: 0,
                position: 1,
                boxes: boxes,
                hue: ColorHelper.anyToColorArray(this.color),
                layer: Constants.MAP_LAYER_BACKGROUND,
                id: 'zoneColor' + NextZoneId++,
                sx: undefined,
                sy: undefined,
                alpha: undefined,
                rotation: undefined,
                isHudElement: false
            });
        }
    }

    public destroy() {
        if (this.gfx !== null) {
            this.gfx.remove();
        }
        if (this._lineBatch) {
            this._lineBatch.remove();
            this._lineBatch = null;
        }
        if (this._boxBatch) {
            this._boxBatch.remove();
            this._boxBatch = null;
        }
    };

}