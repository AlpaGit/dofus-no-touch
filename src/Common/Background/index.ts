import Zone from "../../Engine/Zone";
import LineBatch from "../LineBatch";
import BoxBatch from "../BoxBatch";
import Scene from "../Scene";
import GridAnimator from "../../Engine/GridAnimator";
import Graphic, {GraphicParams} from "../../Engine/Graphic";
import {ElementHandle} from "../../Engine/Cache3State/ElementHandle.ts";
import Tween from "../../Engine/TINAlight/Tween.ts";
import Engine from "../../Engine/Engine.ts";
import Constants from "../Constants";
import Atouin from "../../Engine/Atouin";
import Line from "../Line";
import Box from "../BoxBatch/Box.ts";
import CellIdOverlay from "./CellIdOverlay.ts";
import CellInfo from "../Cell/CellInfo.ts";
import GridAnimationLayer from "../../Engine/GridAnimator/GridAnimationLayer.ts";

const CELL_WIDTH           = Constants.CELL_WIDTH;
const CELL_HEIGHT          = Constants.CELL_HEIGHT;
const GRID_ALTITUDE_OFFSET = Constants.GRID_ALTITUDE_OFFSET;
const MAP_LAYER_BACKGROUND = Constants.MAP_LAYER_BACKGROUND;

const CELL_HALF_WIDTH      = CELL_WIDTH / 2;
const CELL_HALF_HEIGHT     = CELL_HEIGHT / 2;

const COLOR_TACTICAL_BACKGROUND = [0, 0, 0, 1];
const COLOR_TACTICAL_TILE       = [0.569, 0.522, 0.38, 1];
const COLOR_GRID_LINE           = [0.8, 0.8, 0.8, 0.8];

const TOUCH_OFFSET = 10;

export class BackgroundParams extends GraphicParams{
    public scene: Scene;

    constructor(id: string, scene: Scene){
        super(id, scene);

        this.scene = scene;
    }
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
    public tacticalBackground: BoxBatch | null = null;
    public gridAnimator: GridAnimator | null = null;
    public isDebugMode: boolean = true;

    public cellIdOverlay: CellIdOverlay | null = null;

    public targetIndicators: any[] = [];

    constructor(params:BackgroundParams) {
        super(params, params.scene.renderer.getEmptyTexture());

        this.zones   = [];

        this.displayGrid   = false;
        this.tacticalMode  = false;
        this.isFightMode   = false;

        this.gridLines     = null;
        this.tacticalBoxes = null;
        this.gridAnimator = null;
        this.isDebugMode = false;
    }

    /** Reset all data and clear canvas */
    public resetAndClear() {
        this.displayGrid = false;
        this.isFightMode = false;
    }

    public clea() {
        if (this.texture) {
            this.texture.release();
            this.texture = null;
        } else {
            console.warn('[Background.clear] Clearing background although no texture was ever set');
        }
    };

    /** Release map data. This function is called when user change map, before asset preloading */
    public releaseMap() {
        this.deleteAllZones();

        if (this.gridLines) {
            this.gridLines.remove();
            this.gridLines = null;
        }
    };

    /** Update map with new data
     *
     * @param {ElementHandle} bgTexture - reference to the texture handle of the background image
     */
    public updateMap(bgTexture: ElementHandle) {
        // Background graphic is kept and updated instead of being trashed, we need to reset this flag
        //   to be sure that Sprite.remove() will do his clearing job the next time the sprite removed.
        this._cleared = false;

        this.texture = bgTexture;
        this.show();
        if (!this.gridLines) { this.generateWalkableGrid(); }
    };

    public changeGameContext(isFightMode: boolean) {
        this.isFightMode = isFightMode;
        this.generateWalkableGrid();
    };

    /** Toggle grid display */
    public toggleGrid(visibility: boolean) {
        if (this.displayGrid === visibility) { return; }
        this.displayGrid = visibility;

        if (this.gridLines === null) { return; }

        if (visibility) {
            this.gridLines.show();
            new Tween(this.gridLines, ['alpha']).to({ alpha: 1.0 }, 20).start();
        } else {
            let self = this;
            new Tween(this.gridLines, ['alpha']).to({ alpha: 0.0 }, 15).start().onFinish(function () {
                if (self.gridLines) {
                    self.gridLines.hide();
                }
            });
        }
    };

    /** Toggle tactic mode */
    public toggleTacticMode(isTacticMode: boolean) {
        if (this.tacticalBoxes !== null && this.tacticalBackground !== null) {
            if (isTacticMode) {
                this.tacticalBoxes.show();
                this.tacticalBackground.show();
                this.hide();
            } else {
                this.tacticalBoxes.hide();
                this.tacticalBackground.hide();
                this.show();
            }
        }

        this.tacticalMode = isTacticMode;
    };

