import MapData from "../Assets/Maps/MapData.ts";

export default class MapRequest{
    public msg: any;
    public mapData: MapData;

    constructor(msg: any, mapData: MapData){
        this.msg = msg;
        this.mapData = mapData;
    }
}

