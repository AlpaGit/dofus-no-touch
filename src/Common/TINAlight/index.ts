
// Using performance.now, beyond giving better precision,
// its avoids a bug that happens once in a million sessions:
// Data.now is based on a clock that is synchronized by a few milliseconds
// every 15-20 mins and could cause the timer to go backward in time.
// (legend or true fact? not sure, but I think I noticed it once)
// see: http://updates.html5rocks.com/2012/08/When-milliseconds-are-not-enough-performance-now
import Constants from "../Constants";
import Easing from "./Easing.ts";
import DoublyList from "../../Engine/DoublyList";

let clock = window.performance ? window.performance : Date;

/**
 *
 * @classdesc Tween Manager
 * It manages all the tweeners. Its speed is computed from the time units per second (tups)
 * and the duration since the previous call to its update method.
 *
 * @param {number} tups Time units per gigananosecond (NB: 1 gigananosecond = 1 second)
 */
export default class TINAlight{
    public static tups: number = Constants.TIME_UNITS_PER_SECOND;
    public static easing: Easing = Easing;

    private static _startingTime:number = clock.now();
    private static _previousTime:number = clock.now();

    private static _playables: DoublyList = new DoublyList();
    private static _addList: any[];
    private static _removeList: any[];

    private static _silent: boolean = true;
    private static _debug :boolean = false;

    public static restart(){
        this._startingTime = clock.now();
        this._previousTime = clock.now();
    }

    public static getFramesSinceStart(){
        return Math.floor((clock.now() - this._startingTime) * this.tups / 1000);
    }

    public static update(){
        let currentTime = clock.now();

        let speed = (currentTime - this._previousTime) * this.tups / 1000;
        this._previousTime = currentTime;

        // Add playable in add list
        while (this._addList.length > 0) {
            let playable = this._addList.pop();
            playable.reference = this._playables.add(playable);
        }

        // Update every attached tween
        for (let playableRef = this._playables.first; playableRef !== null; playableRef = playableRef.next) {
            playableRef.object.update(speed);
        }

        // Removing playable in remove list
        while (this._removeList.length > 0) {
            this._playables.removeByReference(this._removeList.pop().reference);
        }
    }

    public static start(playable: Playable){
        playable.start(this);
    }

    public static add(playable: Playable){
        // If the playable is already being added
        // it is not added again
        let idx = this._addList.indexOf(playable);
        if (idx !== -1) {
            return;
        }

        idx = this._removeList.indexOf(playable);
        if (idx !== -1) {
            // If the playable was being removed
            // taking it out of the remove list
            this._removeList.splice(idx, 1);
        } else {
            // otherwise adding it to the list of playable to add
            this._addList.push(playable);
        }
    }

    public static remove(playable: Playable){
        // If the playable is already being removed
        // it is not added again
        let idx = this._removeList.indexOf(playable);
        if (idx !== -1) {
            return;
        }

        idx = this._addList.indexOf(playable);
        if (idx !== -1) {
            // If the playable was being added
            // taking it out of the add list
            this._addList.splice(idx, 1);
        } else {
            // otherwise adding it to the list of playables to remove
            this._removeList.push(playable);
        }
    }

    public static stop(){
        for (let playableRef = this._playables.first; playableRef !== null; playableRef = playableRef.next) {
            playableRef.object._stopped();
        }
        this._playables.clear();
    }

    public static silent(silent: boolean | undefined = undefined){
        this._silent = silent || false;
    }

    public static debug(debug: boolean | undefined = undefined){
        this._debug = debug || false;
    }

    public static warn(message: string){
        if (!this._silent) {
            console.warn(message);
        }
    }


}

/** @class */
export class Playable{
    private _time: number = 0;
    protected _duration: number = 0;

    public playing: boolean = false;
    public stopping: boolean = false;
    public starting: boolean = false;

    private _iterations: number = 0;

    private _onStart: Function | null = null;
    private _onStop: Function | null = null;
    private _onUpdate: Function | null = null;
    private _onFinish: Function | null = null;

    private _onceFinish: Function[] | null = null;
    public reference: any = null;

