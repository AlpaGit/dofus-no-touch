import Vector2D from "../../Common/Vectors/Vector2D.ts";
import { EventEmitter } from "events";

/** Camera constants
 */
const CAMERA_BASE_SPEED = 0.005;
const CAMERA_ACCELERATION = 1.25; // Should be higher than 1
const ZOOM_RATIO = 3000;

const DUMPING = 0.008;
const CATCH_UP = 0.013;

export default class Camera extends EventEmitter {
    public zoom: number = 1;
    public l: number;
    public r: number;
    public t: number;
    public b: number;
    public w: number;
    public h: number;
    public min:Vector2D;
    public max:Vector2D;

    public x: number = 0;
    public y: number = 0;

    public fovW: number = 0;
    public fovH: number = 0;

    public fovWAbsolute: number;
    public fovHAbsolute: number;

    public acceleration: number;
    public a: number;
    private _frozen: boolean;
    public emitAtDestination: boolean;


    public z: number = 1;

    public zoomTarget: number = 1;
    public minZoom: number = 1;
    public maxZoom: number = 1;

    public followee: Vector2D = {x: 0, y: 0};

    constructor(x: number, y: number, zoom: number, l: number, r: number, t: number, b: number, fovW: number, fovH: number, maxZoom: number) {
        super();

        this.l = l;
        this.r = r;
        this.t = t;
        this.b = b;
        this.w = r - l;
        this.h = b - t;
        this.min = {x: 0, y: 0};
        this.max = {x: 0, y: 0};

        this.fovWAbsolute = fovW;
        this.fovHAbsolute = fovH;

        this.setZoomMax(maxZoom);
        this._updateZoomBounds();
        this.setZoom(zoom);

        this.setPosition(x, y);

        this.acceleration = CAMERA_ACCELERATION;
        this.a = this.acceleration;

        this._frozen = false;
        this.emitAtDestination = false;
    }

    public setAcceleration(acceleration: number) {
        this.a = acceleration;
    }

    public setDefaultAcceleration(acceleration: number) {
        this.acceleration = acceleration;
    }

    public freeze() {
        this._frozen = true;
    };

    public unfreeze() {
        this._frozen = false;
    };

    public stopMoving() {
        this.followee = {
            x: this.x,
            y: this.y
        };

        this.zoomTarget = this.zoom;
        this.z = ZOOM_RATIO / this.zoom;
    };

