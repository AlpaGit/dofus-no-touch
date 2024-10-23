import EleGraphicalNormal from "./EleGraphicalNormal.ts";
import BigEndianReader from "../Reader/BigEndianReader.ts";

export default class EleGraphicalBlended extends EleGraphicalNormal{
    public blendMode: string = "";

    public static fromRaw(raw: BigEndianReader, id: number): EleGraphicalBlended {
        let element = new EleGraphicalBlended(id);

        element.gfx = raw.readInt();
        element.height = raw.readByte();
        element.horizontalSymmetry = raw.readBoolean();
        element.origin.x = raw.readShort();
        element.origin.y = raw.readShort();
        element.size.x = raw.readShort();
        element.size.y = raw.readShort();

        element.blendMode = raw.readBigUTF();

        return element;
    }
}