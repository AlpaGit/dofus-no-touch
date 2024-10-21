import {ElementHandle, MANAGEMENT_TYPES} from "./ElementHandle.ts";
import DoublyList from "../DoublyList";

/** Holds a list of elements being used by the cache
 *
 * @param {number} memoryAllocated  - Total memory allocated
 * @param {number} onElementRemoved - Callback triggered whenever an element is removed from the cache
 */
export default class Cache3State {
    public memoryAllocated: number;
    public onElementRemoved: (any: any) => void | null;
    public elementsById: { [key: string]: ElementHandle } = {};
    public unidentifiedElementsCount: number;
    public addCount: number;
    public removeCount: number;
    public memoryUsed: number;

    public actives: DoublyList;
    public archives: DoublyList;

    constructor(memoryAllocated: number, onElementRemoved: (obj: any) => void) {
        this.memoryAllocated = memoryAllocated;
        this.onElementRemoved = onElementRemoved;

        this.elementsById = {};

        // If an element is permanent it is not necessary to add it to the cache
        // As it will never be removed it is not necessary to keep track of its last use
        this.actives  = new DoublyList();
        this.archives = new DoublyList();

        this.memoryUsed = 0;
        this.memoryAllocated = memoryAllocated;

        this.onElementRemoved = onElementRemoved || null;

        this.unidentifiedElementsCount = 0;

        this.addCount = 0;
        this.removeCount = 0;
    }

    private _clean() {
        // Removing elements to satisfy the memory constraint
        let handleRef = this.archives.first;
        while (handleRef !== null && this.memoryUsed > this.memoryAllocated) {
            let handle = handleRef.object;
            handleRef = handleRef.next;
            if (handle.nLocks <= 0) {
                this._removeElement(handle);
            }
        }
    };

    public log() {
        console.log('***** Cache Stats *****');
        console.log('  Actives', this.actives.length);
        console.log('  Archives', this.archives.length);
        console.log('  Total', Object.keys(this.elementsById).length);
        console.log('  Usage (units)', this.memoryUsed);
        console.log('  Usage (percentage)', (100 * this.memoryUsed / this.memoryAllocated).toFixed(0), '%');
        console.log('  Elements', this.elementsById);
    };

    public _holdElement(handle: ElementHandle) {
        if (handle.type !== MANAGEMENT_TYPES.permanent) { // Nothing to do if element is permanent
            if (handle.reference.container === this.actives) {
                // Element already in the list of active elements
                // Putting image at the end of the list
                // O(1)
                this.actives.moveToTheEnd(handle.reference);
            } else {
                // Moving element from archives to actives
                // O(1)
                this.archives.removeByReference(handle.reference);
                handle.reference = this.actives.addBack(handle);
            }
        }
    };

    public _releaseElement(handle: ElementHandle) {
        this._archiveElement(handle);
    };

    private _archiveElement(handle: ElementHandle) {
        // Moving the element from active to archived
        if (handle.reference.container !== this.actives) {
            console.warn('[Cache3State.archiveElement] The element cannot be archived:', handle.id);
            return;
        }

        if (handle.type === MANAGEMENT_TYPES.throwable) {
            this._removeElement(handle);
        } else {
            this.actives.removeByReference(handle.reference);
            handle.reference = this.archives.addBack(handle);
            this._clean();
        }
    };

    private _addElement(handle: ElementHandle) {
        // Adding to element map
        this.elementsById[handle.id] = handle;

        // Adding to memory count
        this.memoryUsed += handle.memorySize;

        // Making sure the cache does not use too much memory
        this._clean();

        if (handle.type !== MANAGEMENT_TYPES.permanent) {
            handle.reference = this.actives.addBack(handle);
        }

        this.addCount++;
    }

    public addAndHoldElement(element: any, memorySize: number, id: string | undefined | null, type: string | null | undefined = undefined, replace: boolean = false) {
        let isIdentified = id === undefined || id === null;

        if (id === undefined || id === null) {
            id = 'unidentified' + String(this.unidentifiedElementsCount++);
        }

        if (type === undefined || type === null) {
            type = isIdentified ? 'archivable' : 'throwable';
        }

        let handle = this.elementsById[id];
        if (handle !== undefined) {
            if (replace) {
                if (!handle.isFree()) {
                    console.warn('[Cache3State.addElement] Trying to replace a locked element', id);
                    return handle._hold();
                }

                // Element already present
                // Removing it so that it can be replaced
                this._removeElement(handle);
            } else {
                if (handle.type !== MANAGEMENT_TYPES[type]) {
                    console.warn('[Cache3State.addElement] Trying to change type of an exisiting element', id);
                }

                return handle._hold();
            }
        }

        handle = new ElementHandle(this, element, memorySize, id, type);
        this._addElement(handle);

        return handle._hold();
    };

    public holdElement(elementId: string) {
        let handle = this.elementsById[elementId];
        if (handle !== undefined) {
            return handle._hold();
        }
    };

    public useElement(elementId: string) {
        let handle = this.elementsById[elementId];
        if (handle !== undefined) {
            return handle;
        }
    };

    private _removeElement(handle: ElementHandle) {
        // Removing from element map
        delete this.elementsById[handle.id];

        // Removing from memory count
        this.memoryUsed -= handle.memorySize;

        if (handle.type !== MANAGEMENT_TYPES.permanent) {
            // Removing from list
            if (handle.reference.container === this.actives) {
                handle.reference = this.actives.removeByReference(handle.reference);
            } else {
                handle.reference = this.archives.removeByReference(handle.reference);
            }
        }


        // Applying callback
        if (this.onElementRemoved !== null) {
            this.onElementRemoved(handle.element);
        }

        this.removeCount += 1;
    };
}