import Playable from "./Playable.ts";
import Easing from "./Easing.ts";
import Transition from "./Transition.ts";

/**
 *
 * @classdesc RelativeTween
 * Manages transition of object properties in relative values
 *
 * @param {object} element    - Object to tween
 * @param {string} properties - Properties to tween
 *
 */
export default class RelativeTween extends Playable {
    private _element: Playable;
    private _properties: string[];
    private _previousValues: any;
    private _transitions: any[];
    private _currentTransitionIndex: number;
    private _from: any;

    constructor(element: any, properties: any) {
        super();

        if(!element) {
            console.error(new Error('Invalid tween element: ' + element));

            // Makes the tween harmless by avoiding future crash
            element = {};
        }

        this._element = element;
        this._properties = properties;
        this._previousValues = {};
        for (let p = 0; p < this._properties.length; p += 1) {
            this._previousValues[this._properties[p]] = 0;
        }

        this._transitions = [];
        this._currentTransitionIndex = 0;
        this._duration = 0;
        this._from = null;
    }

    public reset(){
        this._from = null;
        this._duration = 0;
        this._currentTransitionIndex = 0;
        this._transitions = [];
        this._reset();
        this._previousValues = {};
        for (let p = 0; p < this._properties.length; p += 1) {
            this._previousValues[this._properties[p]] = 0;
        }

        return this;
    }

    public from(fromObject: any) {
        this._from = fromObject;

        if (this._transitions.length > 0) {
            this._transitions[0].from = fromObject;
        }

        return this;
    };

    private _setFrom() {
        // Copying properties of tweened object
        this._from = {};
        for (let p = 0; p < this._properties.length; p += 1) {
            this._from[this._properties[p]] = 0;
        }

        return this._from;
    };

    private _getLastTransitionEnding() {
        if (this._transitions.length > 0) {
            return this._setFrom();
        } else {
            return (this._from === null) ? this._setFrom() : this._from;
        }
    };

    public to(toObject: Playable, duration: number, easing: Function | undefined, easingParam: any) {
        if (easing === undefined) {
            easing = Easing.linear;
        }

        // Getting previous transition ending as the beginning for the new transition
        let fromObject = this._getLastTransitionEnding();
        this._transitions.push(new Transition(fromObject, toObject, this._duration, duration, easing, easingParam));
        this._duration += duration;

        return this;
    };

    public wait(duration: number) {
        if (duration === 0) {
            return this;
        }

        // Getting previous transition ending as the beginning AND ending for the waiting transition
        let fromObject = this._getLastTransitionEnding();
        this._transitions.push(new Transition(fromObject, fromObject, this._duration, duration, Easing.linear, null));
        this._duration += duration;

        return this;
    };

    protected override _update() {
        while (this._time < this._transitions[this._currentTransitionIndex].start) { this._currentTransitionIndex--; }
        while (this._time > this._transitions[this._currentTransitionIndex].end)   { this._currentTransitionIndex++; }

        let transition = this._transitions[this._currentTransitionIndex];
        let t = transition.easing((this._time - transition.start) / transition.duration, transition.easingParam);
        let fromObject = transition.fromObject;
        let toObject   = transition.toObject;
        for (let p = 0; p < this._properties.length; p++) {
            let property = this._properties[p];
            let now = fromObject[property] * (1 - t) + toObject[property] * t;
            // @ts-ignore
            this._element[property] += now - this._previousValues[property];
            this._previousValues[property] = now;
        }
    };

}