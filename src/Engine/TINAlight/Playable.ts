import TINAlight from "./index.ts";

/** @class */
export default class Playable {
    protected _time: number = 0;
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

    public start(iterations: number | boolean | undefined = undefined) {
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

    public stop() {
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

    public fastForwardToEnd() {
        this._time = this._duration;
    }

    private _stopped() {
        this.stopping = false;
        this.playing = false;
        if (this._onStop !== null) {
            this._onStop();
        }
    }

    private _started() {
        this.starting = false;
        this.playing = true;
        if (this._onStart !== null) {
            this._onStart();
        }
    };

    private _finished() {
        this.playing = false;
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
        this._onFinish = null;
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