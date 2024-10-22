import Constants from "../../Common/Constants";
import MapPoint from "../../Common/MapPoint";
import Line from "../../Common/Line";

const GRID_ALTITUDE_OFFSET = Constants.GRID_ALTITUDE_OFFSET;
const CELL_WIDTH           = Constants.CELL_WIDTH;
const CELL_HEIGHT          = Constants.CELL_HEIGHT;
const POST_H_OFFSET        = 0.325;
const POST_V_OFFSET        = 1.338;
const FIRST_CELL_OFFSET    = 20.225;
const HORIZONTAL_OFFSET    = Constants.HORIZONTAL_OFFSET - CELL_WIDTH  / 2 - POST_H_OFFSET;
const VERTICAL_OFFSET      = Constants.VERTICAL_OFFSET   - CELL_HEIGHT / 2 - POST_V_OFFSET;
const SQRT2                = Math.sqrt(2);
const SQRT2_OVER2          = SQRT2 / 2;
const CELL_WIDTH_SCALE     = SQRT2 / CELL_WIDTH;
const CELL_HEIGHT_SCALE    = SQRT2 / CELL_HEIGHT;


export default class Outline{


    /** Return coordinates in Scene space form a point in mapPoint space.
     *
     * @param {number[]} coords - the two coordinates i, j of cell in mapPoint space
     */
    public static getCoordinateSceneFromGrid(coords: number[]) {
        let i = SQRT2_OVER2 * (coords[0] - FIRST_CELL_OFFSET);
        let j = SQRT2_OVER2 * coords[1];
        let x = (i + j) / CELL_WIDTH_SCALE + HORIZONTAL_OFFSET;
        let y = (j - i) / CELL_HEIGHT_SCALE + VERTICAL_OFFSET;
        x = ~~Math.round(x);
        y = ~~Math.round(y * 2) / 2 - GRID_ALTITUDE_OFFSET;
        return { x: x, y: y };
    }

    /** Add an edge in the polygon edge list.
     *  If edge id already exist, they cancel, since edge is inside the polygon.
     *
     * @param {string} edgeId - edge id
     * @param {Object} edges  - the current list of edges
     */
    public static addEdge(edgeId: string, edges: any) {
        if (edges[edgeId]) {
            delete edges[edgeId];
        } else {
            edges[edgeId] = true;
        }
    }

    /** Add the edges of a cell to the list of edges.
     *  An edge id is defined by the coordinate of bottom cell (horizontal) or right cell (vertical).
     *  Id is a string formated like: "x:y:H" or "x:y:V" where x and y are coordinate of cell.
     *
     * @param {number} cellId - cell id
     * @param {Object} edges  - the current list of edges
     */
    public static addCellEdges(cellId: number, edges: any) {
        let mp = MapPoint.getMapPointFromCellId(cellId);

        Outline.addEdge(mp.x + ':' + mp.y + ':H', edges); // top edge
        Outline.addEdge((mp.x + 1) + ':' + mp.y + ':V', edges); // right edge
        Outline.addEdge(mp.x + ':' + (mp.y + 1) + ':H', edges); // bottom edge
        Outline.addEdge(mp.x + ':' + mp.y + ':V', edges); // left edge
    }

    /** From a list of cell ids, return a list of lines that outline the zone covered by cells.
     *
     * @param {number[]} cells - list of cell ids
     * @return {Array[]} an array of lines
     */
    public static getZoneOutlines(cells: number[]) : Line[] {
        // get edges of all cells
        let edges = {};
        for (let c = 0; c < cells.length; c++) {
            Outline.addCellEdges(cells[c], edges);
        }

        let edges2: any[] = Object.keys(edges);

        // compute vertices coordinates
        let lines = [];
        for (let e = 0; e < edges2.length; e++) {
            let edge = edges2[e].split(':');
            edge[0] = ~~edge[0];
            edge[1] = ~~edge[1];

            let edgePoint1 = Outline.getCoordinateSceneFromGrid(edge);

            if (edge[2] === 'H') {
                edge[0] += 1;
            } else {
                edge[1] += 1;
            }

            let edgePoint2 = Outline.getCoordinateSceneFromGrid(edge);
            lines.push(new Line(edgePoint1.x, edgePoint1.y, edgePoint2.x, edgePoint2.y));
        }

        return lines;
    }
}