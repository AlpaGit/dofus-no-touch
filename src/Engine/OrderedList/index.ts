/**
 * PRIORITY LIST Class
 *
 * @param {function} comparisonFunction - comparison function that takes two parameters a and b and returns a number
 *
 * @desc Priority list data structure, elements remain sorted
 *
 *    Method                Time Complexity
 *    ___________________________________
 *
 *    add                    O(n), O(1) if insertion at the beginning or at the end of the list
 *    remove                 O(1)
 *    getFirst               O(1)
 *    getLast                O(1)
 *    popFirst               O(1)
 *    popLast                O(1)
 *    getCount               O(1)
 *    forEach                O(n * P) where P is the complexity of the input function
 *    forEachReverse         O(n * P) where P is the complexity of the input function
 *    clear                  O(n) indirectly because of garbage collection
 *
 *    Memory Complexity in O(n)
 */
import IList from "./IList.ts";

export default class OrderedList<T> implements IList {
    public count: number;
    public first: OrderedListNode<T> | null;
    public last: OrderedListNode<T> | null;
    public cmpFunc: (a: T, b: T) => number;

    constructor(comparisonFunction: (a: T, b: T) => number) {
        this.count = 0;
        this.first = null;
        this.last = null;
        this.cmpFunc = comparisonFunction;
    }

    public add(obj: T) : any {
        let newNode = new OrderedListNode(obj, null, null, this);
        this.count += 1;

        if (this.first === null) {
            this.first = newNode;
            this.last  = newNode;
            return newNode;
        }

        let cmpFirst = this.cmpFunc(obj, this.first.object);
        if (cmpFirst < 0) {
            // insertion at the beginning of the list
            newNode.next = this.first;
            this.first.previous = newNode;
            this.first = newNode;
            return newNode;
        }

        let cmpLast = this.cmpFunc(obj, this.last!.object);
        if (cmpLast >= 0) {
            // insertion at the end
            newNode.previous = this.last;
            this.last!.next = newNode;
            this.last = newNode;
            return newNode;
        }

        let current;
        if (cmpFirst + cmpLast < 0) {
            current = this.first.next;
            while (this.cmpFunc(obj, current!.object) >= 0) {
                current = current!.next;
            }

            // insertion before current
            newNode.next = current;
            newNode.previous = current!.previous;
            newNode.previous!.next = newNode;
            current!.previous = newNode;
        } else {
            current = this.last!.previous;
            while (this.cmpFunc(obj, current!.object) < 0) {
                current = current!.previous;
            }

            // insertion after current
            newNode.previous = current;
            newNode.next = current!.next;
            newNode.next!.previous = newNode;
            current!.next = newNode;
        }
        return newNode;
    };

    public removeByRef(node: OrderedListNode<T>) {
        if (!node || node.container !== this) {
            return false;
        }
        this.count -= 1;

        // Removing any reference to the node
        if (node.previous === null) {
            this.first = node.next;
        } else {
            node.previous.next = node.next;
        }
        if (node.next === null) {
            this.last = node.previous;
        } else {
            node.next.previous = node.previous;
        }

        // Removing any reference from the node to any other element of the list
        node.previous  = null;
        node.next      = null;
        node.container = null;
        return true;
    };

    public moveToTheBeginning (node: OrderedListNode<T>) {
        if (!node || node.container !== this) {
            return false;
        }

        if (node.previous === null) {
            // node is already the first one
            return true;
        }

        // Connecting previous node to next node
        node.previous.next = node.next;

        if (this.last === node) {
            this.last = node.previous;
        } else {
            // Connecting next node to previous node
            node.next!.previous = node.previous;
        }

        // Adding at the beginning
        node.previous = null;
        node.next = this.first;
        node.next!.previous = node;
        this.first = node;
        return true;
    };

    public moveToTheEnd(node: OrderedListNode<T>) {
        if (!node || node.container !== this) {
            return false;
        }

        if (node.next === null) {
            // node is already the last one
            return true;
        }

        // Connecting next node to previous node
        node.next.previous = node.previous;

        if (this.first === node) {
            this.first = node.next;
        } else {
            // Connecting previous node to next node
            node.previous!.next = node.next;
        }

        // Adding at the end
        node.next = null;
        node.previous = this.last;
        node.previous!.next = node;
        this.last = node;
        return true;
    };

    public possess(node: OrderedListNode<T>) {
        return node && (node.container === this);
    };

    public popFirst() {
        let node = this.first;
        if (!node) {
            return null;
        }

        this.count -= 1;
        let pop  = node.object;

        this.first = node.next;
        if (this.first !== null) {
            this.first.previous = null;
        }

        node.next = null;
        node.container = null;
        return pop;
    };

    public popLast() {
        let node = this.last;
        if (!node) {
            return null;
        }

        this.count -= 1;
        let pop  = node.object;

        this.last = node.previous;
        if (this.last !== null) {
            this.last.next = null;
        }

        node.previous = null;
        node.container = null;
        return pop;
    };

    public getFirst() {
        return this.first && this.first.object;
    };

    public getLast() {
        return this.last && this.last.object;
    };

    public clear() {
        for (let current = this.first; current; current = current.next) {
            current.container = null;
        }

        this.count = 0;
        this.first = null;
        this.last  = null;
    };

    public getCount() {
        return this.count;
    };

    public toArray(): T[] {
        let arrayList: T[] = [];
        let current = this.first;

        if(!current) {
            return arrayList;
        }

        for (; current; current = current.next) {
            arrayList.push(current.object);
        }
        return arrayList;
    };

    public forEach(processingFunc: any, params: any) {
        for (let current = this.first; current; current = current.next) {
            processingFunc(current.object, params);
        }
    }

    public reposition(node: OrderedListNode<T>) {
        if (node.container !== this) {
            return this.add(node.object);
        }

        let prev = node.previous;
        let next = node.next;
        let obj  = node.object;

        if (next === null) {
            this.last = prev;
        } else {
            next.previous = prev;
        }

        if (prev === null) {
            this.first = next;
        } else {
            prev.next = next;
        }

        while (prev !== null && this.cmpFunc(obj, prev.object) < 0) {
            next = prev;
            prev = prev.previous;
        }

        while (next !== null && this.cmpFunc(obj, next.object) >= 0) {
            prev = next;
            next = next.next;
        }

        node.next = next;
        if (next === null) {
            this.last = node;
        } else {
            next.previous = node;
        }

        node.previous = prev;
        if (prev === null) {
            this.first = node;
        } else {
            prev.next = node;
        }

        return node;
    };
}

export class OrderedListNode<T> {
    public object: T;
    public previous: OrderedListNode<T> | null;
    public next: OrderedListNode<T> | null;
    public container: OrderedList<T> | null;

    constructor(object: T, previous: OrderedListNode<T> | null, next: OrderedListNode<T> | null, container: OrderedList<T>) {
        this.object = object;
        this.previous = previous;
        this.next = next;
        this.container = container;
    }
}