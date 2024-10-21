/**
 * AVL TREE Class
 *
 * @author Brice Chevalier
 *
 * @param {function} comparisonFunction comparison function that takes two parameters a and b and returns a number
 *
 * @desc Avl Tree data structure, keep elements sorted, removal and insertion in O(log2(n))
 *
 *    Method                Time Complexity
 *    ___________________________________
 *
 *    add                    O(log2(n))
 *    remove                 O(log2(n))
 *    getRoot                O(1)
 *    getCount               O(1)
 *    forEach                O(n * P) where P is the complexity of the processing function
 *    forEachReverse         O(n * P) where P is the complexity of the processing function
 *    clear                  O(n)
 *
 *    Memory Complexity in O(n)
 */
export default class AvlTree<T> {
    public count: number = 0;
    public root: Node<T> | null = null;
    public cmpFunc: (a: T, b: T) => number;

    constructor(comparisonFunction: (a: T, b: T) => number) {
        this.cmpFunc = comparisonFunction;
    }

    private _addLeft(node: Node<T>, parent: Node<T>) {
        node.parent = parent;
        parent.left = node;
    }

    private _addRight(node: Node<T>, parent: Node<T>) {
        node.parent = parent;
        parent.right = node;
    }

    public add(obj: T) {
        this.count += 1;
        let newNode = new Node(obj, this);
        if (this.root === null) {
            this.root = newNode;
            return newNode;
        }

        let current = this.root;
        for (; ;) {
            let cmp = this.cmpFunc(obj, current.object);
            if (cmp < 0) {
                // Adding to the left
                if (current.left === null) {
                    this._addLeft(newNode, current);
                    break;
                } else {
                    current = current.left;
                }
            } else if (cmp > 0) {
                // Adding to the right
                if (current.right === null) {
                    this._addRight(newNode, current);
                    break;
                } else {
                    current = current.right;
                }
            } else {
                if (current.left === null) {
                    this._addLeft(newNode, current);
                    break;
                } else if (current.right === null) {
                    this._addRight(newNode, current);
                    break;
                } else {
                    if (current.right.height < current.left.height) {
                        current = current.right;
                    } else {
                        current = current.left;
                    }
                }
            }
        }

        this._balance(newNode.parent);

        return newNode;
    }

    private _balanceLeftRight(node: Node<T>) {
        let left = node.left;
        let a = left == null ? null : left.left;
        let b = (left == null || left.right == null) ? null : left.right.left;

        if(left == null || left.right == null){
            return;
        }

        left.right.left = left;
        node.left = left.right;
        left = node.left;
        left.parent = node;

        let leftLeft = left.left;

        if(leftLeft != null){
            leftLeft.parent = left;
            leftLeft.left = a;
            leftLeft.right = b;
        }
        if (a !== null) {
            a.parent = leftLeft;
        }
        if (b !== null) {
            b.parent = leftLeft;
        }

        if(leftLeft != null) {
            left.height = leftLeft.height + 1;
        }
    };

    private _balanceLeftLeft(node: Node<T>) {
        let left = node.left;
        let c = left == null ? null : left.right;

        if (node === this.root) {
            this.root = left;
        } else {
            if(node.parent == null)
                return;

            if (node.parent.right === node) {
                node.parent.right = left;
            } else {
                node.parent.left = left;
            }
        }

        if(left == null)
            return;

        left.right = node;
        left.parent = node.parent;
        node.parent = left;

        node.left = c;

        if(c == null)
            return;

        c.parent = node;

        node.height = node.height - 1;
    };

    private _balanceRightLeft(node: Node<T>) {
        let right = node.right;
        let a = right == null ? null : right.right;
        let b = (right == null || right.left == null) ? null : right.left.right;

        if(right == null || right.left == null){
            return;
        }

        right.left.right = right;
        node.right = right.left;
        right = node.right;
        right.parent = node;

        let rightRight = right.right;

        if(rightRight != null) {
            rightRight.parent = right;
            rightRight.right = a;
            rightRight.left = b;
        }

        if (a !== null) {
            a.parent = rightRight;
        }
        if (b !== null) {
            b.parent = rightRight;
        }

        if(rightRight != null) {
            node.right.height = rightRight.height + 1;
        }
    };

    private _balanceRightRight(node: Node<T>) {
        let right = node.right;
        let c = right == null ? null : right.left;

        if (node === this.root) {
            this.root = right;
        } else {
            if(node.parent != null) {
                if (node.parent.left === node) {
                    node.parent.left = right;
                } else {
                    node.parent.right = right;
                }
            }
        }

        if(right != null) {
            right.left = node;
            right.parent = node.parent;
        }

        node.parent = right;
        node.right = c;
        if (c !== null) {
            c.parent = node;
        }

        node.height = node.height - 1;
    };


