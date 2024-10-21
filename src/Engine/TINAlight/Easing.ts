/**
 *
 * @file A set of ease functions
 *
 * @param {Number} t Progress of the transition in [0, 1]
 * @param (Number) p Additional parameter, when required.
 *
 * @return {Number} Interpolated time
 *
 * @desc Ease functions
 *
 * Initial and final values of the ease functions are either 0 or 1.
 * All the ease functions are continuous for times t in [0, 1]
 *
 * Note: if you want a particular easing method to be added
 * create an issue or contribute at https://github.com/Wizcorp/tina.js
 */

// Math constants (for readability)
const PI          = Math.PI;
const PI_OVER_TWO = Math.PI / 2;
const TWO_PI      = Math.PI * 2;
const EXP         = 2.718281828;

export default class Easing {
    public static none(){
        return 1;
    }

    public static linear(t: number){
        return t;
    }

    // Flash style transition
    // ease in [-1, 1] for usage similar to flash
    // but works with ease in ]-Inf, +Inf[
    public static flash(t: number, ease: number) {
        return t + t * ease - t * t * ease;
    };

    // Parabolic
    public static parabolic(t: number) {
        const r = (2 * t - 1);
        return 1 - r * r;
    };

    // Trigonometric, n = number of iterations in ]-Inf, +Inf[
    public static trigo(t: number, n: number) {
        return 0.5 * (1 - Math.cos(TWO_PI * t * n));
    };

    // Elastic, e = elasticity in ]0, +Inf[
    public static elastic(t: number, e: number) {
        if (t === 1) { return 1; }
        e /= (e + 1); // transforming e
        const n = (1 + e) * Math.log(1 - t) / Math.log(e);
        return Math.cos(n - PI_OVER_TWO) * Math.pow(e, n);
    };

    // Quadratric
    public static quadIn(t: number) {
        return t * t;
    };

    public static quadOut(t: number) {
        return 2 * t - t * t;
    };

    public static quadInOut(t: number) {
        if (t < 0.5) {
            return 2 * t * t;
        } else {
            return 2 * (2 * t - t * t) - 1;
        }
    };

    // Cubic
    public static cubicIn(t: number) {
        return t * t * t;
    };

    public static cubicOut(t: number) {
        return 3 * t - 3 * t * t + t * t * t;
    };

    public static cubicInOut(t: number) {
        if (t < 0.5) {
            return 4 * t * t * t;
        } else {
            return 4 * (3 * t - 3 * t * t + t * t * t) - 3;
        }
    };

    // Quartic
    public static quartIn(t: number) {
        return t * t * t * t;
    };

    public static quartOut(t: number) {
        const t2 = t * t;
        return 4 * t - 6 * t2 + 4 * t2 * t - t2 * t2;
    };

    public static quartInOut(t: number) {
        if (t < 0.5) {
            return 8 * t * t * t * t;
        } else {
            const t2 = t * t;
            return 8 * (4 * t - 6 * t2 + 4 * t2 * t - t2 * t2) - 7;
        }
    };

    // Polynomial, p = power in ]0, + Inf[
    public static polyIn(t: number, p: number) {
        return Math.pow(t, p);
    };

    public static polyOut(t: number, p: number) {
        return 1 - Math.pow(1 - t, p);
    };

    public static polyInOut(t: number, p: number) {
        if (t < 0.5) {
            return Math.pow(2 * t, p) / 2;
        } else {
            return (2 - Math.pow(2 * (1 - t), p)) / 2;
        }
    };

    // Sine
    public static sineIn(t: number) {
        return 1 - Math.cos(t * PI_OVER_TWO);
    };

    public static sineOut(t: number) {
        return Math.sin(PI_OVER_TWO * t);
    };

    public static sineInOut(t: number) {
        if (t < 0.5) {
            return (1 - Math.cos(PI * t)) / 2;
        } else {
            return (1 + Math.sin(PI * (t - 0.5))) / 2;
        }
    };

    // Exponential, e = exponent in ]0, + Inf[
    public static expoIn(t: number, e: number) {
        return (1 - Math.pow(EXP, e * t)) / (1 - Math.pow(EXP, e));
    };

