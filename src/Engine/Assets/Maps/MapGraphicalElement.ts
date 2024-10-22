import BigEndianReader from "../Reader/BigEndianReader.ts";
import Color from "../../../Common/Colors/Color.ts";

const CellHalfWidth: number = 43;
const CellHalfHeight: number = 21.5;

export default class MapGraphicalElement {
    public id: number;
    public hue: Color = new Color();
    public shadow: Color = new Color();
    public offset: {x: number, y: number} = {x: 0, y: 0};
    public pixelOffset: {x: number, y: number} = {x: 0, y: 0};
    public altitude: number = 0;
    public identifier: number = 0;

    constructor(id: number) {
        this.id = id;
    }

    public static fromRaw(raw: BigEndianReader, version: number): MapGraphicalElement {
        let element = new MapGraphicalElement(raw.readUInt());

        element.hue.r = raw.readByte();
        element.hue.g = raw.readByte();
        element.hue.b = raw.readByte();

        element.shadow.r = raw.readByte();
        element.shadow.g = raw.readByte();
        element.shadow.b = raw.readByte();

        if(version <= 4){
            element.offset.x = raw.readByte();
            element.offset.y = raw.readByte();
            element.pixelOffset.x = element.offset.x * CellHalfWidth;
            element.pixelOffset.y = element.offset.y * CellHalfHeight;
        } else{
            element.pixelOffset.x = raw.readShort();
            element.pixelOffset.y = raw.readShort();
            element.offset.x = element.pixelOffset.x / CellHalfWidth;
            element.offset.y = element.pixelOffset.y / CellHalfHeight;
        }

        element.altitude = raw.readByte();
        element.identifier = raw.readInt();

        return element;
    }
}