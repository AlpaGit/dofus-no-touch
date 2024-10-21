import AtlasSprite from "../AtlasAnimationTemplate/AtlasSprite.ts";
import SubBatchData from "./SubBatchData.ts";

export default class BatchData{
    public bbox: number[];
    public prerender: boolean;
    public spriteBatches: (AtlasSprite | SubBatchData)[];

    constructor(spriteBatches: (AtlasSprite | SubBatchData)[], bbox: number[], prerender: boolean) {
        this.bbox = bbox;
        this.prerender = prerender;
        this.spriteBatches = spriteBatches;
    }
}