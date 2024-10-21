import {TransformState} from "../TransformStates/index.js.ts";

/**
 * Holds all the information needed to animate a grid cell
 * @constructor
 * @param {number} cellId - the cell id of the target cell
 * @param {number} distanceToPlayer - the distance the target cell is from the player
 * @param {object} transformState - the final state that you want to animate to
 **/
export default class CellInfo {
    public cellId: number;
    public distanceToPlayer: number;
    public transformState: TransformState;

    constructor(cellId: number, distanceToPlayer: number, transformState: TransformState) {
        this.cellId = cellId;
        this.distanceToPlayer = distanceToPlayer;
        this.transformState = transformState;
    }
}