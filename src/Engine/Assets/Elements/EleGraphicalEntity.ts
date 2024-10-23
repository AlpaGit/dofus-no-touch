import BigEndianReader from "../Reader/BigEndianReader.ts";
import EleGraphical from "./EleGraphical.ts";

export default class EleGraphicalEntity extends EleGraphical{
    public entityLook: string = "";
    public horizontalSymmetry: boolean = false;
    public playAnimation: boolean = false;
    public playAnimStatic: boolean = false;
    public minDelay: number = 0;
    public maxDelay: number = 0;

    public static fromRawEntity(raw: BigEndianReader, id:number, version: number): EleGraphicalEntity {
        let element = new EleGraphicalEntity(id);

        element.entityLook = raw.readBigUTF();
        element.horizontalSymmetry = raw.readBoolean();

        if(version >= 7) {
            element.playAnimation = raw.readBoolean();
        }

        if(version >= 6){
            element.playAnimStatic = raw.readBoolean();
        }

        if(version < 5){
            return element;
        }

        element.minDelay = raw.readUInt();
        element.maxDelay = raw.readUInt();

        return element;
    }
}