    public static expoOut(t: number, e: number) {
        return (1 - Math.pow(EXP, -e * t)) / (1 - Math.pow(EXP, -e));
    };

    public static expoInOut(t: number, e: number) {
        if (t < 0.5) {
            return (1 - Math.pow(EXP, 2 * e * t)) / (1 - Math.pow(EXP, e)) / 2;
        } else {
            return 0.5 + (1 - Math.pow(EXP, e - 2 * e * t)) / (1 - Math.pow(EXP, -e)) / 2;
        }
    };

    // Circular
    public static circIn(t: number) {
        return 1 - Math.sqrt(1 - Math.pow(t, 2));
    };

    public static circOut(t: number) {
        return Math.sqrt(1 - Math.pow(1 - t, 2));
    };

    public static circInOut(t: number) {
        if (t < 0.5) {
            return (1 - Math.sqrt(1 - 4 * t * t)) / 2;
        } else {
            return (1 + Math.sqrt(-3 + 8 * t - 4 * t * t)) / 2;
        }
    };

    // Elastic, e = elasticity in ]0, +Inf[
    public static elasticIn(t: number, e: number) {
        if (t === 0) { return 0; }
        e /= (e + 1); // transforming e
        const n = (1 + e) * Math.log(t) / Math.log(e);
        return Math.cos(n) * Math.pow(e, n);
    };

    public static elasticOut(t: number, e: number) {
        if (t === 1) { return 1; }
        e /= (e + 1); // transforming e
        const n = (1 + e) * Math.log(1 - t) / Math.log(e);
        return 1.0 - Math.cos(n) * Math.pow(e, n);
    };

    public static elasticInOut(t: number, e: number) {
        let n;
        if (t < 0.5) {
            if (t === 0) { return 0; }
            e /= (e + 1); // transforming e
            n = (1 + e) * Math.log(2 * t) / Math.log(e);
            return 0.5 * Math.cos(n) * Math.pow(e, n);
        }

        if (t === 1) { return 1; }
        e /= (e + 1); // transforming e
        n = (1 + e) * Math.log(2 - 2 * t) / Math.log(e);
        return 0.5 + 0.5 * (1.0 - Math.cos(n) * Math.pow(e, n));
    };

    // Bounce, e = elasticity in ]0, +Inf[
    public static bounceIn(t: number, e: number) {
        if (t === 0) { return 0; }
        e /= (e + 1); // transforming e
        const n = (1 + e) * Math.log(t) / Math.log(e);
        return Math.abs(Math.cos(n) * Math.pow(e, n));
    };

    public static bounceOut(t: number, e: number) {
        if (t === 1) { return 1; }
        e /= (e + 1); // transforming e
        const n = (1 + e) * Math.log(1 - t) / Math.log(e);
        return 1.0 - Math.abs(Math.cos(n) * Math.pow(e, n));
    };

    public static bounceInOut(t: number, e: number) {
        let n;
        if (t < 0.5) {
            if (t === 0) { return 0; }
            e /= (e + 1); // transforming e
            n = (1 + e) * Math.log(2 * t) / Math.log(e);
            return Math.abs(0.5 * Math.cos(n) * Math.pow(e, n));
        }

        if (t === 1) { return 1; }
        e /= (e + 1); // transforming e
        n = (1 + e) * Math.log(2 - 2 * t) / Math.log(e);
        return 0.5 + 0.5 * (1.0 - Math.abs(Math.cos(n) * Math.pow(e, n)));
    };

    // Back, e = elasticity in [0, +Inf[
    public static backIn(t: number, e: number) {
        return t * t * ((e + 1) * t - e);
    };

    public static backOut(t: number, e: number) {
        t -= 1;
        return t * t * ((e + 1) * t + e) + 1;
    };

    public static backInOut(t: number, e: number) {
        if (t < 0.5) {
            t *= 2;
            return 0.5 * (t * t * ((e + 1) * t - e));
        }
        t = 2 * t - 2;
        return 0.5 * (t * t * ((e + 1) * t + e)) + 1;
    };
}