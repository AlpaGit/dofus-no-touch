import BigEndianReader from "../Reader/BigEndianReader.ts";
import EleGraphical from "./EleGraphical.ts";

export default class EleGraphicalNormal extends EleGraphical{
    public gfx: number = 0;
    public height: number = 0;
    public horizontalSymmetry: boolean = false;
    public origin: { x: number, y: number } = { x: 0, y: 0 };
    public size: { x: number, y: number } = { x: 0, y: 0 };

    public static fromRaw(raw: BigEndianReader, id: number): EleGraphicalNormal {
        let element = new EleGraphicalNormal(id);

        element.gfx = raw.readInt();
        element.height = raw.readByte();
        element.horizontalSymmetry = raw.readBoolean();
        element.origin.x = raw.readShort();
        element.origin.y = raw.readShort();
        element.size.x = raw.readShort();
        element.size.y = raw.readShort();

        return element;
    }
}