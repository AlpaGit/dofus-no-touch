import WebGLRenderer from "./index.ts";

export class ProgramData {
    public program: Program;
    public data: any | null;

    constructor(program: Program, data: any | null) {
        this.program = program;
        this.data = data;
    }
}

export const TEXTURE_INDEXES : { [key: string]: number } = {
    "uTexture": 0,
    "uMask": 1
};

export class Program {
    public binder: any | undefined;
    public vertexShaderId: string;
    public fragmentShaderId: string;
    public uniformIds: string[];
    public attributeIds: string[];

    public uniforms: any;
    public attributes: any;

    public lastAttributeIndex: number;
    public vertexSize: number;

    public gl: WebGLRenderingContext;

    constructor(renderer: WebGLRenderer,
                vertexShaderId: string,
                fragmentShaderId: string,
                uniformIds: string[],
                attributeIds: string[])
    {
        this.binder = null;
        this.vertexShaderId   = vertexShaderId;
        this.fragmentShaderId = fragmentShaderId;

        this.uniformIds   = uniformIds;
        this.attributeIds = attributeIds;

        this.uniforms   = {};
        this.attributes = {};

        this.lastAttributeIndex = attributeIds.length - 1;

        this.vertexSize = renderer.vertexSize;
        this.gl = renderer.gl;
    }

    public setAttributes() {
        const floatSize = 4;
        const shortSize = 2;
        const byteSize  = 1;

        this.gl.vertexAttribPointer(this.attributes.aPosition, 2, this.gl.FLOAT, false, this.vertexSize, 0);
        // this.gl.vertexAttribPointer(this.attributes.aTexCoord, 2, this.gl.UNSIGNED_SHORT, true,  this.vertexSize, 2 * floatSize);
        this.gl.vertexAttribPointer(this.attributes.aColorMul, 4, this.gl.BYTE,  true,  this.vertexSize, 2 * floatSize + 2 * shortSize);
        this.gl.vertexAttribPointer(this.attributes.aColorAdd, 4, this.gl.BYTE,  true,  this.vertexSize, 2 * floatSize + 2 * shortSize + 4 * byteSize);
    };
}