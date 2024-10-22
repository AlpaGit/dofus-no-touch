import MapFixture from "./MapFixture.ts";
import MapLayer from "./MapLayer.ts";
import MapCellData from "./MapCellData.ts";
import Color from "../../../Common/Colors/Color.ts";
import BigEndianReader from "../Reader/BigEndianReader.ts";
import {Buffer} from "buffer";
// @ts-ignore
import pako from 'pako';

const DECRYPTION_KEY = "649ae451ca33ec53bbcbcc33becf15f4";

export default class MapData {
    public id: number;
    public version: number;
    public isEncrypted: boolean = false;
    public encryptionVersion: number = 0;
    public groundCRC: number = 0;
    public relativeId: number = 0;
    public mapType: number = 0;
    public subAreaId: number = 0;
    public topNeighbourId: number = 0;
    public bottomNeighbourId: number = 0;
    public leftNeighbourId: number = 0;
    public rightNeighbourId: number = 0;
    public shadowBonusOnEntities: number = 0;
    public backgroundColor: Color = new Color();
    public gridColor: Color = new Color();
    public zoomScale: number = 0;
    public zoomOffsetX: number = 0;
    public zoomOffsetY: number = 0;
    public tacticalModeTemplateId: number = 0;
    public backgroundFixtures: MapFixture[] = [];
    public foregroundFixtures: MapFixture[] = [];
    public unknown: number = 0;
    public layers: MapLayer[] = [];
    public cells: MapCellData[] = new Array(560);

    constructor(id: number, version: number) {
        this.id = id;
        this.version = version;
    }

    public static fromRawBuffer(buffer: Buffer): MapData {
        let reader = new BigEndianReader(buffer);
        let header = reader.readByte();

        if (header == 77) {
            return MapData.fromRaw(reader);
        }

        // it's zlib compressed
        reader.setPointer(0);
        const decompressed = pako.inflate(buffer);

        reader = new BigEndianReader(Buffer.from(decompressed));
        header = reader.readByte();

        if(header != 77) {
            throw new Error("Invalid header");
        }

        return MapData.fromRaw(reader);
    }

    public static fromRaw(reader: BigEndianReader): MapData{
        const version = reader.readByte();
        const id = reader.readUInt();

        let map = new MapData(id, version);

        if(version > 11){
            throw new Error("Unsupported version " + version);
        }

        if(version >= 7){
            map.isEncrypted = reader.readBoolean();
            map.encryptionVersion = reader.readByte();

            // this is probably the length of the encrypted data ? maybe not we ignore it
            reader.readInt();

            if(map.isEncrypted)
            {
                // we have to convert the key to bytes
                let keyBytes = Buffer.from(DECRYPTION_KEY, "utf8");
                let data = reader.getBuffer();

                for(let i = 0; i < data.length; i++){
                    data[i] ^= keyBytes[i % keyBytes.length];
                }

                reader = new BigEndianReader(data);
            }
        }

        map.relativeId = reader.readUInt();
        map.mapType = reader.readByte();

        if (map.mapType < 0 || map.mapType > 1)
        {
            throw new Error("Invalid decryption key");
        }

        map.subAreaId = reader.readInt();
        map.topNeighbourId = reader.readInt();
        map.bottomNeighbourId = reader.readInt();
        map.leftNeighbourId = reader.readInt();
        map.rightNeighbourId = reader.readInt();
        map.shadowBonusOnEntities = reader.readInt();

        map.backgroundColor = {r: 0, g: 0, b: 0, a: 255};
        map.gridColor = {r: 0, g: 0, b: 0, a: 255};
        if(version >= 9){
            map.backgroundColor = {
                a: reader.readByte(),
                r: reader.readByte(),
                g: reader.readByte(),
                b: reader.readByte()
            };
            map.gridColor = {
                a: reader.readByte(),
                r: reader.readByte(),
                g: reader.readByte(),
                b: reader.readByte(),
            };
        }
        else if(version >= 3){
            map.backgroundColor = {
                r: reader.readByte(),
                g: reader.readByte(),
                b: reader.readByte(),
                a: 255
            };
        }

        if(version >= 4){
            map.zoomScale = reader.readUShort();
            map.zoomOffsetX = reader.readShort();
            map.zoomOffsetY = reader.readShort();
        }

        if(version >= 10){
            map.tacticalModeTemplateId = reader.readInt();
        }

        // Deprecated without version
        // map.UseLowPassFilter = (int)reader.ReadByte() == 1;
        // map.UseReverb = (int)reader.ReadByte() == 1;
        // if (map.UseReverb)
        //     map.PresetId = reader.ReadInt();
        // map.PresetId = -1;

        map.backgroundFixtures = new Array(reader.readByte());
        for(let i = 0; i < map.backgroundFixtures.length; i++){
            map.backgroundFixtures[i] = MapFixture.fromRaw(reader);
        }

        map.foregroundFixtures = new Array(reader.readByte());
        for(let i = 0; i < map.foregroundFixtures.length; i++){
            map.foregroundFixtures[i] = MapFixture.fromRaw(reader);
        }

        map.unknown = reader.readInt();
        map.groundCRC = reader.readInt();
        map.layers = new Array(reader.readByte());

        for(let i = 0; i < map.layers.length; i++){
            map.layers[i] = MapLayer.fromRaw(reader, version);
        }

        for(let i = 0; i < 560; i++){
            map.cells[i] = MapCellData.fromRaw(i, reader, version);
        }

        return map;

    }
}
