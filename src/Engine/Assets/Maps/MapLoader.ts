import MapData from "./MapData.ts";
import {Buffer} from "buffer";

const URL = "/assets/maps/";

export default class MapLoader {
    public static async loadMap(mapId: number) : Promise<MapData> {
        const res = await fetch(URL + mapId + ".dlm");
        const blob = await res.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return MapData.fromRawBuffer(buffer);
    }
}