    private _balance(node: Node<T> | null) {
        // Balancing the tree
        let current : Node<T> | null = node;
        while (current !== null) {
            let leftHeight = (current.left === null) ? 0 : current.left.height;
            let rightHeight = (current.right === null) ? 0 : current.right.height;
            let newHeight = 1 + Math.max(leftHeight, rightHeight);

            if (newHeight > current.height) {
                current.height = newHeight;
                if (leftHeight - rightHeight > 1) {
                    // Left case
                    if (current.left != null && current.left.right !== null &&
                        (current.left.left === null || current.left.left.height < current.left.right.height)) {
                        // Left Right Case
                        this._balanceLeftRight(current);
                    }

                    // Left Left Case
                    this._balanceLeftLeft(current);

                    // The tree has been balanced
                    break;
                } else if (rightHeight - leftHeight > 1) {
                    // Right case
                    if (current.right != null && current.right.left !== null &&
                        (current.right.right === null || current.right.right.height < current.right.left.height)) {
                        // Right Left Case
                        this._balanceRightLeft(current);
                    }

                    // Right Right Case
                    this._balanceRightRight(current);

                    // The tree has been balanced
                    break;
                } else {
                    // Node is balanced
                    current = current.parent;
                }
            } else {
                break;
            }
        }
    };

    public removeByRef(node: Node<T>) {
        this.count -= 1;

        // Replacing the node by the smallest element greater than it
        let parent = node.parent;
        let left = node.left;
        let right = node.right;

        if (node.right === null) {
            if (parent === null) {
                this.root = left;
            } else {
                if (parent.right === node) {
                    parent.right = left;
                } else {
                    parent.left = left;
                }
            }

            if (left !== null) {
                left.parent = parent;
            }

            this._balance(parent);
            return true;
        }

        let replacement = node.right;
        let balanceFrom;

        if (replacement.left === null) {
            balanceFrom = replacement;

            if (left !== null) {
                left.parent = replacement;
            }
            replacement.left = left;

            if (parent === null) {
                this.root = replacement;
            } else {
                if (parent.right === node) {
                    parent.right = replacement;
                } else {
                    parent.left = replacement;
                }
            }
            replacement.parent = parent;

            this._balance(balanceFrom);

            return true;
        }

        replacement = replacement.left;
        while (replacement.left !== null) {
            replacement = replacement.left;
        }

        if (replacement.right !== null) {
            replacement.right.parent = replacement.parent;
        }

        if(replacement.parent != null) {
            replacement.parent.left = replacement.right;
        }

        if (right !== null) {
            right.parent = replacement;
        }
        replacement.right = right;

        balanceFrom = replacement.parent;

        if (left !== null) {
            left.parent = replacement;
        }
        replacement.left = left;

        if (parent === null) {
            this.root = replacement;
        } else {
            if (parent.right === node) {
                parent.right = replacement;
            } else {
                parent.left = replacement;
            }
        }
        replacement.parent = parent;

        this._balance(balanceFrom);

        return true;
    };

    public getSmallestAbove(obj: T) {
        if (this.root === null) {
            return null;
        }

        let smallestAbove = null;
        let current: Node<T> | null = this.root;
        while (current !== null) {
            let cmp = this.cmpFunc(obj, current.object);
            if (cmp < 0) {
                smallestAbove = current.object;
                // Searching left
                current = current.left;
            } else if (cmp > 0) {
                // Searching right
                current = current.right;
            } else {
                return current.object;
            }
        }

        return smallestAbove;
    };

    public getHeight() {
        return this.root?.height || 0;
    };

    public getRoot() {
        return this.root?.object || null;
    };

    public getCount() {
        return this.count;
    };

    private _forEach(node: Node<T> | null, processingFunc: any, params: any) {
        if (node !== null) {
            processingFunc(node.object, params);
            this._forEach(node.left, processingFunc, params);
            this._forEach(node.right, processingFunc, params);
        }
    };

    public forEach(processingFunc:any, params: any) {
        this._forEach(this.root, processingFunc, params);
    };

    public clear() {
        this.count = 0;
        this.root = null;
    };
}


/**
 * Avl Node class
 */
class Node<T> {
    public object: T;
    public height: number = 1;
    public left: Node<T> | null = null;
    public right: Node<T> | null = null;
    public parent: Node<T> | null = null;
    public container: AvlTree<T>;

    constructor(object: T, container: AvlTree<T>) {
        this.object = object;
        this.container = container;
    }
}
