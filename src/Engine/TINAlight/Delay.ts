import Playable from "./Playable.ts";

/**
 *
 * @classdesc Delay
 * Execute a callback after a given amount of time has passed
 *
 * @param {number}   duration - Duration of the delay
 * @param {function} onFinish - Callback to execute at the end of the delay
 *
 */
export default class Delay extends Playable {
    constructor(duration: number, onFinish: Function) {
        super();

        this._duration = duration;
        this.onFinish(onFinish);
    }


    public reset(duration: number, onFinish: Function) {
        this._duration = duration;
        this.removeOnFinish();
        this.onFinish(onFinish);
    }

    protected override _update() {
        // Do nothing
    }
}