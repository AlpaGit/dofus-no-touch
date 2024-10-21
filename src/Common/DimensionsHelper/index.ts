import Constants from '../Constants'

// in px, max thickness of sidebar
const MAX_SIDEBAR_NARROW = 175;
const MAX_SIDEBAR_WIDE = 210;

/**
 * Most common dimensions are: (all in px)
 *  dimensions.screenWidth: total width of viewport
 *  dimensions.screenHeight: total height of viewport
 *  dimensions.physicalScreenWidth: actual width of physical screen
 *  dimensions.physicalScreenHeight: actual height of physical screen
 *  dimensions.mapLeft: offset of left side of map. >0 if a "black stripe" is on the left of the map canvas
 *  dimensions.mapTop: offset of top side of map. >0 if a "black stripe" is on the top of the map canvas
 *  dimensions.mapWidth: width of map canvas area
 *  dimensions.mapHeight: height of map canvas area
 *  dimensions.mapRight: offset of right side of map canvas (= mapLeft + mapWidth)
 *  dimensions.mapBottom: offset of bottom side of map canvas (= mapTop + mapHeight)
 *  dimensions.windowFullScreenHeight: maximum height of windows
 *  dimensions.windowFullScreenWidth: maximum width of windows
 *  NB: we could add more constants for windows, e.g. when we want them to overlap the menubar
 */


export class DimensionsHelper {
    physicalScreenWidth: number;
    physicalScreenHeight: number;
    screenWidth: number = 0;
    screenHeight: number = 0;
    physicalToViewportRatio: number = 1;
    mapWidth: number = 0;
    mapHeight: number = 0;
    zoom: number = 1;
    sideBarWidth: number = 0;
    bottomBarHeight: number = 0;
    mapLeft: number = 0;
    mapTop: number = 0;
    mapRight: number = 0;
    mapBottom: number = 0;
    windowFullScreenWidth: number = 0;
    windowFullScreenHeight: number = 0;
    screenExceptToolbar: { left: number, top: number, width: number, height: number } = { left: 0, top: 0, width: 0, height: 0 };

    constructor() {
        this.physicalScreenWidth = Math.max(window.screen.width, window.screen.height);
        this.physicalScreenHeight = Math.min(window.screen.width, window.screen.height);

        this.updateScreen();
    }

    updateScreen(screenWidth?: number, screenHeight?: number) {
        this.screenWidth = screenWidth || document.documentElement.clientWidth;
        this.screenHeight = screenHeight || document.documentElement.clientHeight;
        this.physicalToViewportRatio = this.screenWidth / this.physicalScreenWidth;
    }

    computeMapSize(mapHeight: number) {
        const fittingRatio = mapHeight / Constants.MAP_SCENE_HEIGHT;
        this.mapWidth = ~~(Constants.MAP_SCENE_WIDTH * fittingRatio);
        this.mapHeight = ~~(Constants.MAP_SCENE_HEIGHT * fittingRatio);
        this.zoom = Constants.PIXEL_RATIO * fittingRatio;

        this.sideBarWidth = this.screenWidth - this.mapWidth;
        this.bottomBarHeight = this.screenHeight - this.mapHeight;
    }
    // NB: To decide if we are "fighting", we use the "real" flag, to avoid too much map resizing.
    // If this resize operation was triggered by option change or toolbar edit, we can leave the
    // toolbar thickness as it is.
    computeSideBarThickness(mode: string) {
        let numRows;
        if (mode === 'narrow') {
            // numRows = window.gui.playerData.isFighting ? gameOptions.toolbarThicknessInFight : 1;
            numRows = 1;
        } else {
            numRows = 3; // always 3 rows thick in wide mode
        }
        return numRows * Constants.SHORTCUT_ICON_SIZE + Constants.SHORTCUT_GAUGE_SIZE + 5;
    }
    resizeNarrowScreen() {
        const mode = 'narrow';
        let mapHeight = this.screenHeight - this.computeSideBarThickness(mode);
        let zoom = mapHeight / Constants.MAP_SCENE_HEIGHT;
        const mapWidth = ~~(Constants.MAP_SCENE_WIDTH * zoom);
        // if resulting width would exceed the screen, reduce zoom
        if (mapWidth > this.screenWidth) {
            zoom = this.screenWidth / Constants.MAP_SCENE_WIDTH;
            mapHeight = ~~(Constants.MAP_SCENE_HEIGHT * zoom);
        }

        this.computeMapSize(mapHeight);
        this.bottomBarHeight = Math.min(this.bottomBarHeight, MAX_SIDEBAR_NARROW);
        //computeBestSizeForUi(mode, isFighting);

        this.mapLeft = Math.round(this.sideBarWidth / 2);
        this.mapTop = this.screenHeight - this.bottomBarHeight - this.mapHeight;
        this.mapRight = this.mapLeft + this.mapWidth;
        this.mapBottom = this.mapTop + this.mapHeight;

        this.windowFullScreenWidth = this.screenWidth;
        this.windowFullScreenHeight = this.mapBottom; // on iPad we leave the menu bars always visible for now

        this.screenExceptToolbar = {
            left: 0,
            top: 0,
            width: this.screenWidth,
            height: this.screenHeight - this.bottomBarHeight
        };
    }

    resizeWideScreen() {
        const mode = 'wide';
        const mapWidth = this.screenWidth - this.computeSideBarThickness(mode);
        const zoom = mapWidth / Constants.MAP_SCENE_WIDTH;
        const mapHeight = ~~(Constants.MAP_SCENE_HEIGHT * zoom);

        this.computeMapSize(Math.min(mapHeight, this.screenHeight));
        this.sideBarWidth = Math.min(this.sideBarWidth, MAX_SIDEBAR_WIDE);

        this.mapLeft = this.screenWidth - this.sideBarWidth - this.mapWidth;
        this.mapTop = Math.round(this.bottomBarHeight / 2);
        this.mapRight = this.mapLeft + this.mapWidth;
        this.mapBottom = this.mapTop + this.mapHeight;

        this.windowFullScreenWidth = this.screenWidth;
        this.windowFullScreenHeight = this.screenHeight;

        this.screenExceptToolbar = {
            left: 0,
            top: 0,
            width: this.screenWidth - this.sideBarWidth,
            height: this.screenHeight
        };
    }
}

const Dimensions = new DimensionsHelper();
Dimensions.updateScreen();

export default Dimensions;
