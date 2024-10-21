export default class AtlasSprite{
    public color: number[] = [255, 255, 255, 255];
    public texture: any | null = null;
    public vertexPos: number[] = [];
    public textureCoord: number[] = [];

    public isMaskTag: boolean = false;
    public isMaskDef: boolean = false;
    public isMaskUse: boolean = false;
    public isMaskStop: boolean = false;
}