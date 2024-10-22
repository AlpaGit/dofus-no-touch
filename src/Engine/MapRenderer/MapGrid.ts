import Constants from '../../Common/Constants';
import GridData from "./GridData.ts";
import MapCoordinate from "./MapCoordinate.ts";
import Vector2D from "../../Common/Vectors/Vector2D.ts";
import ClosestCellData from "./ClosestCellData.ts";
import CellData from "./CellData.ts";
import MapPoint from "../../Common/MapPoint";

//var mapPoint = require('mapPoint');

const CELL_WIDTH  = Constants.CELL_WIDTH;
const CELL_HEIGHT = Constants.CELL_HEIGHT;

const HORIZONTAL_OFFSET = Constants.HORIZONTAL_OFFSET - CELL_WIDTH;
const VERTICAL_OFFSET = Constants.VERTICAL_OFFSET - CELL_HEIGHT / 2;

const FIRST_CELL_I = 19;
const FIRST_CELL_OFFSET = FIRST_CELL_I + 0.225;

const SQRT2 = Math.sqrt(2);
const SQRT2_OVER2 = SQRT2 / 2;
const CELL_WIDTH_SCALE  = SQRT2 / CELL_WIDTH;
const CELL_HEIGHT_SCALE = SQRT2 / CELL_HEIGHT;

const GRID_WIDTH  = 33;
const GRID_HEIGHT = 34;

const N_CELLS_PER_ROW  = 14;
const N_CELLS_PER_ROW2 = 2 * N_CELLS_PER_ROW;

export class MapGrid {
    grid: GridData[][] = [];
    scenePositions: {x :number, y: number}[] = [];
    useAltitude: boolean = false;
    cellList: CellData[] = [];

    getCoordinateGridFromCellId = function (cellId:number) : MapCoordinate {
        const row = cellId % N_CELLS_PER_ROW - ~~(cellId / N_CELLS_PER_ROW2);
        const i = row + FIRST_CELL_I;
        const j = row + ~~(cellId / N_CELLS_PER_ROW);

        return { i: i, j: j, dx: 0, dy: 0 };
    };

    /** @desc   Converts grid coordinate into cell id
     *
     * @param   {MapCoordinate} gridPos - Coordinate in the grid
     * @returns {number} cellId  - Corresponding cell id
     */
    getCoordinateCellIdFromGrid(gridPos: MapCoordinate) : number {
        return this.grid[gridPos.i][gridPos.j].cellId;
    };

    /** @desc   Converts scene coordinate into grid coordinate
     *
     * @param   {Vector2D} scenePos       - Scene coordinate
     * @returns {MapCoordinate} (i, j, dx, dy) - Corresponding coordinate (i, j) in the grid with offset (dx, dy)
     *                                    with respect to top left corner of the cell
     */
    getCoordinateGridFromScene(scenePos: Vector2D) : MapCoordinate {
        const x0 = (scenePos.x - HORIZONTAL_OFFSET) * CELL_WIDTH_SCALE;
        const y0 = (scenePos.y - VERTICAL_OFFSET)   * CELL_HEIGHT_SCALE;

        const x1 = SQRT2_OVER2 * x0 - SQRT2_OVER2 * y0 + FIRST_CELL_OFFSET;
        const y1 = SQRT2_OVER2 * x0 + SQRT2_OVER2 * y0;

        const i = Math.max(0, Math.min(GRID_WIDTH  - 1, ~~x1));
        const j = Math.max(0, Math.min(GRID_HEIGHT - 1, ~~y1));
        return { i: i, j: j, dx: x1 - i, dy: y1 - j };
    };

    /** @desc   Converts grid coordinate into scene coordinate
     *
     * @param   {MapCoordinate} gridPos - Grid coordinate
     * @returns {Vector2D} (x, y) - Corresponding coordinate (x, y) on the scene
     */
    getCoordinateSceneFromGrid(gridPos: MapCoordinate) : Vector2D {
        const i = gridPos.i - FIRST_CELL_OFFSET;
        const j = gridPos.j;
        return {
            x: (SQRT2_OVER2 * i + SQRT2_OVER2 * j) / CELL_WIDTH_SCALE + CELL_WIDTH / 2 + HORIZONTAL_OFFSET,
            y: (SQRT2_OVER2 * j - SQRT2_OVER2 * i) / CELL_HEIGHT_SCALE + VERTICAL_OFFSET
        };
    };

