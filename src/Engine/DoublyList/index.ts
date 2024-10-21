/**
 * DOUBLY LIST Class
 *
 * @author Brice Chevalier
 *
 * @desc Doubly list data structure
 *
 * Method      Time Complexity
 * ___________________________________
 *
 * add (front and back)    O(1)
 * pop (front and back)    O(1)
 * remove by reference     O(1)
 * remove                  O(n)
 * moveToBeginning         O(1)
 * moveToEnd               O(1)
 * clear                   O(n)
 *
 * Memory Complexity in O(n)
 */


export default class DoublyList {
    public first: ListNode | null;
    public last: ListNode | null;
    public length: number;

    constructor() {
        this.first = null;
        this.last = null;
        this.length = 0;
    }

    public addFront(obj: any) {
        let newNode = new ListNode(obj, null, this.first, this);
        if (this.first === null) {
            this.first = newNode;
            this.last  = newNode;
        } else {
            this.first.previous = newNode;
            this.first          = newNode;
        }

        this.length += 1;
        return newNode;
    };

    public add(obj: any) {
        return this.addFront(obj);
    }

    public addBack(obj: any) {
        let newNode = new ListNode(obj, this.last, null, this);
        if (this.last === null) {
            this.first = newNode;
            this.last  = newNode;
        } else {
            this.last.next = newNode;
            this.last      = newNode;
        }

        this.length += 1;
        return newNode;
    }

    public popFront() {
        let object = this.first?.object;

        if(object === undefined) {
            return null;
        }

        this.removeByReference(this.first);

        return object;
    }

    public pop() {
        return this.popFront();
    }

    public popBack() {
        let object = this.last?.object;

        if(object === undefined) {
            return null;
        }

        this.removeByReference(this.last);

        return object;
    }

    public addBefore(node: ListNode, obj: any) {
        let newNode = new ListNode(obj, node.previous, node, this);

        if (node.previous !== null) {
            node.previous.next = newNode;
        }

        node.previous = newNode;

        if (this.first === node) {
            this.first = newNode;
        }

        this.length += 1;
        return newNode;
    };

    public addAfter(node: ListNode, obj: any) {
        let newNode = new ListNode(obj, node, node.next, this);

        if (node.next !== null) {
            node.next.previous = newNode;
        }

        node.next = newNode;

        if (this.last === node) {
            this.last = newNode;
        }

        this.length += 1;
        return newNode;
    };

    public moveToTheBeginning(node: ListNode) {
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

    public moveToTheEnd(node: ListNode) {
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

     public removeByReference(node: ListNode | null) {
         if(node == null)
             return null;

        if (node.container !== this) {
            console.warn('[DoublyList.removeByReference] Trying to remove a node that does not belong to the list');
            return node;
        }

        if (node.next === null) {
            this.last = node.previous;
        } else {
            node.next.previous = node.previous;
        }

        if (node.previous === null) {
            this.first = node.next;
        } else {
            node.previous.next = node.next;
        }

        node.container = null;
        this.length -= 1;

        return null;
    };

    public remove(object: any) {
        for (let node = this.first; node !== null; node = node.next) {
            if (node.object === object) {
                this.removeByReference(node);
                return true;
            }
        }

        return false;
    };

    public clear() {
        // Making sure that nodes containers are being resetted
        for (let node = this.first; node !== null; node = node.next) {
            node.container = null;
        }

        this.first  = null;
        this.last   = null;
        this.length = 0;
    };

    public forEach(processingFunc: any, params: any = null) {
        for (let node = this.first; node; node = node.next) {
            processingFunc(node.object, params);
        }
    };

    public toArray() {
        let objects = [];
        for (let node = this.first; node !== null; node = node.next) {
            objects.push(node.object);
        }

        return objects;
    };
}

class ListNode {
    public object: any;
    public previous: ListNode | null;
    public next: ListNode| null;
    public container: DoublyList | null;

    constructor(object: any, prev: ListNode | null, next: ListNode | null, container: DoublyList) {
        this.object = object;
        this.container = container;
        this.previous = prev;
        this.next = next;
    }
}




