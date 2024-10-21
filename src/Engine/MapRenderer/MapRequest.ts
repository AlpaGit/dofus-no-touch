export default class MapRequest{
    public msg: any;
    public mapData: MapData;

    constructor(msg: any, mapData: MapData){
        this.msg = msg;
        this.mapData = mapData;
    }
}

export class MapData{
    public id: number;
    public cells: any[] = [];

    constructor(id: number){
        this.id = id;
    }
}