    public generateWalkableGrid() {
        if (!this.gridAnimator) {
            this.gridAnimator = new GridAnimator();
        }

        let mapRenderer = Engine.isoEngine.mapRenderer;
        if (!mapRenderer.map || !mapRenderer.map.cells) { return; }

        // Update line batch for grid lines
        let cells = mapRenderer.map.cells;
        let showAltitude = !this.isFightMode;

        let existingLines: { [key: string]: any} = {};

        let greyBoxes = [];
        let gridLines = [];
        for (let cellId = 0; cellId < Constants.NB_CELLS; cellId++) {
            let walkable = mapRenderer.isWalkable(cellId, this.isFightMode);
            if (!walkable) { continue; }

            let cell = cells[cellId];
            let coord = Atouin.getCellCoords()[cellId];

            let altitude = (showAltitude && cell.f || 0) + GRID_ALTITUDE_OFFSET;
            let x0 = coord.x;
            let x1 = x0 - CELL_HALF_WIDTH;
            let x2 = x0 + CELL_HALF_WIDTH;

            let y0 = coord.y - altitude;
            let y1 = y0 + CELL_HALF_HEIGHT;
            let y2 = y0 + CELL_HEIGHT;

            let lineId0 = x0 + '.' + y0 + '-' + x2 + '.' + y1;
            let lineId1 = x0 + '.' + y2 + '-' + x2 + '.' + y1;
            let lineId2 = x0 + '.' + y2 + '-' + x1 + '.' + y1;
            let lineId3 = x0 + '.' + y0 + '-' + x1 + '.' + y1;

            if (existingLines[lineId0] === undefined) {
                existingLines[lineId0] = true;
                gridLines.push(new Line(x0, y0, x2, y1));
            }

            if (existingLines[lineId1] === undefined) {
                existingLines[lineId1] = true;
                gridLines.push(new Line(x2, y1, x0, y2));
            }

            if (existingLines[lineId2] === undefined) {
                existingLines[lineId2] = true;
                gridLines.push(new Line(x0, y2, x1, y1));
            }

            if (existingLines[lineId3] === undefined) {
                existingLines[lineId3] = true;
                gridLines.push(new Line(x1, y1, x0, y0));
            }

            const box = new Box(x0, y0, x2, y1, x0, y2, x1, y1);
            // @ts-ignore
            box.cellId = cellId;

            greyBoxes.push(box);
        }

        if (this.gridLines) { this.gridLines.remove(); }
        if (this.tacticalBackground) { this.tacticalBackground.remove(); }
        if (this.tacticalBoxes) { this.tacticalBoxes.remove(); }

        this.gridLines = new LineBatch({
            scene: Engine.isoEngine.mapScene,
            x: 0,
            y: 0,
            position: 3,
            lines: gridLines,
            lineWidth: 2,
            hue: COLOR_GRID_LINE,
            layer: MAP_LAYER_BACKGROUND,
            id: 'combatGrid',
            alpha: undefined,
            sx: undefined,
            sy: undefined,
            rotation: undefined,
            isHudElement: false
        });

        this.gridLines.alpha = 0.0;

        if (!this.displayGrid) {
            this.gridLines.hide();
        } else {
            this.gridLines.show();
            new Tween(this.gridLines, ['alpha']).to({ alpha: 1.0 }, 20).start();
        }

        this.tacticalBackground = new BoxBatch({
            scene: Engine.isoEngine.mapScene,
            x: 0,
            y: 0,
            position: -4,
            boxes: [
                new Box(
                    -CELL_WIDTH, -CELL_HEIGHT,
                    -CELL_WIDTH, this.h,
                    this.w,      this.h,
                    this.w,      -CELL_HEIGHT
                )
            ],
            hue: COLOR_TACTICAL_BACKGROUND,
            layer: MAP_LAYER_BACKGROUND,
            id: 'tacticalBackground',
            alpha: undefined,
            sx: undefined,
            sy: undefined,
            rotation: undefined,
            isHudElement: false
        });

        this.tacticalBoxes = new BoxBatch({
            scene: Engine.isoEngine.mapScene,
            x: 0,
            y: 0,
            position: -3,
            boxes: greyBoxes,
            hue: COLOR_TACTICAL_TILE,
            layer: MAP_LAYER_BACKGROUND,
            id: 'tacticalBoxes',
            alpha: undefined,
            sx: undefined,
            sy: undefined,
            rotation: undefined,
            isHudElement: false
        });

        if (!this.tacticalMode) {
            this.tacticalBoxes.hide();
            this.tacticalBackground.hide();
        }

        if (this.isDebugMode) {
            this.initDebugOverlay();
            this.cellIdOverlay!.clear();
            this.cellIdOverlay!.generateOverlay();
        }
    };

    public setGridColor(color: number[]) {
        this.gridLines!.hue = color;
    };

