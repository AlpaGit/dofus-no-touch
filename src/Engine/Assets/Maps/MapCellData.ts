import BigEndianReader from "../Reader/BigEndianReader.ts";

export default class MapCellData {
    public id: number;

    public floor: number = 0;
    public mapChangeData: number = 0;
    public moveZone: number = 0;
    public speed: number = 0;
    public data: number = 3;

    public linkedZone: number = 0;
    public losMov: number = 0;

    // Could be computed
    public mov: boolean = false;
    public nonWalkableDuringFight: boolean = false;
    public nonWalkableDuringRP: boolean = false;
    public los: boolean = false;
    public red: boolean = false;
    public blue: boolean = false;
    public farmCell: boolean = false;
    public visible: boolean = false;
    public havenbagCell: boolean = false;

    public useTopArrow: boolean = false;
    public useBottomArrow: boolean = false;
    public useRightArrow: boolean = false;
    public useLeftArrow: boolean = false;

    public get hasLinkedCellZone(): boolean {
        return this.mov && !this.nonWalkableDuringFight && !this.farmCell && !this.havenbagCell;
    }

    public get hasLinkedCellRp(): boolean {
        return this.mov && !this.farmCell;
    }

    constructor(id: number) {
        this.id = id;
    }


    public static fromRaw(id: number, raw: BigEndianReader, version: number): MapCellData {
        let cell = new MapCellData(id);
        cell.floor = raw.readByte() / 10;

        if(cell.floor == -128){
            return cell;
        }

        if(version >= 5){
            if(version >= 9){
                const data = raw.readShort();
                cell.data = data;
                cell.mov = (data & 1) == 0;
                cell.nonWalkableDuringFight = (data & 2) != 0;
                cell.nonWalkableDuringRP = (data & 4) != 0;
                cell.los = (data & 8) == 0;
                cell.blue = (data & 16) != 0;
                cell.red = (data & 32) != 0;
                cell.visible = (data & 64) != 0;
                cell.farmCell = (data & 128) != 0;

                if(version >= 10){
                    cell.havenbagCell = (data & 256) != 0;
                    cell.useTopArrow = (data & 512) != 0;
                    cell.useBottomArrow = (data & 1024) != 0;
                    cell.useRightArrow = (data & 2048) != 0;
                    cell.useLeftArrow = (data & 4096) != 0;
                }
            }

            cell.speed = raw.readByte();
            cell.mapChangeData = raw.readByte();
            cell.moveZone = raw.readByte();

            if(version >= 10 && (cell.hasLinkedCellZone || cell.hasLinkedCellRp)){
                cell.linkedZone = raw.readByte();
            }
        }
        else {
            cell.losMov = raw.readByte();

            if(version <= 3){
                cell.los = ((cell.losMov & 2) >> 1) == 1;
                cell.nonWalkableDuringFight = ((cell.losMov & 3) >> 2) == 1;
                cell.mov = (cell.losMov & 1) == 1 && !cell.nonWalkableDuringFight;
                cell.red = ((cell.losMov & 4) >> 3) == 1;
                cell.blue = ((cell.losMov & 5) >> 4) == 1;
            }
            else{
                cell.mov = (cell.losMov & 1) == 1;
                cell.los = (cell.losMov & 2) >> 1 == 1;
                cell.nonWalkableDuringFight = (cell.losMov & 4) >> 2 == 1;
                cell.red = (cell.losMov & 8) >> 3 == 1;
                cell.blue = (cell.losMov & 16) >> 4 == 1;
                cell.farmCell = (cell.losMov & 32) >> 5 == 1;
                cell.visible = (cell.losMov & 64) >> 6 == 1;
                cell.havenbagCell = (cell.losMov & 128) >> 7 == 1;
            }

            cell.data = 0 |
                (cell.mov ? 0 : 1) |
                (cell.nonWalkableDuringFight ? 2 : 0) |
                (cell.nonWalkableDuringRP ? 4 : 0) |
                (cell.los ? 0 : 8) |
                (cell.blue ? 16 : 0) |
                (cell.red ? 32 : 0) |
                (cell.visible ? 64 : 0) |
                (cell.farmCell ? 128 : 0);
        }

        return cell;
    }
}