    public setZoom(zoom: number) {
        // Minimum zoom value has priority over maximum zoom value
        zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));

        this.z = ZOOM_RATIO / zoom;
        this.zoom = zoom;
        this.zoomTarget = zoom;

        this._updatePositionBounds();
    };

    public setZoomMax(maxZoom: number) {
        this.maxZoom = maxZoom;
    }

    public setPosition(x: number, y: number) {
        this.x = Math.min(this.max.x, Math.max(this.min.x, x));
        this.y = Math.min(this.max.y, Math.max(this.min.y, y));

        this.followee = {
            x: x,
            y: y
        };
    };


    private _updateZoomBounds() {
        // Computing minimum zoom value with respect to bounds and field of view
        let fovWidthOverTotalWidth   = this.fovWAbsolute / this.w;
        let fovHeightOverTotalHeight = this.fovHAbsolute / this.h;
        this.minZoom = Math.max(fovWidthOverTotalWidth, fovHeightOverTotalHeight);

        if (this.zoom       < this.minZoom) { this.zoom       = this.minZoom; }
        if (this.zoomTarget < this.minZoom) { this.zoomTarget = this.minZoom; }

        this.z = ZOOM_RATIO / this.zoom;
    }

    private _updatePositionBounds() {
        // Computing field of view with respect to targeted zoom and bounds
        this.fovW = this.fovWAbsolute / this.zoomTarget;
        this.fovH = this.fovHAbsolute / this.zoomTarget;

        this.min.x = this.l + this.fovW / 2;
        this.min.y = this.t + this.fovH / 2;

        this.max.x = this.r - this.fovW / 2;
        this.max.y = this.b - this.fovH / 2;

        if (this.min.x > this.max.x) { this.min.x = this.max.x = (this.min.x + this.max.x) / 2; }
        if (this.min.y > this.max.y) { this.min.y = this.max.y = (this.min.y + this.max.y) / 2; }
    };

    public zoomTo(zoom: number) {
        this.zoomTarget = Math.min(Math.max(zoom, this.minZoom), this.maxZoom);
        this._updatePositionBounds();
    };

    // If emitAtDestination is given, camera emits 'reached' event once it moves less than this distance (in px)
    public moveTo(x: number, y: number, emitAtDestination: boolean | undefined = undefined) {
        this.followee = {
            x: x,
            y: y
        };

        if (emitAtDestination !== null && emitAtDestination !== undefined) {
            this.emitAtDestination = true;
        }
    };

    public transform (cx: number, cy: number, tx: number, ty: number, scale: number) {
        // Transforming translations with respect to targetted zoom and position
        let previousZoom = this.zoomTarget;
        cx /= previousZoom;
        cy /= previousZoom;
        tx /= previousZoom;
        ty /= previousZoom;

        let newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, previousZoom * scale));
        let r = 1 - previousZoom / newZoom;

        let previousX = Math.min(this.max.x, Math.max(this.min.x, this.followee.x));
        let previousY = Math.min(this.max.y, Math.max(this.min.y, this.followee.y));
        let x = previousX + (cx - this.fovW / 2) * r + tx;
        let y = previousY + (cy - this.fovH / 2) * r + ty;

        // this.setZoom(newZoom);
        this.zoomTo(newZoom);

        // this.setPosition(x, y);
        this.moveTo(x, y);
    }

    public addInertia(sx: number, sy: number, inertia: number) {
        sx /= this.zoom;
        sy /= this.zoom;

        let s = Math.sqrt(sx * sx + sy * sy);
        if (s === 0) {
            return;
        }

        // Reducing acceleration according to inertia
        this.a = Math.pow(this.acceleration, 1 - inertia);

        // Computing how many steps are require for the camera to reach a speed of 0
        // with respect to new acceleration
        let n = Math.log(s / CAMERA_BASE_SPEED) / Math.log(this.a) - 1;

        // Computing total distance that will be traveled
        // with respect to new acceleration and number of steps
        let d = CAMERA_BASE_SPEED * (1 - Math.pow(this.a, n)) / (1 - this.a);

        // Changing destination with respect to newly computed distance
        this.moveTo(this.x + d * sx / s, this.y + sy * d / s);
    };

    public setFieldOfView(fovW: number, fovH: number) {
        // Field of view when zoom is 1
        this.fovWAbsolute = fovW;
        this.fovHAbsolute = fovH;

        this._updateZoomBounds();
        this._updatePositionBounds();
    };

    public setBounds(l: number, r: number, t: number, b: number) {
        this.l = l;
        this.r = r;
        this.t = t;
        this.b = b;
        this.w = r - l;
        this.h = b - t;

        this._updateZoomBounds();
        this._updatePositionBounds();
    };

    public follow(followee: Vector2D) {
        this.followee = followee;
    };

    public updatePosition(dt: number) {
        if (this._frozen) {
            return;
        }

        // Acceleration tends toward default acceleration
        this.a += (this.acceleration - this.a) * (CATCH_UP * dt);

        // Computing bounds for camera position
        let fovW = this.fovWAbsolute / this.zoomTarget;
        let fovH = this.fovHAbsolute / this.zoomTarget;

        let minX = this.l + fovW / 2;
        let minY = this.t + fovH / 2;

        let maxX = this.r - fovW / 2;
        let maxY = this.b - fovH / 2;

        // Bounding camera destination
        let x = Math.min(maxX, Math.max(minX, this.followee.x));
        let y = Math.min(maxY, Math.max(minY, this.followee.y));
        let z = ZOOM_RATIO / this.zoomTarget;

        let x0 = this.x;
        let y0 = this.y;
        let z0 = this.z;

        // Computing camera's distance to destination
        let dx = x - x0;
        let dy = y - y0;
        let dz = z - z0;

        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(dz) < 0.5) {
            // Camera reached destination
            this.x = x;
            this.y = y;
            this.z = z;

            this.zoom = this.zoomTarget;

            if (this.emitAtDestination) {
                this.emitAtDestination = false;
                this.emit('reached');
            }

            this.a += (1.0 - this.a) * DUMPING;

            return false;
        }

        // Computing traveling ratio (proportion of total remaining distance) adjusted to framerate
        // The speed is not constant, it is a fraction of the remaining distance.
        // The value we are looking for is a + a * (1 - a) + a * (1 - a) ^ 2 + a * (1 - a) ^ 3 + ... + a * (1 - a) ^ dt
        // (where a = this.a - 1)
        // For performance reason and simplicity, the formula was simplified into:
        // (see https://en.wikipedia.org/wiki/Geometric_series to understand that both formula are equivalent)
        var r = 1 - Math.pow(2 - this.a, dt);

        // Computing new camera position
        this.x += r * dx;
        this.y += r * dy;
        this.z += r * dz;

        // Setting zoom value corresponding to position z
        this.zoom = ZOOM_RATIO / this.z;

        return true;
    };

}