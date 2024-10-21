import Cache3State from "./index.ts";

export const MANAGEMENT_TYPES : { [key: string]: number } = {
    permanent:  0,
    archivable: 1,
    throwable:  2
};

/** Element Handle containts all the properties necessary for the cache to manage the element
 *
 * @param {Object} element    - Cached element
 * @param {Object} memorySize - Size of the element in memory
 * @param {string} id         - Id of the element
 * @param {String} type       - Type used for memory management strategy
 */
export class ElementHandle {
    public id: string;
    // Cache holding the element
    public cache: Cache3State;

    // Handled element
    public element: any;

    // Size of the element in the cache
    public memorySize: number;

    // Element type, for caching strategy
    public type: number;

    // Number of locks added to the element
    public nLocks: number = 0;

    // Reference to its node in the cache
    public reference:any = null;

    // Additional attachment to the element handle, for convenience purpose
    public attachment: any = null;

    constructor(cache: Cache3State, element: any, memorySize: number, id: string, type: string) {
        this.cache = cache;
        this.element = element;
        this.memorySize = memorySize;
        this.id = id;
        this.type = MANAGEMENT_TYPES[type];
    }

    public isPermanent() {
        return this.type === MANAGEMENT_TYPES.permanent;
    }

    public _hold() : ElementHandle {
        if (this.type === MANAGEMENT_TYPES.permanent) {
            return this;
        }

        this.nLocks++;
        this.cache._holdElement(this);
        return this;
    }

    public release() {
        if (this.type === MANAGEMENT_TYPES.permanent) {
            return this;
        }

        this.nLocks -= 1;
        if (this.nLocks === 0) {
            this.cache._releaseElement(this);
        } else if (this.nLocks < 0) {
            console.error(new Error('[ElementHandle.release] Number of locks is negative: ' + this.id));
        }
    };

    public isFree() {
        return this.nLocks === 0;
    };

}