import GraphicalElement from "./GraphicalElement.ts";

export default class AnimationGraphic {
    public vertexPos: number[];
    public textureCoord: number[];
    public id: number;
    public tint: number[];
    public texture: any;
    public className: string;
    public nbFrame: number;

    public animationData: any;
    public isGraphic: boolean = true;

    constructor(graphicProps: GraphicalElement, animationData: any, texture: any) {
        this.vertexPos = [
            graphicProps.x,
            graphicProps.y,
            graphicProps.x + graphicProps.w,
            graphicProps.y + graphicProps.h
        ];

        this.textureCoord = [
            graphicProps.sx / texture.element.width,
            graphicProps.sy / texture.element.height,
            (graphicProps.sx + graphicProps.sw) / texture.element.width,
            (graphicProps.sy + graphicProps.sh) / texture.element.height
        ];

        this.id = graphicProps.id;
        this.tint = graphicProps.tint;

        this.texture = texture;
        this.className = graphicProps.className;
        this.nbFrame = 1;

        this.animationData = animationData;

    }
}