    /** @desc   Converts cell id into scene coordinate
     *
     * @param   {number} cellId - Cell id
     * @returns {Vector2D} (x, y) - Corresponding coordinate on the scene
     */
    getSceneCoordinateFromCellId(cellId: number) : Vector2D {
        return this.getCoordinateSceneFromGrid(this.getCoordinateGridFromCellId(cellId));
    };

    /** @desc   Get cells at given scene coordinate.
     *         If no cell at coordinate then returns closest cell with it's distance to the scene coordinate.
     *
     * @param   {Object} scenePos     - Scene coordinate
     * @returns {Object} (cell, dist) - Corresponding cell and its distance to scene coordinate
     */
    getCellAtSceneCoordinate(scenePos: Vector2D) {
        const gridPos = this.getCoordinateGridFromScene(scenePos);
        const gridData = this.grid[gridPos.i][gridPos.j];

        let cells = gridData.cells;
        if (cells.length === 0) {
            // No cell at given location, returning the closest one
            return this.getClosestCell(gridPos, scenePos);
        }

        let x = gridPos.dx;
        let y = gridPos.dy;
        let bounds = gridData.bounds;
        for (var c = 0, nBounds = bounds.length; c < nBounds; c += 1) {
            // iterating through bounds of cells in decreasing order of their z-index
            let bbox = bounds[c];
            if ((bbox[0] <= x) && (x <= bbox[1]) && (bbox[2] <= y) && (y <= bbox[3])) {
                return { cell: cells[c], dist: 0 };
            }
        }

        // No cell has been selected at given location
        // Returning the closest one
        return this.getClosestCell(gridPos, scenePos);
    };

    /**▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
     * @desc   Get closest cell to the given scene coordinate. Algorithm starts searching from given grid Position
     *
     * @param   {MapCoordinate} gridPos - Grid coordinate
     * @param   {Vector2D} scenePos - Scene coordinate
     * @returns {ClosestCellData} (cell, dist) - Closest cell to scene coordinate and its distance to scene coordinate
     */
     getClosestCell(gridPos: MapCoordinate, scenePos : Vector2D) : ClosestCellData {
        let i = gridPos.i;
        let j = gridPos.j;
        let x = scenePos.x;
        let y = scenePos.y;

        let k0, k1, l0, l1;
        let d = 0;
        let closestCellData: ClosestCellData  = {
            cell: -1,
            distance: Infinity
        };

        while (closestCellData.cell === -1) {
            l0 = Math.max(j - d, 0);
            l1 = Math.min(j + d, GRID_HEIGHT - 1);
            k1 = Math.min(i + d, GRID_WIDTH  - 1);
            for (k0 = Math.max(i - d, 0); k0 <= k1; k0 += 1) {
                updateMinDist(this.grid[k0][l0].cells, this.scenePositions, x, y, closestCellData);
                updateMinDist(this.grid[k0][l1].cells, this.scenePositions, x, y, closestCellData);
            }

            k0 = Math.max(i - d, 0);
            k1 = Math.min(i + d, GRID_WIDTH  - 1);
            l1 = Math.min(j + d - 1, GRID_HEIGHT - 1);
            for (l0 = Math.max(j - d + 1, 0); l0 <= l1; l0 += 1) {
                updateMinDist(this.grid[k0][l0].cells, this.scenePositions, x, y, closestCellData);
                updateMinDist(this.grid[k1][l0].cells, this.scenePositions, x, y, closestCellData);
            }
            d += 1;
        }

        return closestCellData;
    };

