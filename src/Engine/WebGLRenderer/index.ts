import Color from "../../Common/Colors/Color.ts";
import {Program, ProgramData, TEXTURE_INDEXES} from "./Program.ts";
import TextureProgram from "./TextureProgram.ts";
import RenderTarget from "./RenderTarget.ts";

import fragmentBox from './Shaders/fragmentBox.glsl?raw'
import fragmentColorSplit from './Shaders/fragmentColorSplit.glsl?raw'
import fragmentEnteringFight from './Shaders/fragmentEnteringFight.glsl?raw'
import fragmentFiltering from './Shaders/fragmentFiltering.glsl?raw'
import fragmentLine from './Shaders/fragmentLine.glsl?raw'
import fragmentMapTransition from './Shaders/fragmentMapTransition.glsl?raw'
import fragmentMask from './Shaders/fragmentMask.glsl?raw'
import fragmentOutline from './Shaders/fragmentOutline.glsl?raw'
import fragmentPixelArt from './Shaders/fragmentPixelArt.glsl?raw'
import fragmentRegular from './Shaders/fragmentRegular.glsl?raw'
import vertexAbsoluteScale from './Shaders/vertexAbsoluteScale.glsl?raw'
import vertexLine from './Shaders/vertexLine.glsl?raw'
import vertexBox from './Shaders/vertexBox.glsl?raw'
import vertexMask from './Shaders/vertexMask.glsl?raw'
import vertexOutline from './Shaders/vertexOutline.glsl?raw'
import vertexRegular from './Shaders/vertexRegular.glsl?raw'
import vertexRelativeScale from './Shaders/vertexRelativeScale.glsl?raw'
import Constants from "../../Common/Constants";
import SuperFastMemoryPartitioner from "../SuperFastMemoryPartitioner";
import Cache3State from "../Cache3State";
import {ElementHandle} from "../Cache3State/ElementHandle.ts";
import SubBatchData from "./SubBatchData.ts";
import BatchData from "./BatchData.ts";
import AtlasSprite from "../../Common/AtlasAnimationTemplate/AtlasSprite.ts";

export default class WebGLRenderer {
    public canvas: HTMLCanvasElement;
    public gl: WebGLRenderingContext;
    public maskQuality: number;
    public textureCache: Cache3State;
    public emptyTexture: ElementHandle;

    private _height: number;
    private _width: number;

    private _drawModes: {[key: string]: number};
    private _renderTarget: RenderTarget;
    private readonly _renderTargetStack: RenderTarget[];
    private _matrixStack: number[][];
    private readonly _maxTextureSize: number;

    private readonly _vertexSize: number;
    private readonly _spriteSize: number;
    private readonly _lineSize: number;
    private readonly _boxSize: number;

    private _currentProgram: Program;
    private readonly _shaders: {[key: string]: WebGLShader};
    private readonly prerenderRatio: number;

    private readonly _programLine: Program;
    private readonly _programBox: Program;
    private readonly _programMask: TextureProgram;
    private readonly _programAbsoluteScale: TextureProgram;
    public _programPixelArt: TextureProgram;
    public _programFiltering: TextureProgram;
    public _programMapTransition: TextureProgram;
    public readonly _programRegular: TextureProgram;

    private readonly _programs: ProgramData[] = [];


    private static _isWebGlSupported: boolean | null = null;
    private sfmPartitioner: SuperFastMemoryPartitioner;

    public get vertexSize() {
        return this._vertexSize;
    }

    constructor(canvas: HTMLCanvasElement,
                width: number,
                height: number,
                maxSpritesInMemory: number,
                maxTextureMemory: number,
                prerenderRatio:number,
                transparent: boolean) {
        this.canvas = canvas;

        // Get A WebGL context
        this.gl = WebGLRenderer.getWebGlContext(this.canvas, transparent);
        this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.enable(this.gl.BLEND);
        this.gl.activeTexture(this.gl.TEXTURE0);

        this.resetClearColor();

        // Generating size attributes
        const floatSize = 4;
        const shortSize = 2;
        const byteSize  = 1;

        const nbPosComponents = 2;
        const nbTexComponents = 2;
        const nbColComponents = 8;

        this._vertexSize = floatSize * nbPosComponents + shortSize * nbTexComponents + byteSize * nbColComponents;
        this._spriteSize = 6 * this._vertexSize;
        this._lineSize   = 2 * this._vertexSize;
        this._boxSize    = 6 * this._vertexSize;

        // Object holding every built shaders
        this._shaders = {};

        const uniformsLine        = ['uMatrix'];
        const uniformsBox         = ['uMatrix'];
        const uniformsRegular     = ['uMatrix', 'uTexture'];
        const uniformsDeformation = ['uMatrix', 'uTexture', 'uRatio'];
        const uniformsMask        = ['uMatrix', 'uTexture', 'uMask', 'uBbox'];

        const attributes = ['aPosition', 'aColorMul', 'aColorAdd'];
        this._programLine = new Program(this, 'vertexLine', 'fragmentLine', uniformsLine, attributes);
        this._programBox  = new Program(this, 'vertexBox',  'fragmentBox',  uniformsBox,  attributes);

        const attributesTexture = ['aPosition', 'aTexCoord', 'aColorMul', 'aColorAdd'];
        this._programMask          = new TextureProgram(this, 'vertexMask',          'fragmentMask',          uniformsMask,        attributesTexture);
        this._programAbsoluteScale = new TextureProgram(this, 'vertexAbsoluteScale', 'fragmentRegular',       uniformsRegular,     attributesTexture);
        this._programPixelArt      = new TextureProgram(this, 'vertexRegular',       'fragmentPixelArt',      uniformsDeformation, attributesTexture);
        this._programFiltering     = new TextureProgram(this, 'vertexRegular',       'fragmentFiltering',     uniformsDeformation, attributesTexture);
        this._programMapTransition = new TextureProgram(this, 'vertexRegular',       'fragmentMapTransition', uniformsDeformation, attributesTexture);
        this._programRegular       = new TextureProgram(this, 'vertexRegular',       'fragmentRegular',       uniformsRegular,     attributesTexture);

        // Unused programs
        // this._programRelativeScale = new TextureProgram(this, 'vertexRelativeScale', 'fragmentRegular',       uniformsRegular,     attributesTexture);
        // this._programOutline       = new TextureProgram(this, 'vertexOutline',       'fragmentOutline',       uniformsRegular,     attributesTexture);
        // this._programColorSplit    = new TextureProgram(this, 'vertexRegular',       'fragmentColorSplit',    uniformsRegular,     attributesTexture);
        // this._programEnteringFight = new TextureProgram(this, 'vertexRegular',       'fragmentEnteringFight', uniformsDeformation, attributesTexture);

        this._currentProgram = new Program(this, '', '', [], []);

        // Allocating vertex buffer memory
        this.initBuffer(maxSpritesInMemory);

        this.sfmPartitioner = new SuperFastMemoryPartitioner(this._spriteSize, maxSpritesInMemory * this._spriteSize);

        let gl = this.gl;
        function deleteTexture(textureData: any) {
            // Removing texture from GPU Memory
            gl.deleteTexture(textureData.binder);
        }

        this.textureCache = new Cache3State(maxTextureMemory, deleteTexture);
        // Allocating vertex buffer memory

        this._programs = [];
        this.useProgram(this._programRegular);

        // Additional properties to handle several render targets
        // Could also be used for blendings and filters
        const defaultBuffer = this.gl.getParameter(this.gl.FRAMEBUFFER_BINDING);
        this._renderTarget = this._createRenderTarget(null, defaultBuffer, 1, 1);
        this._renderTargetStack = [this._renderTarget];

        this._matrixStack = this._renderTarget.matrixStack;

        // Setting dimension of the viewport
        this._width  = 1;
        this._height = 1;
        this.resetDimension(width || 0, height || 0);

        this._maxTextureSize = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);

