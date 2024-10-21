export default class RenderTarget{
    public textureBinder: WebGLTexture;
    public frameBufferBinder: any;

    public width: number;
    public height: number;

    public matrixStack: number[][] = [[
        2,  0, -1, 0, // transform for position x
        0, -2,  1, 0, // transform for position y
        1,  1,  1, 1, // color multiplication
        0,  0,  0, 0  // color addition
    ]];

    public scissor: any | null = null;
    public texture : any | null = null;

    constructor(textureBinder:WebGLTexture, frameBufferBinder:any, width: number, height: number) {
        this.textureBinder = textureBinder;
        this.frameBufferBinder = frameBufferBinder;
        this.width = width;
        this.height = height;
    }
}