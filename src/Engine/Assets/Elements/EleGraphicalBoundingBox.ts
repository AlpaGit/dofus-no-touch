import BigEndianReader from "../Reader/BigEndianReader.ts";
import EleGraphicalNormal from "./EleGraphicalNormal.ts";

export default class EleGraphicalBoundingBox extends EleGraphicalNormal{
    public static fromRaw(raw: BigEndianReader, id: number): EleGraphicalBoundingBox {
        let element = new EleGraphicalBoundingBox(id);

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