    /**
     * Look for closest cell in a zone after a tap.
     * NB: This is used in FIGHT only => cell's altitude is not handled here.
     *
     * @param   {number} cellId - Cell tapped
     * @param   {number} x - Scene coordinate X
     * @param   {number} y - Scene coordinate Y
     * @param   {Array} zone - array of cell IDs in the zone (the list of valid cells)
     * @returns {number|null} - Closest cell ID OR null if x,y is farther than 1 cell away from any cell in the zone
     */
    getNearbyCellInZone(cellId:number, x:number, y:number, zone:number[]) : number | null {
        if (zone[cellId] !== undefined) {
            return cellId;
        }

        let closestCell = null;
        let validNeighbours = [];
        let neighbours = MapPoint.getNeighbourCells(cellId, /*allowDiagonal=*/true)
        let i = 0;
        for (i = 0; i < neighbours.length; i++) {
            if (neighbours[i] !== undefined && zone[neighbours[i]] !== undefined) {
                validNeighbours.push(neighbours[i]);
            }
        }

        let minDist = Infinity;
        for (i = 0; i < validNeighbours.length; i++) {
            let cell = validNeighbours[i];
            let scenePos = this.scenePositions[cell];
            let dx = (scenePos.x - x) * CELL_WIDTH_SCALE;
            let dy = (scenePos.y - y) * CELL_HEIGHT_SCALE;
            let dist = dx * dx + dy * dy;
            if (dist < minDist) {
                minDist = dist;
                closestCell = cell;
            }
        }
        return closestCell; // will be null if validNeighbours is empty
    };

    updateCellState(cellId: number, cell: CellData, previousState: number) {
        const newState = cell.l;
        if ((newState & 1) === 0) {
            // Shouldn't be accessible
            if ((previousState & 1) !== 0) {
                // Is accessible
                // Making it inaccessible
                this._removeCell(cellId, cell);
            }
        } else {
            // Should be accessible
            if ((previousState & 1) === 0) {
                // Is inaccessible
                // Making it accessible
                this._addCell(cellId, cell);
            }
        }
    };

    _removeCell(cellId: number, cell: CellData) {
        delete this.scenePositions[cellId];

        const height = this.useAltitude && cell.f || 0;
        const gridPos = this.getCoordinateGridFromCellId(cellId);
        if (height === 0) {
            // Cell appears only in one slot in the grid
            removeCell(this.grid[gridPos.i][gridPos.j], cellId);
        } else {
            // Cell appears in up to 4 slots in the grid
            const ratio = height / CELL_HEIGHT;

            const i0 = Math.floor(gridPos.i + ratio);
            const j0 = Math.floor(gridPos.j - ratio);

            if (i0 >= GRID_WIDTH || j0 >= GRID_HEIGHT) {
                return;
            }

            const i1 = i0 + 1;
            const j1 = j0 + 1;

            if (i1 < 0 || j1 < 0) {
                return;
            }

            if (i0 >= 0) {
                if (j0 >= 0) { removeCell(this.grid[i0][j0], cellId); }
                if (j1 < GRID_HEIGHT) { removeCell(this.grid[i0][j1], cellId); }
            }

            if (i1 < GRID_WIDTH) {
                if (j0 >= 0) { removeCell(this.grid[i1][j0], cellId); }
                if (j1 < GRID_HEIGHT) { removeCell(this.grid[i1][j1], cellId); }
            }
        }
    };

