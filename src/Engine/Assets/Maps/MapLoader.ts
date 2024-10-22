import MapData from "./MapData.ts";
import {Buffer} from "buffer";

const URL = "/assets/maps/";

export default class MapLoader {
    public static loadMap(mapId: number, cb: Function) {
        fetch(URL + mapId + ".dlm")
            .then(response => response.blob())
            .then(blob => blob.arrayBuffer())
            .then(arrayBuffer => MapData.fromRawBuffer(Buffer.from(arrayBuffer)))
            .then(mapData => {
                cb(mapData);
                return mapData;
            });
    }
}