    public initDebugOverlay() {
        if (!this.cellIdOverlay) {
            let cellIdOverlayParams = {
                scene: this.scene,
                layer: Constants.MAP_LAYER_FOREGROUND,
                position: 1,
                x: -Constants.HORIZONTAL_OFFSET,
                y: -Constants.VERTICAL_OFFSET,
                w: Constants.MAP_SCENE_WIDTH,
                h: Constants.MAP_SCENE_HEIGHT,
                id: 'cellIdOverlay',
                alpha: undefined,
                sx: undefined,
                sy: undefined,
                rotation: undefined,
                isHudElement: false,
                hue: undefined
            };
            this.cellIdOverlay = new CellIdOverlay(cellIdOverlayParams);
        }
    };


    /**
     * @param {string} fillStyle - overRide default fillStyle, ex: 'blue'
     */
    public toggleDebugMode(fillStyle: string | null = null) {
        this.isDebugMode = !this.isDebugMode;
        this.initDebugOverlay();
        if (this.isDebugMode) {
            this.cellIdOverlay!.generateOverlay(fillStyle);
        } else {
            this.cellIdOverlay!.clear();
        }
    };

    /**
     * @param {array} cells - list of cellids
     * @param {string} color - color to change cells
     */
    public highlightDebugCells(cells: number[], color: string) {
        if (this.isDebugMode && this.cellIdOverlay) {
            this.cellIdOverlay.colorCells(cells, color);
        }
    };

    //████████████████████████████████████
    //████████████████████████████████████
    //█░▄▄░▄█▀▄▄▄▄▀█▄░▀▄▄▀██▀▄▄▄▄▀█▀▄▄▄▄░█
    //██▀▄███░████░██░███░██░▄▄▄▄▄██▄▄▄▄▀█
    //█░▀▀▀░█▄▀▀▀▀▄█▀░▀█▀░▀█▄▀▀▀▀▀█░▀▀▀▀▄█
    //████████████████████████████████████

    /** Delete all zones */
    public deleteAllZones() {
        for (let i = 0; i < this.zones.length; i++) {
            this.zones[i].destroy();
        }
        this.zones = [];
    };

    /** Add a new zone in the list
     *
     * @param {Zone} zone - zone object to add
     * @param id
     */
    public addZone(zone: Zone, id: number | string) {
        this.zones.push(zone);
        zone.id = id;
    };

    /** Remove a zone from the list
     *
     * @param {Zone} zone - zone object to remove
     */
    public deleteZone(zone: Zone) {
        zone.destroy();
        let index = this.zones.indexOf(zone);
        if (index === -1) { return console.warn('Removing a non existing zone'); }
        this.zones.splice(index, 1);
    };

    /** Remove zones by its id
     *
     * @param {number|string} id - zone id
     * @param {Function}  [onDelete] - optional function called before each zone is removed
     */
    public deleteZoneById(id: number | string, onDelete : Function) {
        let i = 0;
        while (i < this.zones.length) {
            if (this.zones[i].id === id) {
                if (onDelete) { onDelete(this.zones[i]); }
                this.zones[i].destroy();
                this.zones.splice(i, 1);
            } else {
                i++;
            }
        }
    };

    /** Get data of a zone by its id
     *
     * @param {number|string} id - zone id
     */
    public getDataOfZoneId(id: number|string) {
        for (let i = 0; i < this.zones.length; i++) {
            if (this.zones[i].id === id) {
                return this.zones[i].data;
            }
        }
        return null;
    };

    public colorCurrentDragCell(x: number, y: number, slot: any) {
        if (!slot.data) {
            return;
        }
        // offset x and y for more friendly drag, maybe it is better to offset in canvas coords...

        // TODO: After Foreground implementation
        const canvasCoord = Engine.foreground.convertScreenToCanvasCoordinate(x, y - TOUCH_OFFSET);
        const sceneCoord = Engine.isoEngine.mapScene.convertCanvasToSceneCoordinate(canvasCoord.x, canvasCoord.y);
        const cellObj = Engine.isoEngine.mapRenderer.getCellId(sceneCoord.x, sceneCoord.y);
        const cellId = cellObj.cell;
        Engine.isoEngine.cellHover(cellId, slot.data.id);
    };

    public dragCellRelease(x: number, y: number, slot: any) {
        if (this.isFightMode) {
            if (!slot.data) {
                return;
            }
            let cellObj = Background.screenToSceneCellId(x, y - TOUCH_OFFSET);
            Engine.isoEngine.cellHoverRelease(cellObj.cell);
        }
    };

    public addGridAnimation(cellInfos: CellInfo[]) {
        return this.gridAnimator!.addGridAnimation(cellInfos);
    };

    public removeGridLayer(layer: GridAnimationLayer) {
        if (this.gridAnimator) {
            this.gridAnimator.removeGridLayer(layer);
        } else {
            this.gridAnimator = new GridAnimator();
        }
    };

    public static screenToSceneCellId(x: number, y: number) {
        let canvasCoord = Engine.foreground.convertScreenToCanvasCoordinate(x, y);
        let sceneCoord = Engine.isoEngine.mapScene.convertCanvasToSceneCoordinate(canvasCoord.x, canvasCoord.y);
        return Engine.isoEngine.mapRenderer.getCellId(sceneCoord.x, sceneCoord.y);
    }

}