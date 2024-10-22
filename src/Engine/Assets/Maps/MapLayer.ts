import BigEndianReader from "../Reader/BigEndianReader.ts";
import MapLayerCell from "./MapLayerCell.ts";

export default class MapLayer{
    public id: number;
    public cells: MapLayerCell[] = [];
    constructor(id: number){
        this.id = id;
    }

    public static fromRaw(raw: BigEndianReader, version: number): MapLayer{
        let layer = new MapLayer(version >= 9 ? raw.readByte() : raw.readInt());

        const cellsCount = raw.readShort();
        layer.cells = new Array(cellsCount);

        for(let i = 0; i < cellsCount; i++){
            layer.cells[i] = MapLayerCell.fromRaw(raw, version);
        }

        return layer;
    }
}