import Scene from "../../Common/Scene";

export default class SpriteParams {
    id: string;
    position: number | undefined;
    hue: number[] | undefined;
    alpha: number | undefined = undefined;
    layer: number | undefined;
    x: number | undefined;
    y: number | undefined;
    sx: number | undefined = undefined;
    sy: number | undefined= undefined;
    rotation: number | undefined;
    scene: Scene;
    isHudElement: boolean | undefined;

    constructor(id: string, scene: Scene) {
        this.id = id;
        this.scene = scene;
    }
}