    public start(iterations: number | boolean){
        this._iterations = (iterations === true) ? Infinity : (iterations ? iterations : 1);

        if (this._iterations === 0) {
            TINAlight.warn('[Playable.start] playable is required to run 0 times');
            return this;
        }

        if (this.starting) {
            TINAlight.warn('[Playable.start] playable is already starting');
            return this;
        }

        if (this.playing && !this.stopping) {
            TINAlight.warn('[Playable.start] playable is already playing');
            return this;
        }

        this.starting = true;
        TINAlight.add(this);
        return this;
    }

    public stop(){
        if (this.stopping) {
            TINAlight.warn('[Playable.stop] playable is already stopping');
            return this;
        }

        if (!this.playing && !this.starting) {
            TINAlight.warn('[Playable.stop] playable is not playing');
            return this;
        }

        this.stopping = true;
        this.starting = false;
        TINAlight.remove(this);
        return this;
    }

    public fastForwardToEnd(){
        this._time = this._duration;
    }

    private _stopped(){
        this.stopping = false;
        this.playing  = false;
        if (this._onStop !== null) {
            this._onStop();
        }
    }

    private _started() {
        this.starting = false;
        this.playing  = true;
        if (this._onStart !== null) {
            this._onStart();
        }
    };

    private _finished() {
        this.playing  = false;
        TINAlight.remove(this);

        // Copying onceFinish array to ensure that
        // calls to onFinish or callbacks within onceFinish
        // can safely add new onFinish and onceFinish callbacks to this tween
        if (this._onceFinish !== null) {
            let onceFinishArray = this._onceFinish.slice();
            this._onceFinish = null;
            for (let f = 0; f < onceFinishArray.length; f += 1) {
                onceFinishArray[f]();
            }
        }

        if (this._onFinish !== null) {
            this._onFinish();
        }
    };

    protected _reset() {
        this._time = 0;
    };

    // Update method, returns true if playable stops playing
    public update(speed: number) {
        if (this.stopping) {
            this._stopped();
            if (!this.starting) {
                return;
            }
        }

        if (this.starting) {
            this._time = 0;
            this._update();
            this._started();
        } else {
            let t = this._time + speed;
            if (t >= this._duration) {
                if (this._iterations === 1) {
                    this._time = this._duration;
                    this._update();
                    if (this._onUpdate !== null) {
                        this._onUpdate();
                    }
                    this._finished();
                } else {
                    this._time = t % this._duration;
                    this._update();
                    if (this._onUpdate !== null) {
                        this._onUpdate();
                    }
                    this._iterations -= 1;
                }
            } else {
                this._time = t;
                this._update();
                if (this._onUpdate !== null) {
                    this._onUpdate();
                }
            }
        }
    };

    public onUpdate(onUpdate: Function | null) {
        this._onUpdate = onUpdate || null;
        return this;
    };

    public onStart(onStart: Function | null) {
        this._onStart = onStart || null;
        return this;
    };

    public onStop(onStop: Function | null) {
        this._onStop = onStop || null;
        return this;
    };

    public onFinish(onFinish: Function | null) {
        this._onFinish = onFinish || null;
        return this;
    };

    public onceFinish(onceFinish: Function) {
        if (this._onceFinish === null) {
            this._onceFinish = [onceFinish];
        } else {
            this._onceFinish.push(onceFinish);
        }
        return this;
    };

    public removeOnFinish() {
        this._onFinish   = null;
        this._onceFinish = null;
        return this;
    };

    public removeOnUpdate() {
        this._onUpdate = null;
        return this;
    };

    public removeOnStart() {
        this._onStart = null;
        return this;
    };

    public removeOnStop() {
        this._onStop = null;
        return this;
    };

    public getElapsedTime() {
        return this._time;
    };

    public getRemainingTime() {
        return this._duration - this._time;
    };

    protected _update() {
        // To be implemented by subclasses
    }
}


/**
 *
 * @classdesc Delay
 * Execute a callback after a given amount of time has passed
 *
 * @param {number}   duration - Duration of the delay
 * @param {function} onFinish - Callback to execute at the end of the delay
 *
 */
export class Delay extends Playable{
    constructor(duration: number, onFinish: Function) {
        super();

        this._duration = duration;
        this.onFinish(onFinish);
    }


    public reset(duration: number, onFinish: Function){
        this._duration = duration;
        this.removeOnFinish();
        this.onFinish(onFinish);
    }

    protected override _update() {
        // Do nothing
    }
}



