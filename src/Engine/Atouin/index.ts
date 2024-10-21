//████████████████████████████████████████████████████████████████████████████████
//█████████████████████████████████▄ ████▄████████████████████▀███████████████████
//█▀▄▄▄▀ █▀▄▄▄▄▀█▀▄▄▄▄▀█▄ ▀▄▄▄█▀▄▄▄▀ ██▄▄ ███▄ ▀▄▄▀██▀▄▄▄▄▀██▄ ▄▄▄██▀▄▄▄▄▀█▀▄▄▄▄ █
//█ ██████ ████ █ ████ ██ █████ ████ ████ ████ ███ ██▀▄▄▄▄ ███ █████ ▄▄▄▄▄██▄▄▄▄▀█
//█▄▀▀▀▀▄█▄▀▀▀▀▄█▄▀▀▀▀▄█▀ ▀▀▀██▄▀▀▀▄ ▀█▀▀ ▀▀█▀ ▀█▀ ▀█▄▀▀▀▄ ▀██▄▀▀▀▄█▄▀▀▀▀▀█ ▀▀▀▀▄█
//████████████████████████████████████████████████████████████████████████████████

import Constants from "../../Common/Constants";
import Vector2D from "../../Common/Vectors/Vector2D.ts";

const CELL_WIDTH  = Constants.CELL_WIDTH;
const CELL_HEIGHT = Constants.CELL_HEIGHT;


export default class Atouin{
    public static coordinates: Vector2D[] = [];
    /**
     * getCellCoord - Get cell scene coordinates from id.
     *
     * @param {Number} cellId - Cell id, a number between 0 and 559
     * @return {Object} coordinates - Coordinates on scene { x: x, y: y }
     */
    public static getCellCoord(cellId: number) {
        let x = cellId % 14;
        let y = Math.floor(cellId / 14);
        x += (y % 2) * 0.5;

        return {
            x: x * CELL_WIDTH,
            y: y * 0.5 * CELL_HEIGHT
        };
    }

    /**
     * constructCellCoordMap - for better performances, we store all cells coordinates in memory
     *
     * @return {Array} coordinates
     */
    public static constructCellCoordMap() {
        for (let i = 0; i < 560; i += 1) {
            Atouin.coordinates.push(Atouin.getCellCoord(i));
        }
        Object.freeze(Atouin.coordinates);
        return Atouin.coordinates;
    }

    public static getCellCoords(){
        if(Atouin.coordinates.length === 0){
            Atouin.constructCellCoordMap();
        }

        return Atouin.coordinates;
    }
}