import Dimensions from "../DimensionsHelper";

export default class Foreground{

    public convertScreenToCanvasCoordinate(x: number, y: number) {
        return {
            x: x - Dimensions.mapLeft,
            y: y - Dimensions.mapTop
        };
    };
}