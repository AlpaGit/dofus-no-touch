import WebGLRenderer from "./index.ts";
import {Program} from "./Program.ts";

export default class TextureProgram extends Program {
    constructor(renderer: WebGLRenderer,
                vertexShaderId: string,
                fragmentShaderId: string,
                uniformIds: string[],
                attributeIds: string[]) {
        super(renderer, vertexShaderId, fragmentShaderId, uniformIds, attributeIds);
    }

   public override setAttributes() {
        const floatSize = 4;
        const shortSize = 2;
        const byteSize  = 1;

        this.gl.vertexAttribPointer(this.attributes.aPosition, 2, this.gl.FLOAT,          false, this.vertexSize, 0);
        this.gl.vertexAttribPointer(this.attributes.aTexCoord, 2, this.gl.UNSIGNED_SHORT, true,  this.vertexSize, 2 * floatSize);
        this.gl.vertexAttribPointer(this.attributes.aColorMul, 4, this.gl.BYTE,           true,  this.vertexSize, 2 * floatSize + 2 * shortSize);
        this.gl.vertexAttribPointer(this.attributes.aColorAdd, 4, this.gl.BYTE,           true,  this.vertexSize, 2 * floatSize + 2 * shortSize + 4 * byteSize);
    }
}