import Playable from "./Playable.ts";

/**
 *
 * @classdesc Transition
 * Holds parameters to handle a transition
 *
 * @param {object} fromObject   - Starting values of the properties of the transition
 * @param {object} toObject     - Ending values of the properties of the transition
 * @param {number} startingTime - Starting time of the transition
 * @param {number} duration     - Duration of the transition
 * @param {function} easing     - Easing method of the transition
 * @param {object} easingParam  - Parameters of the easing
 *
 */
export default class Transition {
    public start: number;
    public end: number;
    public duration: number;

    // Properties values information
    public fromObject: Playable;
    public toObject: Playable;

    // Easing information
    public easing: Function;
    public easingParam: any;

    constructor(fromObject: Playable, toObject: Playable, startingTime: number, duration: number, easing: Function, easingParams: any) {
        this.start = startingTime;
        this.end = startingTime + duration;
        this.duration = duration;

        this.fromObject = fromObject;
        this.toObject = toObject;

        this.easing = easing;
        this.easingParam = easingParams;
    }
}