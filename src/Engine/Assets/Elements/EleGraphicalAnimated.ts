import EleGraphicalNormal from "./EleGraphicalNormal.ts";
import BigEndianReader from "../Reader/BigEndianReader.ts";

export default class EleGraphicalAnimated extends EleGraphicalNormal{
    public minDelay: number = 0;
    public maxDelay: number = 0;

    public static fromRawAnimated(raw: BigEndianReader, id: number, version: number): EleGraphicalAnimated {
        let element = new EleGraphicalAnimated(id);

        element.gfx = raw.readInt();
        element.height = raw.readByte();
        element.horizontalSymmetry = raw.readBoolean();
        element.origin.x = raw.readShort();
        element.origin.y = raw.readShort();
        element.size.x = raw.readShort();
        element.size.y = raw.readShort();

        if(version != 4){
            return element;
        }

        element.minDelay = raw.readUInt();
        element.maxDelay = raw.readUInt();

        return element;
    }
}