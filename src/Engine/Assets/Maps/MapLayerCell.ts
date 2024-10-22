import BigEndianReader from "../Reader/BigEndianReader.ts";
import MapGraphicalElement from "./MapGraphicalElement.ts";
import MapSoundElement from "./MapSoundElement.ts";

enum ElementTypesEnum
{
    Graphical = 2,
    Sound = 33,
}

export default class MapLayerCell{
    public id: number;
    public graphicalElements: MapGraphicalElement[] = [];
    public soundElements: MapSoundElement[] = [];

    constructor(id: number){
        this.id = id;
    }

    public static fromRaw(raw: BigEndianReader, version: number): MapLayerCell{
        let cell = new MapLayerCell(raw.readShort());

        const elementsCount = raw.readShort();

        for(let i = 0; i < elementsCount; i++) {
            let type = raw.readByte();
            let element: MapGraphicalElement | MapSoundElement;

            switch (type) {
                case ElementTypesEnum.Graphical:
                    element = MapGraphicalElement.fromRaw(raw, version);
                    cell.graphicalElements.push(element);
                    break;
                case ElementTypesEnum.Sound:
                    element = MapSoundElement.fromRaw(raw);
                    cell.soundElements.push(element);
                    break;
                default:
                    throw new Error(`Unknown element type ${type}`);
            }
        }

        return cell;
    }
}