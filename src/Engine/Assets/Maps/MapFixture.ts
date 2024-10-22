import BigEndianReader from "../Reader/BigEndianReader.ts";

export default class MapFixture{
    public id: number;
    public offset: {x: number, y: number} = {x: 0, y: 0};
    public rotation: number = 0;
    public scale: {x: number, y: number} = {x: 1, y: 1};
    public hue:number = 0;
    public redMultiplier: number = 1;
    public greenMultiplier: number = 1;
    public blueMultiplier: number = 1;
    public alpha: number = 1;

    constructor(id: number){
        this.id = id;
    }

    static fromRaw(raw: BigEndianReader): MapFixture{
        let fixture = new MapFixture(raw.readInt());

        fixture.offset.x = raw.readShort();
        fixture.offset.y = raw.readShort();
        fixture.rotation = raw.readShort();
        fixture.scale.x = raw.readShort();
        fixture.scale.y = raw.readShort();
        fixture.redMultiplier = raw.readByte();
        fixture.greenMultiplier = raw.readByte();
        fixture.blueMultiplier = raw.readByte();
        fixture.alpha = raw.readByte();

        fixture.hue = fixture.redMultiplier | fixture.greenMultiplier | fixture.blueMultiplier;

        return fixture;
    }
}