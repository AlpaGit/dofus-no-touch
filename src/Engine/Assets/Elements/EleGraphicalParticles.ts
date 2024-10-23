import EleGraphicalNormal from "./EleGraphicalNormal.ts";
import BigEndianReader from "../Reader/BigEndianReader.ts";

export default class EleGraphicalParticles extends EleGraphicalNormal{
    public static fromRaw(raw: BigEndianReader, id: number): EleGraphicalParticles {
        let element = new EleGraphicalParticles(id);

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