import Constants from "../../Common/Constants";
import Vector2D from "../../Common/Vectors/Vector2D.ts";

const CELL_WIDTH  = Constants.CELL_WIDTH;
const CELL_HEIGHT = Constants.CELL_HEIGHT;

const HORIZONTAL_OFFSET = Constants.HORIZONTAL_OFFSET - CELL_WIDTH;
const VERTICAL_OFFSET = Constants.VERTICAL_OFFSET - CELL_HEIGHT / 2;

const FIRST_CELL_I = 19;
const FIRST_CELL_OFFSET = FIRST_CELL_I + 0.225;

const SQRT2 = Math.sqrt(2);
const SQRT2_OVER2 = SQRT2 / 2;
const CELL_WIDTH_SCALE = SQRT2 / CELL_WIDTH;
const CELL_HEIGHT_SCALE = SQRT2 / CELL_HEIGHT;

let mapPointToCellId: { [key: string]: number } = {};

/** Construct the map function from PathFinder matrix coordinate to Atouin cell id. */
function constructMapPoints() {
    for (let cellId = 0; cellId < 560; cellId++) {
        const coord = getMapPointFromCellId(cellId);
        mapPointToCellId[coord.x + '_' + coord.y] = cellId;
    }
}
constructMapPoints();
Object.freeze(mapPointToCellId);

/**
 * Converts grid coordinate into scene coordinate
 *
 * @param   {Vector2D} gridPos - Grid coordinate
 * @returns {Vector2D} (x, y) - Corresponding coordinate (x, y) on the screen
 */
export function getCoordinateSceneFromGrid(gridPos: Vector2D) : Vector2D {
    const i = gridPos.x - FIRST_CELL_OFFSET;
    const j = gridPos.y;
    return {
        x: (SQRT2_OVER2 * i + SQRT2_OVER2 * j) / CELL_WIDTH_SCALE + CELL_WIDTH / 2 + HORIZONTAL_OFFSET,
        y: (SQRT2_OVER2 * j - SQRT2_OVER2 * i) / CELL_HEIGHT_SCALE + VERTICAL_OFFSET
    };
}

/** Get map point coordinates from an atouin cell id.
 *
 * @param {number} cellId - Cell id
 */
export function getMapPointFromCellId(cellId:number): Vector2D {
    const row = cellId % 14 - ~~(cellId / 28);
    const x = row + 19;
    const y = row + ~~(cellId / 14);
    return { x: x, y: y };
}

/** Get cell id from map point
 *
 * @param {number} x - x coordinate in map space
 * @param {number} y - y coordinate in map space
 *
 * @return {number} cellId
 */
export function getCellIdFromMapPoint(x:number, y:number): number {
    return mapPointToCellId[x + '_' + y];
}

/** Get all neighbour of a cell
 *
 * @param {number}  cellId
 * @param {boolean} [allowDiagonal]
 *
 * @return {int[]} neighbour cells ids from middle right one, then clockwise.
 */
export function getNeighbourCells(cellId: number, allowDiagonal: boolean) {
    allowDiagonal = allowDiagonal || false;
    const coord = getMapPointFromCellId(cellId);
    const x = coord.x;
    const y = coord.y;
    let neighbours = [];

    if (allowDiagonal) {
        neighbours.push(getCellIdFromMapPoint(x + 1, y + 1));
    }
    neighbours.push(getCellIdFromMapPoint(x, y + 1));

    if (allowDiagonal) {
        neighbours.push(getCellIdFromMapPoint(x - 1, y + 1));
    }
    neighbours.push(getCellIdFromMapPoint(x - 1, y));

    if (allowDiagonal) {
        neighbours.push(getCellIdFromMapPoint(x - 1, y - 1));
    }
    neighbours.push(getCellIdFromMapPoint(x, y - 1));

    if (allowDiagonal) {
        neighbours.push(getCellIdFromMapPoint(x + 1, y - 1));
    }
    neighbours.push(getCellIdFromMapPoint(x + 1, y));
    return neighbours;
}

/** Get orientation from a source cell id to a target cell id
 *
 * @param {number}  source - source cell id. PRECONDITION source:[0..559]
 * @param {number}  target - target cell id. PRECONDITION target:[0..559] && source != target
 * @param {boolean} [allowDiagonal = false]
 *
 * @return {number} orientation, number in the range [0..7]
 */
export function getOrientation(source: number, target: number, allowDiagonal: boolean = false) {
    const sourcePos = getMapPointFromCellId(source);
    const targetPos = getMapPointFromCellId(target);

    let orientation;
    let angle = Math.atan2(sourcePos.y - targetPos.y, targetPos.x - sourcePos.x);

    if (allowDiagonal) {
        // normalize angle as an integer in range [0..16] and convert to direction
        angle = ~~(Math.floor(8 * angle / Math.PI) + 8);
        orientation = [3, 2, 2, 1, 1, 0, 0, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3][angle];
    } else {
        // normalize angle as an integer in range [0..8] and convert to direction
        angle = ~~(Math.floor(4 * angle / Math.PI) + 4);
        orientation = [3, 1, 1, 7, 7, 5, 5, 3, 3][angle];
    }

    return orientation;
}

/** Distance between cells, in Manhattan distance (number of cells)
 *
 * @param {Number}  source - source cell id.
 * @param {Number}  target - target cell id.
 */
export function getDistance(source:number, target:number) {
    const sourcePoint = getMapPointFromCellId(source);
    const targetPoint = getMapPointFromCellId(target);
    return Math.abs(sourcePoint.x - targetPoint.x) + Math.abs(sourcePoint.y - targetPoint.y);
}

export default {
    getCoordinateSceneFromGrid,
    getMapPointFromCellId,
    getCellIdFromMapPoint,
    getNeighbourCells,
    getOrientation,
    getDistance
}