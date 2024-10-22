import Constants from "../../Common/Constants";
import Scene from "../../Common/Scene";
import TINAlight from "../TINAlight";

const FRAME_INTERVAL = 1000 / Constants.FPS;

let requestAnimFrame = window.requestAnimationFrame ||
    // @ts-ignore
    window.webkitRequestAnimationFrame ||
    // @ts-ignore
    window.mozRequestAnimationFrame ||
    // @ts-ignore
    window.oRequestAnimationFrame ||
    // @ts-ignore
    window.msRequestAnimationFrame ||
    function (callback) {
        window.setTimeout(callback, FRAME_INTERVAL);
    };

export default class AnimationController {
    public static gameScenes: Scene[]  = [];
    public static previousUpdate: number = Date.now();

    /** Add scene
     *
     * @param {Scene} scene
     */
    public static addScene(scene: Scene) {
        let idx = this.gameScenes.indexOf(scene);
        if (idx === -1) {
            this.gameScenes.push(scene);
        } else {
            console.warn('[AnimationController.addScene] Scene already in the animation controller');
        }
    }

    /** Remove scene
     *
     * @param {Scene} scene
     */
    public static removeScene(scene: Scene) {
        let idx = this.gameScenes.indexOf(scene);
        if (idx !== -1) {
            this.gameScenes.splice(idx, 1);
        } else {
            console.warn('[AnimationController.removeScene] Scene not found in the animation controller');
        }
    }

    /** start the animation controller
     */
    public static start() {
        let self = this;

        function selfUpdate() {
            TINAlight.update();

            let now = Date.now();
            let dt = Math.min(now - self.previousUpdate, 200); // Slowing the game down if fps smaller than 5
            let isDifferentFrame = dt > FRAME_INTERVAL;

            if (isDifferentFrame) {
                self.previousUpdate = now - (dt % FRAME_INTERVAL);
                dt /= FRAME_INTERVAL;

                let scenes = self.gameScenes;
                for (let s = 0; s < scenes.length; s += 1) {
                    scenes[s].refresh(dt);
                }
            }

            requestAnimFrame(selfUpdate);
        }

        selfUpdate();
    }

    /** stop all animations
     */
    public static stop() {
        TINAlight.stop();
    }

}