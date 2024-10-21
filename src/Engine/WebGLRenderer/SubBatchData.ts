export default class SubBatchData{
    public startingByte: number;
    public nBytes: number;
    public drawMode = 0;
    public texture: any | null = null;

    constructor(startingByte: number, nBytes: number, drawMode: number, texture: any = null) {
        this.startingByte = startingByte;
        this.nBytes = nBytes;
        this.drawMode = drawMode;
        this.texture = texture;
    }
}