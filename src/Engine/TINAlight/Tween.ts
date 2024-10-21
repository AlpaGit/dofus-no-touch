import Playable from "./Playable.ts";
import Transition from "./Transition.ts";
import Easing from "./Easing.ts";

/**
 *
 * @classdesc Tween
 * Manages transition of object properties in absolute values
 *
 * @param {object} element    - Object to tween
 * @param {string} properties - Properties to tween
 *
 */
export default class Tween extends Playable {
    private _element: Playable;
    private _properties: string[];

    private _transitions: Transition[] = [];
    private _currentTransitionIndex: number = 0;
    private _from: any | null = null;

    constructor(element: any, properties: string[]) {
        super();

        if(!element) {
            console.error(new Error('Invalid tween element: ' + element));

            // Makes the tween harmless by avoiding future crash
            element = {};
        }

        this._element = element;
        this._properties = properties;

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

        return this;
    }

    public from(fromObject: any) {
        this._from = fromObject;

        if (this._transitions.length > 0) {
            this._transitions[0].fromObject = fromObject;
        }

        return this;
    };

    private _setFrom() {
        // Copying properties of tweened object
        this._from = {};
        for (let p = 0; p < this._properties.length; p += 1) {
            let property = this._properties[p];
            // @ts-ignore
            this._from[property] = this._element[property];
        }

        return this._from;
    }

    private _getLastTransitionEnding() {
        if (this._transitions.length > 0) {
            return this._transitions[this._transitions.length - 1].toObject;
        } else {
            return (this._from === null) ? this._setFrom() : this._from;
        }
    };

    public to(toObject: any, duration: number, easing: Function | undefined = undefined, easingParam: any | undefined = undefined) {
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
        type PlayableKey = keyof typeof Playable;
        for (let p = 0; p < this._properties.length; p++) {
            let property  = this._properties[p] as PlayableKey;
            // @ts-ignore
            this._element[property] = fromObject[property] * (1 - t) + toObject[property] * t;
        }
    };
}