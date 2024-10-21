// Because we only have one set of sprite boxes, we use that almost like the pixels on a computer screen.
// So then when you have multiple animations, stacked on one another, how do you manage the transition between states?
// What if you have several effects that are animating at the same time, and are in different states.
// What happens when one effect disappears, what if it is overlapped with other animations.  How do you determine the
// state you need to animate to?

// My answer to these questions was forming virtual layers of target animation state.
// This makes it conceptually simple to visualise and manage that animating state of each grid box.
// It also makes the code simple.

// every time you want to apply a state to a cell, you need 2 things.  The desired ending state, and the type of
// animation to get to it, both are specifiable per cell.

// each effect spans a number of cells, has a particular color and animation.  It is logical to group these cells
// together into a layer, these are what the GridAnimationLayers are.
// When layers are added, they are added to the top.
// When layers are removed, the target state for all cells is recalculated.

//TODO: change all cellInfo objects to arrays
import GridFeedbackOverlay from "./GridFeedbackOverlay.ts";

export default class GridAnimator{
    private _gridOverlay: GridFeedbackOverlay;

    constructor() {
        this._gridOverlay = new GridFeedbackOverlay();
    }
}