        this.prerenderRatio = prerenderRatio;
        this.maskQuality    = 0.5; // Masks rendering quality reduced for performance reasons

        this._drawModes = {
            lines:     this.gl.LINES,
            triangles: this.gl.TRIANGLES
        };

        // Generating empty texture
        this.emptyTexture = this.createTexture(Constants.EMPTY_IMAGE, 'empty_texture', 'linear', 'permanent');
    }

    public resetClearColor() {
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
    };

    public setClearColor(color: Color) {
        this.gl.clearColor(color.r, color.g, color.b, color.a);
    };

    private _getShader(shaderId: string): WebGLShader {
        if (this._shaders[shaderId]) {
            return this._shaders[shaderId];
        }

        let gl = this.gl;
        let shaderData = WebGLRenderer.shadersData[shaderId];
        console.log(WebGLRenderer.shadersData, shaderId);
        let shader;
        if (shaderData.type === 'fragment') {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderData.type === 'vertex') {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            throw new Error('Unknown shader type');
        }

        if(shader === null) {
            throw new Error('Could not create shader');
        }

        gl.shaderSource(shader, shaderData.script);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader) || 'Unknown error compiling shader');
        }

        this._shaders[shaderId] = shader;
        return shader;
    };

    private _buildProgram(program: Program) {
        let gl = this.gl;

        // Creating the program
        let programBinder = gl.createProgram();

        if(programBinder === null) {
            return;
        }

        gl.attachShader(programBinder, this._getShader(program.vertexShaderId));
        gl.attachShader(programBinder, this._getShader(program.fragmentShaderId));
        gl.linkProgram(programBinder);

        // Check the link status
        if (!gl.getProgramParameter(programBinder, gl.LINK_STATUS)) {
            // Something went wrong with the link
            let error = gl.getProgramInfoLog(programBinder);
            gl.deleteProgram(programBinder);
            throw new Error('Error linking the program:' + error);
        }

        gl.useProgram(programBinder);

        // Setting shader attribute pointers
        let attributeIds = program.attributeIds;
        let attributes = program.attributes;
        for (let a = 0; a < attributeIds.length; a += 1) {
            let attributeId = attributeIds[a];
            attributes[attributeId] = gl.getAttribLocation(programBinder, attributeId);
        }

        // Setting shader uniform pointers
        const uniformIds = program.uniformIds;
        const uniforms = program.uniforms;
        for (let u = 0; u < uniformIds.length; u += 1) {
            let uniformId = uniformIds[u];
            let uniformLocation = gl.getUniformLocation(programBinder, uniformId);

            if (TEXTURE_INDEXES[uniformId]) {
                gl.uniform1i(uniformLocation, TEXTURE_INDEXES[uniformId]);
            }

            uniforms[uniformId] = uniformLocation;
        }
    }

    private _useProgram(programData: ProgramData) {
        let program = programData.program;
        if (program !== this._currentProgram) {
            let a; // attribute index

            const lastAttributesOld = this._currentProgram.lastAttributeIndex;
            const lastAttributesNew = program.lastAttributeIndex;
            if (lastAttributesOld > lastAttributesNew) {
                for (a = lastAttributesOld; a > lastAttributesNew; a -= 1) {
                    this.gl.disableVertexAttribArray(a);
                }
            } else if (lastAttributesOld < lastAttributesNew) {
                for (a = lastAttributesOld + 1; a <= lastAttributesNew; a += 1) {
                    this.gl.enableVertexAttribArray(a);
                }
            }

            const programBinder = program.binder;
            if (programBinder === null) {
                this._buildProgram(program);
            } else {
                this.gl.useProgram(program.binder);
            }

            program.setAttributes();
            this._currentProgram = program;
        }

        const data = programData.data;
        if (data !== null) {
            const gl = this.gl;

            if (data.mask !== undefined) {
                // Binding texture corresponding to mask to texture index 1
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, data.mask);
                gl.activeTexture(gl.TEXTURE0);
            }

            if (data.ratio !== undefined) {
                gl.uniform1f(this._currentProgram.uniforms.uRatio, data.ratio);
            }

            if (data.resolution !== undefined) {
                gl.uniform1f(this._currentProgram.uniforms.uResolution, data.resolution);
            }
        }
    }

    public useProgram(program: Program, params: any | null = null) {
        const programData = new ProgramData(program, params);

        this._programs.push(programData);
        this._useProgram(programData);
    };

    public stopProgram() {
        this._programs.pop();
        this._useProgram(this._programs[this._programs.length - 1]);
    };

    private _createRenderTarget(textureBinder:any | null, frameBufferBinder:any, width: number, height: number) {
        return new RenderTarget(textureBinder, frameBufferBinder, width, height);
    };

    private _setScissor(scissor: number[] | null) {
        let gl = this.gl;
        if (scissor === null) {
            gl.disable(gl.SCISSOR_TEST);
        } else {
            gl.enable(gl.SCISSOR_TEST);
            gl.scissor(scissor[0], scissor[1], scissor[2], scissor[3]);
        }
    };

    public enableScissor(x: number, y:  number, w:  number, h:  number) {
        let scissor = [x, y, w, h];
        this._renderTarget.scissor = scissor;
        this._setScissor(scissor);
    };

    public disableScissor() {
        let scissor = null;
        this._renderTarget.scissor = scissor;
        this._setScissor(scissor);
    };

    // function upperPowerOfTwo(x) {
    // 	x -= 1;
    // 	x |= x >> 1;
    // 	x |= x >> 2;
    // 	x |= x >> 4;
    // 	x |= x >> 8;
    // 	x |= x >> 16;
    // 	return x + 1;
    // }

    public startTextureUsage(w: number, h: number,
                             ratio: number,
                             textureId: string | undefined = undefined,
                             filtering: string | undefined = undefined) : RenderTarget {
        let gl = this.gl;

        ratio = ratio || this.prerenderRatio;
        w = Math.min(Math.ceil(w * ratio), this._maxTextureSize);
        h = Math.min(Math.ceil(h * ratio), this._maxTextureSize);

        // Allocating texture of correct size

        // Creating a new texture and a frame buffer
        let textureBinder     = gl.createTexture();
        let frameBufferBinder = gl.createFramebuffer();

        if(!textureBinder || !frameBufferBinder) {
            throw new Error('Could not create texture or frame buffer');
        }

        // Creating a new render target and adding it to the list of render targets
        let renderTarget = new RenderTarget(textureBinder, frameBufferBinder, w, h);

        // Giving correct dimension to the texture
        gl.bindTexture(gl.TEXTURE_2D, textureBinder);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        this._setFiltering(renderTarget, filtering);

        // Binding texture to frame buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBufferBinder);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureBinder, 0);

        // Switching back to currently used render target
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._renderTarget.frameBufferBinder);

        let textureData = {
            binder: textureBinder,
            width:  w,
            height: h
        };

        // Returning a texture handle
        renderTarget.texture = this.textureCache.addAndHoldElement(textureData, 4 * w * h, textureId);

        return renderTarget;
    };

    private _setRenderTarget(renderTarget: RenderTarget, clear: boolean = false) {
        let gl = this.gl;

        // Switching render target
        this._renderTarget = renderTarget;
        gl.bindFramebuffer(gl.FRAMEBUFFER, renderTarget.frameBufferBinder);

        // Setting viewport and scissor dimensions corresponding to render target
        gl.viewport(0, 0, renderTarget.width, renderTarget.height);
        this._setScissor(renderTarget.scissor);

        // Clearing if required
        if (clear) {
            gl.clear(gl.COLOR_BUFFER_BIT);
        }

        // Switching to matrix stack corresponding to render target
        this._matrixStack = renderTarget.matrixStack;
    };

    public startTextureRendering(renderTarget: RenderTarget, x0: number, x1: number, y0: number, y1: number, clear: boolean = false) {
        // Adding to target render stack
        this._renderTargetStack.push(renderTarget);
        this._setRenderTarget(renderTarget, clear);

        // Setting proper transformation matrix
        let sx = 2 / Math.max(x1 - x0, 1);
        let sy = 2 / Math.max(y1 - y0, 1);

        let matrix = this._matrixStack[0];

        matrix[0] = sx;
        matrix[4] = 0;
        matrix[1] = 0;
        matrix[5] = sy;

        matrix[2] = -x0 * sx - 1;
        matrix[6] = -y0 * sy - 1;

        matrix[8] = 1;
        matrix[9] = 1;
        matrix[10] = 1;
        matrix[11] = 1;
        matrix[12] = 0;
        matrix[13] = 0;
        matrix[14] = 0;
        matrix[15] = 0;
    }

    public stopTextureRendering(deleteFramebuffer: boolean) {
        // To debug prerendering
        // this._debugRenderTarget();

        // Popping render target from stack
        let renderTarget = this._renderTargetStack.pop();

        if(renderTarget === undefined) {
            throw new Error('No render target to pop');
        }

        this._setRenderTarget(this._renderTargetStack[this._renderTargetStack.length - 1]);

        if (deleteFramebuffer) {
            this.gl.deleteFramebuffer(renderTarget.frameBufferBinder);
        }
    };

    // @ts-ignore
    private _debugRenderTarget() {
        let rt = this._renderTargetStack[this._renderTargetStack.length - 1];

        // Fetching pixels of rendered texture (on currently used frame buffer)
        let w = rt.width;
        let h = rt.height;
        let gl = this.gl;
        let pixels = new Uint8Array(w * h * 4);
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

        let nPixels  = pixels.length;
        let alphaSum = 0;
        for (let p = 3; p < nPixels; p += 4) {
            alphaSum += pixels[p];
        }

        // For debugging purpose:
        let testCanvas  = document.createElement('canvas');
        let testContext = testCanvas.getContext('2d');

        if(!testContext) {
            throw new Error('Could not get 2D context');
        }

        testCanvas.width  = w;
        testCanvas.height = h;
        document.body.appendChild(testCanvas);
        testCanvas.style.position = 'absolute';
        testCanvas.style.left = 100 + 'px';
        testCanvas.style.top  = 100 + 'px';
        let testData  = testContext.getImageData(0, 0, w, h);
        let testPixel = testData.data;
        for (let p = 3; p < nPixels; p += 4) {
            testPixel[p - 3] = pixels[p - 3];
            testPixel[p - 2] = pixels[p - 2];
            testPixel[p - 1] = pixels[p - 1];
            testPixel[p - 0] = pixels[p - 0];
        }
        testContext.putImageData(testData, 0, 0);
        testContext.fillRect(w / 2 - 5, h / 2 - 5, 10, 10);
    };

    public resetDimension(width:number, height:number) {
        let prevWidth  = this._width;
        let prevHeight = this._height;

        this._width  = width;
        this._height = height;

        this.gl.viewport(0, 0, width, height);

        let renderTarget = this._renderTargetStack[0];
        renderTarget.width  = width;
        renderTarget.height = height;

        // Computing new viewport transformation with respect to previous and current dimension
        let sw = prevWidth  / this._width;
        let sh = prevHeight / this._height;
        let matrixStack  = renderTarget.matrixStack;
        for (let m = 0; m < matrixStack.length; m += 1) {
            let matrix = matrixStack[m];
            matrix[0] *= sw;
            matrix[1] *= sw;
            matrix[2] = (matrix[2] + 1.0) * sw - 1.0;

            matrix[4] *= sh;
            matrix[5] *= sh;
            matrix[6] = (matrix[6] - 1.0) * sh + 1.0;
        }
    };

    public getNbBytesPerSprite() {
        return this._spriteSize;
    };

    public getNbBytesPerLine() {
        return this._lineSize;
    };

    public getNbBytesPerBox() {
        return this._boxSize;
    };

    public getNbBytesPerVertex() {
        return this._vertexSize;
    };

    public enableBlending() {
        let gl = this.gl;
        gl.enable(gl.BLEND);
    };

    public disableBlending() {
        let gl = this.gl;
        gl.disable(gl.BLEND);
    };

    public drawImage(texture: any, x: number, y: number, w: number, h: number) {
        if (!texture) {
            // Ignoring the draw
            return;
        }

        let matrix = this._matrixStack[0];

        // Saving matrix
        let a = matrix[0];
        let b = matrix[4];
        let c = matrix[1];
        let d = matrix[5];
        let e = matrix[2];
        let f = matrix[6];

        // Applying transformations
        matrix[2] += a * x + c * y;
        matrix[6] += b * x + d * y;
        matrix[0] *= w;
        matrix[4] *= w;
        matrix[1] *= h;
        matrix[5] *= h;

        // Loading transformation matrix
        this.gl.uniformMatrix4fv(this._currentProgram.uniforms.uMatrix, false, matrix);

        // Setting texture
        let t = this.textureCache.useElement(texture.id);
        if(t == undefined)
            return;

        let textureBinder = t.element.binder;
        this.gl.bindTexture(this.gl.TEXTURE_2D, textureBinder);

        // Draw
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

        // Restoring matrix
        matrix[0] = a;
        matrix[4] = b;
        matrix[1] = c;
        matrix[5] = d;
        matrix[2] = e;
        matrix[6] = f;
    };

    public clear() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    };

    public initBuffer(maxSprites: number) {
        // Provide positions for the sprites
        let gl = this.gl;

        // Allocating vertex buffer (GPU memory)
        let vertexBufferBinder = gl.createBuffer();

        // Creating structure of the vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferBinder);

        // Vertex buffer that will hold all the vertices
        let vertexBuffer = new ArrayBuffer(maxSprites * this._spriteSize);

        // Feeding vertex data that will be used to render images
        let positions = new Float32Array(vertexBuffer);
        let colorView = new Uint32Array(vertexBuffer);

        positions[0]  = 0;
        positions[1]  = 0;
        colorView[2]  = 0;

        positions[5]  = 0;
        positions[6]  = 1;
        colorView[7]  = 0xffff0000;

        positions[10] = 1;
        positions[11] = 1;
        colorView[12] = 0xffffffff;

        positions[15] = 0;
        positions[16] = 0;
        colorView[17] = 0;

        positions[20] = 1;
        positions[21] = 1;
        colorView[22] = 0xffffffff;

        positions[25] = 1;
        positions[26] = 0;
        colorView[27] = 0x0000ffff;

        // 0x40404040 === (64 << 24) + (64 << 16) + (64 << 8) + 64 where 64 corresponds to a color multiplier of 1
        colorView[3] = colorView[8] = colorView[13] = colorView[18] = colorView[23] = colorView[28] = 0x40404040;
        colorView[4] = colorView[9] = colorView[14] = colorView[19] = colorView[24] = colorView[29] = 0;

        gl.bufferData(gl.ARRAY_BUFFER, vertexBuffer, gl.STATIC_DRAW);
    };

    public updateGPUBuffer(startingByte: number, subBuffer:AllowSharedBufferSource) {
        let gl = this.gl;
        // TODO: add security mechanism to make sure that the subBuffer never overflows the number of reserved bytes
        gl.bufferSubData(gl.ARRAY_BUFFER, startingByte, subBuffer);
    };

    public isInBuffer(batchId: string) {
        return this.sfmPartitioner.possess(batchId);
    };

    public getBufferData(batchId: string) {
        return this.sfmPartitioner.touch(batchId);
    };

    public lockBuffer(batchId: string) {
        return this.sfmPartitioner.addLock(batchId);
    };

    public releaseBuffer(batchId: string) {
        return this.sfmPartitioner.release(batchId);
    };

    public  unlockBuffer(batchId: string) {
        this.sfmPartitioner.removeLock(batchId);
    };

    static isPowerOfTwo(v: number) {
        return (v & (v - 1)) === 0;
    }

    private _setFiltering(dimensions: { width: number, height: number},
                          filtering: string | undefined = undefined,
                          textureId: string | undefined = "") {
        let gl = this.gl;

        let minFilter: number = gl.LINEAR;
        let magFilter: number = gl.LINEAR;
        switch (filtering) {
            case 'nearest':
                magFilter = gl.NEAREST;
                break;
            case 'mipmap':
                if (WebGLRenderer.isPowerOfTwo(dimensions.width) && WebGLRenderer.isPowerOfTwo(dimensions.height)) {
                    minFilter = gl.LINEAR_MIPMAP_LINEAR;
                    gl.generateMipmap(gl.TEXTURE_2D);
                } else {
                    // Mipmap not supported on non-power of 2 images
                    // Fallback to linear filtering
                    console.warn(
                        '[WebGLRenderer._setFiltering]',
                        'Cannot build mipmap from image', textureId, ' because its dimensions are not a power of 2.'
                    );
                }
                break;
        }

        // Set the parameters so we can render any image size
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };

    public holdTexture(textureId: string) {
        return this.textureCache.holdElement(textureId);
    };

    public useTexture(textureId: string) {
        return this.textureCache.useElement(textureId);
    };

    public createTexture(imageData: TexImageSource & { width: number, height: number}, textureId: string | undefined, filtering: string | undefined, type: string | undefined) : ElementHandle {
        textureId = textureId || "null";

        let textureHandle = this.textureCache.holdElement(textureId);
        if (textureHandle) {
            // Texture already in cache
            return textureHandle;
        }

        let gl = this.gl;

        // Creating a new texture
        let textureBinder = gl.createTexture();

        // Binding it
        gl.bindTexture(gl.TEXTURE_2D, textureBinder);

        // Alpha premultiplication will be applied when loading the texture
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

        // Loading the image onto the GPU
        console.log(imageData);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);

        // Setting its filtering
        this._setFiltering(imageData, filtering, textureId);

        let textureData = {
            binder: textureBinder,
            width:  imageData.width,
            height: imageData.height
        };

        return this.textureCache.addAndHoldElement(textureData, 4 * imageData.width * imageData.height, textureId, type, false);
    };

    public getEmptyTexture() {
        return this.emptyTexture;
    };

    static populateSpriteVertexBuffer(positions: Float32Array, colorView: Uint32Array, spriteIdx: number, sprite: AtlasSprite) {
        let vertexPos    = sprite.vertexPos;
        let textureCoord = sprite.textureCoord;
        let color        = sprite.color;

        positions[spriteIdx + 0]  = vertexPos[0];
        positions[spriteIdx + 1]  = vertexPos[1];
        colorView[spriteIdx + 2]  = (textureCoord[0] * 0xffff & 0xffff) + (textureCoord[1] * 0xffff0000 & 0xffff0000);

        positions[spriteIdx + 5]  = vertexPos[4];
        positions[spriteIdx + 6]  = vertexPos[5];
        colorView[spriteIdx + 7]  = (textureCoord[0] * 0xffff & 0xffff) + (textureCoord[3] * 0xffff0000 & 0xffff0000);

        positions[spriteIdx + 10] = vertexPos[6];
        positions[spriteIdx + 11] = vertexPos[7];
        colorView[spriteIdx + 12] = (textureCoord[2] * 0xffff & 0xffff) + (textureCoord[3] * 0xffff0000 & 0xffff0000);

        positions[spriteIdx + 15] = vertexPos[0];
        positions[spriteIdx + 16] = vertexPos[1];
        colorView[spriteIdx + 17] = (textureCoord[0] * 0xffff & 0xffff) + (textureCoord[1] * 0xffff0000 & 0xffff0000);

        positions[spriteIdx + 20] = vertexPos[6];
        positions[spriteIdx + 21] = vertexPos[7];
        colorView[spriteIdx + 22] = (textureCoord[2] * 0xffff & 0xffff) + (textureCoord[3] * 0xffff0000 & 0xffff0000);

        positions[spriteIdx + 25] = vertexPos[2];
        positions[spriteIdx + 26] = vertexPos[3];
        colorView[spriteIdx + 27] = (textureCoord[2] * 0xffff & 0xffff) + (textureCoord[1] * 0xffff0000 & 0xffff0000);

        // Clamping color components in [-128, 127]
        let cmr = Math.max(-128, Math.min(127, color[0] * 64));
        let cmg = Math.max(-128, Math.min(127, color[1] * 64));
        let cmb = Math.max(-128, Math.min(127, color[2] * 64));
        let cma = Math.max(-128, Math.min(127, color[3] * 64));
        let car = Math.max(-128, Math.min(127, color[4] * 128));
        let cag = Math.max(-128, Math.min(127, color[5] * 128));
        let cab = Math.max(-128, Math.min(127, color[6] * 128));
        let caa = Math.max(-128, Math.min(127, color[7] * 128));

        let cm = ((cma << 24) & 0xff000000) + ((cmb << 16) & 0xff0000) + ((cmg << 8) & 0xff00) + (cmr & 0xff);
        let ca = ((caa << 24) & 0xff000000) + ((cab << 16) & 0xff0000) + ((cag << 8) & 0xff00) + (car & 0xff);

        colorView[spriteIdx + 3]  = colorView[spriteIdx + 8]  = colorView[spriteIdx + 13] = cm;
        colorView[spriteIdx + 18] = colorView[spriteIdx + 23] = colorView[spriteIdx + 28] = cm;
        colorView[spriteIdx + 4]  = colorView[spriteIdx + 9]  = colorView[spriteIdx + 14] = ca;
        colorView[spriteIdx + 19] = colorView[spriteIdx + 24] = colorView[spriteIdx + 29] = ca;
    }

    public prepareBatchFromSpriteList(batchId: string,
                                      batchData: { bbox: number[], nbSprites: number, spriteBatch: AtlasSprite[]},
                                      prerender: boolean | null = null) {
        prerender = !!prerender; // Whether to prerender the sprite batch

        let spriteBatch = batchData.spriteBatch;
        let lastSprite  = spriteBatch.length - 1;
        let batchSize   = batchData.nbSprites * this._spriteSize;

        let reservedChunk = this.sfmPartitioner.reserve(batchId, batchSize);
        let startingByte  = reservedChunk.start;
        let startSubBatch = startingByte;
        let endingByte    = startingByte;

        let vertexBuffer = new ArrayBuffer(batchSize);
        let positions    = new Float32Array(vertexBuffer);
        let colorView    = new Uint32Array(vertexBuffer);

        let byteCoeff = this._spriteSize / 4;

        let spritesIdx    = 0;
        let spriteBatches: (AtlasSprite | SubBatchData)[] = [];
        for (let s = 0; s <= lastSprite; s += 1) {
            let sprite = spriteBatch[s];
            if (sprite.isMaskTag) {
                prerender = true; // Sprite batch includes a mask, will be prerendered
                spriteBatches.push(sprite); // adding sprite as a mask tag
                continue;
            }

            WebGLRenderer.populateSpriteVertexBuffer(positions, colorView, spritesIdx * byteCoeff, sprite);
            endingByte += this._spriteSize;
            spritesIdx += 1;

            let nextSprite = spriteBatch[s + 1];
            if ((s === lastSprite)                     || // Last sprite of the batch
                sprite.texture !== nextSprite.texture  || // Texture differs from texture of next sprite
                nextSprite.isMaskTag                      // Next sprite is a mask tag
            ) {
                // Texturing is switching
                spriteBatches.push(
                    new SubBatchData(startSubBatch, endingByte - startSubBatch, this._drawModes.triangles, sprite.texture)
                );

                startSubBatch = endingByte;
            }
        }

        // Uploading created buffer onto the GPU
        this.updateGPUBuffer(startingByte, positions);

        // Attaching preloaded batch object to its memory chunk reference for easy access
        // Also attaching bounding box of the animation for ulterior access
        reservedChunk.obj = new BatchData(spriteBatches, batchData.bbox, prerender);
    };

    public loadSpriteBuffer(batchId: string, vertexBuffer: ArrayBuffer, texture: any, bbox: number[], prerender: boolean) {
        this._loadVertexBuffer(batchId, vertexBuffer, texture, bbox, this._drawModes.triangles, prerender);
    };

    public loadLineBuffer(batchId: string, vertexBuffer: ArrayBuffer, bbox: number[], prerender: boolean) {
        this._loadVertexBuffer(batchId, vertexBuffer, null, bbox, this._drawModes.lines, prerender);
    };

    private _loadVertexBuffer(batchId: string, vertexBuffer: ArrayBuffer, texture: any, bbox: number[], drawMode: number, prerender: boolean) {
        let batchSize     = vertexBuffer.byteLength;
        let reservedChunk = this.sfmPartitioner.reserve(batchId, batchSize);
        let startingByte  = reservedChunk.start;

        let batch = new SubBatchData(startingByte, batchSize, drawMode, texture);
        reservedChunk.obj = new BatchData([batch], bbox, prerender);

        // Uploading buffer onto the GPU
        this.updateGPUBuffer(startingByte, vertexBuffer);
    };

    public updateVertexBuffer(batchId: string, vertexBuffer: ArrayBuffer, byteOffset: number, _byteSize: number = 0) {
        let reservedChunk = this.sfmPartitioner.getChunk(batchId);
        if (reservedChunk === undefined) {
            console.warn('[WebGLRenderer.updateVertexBuffer] No buffer loaded for', batchId);
            return;
        }

        let startingByte  = reservedChunk.start;

        // Uploading buffer onto the GPU
        this.updateGPUBuffer(startingByte + byteOffset, vertexBuffer/*, byteSize*/);
    };

    public drawLineBatch(batchId: string, lineWidth: number) {
        // Switching to program that enables the fixed scaling of the sprites
        this.useProgram(this._programLine);

        this.gl.lineWidth(lineWidth);
        let batchData = this.sfmPartitioner.touch(batchId);
        if (batchData === undefined) {
            console.warn('[WebGLRenderer.drawLineBatch] No buffer loaded for', batchId);
            this.stopProgram();
            return;
        }

        this._drawBatch(batchData);

        // Switching back to previous program
        this.stopProgram();
    };

    public drawBoxBatch(batchId: string) {
        // Switching to program that enables the fixed scaling of the sprites
        this.useProgram(this._programBox);

        let batchData = this.sfmPartitioner.touch(batchId);
        if (batchData === undefined) {
            console.warn('[WebGLRenderer.drawBoxBatch] No buffer loaded for', batchId);
            this.stopProgram();
            return;
        }

        this._drawBatch(batchData);

        // Switching back to previous program
        this.stopProgram();
    };

    public drawSpriteBatchAbsoluteScale(batchId: string, scale: number) {
        // Switching to program that enables the fixed scaling of the sprites
        this.useProgram(this._programAbsoluteScale);

        // Adding necessary info to correctly scale the sprites
        let matrix = this._matrixStack[0];
        matrix[3] = scale / this._renderTarget.width;
        matrix[7] = scale / this._renderTarget.height;

        this.drawSpriteBatch(batchId);

        // Switching back to previous program
        this.stopProgram();
    };

    public drawSpriteBatch(batchId: string) {
        let batchData = this.sfmPartitioner.touch(batchId);
        if (batchData === undefined) {
            console.warn('[WebGLRenderer.drawSpriteBatch] No buffer loaded for', batchId);
            return;
        }

        if (batchData.prerender) {
            let texture = this.textureCache.holdElement(batchId);
            let bbox    = batchData.bbox;
            if (texture === undefined) {
                // Bounds of the texture
                let x0 = bbox[0];
                let x1 = bbox[1];
                let y0 = bbox[2];
                let y1 = bbox[3];

                // Scale of the texture (for improved rendering quality)
                let matrix = this._matrixStack[0];
                let a = this._renderTarget.width  * matrix[0] / 2;
                let b = this._renderTarget.width  * matrix[4] / 2;
                let c = this._renderTarget.height * matrix[1] / 2;
                let d = this._renderTarget.height * matrix[5] / 2;
                let scale = Math.sqrt(Math.max(a * a + b * b, c * c + d * d)) * this.prerenderRatio;

                let renderTarget = this.startTextureUsage(x1 - x0, y1 - y0, scale, batchId, 'nearest');
                this.startTextureRendering(renderTarget, x0, x1, y0, y1);
                this._drawBatch(batchData);
                this.stopTextureRendering(true/*, true*/);

                texture = renderTarget.texture;
            }

            this.drawImage(texture, bbox[0], bbox[2], bbox[1] - bbox[0], bbox[3] - bbox[2]);
            texture!.release();
        } else {
            this._drawBatch(batchData);
        }
    };

    public handleMaskTag(maskTag: AtlasSprite, bbox: number[], maskStack: RenderTarget[]) {
        if (maskTag.isMaskDef) {
            let x0 = bbox[0];
            let x1 = bbox[1];
            let y0 = bbox[2];
            let y1 = bbox[3];

            // Start rendering into the mask texture
            let renderTarget = this.startTextureUsage(x1 - x0, y1 - y0, this.maskQuality);
            this.startTextureRendering(renderTarget, x0, x1, y0, y1);
            maskStack.push(renderTarget);
            return;
        }

        let gl = this.gl;
        if (maskTag.isMaskUse) {
            // Using program to render masked sprites with the current render target as the mask
            this.useProgram(this._programMask, { mask: this._renderTarget.textureBinder });

            // Uploading bounding box
            gl.uniform4fv(this._currentProgram.uniforms.uBbox, bbox);

            // Stop rendering into the mask texture
            this.stopTextureRendering(true);
            return;
        }

        if (maskTag.isMaskStop) {
            // Stop using the mask texture
            maskStack.pop()!.texture.release();

            // Stop using the program that renders masked sprite
            this.stopProgram();
            return;
        }
    };

    private _drawBatch(batchData: BatchData) {
        let spriteBatches = batchData.spriteBatches;
        let maskStack: RenderTarget[] | undefined = undefined;
        for (let b = 0; b < spriteBatches.length; b += 1) {
            let subBatch = spriteBatches[b];
            if(subBatch instanceof AtlasSprite) {
                if (subBatch.isMaskTag) {
                    if (maskStack === null) {
                        maskStack = [];
                    }
                    this.handleMaskTag(subBatch, batchData.bbox, maskStack!);
                }
            }
            else {
                let offset = subBatch.startingByte / this._vertexSize;
                let nVertices = subBatch.nBytes / this._vertexSize;
                this._drawSubBatch(offset, nVertices, subBatch.texture, subBatch.drawMode);
            }
        }
    };

    public drawSpriteSubBatch(batchId: string, fromVertex: number, toVertex: number) {
        let batchData = this.sfmPartitioner.touch(batchId);
        if (batchData === undefined) {
            console.warn('[WebGLRenderer.drawSpriteSubBatch] No buffer loaded for', batchId);
            return;
        }

        let subBatch  = batchData.spriteBatches[0];
        let offset    = subBatch.startingByte / this._vertexSize + fromVertex;
        let nVertices = toVertex - fromVertex;
        this._drawSubBatch(offset, nVertices, subBatch.texture, subBatch.drawMode);
    };

    private _drawSubBatch(offset: number, nVertices: number, texture: any, drawMode: number) {
        if (nVertices <= 0) {
            return;
        }

        // Draw
        let gl = this.gl;
        if (texture !== null) {
            let textureHandle = this.textureCache.useElement(texture.id);
            if (textureHandle === undefined) {
                console.warn('[WebGLRenderer._drawSubBatch] Texture not loaded:', texture.id);
                return;
            }

            gl.bindTexture(gl.TEXTURE_2D, textureHandle.element.binder);
        }

        gl.uniformMatrix4fv(this._currentProgram.uniforms.uMatrix, false, this._matrixStack[0]);
        gl.drawArrays(drawMode, offset, nVertices);
    };

    public save() {
        this._matrixStack.unshift(this._matrixStack[0].slice());
    };

    public restore() {
        this._matrixStack.shift();
    };

    public setTransform(a: number,
                        b: number,
                        c: number,
                        d: number,
                        e: number,
                        f: number,
                        sw: number = 0,
                        sh: number = 0) {
        let matrix = this._matrixStack[0];
        sw =  2 / (sw || this._width);
        sh = -2 / (sh || this._height);

        matrix[0] = a * sw;
        matrix[4] = b * sh;
        matrix[1] = c * sw;
        matrix[5] = d * sh;

        matrix[2] = e * sw - 1;
        matrix[6] = f * sh + 1;
    };

    public rotate(rotation: number) {
        if (rotation === 0) {
            return;
        }
        let matrix = this._matrixStack[0];

        let cos = Math.cos(rotation);
        let sin = Math.sin(rotation);

        let a = matrix[0];
        let b = matrix[4];
        let c = matrix[1];
        let d = matrix[5];

        matrix[0] = a * cos + c * sin;
        matrix[4] = b * cos + d * sin;
        matrix[1] = c * cos - a * sin;
        matrix[5] = d * cos - b * sin;
    };

    public translate(x: number, y: number) {
        let matrix = this._matrixStack[0];
        matrix[2] += matrix[0] * x + matrix[1] * y;
        matrix[6] += matrix[4] * x + matrix[5] * y;
    };

    public scale(sx: number, sy: number) {
        let matrix = this._matrixStack[0];
        matrix[0] *= sx;
        matrix[4] *= sx;
        matrix[1] *= sy;
        matrix[5] *= sy;
    };

    public transform(a: number, b: number, c: number, d: number, e: number, f: number) {
        let matrix = this._matrixStack[0];
        let a0 = matrix[0];
        let b0 = matrix[4];
        let c0 = matrix[1];
        let d0 = matrix[5];
        let e0 = matrix[2];
        let f0 = matrix[6];

        matrix[0] = a0 * a + c0 * b;
        matrix[4] = b0 * a + d0 * b;
        matrix[1] = a0 * c + c0 * d;
        matrix[5] = b0 * c + d0 * d;

        matrix[2] = a0 * e + c0 * f + e0;
        matrix[6] = b0 * e + d0 * f + f0;
    };

    public getTransform() {
        let t = this._matrixStack[0];
        return [t[0], t[4], t[1], t[5], t[2], t[6]];
    };

    public setTint(rm: number, gm: number, bm: number, am: number, ra: number, ga: number, ba: number, aa: number) {
        let matrix = this._matrixStack[0];
        matrix[8]  = rm;
        matrix[9]  = gm;
        matrix[10] = bm;
        matrix[11] = am;
        matrix[12] = ra / 255;
        matrix[13] = ga / 255;
        matrix[14] = ba / 255;
        matrix[15] = aa / 255;
    };

    public tint(rm: number, gm: number, bm: number, am: number, ra: number, ga: number, ba: number, aa: number) {
        let matrix = this._matrixStack[0];
        let rm0 = matrix[8];
        let gm0 = matrix[9];
        let bm0 = matrix[10];
        let am0 = matrix[11];

        matrix[8]  = rm * rm0;
        matrix[9]  = gm * gm0;
        matrix[10] = bm * bm0;
        matrix[11] = am * am0;
        matrix[12] = ra / 255 + matrix[12] * rm;
        matrix[13] = ga / 255 + matrix[13] * gm;
        matrix[14] = ba / 255 + matrix[14] * bm;
        matrix[15] = aa / 255 + matrix[15] * am;
    };

    public setTintMult(rm: number, gm: number, bm: number, am: number) {
        let matrix = this._matrixStack[0];
        matrix[8]  = rm;
        matrix[9]  = gm;
        matrix[10] = bm;
        matrix[11] = am;
    };

    public setTintAdd(ra: number, ga: number, ba: number, aa: number) {
        let matrix = this._matrixStack[0];
        matrix[12] = ra / 255;
        matrix[13] = ga / 255;
        matrix[14] = ba / 255;
        matrix[15] = aa / 255;
    };


    public multiplyColor(rm: number, gm: number, bm: number, am: number) {
        let matrix = this._matrixStack[0];
        matrix[8]  *= rm;
        matrix[9]  *= gm;
        matrix[10] *= bm;
        matrix[11] *= am;
    };

    public addColor(ra: number, ga: number, ba: number, aa: number) {
        let matrix = this._matrixStack[0];
        matrix[12] += ra * matrix[8]  / 255;
        matrix[13] += ga * matrix[9]  / 255;
        matrix[14] += ba * matrix[10] / 255;
        matrix[15] += aa * matrix[11] / 255;
    };

    public static isWebGlSupported() {
        if (WebGLRenderer._isWebGlSupported !== null) {
            return WebGLRenderer._isWebGlSupported;
        }

        let canvas = document.createElement('canvas');
        WebGLRenderer._isWebGlSupported = !!WebGLRenderer.getWebGlContext(canvas, true);
        return WebGLRenderer._isWebGlSupported;
    };

    public static readonly shadersData : {[key: string]: {type: string, script: string}} = {
        "fragmentBox": {
            type: "fragment",
            script: fragmentBox
        },
        "fragmentColorSplit": {
            type: "fragment",
            script: fragmentColorSplit
        },
        "fragmentEnteringFight": {
            type: "fragment",
            script: fragmentEnteringFight
        },
        "fragmentFiltering": {
            type: "fragment",
            script: fragmentFiltering
        },
        "fragmentLine": {
            type: "fragment",
            script: fragmentLine
        },
        "fragmentMapTransition": {
            type: "fragment",
            script: fragmentMapTransition
        },
        "fragmentMask": {
            type: "fragment",
            script: fragmentMask
        },
        "fragmentOutline": {
            type: "fragment",
            script: fragmentOutline
        },
        "fragmentPixelArt": {
            type: "fragment",
            script: fragmentPixelArt
        },
        "fragmentRegular": {
            type: "fragment",
            script: fragmentRegular
        },
        "vertexAbsoluteScale": {
            type: "vertex",
            script: vertexAbsoluteScale
        },
        "vertexLine": {
            type: "vertex",
            script: vertexLine
        },
        "vertexBox": {
            type: "vertex",
            script: vertexBox
        },
        "vertexMask": {
            type: "vertex",
            script: vertexMask
        },
        "vertexOutline": {
            type: "vertex",
            script: vertexOutline
        },
        "vertexRegular": {
            type: "vertex",
            script: vertexRegular
        },
        "vertexRelativeScale": {
            type: "vertex",
            script: vertexRelativeScale
        }
    }

    static getWebGlContext(canvas: HTMLCanvasElement,
                           transparent: boolean): WebGLRenderingContext {
        let gl = null;
        try {
            let contextOptions = {
                alpha: transparent,
                depth: false,
                stencil: false,
                antialias: true,
                powerPreference: 'high-performance'
            };

            gl = canvas.getContext('webgl', contextOptions) || canvas.getContext('experimental-webgl', contextOptions);
        } catch (err: any) {
            throw new Error('Could not initialise WebGL (' + err.message + ')');
        }
        if (!gl) {
            throw new Error('Could not initialise WebGL, sorry :-(');
        }
        return gl as WebGLRenderingContext;
    };
}

