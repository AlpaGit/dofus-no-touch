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
    sy: number | undefined = undefined;
    cx: number | undefined;
    cy: number | undefined;
    cw: number | undefined;
    ch: number | undefined;
    rotation: number | undefined;
    scene: Scene;
    isHudElement: boolean | undefined;
    holdsStatics: boolean | undefined;

    constructor(id: string, scene: Scene, params: Partial<SpriteParams> = {}) {
        this.id = id;
        this.scene = scene;

        Object.assign(this, params);
    }
}
