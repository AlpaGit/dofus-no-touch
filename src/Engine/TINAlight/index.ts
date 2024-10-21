// Using performance.now, beyond giving better precision,
// its avoids a bug that happens once in a million sessions:
// Data.now is based on a clock that is synchronized by a few milliseconds
// every 15-20 mins and could cause the timer to go backward in time.
// (legend or true fact? not sure, but I think I noticed it once)
// see: http://updates.html5rocks.com/2012/08/When-milliseconds-are-not-enough-performance-now
import Constants from "../../Common/Constants";
import Easing from "./Easing.ts";
import DoublyList from "../DoublyList";
import Playable from "./Playable.ts";

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
    private static _addList: any[] = [];
    private static _removeList: any[] = [];

    private static _silent: boolean = true;
    static _debug :boolean = false;

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
        playable.start(1);
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


