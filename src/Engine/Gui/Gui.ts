import Dimensions from "../../Common/DimensionsHelper";
import Engine from "../Engine.ts";

export default class Gui {
    constructor() {
        this._initAutoResize();
    }

    private _resizeUi(){
        Dimensions.updateScreen();
        Dimensions.resizeWideScreen();

        if(Engine.isoEngine) {
            Engine.isoEngine.updateDimensions(Dimensions);
        }
    }

    private _initAutoResize() {
        this._resizeUi();

        let resizeTimer: number = 0;
        let self = this;

        function resizeAfterDelay() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                self._resizeUi();
            }, 10)  as any as number;
        }

        window.addEventListener('scroll', resizeAfterDelay);
        window.addEventListener('resize', resizeAfterDelay);
    }
}