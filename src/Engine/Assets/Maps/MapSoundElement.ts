import BigEndianReader from "../Reader/BigEndianReader.ts";

export default class MapSoundElement {
    public id: number = 0;
    public baseVolume: number = 0;
    public fullVolumeDistance: number = 0;
    public nullVolumeDistance: number = 0;
    public minDelayBetweenLoops: number = 0;
    public maxDelayBetweenLoops: number = 0;

    public static fromRaw(raw: BigEndianReader): MapSoundElement {
        let element = new MapSoundElement();

        element.id = raw.readInt();
        element.baseVolume = raw.readShort();
        element.fullVolumeDistance = raw.readInt();
        element.nullVolumeDistance = raw.readInt();
        element.minDelayBetweenLoops = raw.readShort();
        element.maxDelayBetweenLoops = raw.readShort();

        return element;
    }
}