    _addCell(cellId: number, cell: CellData) {
        /* jslint maxstatements: 60 */
        let gridData;

        const gridPos = this.getCoordinateGridFromCellId(cellId);
        this.grid[gridPos.i][gridPos.j].cellId = cellId;

        const height = this.useAltitude && cell.f || 0;
        const scenePos = this.getCoordinateSceneFromGrid(gridPos);
        scenePos.y -= height;
        this.scenePositions[cellId] = scenePos;
        if (height === 0) {
            gridData = this.grid[gridPos.i][gridPos.j];
            gridData.cells.push(cellId);
            gridData.bounds.push([0, 1, 0, 1]);
        } else {
            const ratio = height / CELL_HEIGHT;

            const x = gridPos.i + ratio;
            const y = gridPos.j - ratio;

            const i0 = Math.floor(x);
            const j0 = Math.floor(y);

            if (i0 >= GRID_WIDTH || j0 >= GRID_HEIGHT) {
                return;
            }

            const i1 = i0 + 1;
            const j1 = j0 + 1;

            if (i1 < 0 || j1 < 0) {
                return;
            }

            const dx = x - i0;
            const dy = y - j0;

            if (i0 >= 0) {
                if (j0 >= 0) {
                    gridData = this.grid[i0][j0];
                    gridData.cells.push(cellId);
                    gridData.bounds.push([dx, 1, dy, 1]);
                }

                if (j1 < GRID_HEIGHT) {
                    gridData = this.grid[i0][j1];
                    gridData.cells.push(cellId);
                    gridData.bounds.push([dx, 1, 0, dy]);
                }
            }

            if (i1 < GRID_WIDTH) {
                if (j0 >= 0) {
                    gridData = this.grid[i1][j0];
                    gridData.cells.push(cellId);
                    gridData.bounds.push([0, dx, dy, 1]);
                }

                if (j1 < GRID_HEIGHT) {
                    gridData = this.grid[i1][j1];
                    gridData.cells.push(cellId);
                    gridData.bounds.push([0, dx, 0, dy]);
                }
            }
        }
    };

    /**▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
     * @desc   Initializes grid with list of cells for a given cell id.
     * Each cell has a physical location on the scene with respect to the cells layout when its height is 0.
     * This algorithm computes which cells, considering their height, overlap with the physical location
     * of a cell of id 'cellId' of height 0 and store them in a grid.
     * This allows to quickly find cells at a given position (either using grid coordinates, scene coordinates or cell id).
     *
     * @param {Array} cellList - List of cells and their heights
     * @param {boolean} useAltitude - Should grid use cell altitude (grid is flatten during fight).
     */
    initialize(cellList: CellData[], useAltitude: boolean) {
        console.log('MapGrid.initialize');

        this.cellList = cellList;
        this.useAltitude = useAltitude;

        this.grid = [];
        this.scenePositions = [];
        for (let i = 0; i < GRID_WIDTH; i += 1) {
            const row  = new Array(GRID_HEIGHT);
            this.grid[i] = row;
            for (let j = 0; j < GRID_HEIGHT; j += 1) {
                row[j] = new GridData();
            }
        }

        console.log('MapGrid.initialize: Adding cells to grid', cellList.length);

        for (let cellId = cellList.length - 1; cellId >= 0; cellId -= 1) {
            const cell = cellList[cellId];
            if ((cell.l & 1) === 0) {
                // Ignoring unwalkable cells (bit 1 set to 0)
                continue;
            }

            this._addCell(cellId, cell);
        }
    };
}

/**▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
 * @desc   Update closestCellData with closest cell from point (x, y)
 *
 * @param   {Array} cells - All cells for a given grid position
 * @param   {Array} scenePositions - Scene coordinates per cell
 * @param   {Number} x - x component of the coordinate to get distance from
 * @param   {Number} y - y component of the coordinate to get distance from
 * @param   {ClosestCellData} closestCellData - Data to update with new closest cell info if new closest cell found
 */
export function updateMinDist(cells: number[], scenePositions: Vector2D[], x: number, y: number, closestCellData : ClosestCellData) {
    for (let c = 0; c < cells.length; c += 1) {
        let cellId = cells[c];
        let scenePos = scenePositions[cellId];
        let dx = (scenePos.x - x) * CELL_WIDTH_SCALE;
        let dy = (scenePos.y - y) * CELL_HEIGHT_SCALE;
        let dist = dx * dx + dy * dy;
        if (dist < closestCellData.distance) {
            closestCellData.distance = dist;
            closestCellData.cell = cellId;
        }
    }
}



export function removeCell(gridData:GridData, cellId:number) {
    const idx = gridData.cells.indexOf(cellId);
    if (idx !== -1) {
        gridData.cells.splice(idx, 1);
        gridData.bounds.splice(idx, 1);
    }
}

export default {
    MapGrid: MapGrid,
    removeCell,
    updateMinDist
};