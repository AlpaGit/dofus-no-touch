import { EventEmitter } from 'events';
import Scene from "../../Common/Scene";
import Constants from "../../Common/Constants";
import WebGLRenderer from "../WebGLRenderer";
import MapRenderer from "../MapRenderer";
import Background, {BackgroundParams} from "../../Common/Background";
import AnimationController from "../AnimationController";
import Engine from "../Engine.ts";
import Dimensions, {DimensionsHelper} from "../../Common/DimensionsHelper";

enum GameContext {
    ROLEPLAY = 1,
    FIGHT = 2,
}

/** Main manager and renderer for map, actors and elements displayed on map.
 */
export default class IsoEngine  extends EventEmitter {
    public mapScene: Scene;
    public renderer: WebGLRenderer;
    public background: Background;
    public mapRenderer: MapRenderer;

    public highlightedElements: any;
    public gameContext: GameContext = GameContext.ROLEPLAY;

    public isMovementWaitingForConfirmation: boolean;
    public endMovementCallback: Function | null;
    public isMovementCanceled: boolean;

    public isInGame: boolean = false;

    constructor() {
        super();

        // Creation of roleplay canvas
        let canvasRoleplay = document.createElement('canvas');
        canvasRoleplay.id = 'engineCanvas';

        let dofusBody = document.getElementById('dofusBody');
        if(!dofusBody)
            throw new Error('No Dofus body found');

        canvasRoleplay.width = Dimensions.mapWidth;
        canvasRoleplay.height = Dimensions.mapHeight;

        dofusBody.appendChild(canvasRoleplay);

        // Creation of the roleplay scene
        this.mapScene = new Scene({
            // Scene canvas
            canvas: canvasRoleplay,

            // Scene name
            name: 'mapScene',

            // Scene dimensions parameters
            l: -Constants.HORIZONTAL_OFFSET,
            t: -Constants.VERTICAL_OFFSET,
            w: Constants.MAP_SCENE_WIDTH,
            h: Constants.MAP_SCENE_HEIGHT,

            canvasWidth:  0,
            canvasHeight: 0,

            // Scene aspect parameters
            maxZoom:      Constants.MAX_ZOOM_MAP,
            pixelRatio:   Constants.PIXEL_RATIO,
            textureRatio: Constants.PRERENDER_RATIO_MAP,
            cameraAcceleration: 1.15,

            // Scene renderer parameters
            nbCacheableSprites:     Constants.MAX_SPRITES_BUFFER_MAP,
            textureMemoryCacheSize: Constants.MAX_TEXTURE_MEMORY_MAP,
            prerenderQualityRatio:  Constants.PRERENDER_RATIO_MAP,

            adjustToCanvasRatio: true,
            usePrecisionRendering: true
        });

        // Creation of the roleplay scene's background
        let backgroundParams = new BackgroundParams('mapBackground', this.mapScene, {
            layer: Constants.MAP_LAYER_BACKGROUND,
            position: -1,
            x: -Constants.HORIZONTAL_OFFSET,
            y: -Constants.VERTICAL_OFFSET,
            w: Constants.MAP_SCENE_WIDTH,
            h: Constants.MAP_SCENE_HEIGHT,
        });

        // TODO: remove reference to WebGL Renderer
        this.renderer     = this.mapScene.renderer;
        this.background   = new Background(backgroundParams);
        Engine.background = this.background;
        //this.actorManager = new ActorManager({ isoEngine: this, scene: this.mapScene });
        this.mapRenderer  = new MapRenderer(this.mapScene, this.background);

        this.highlightedElements = {};
        this.gameContext = GameContext.ROLEPLAY;

        this.isMovementWaitingForConfirmation = false;
        this.endMovementCallback = null;
        this.isMovementCanceled = false;

        //this.actionQueue = new ActionQueue();

        // Starting the game loop
        AnimationController.start();

        this.mapScene.camera.setZoom(0); // Setting to smallest zoom level

        this._activateMapScene();
        //this._initGridOverlayLayers();
    }

    public initialize(){
        /** Called when other views are ready */
        //fightSequence.initialize(this);
        //this.mapRenderer.initialize();
        //this.actionQueue.initialize();
        //templateLoading.loadMissingTemplatesInfo();
        //this._loadBitmapFonts();
    }

    public cellHover(_cellId: number, _slotId: number) {
        throw new Error('Method not implemented.');
    }
    public cellHoverRelease(_cellId: number) {
        throw new Error('Method not implemented.');
    }

    /** Resize canvas used for render map, background and grid.
     *  This function is called once on native to set dimensions of map relatively to Gui,
     *  on browser, this function is called when user resize the browser window.
     *
     * @param {Object} dimensions -
     */
    public updateDimensions(dimensions: DimensionsHelper) {
        this.mapScene.setCanvasDimensions(dimensions.mapWidth, dimensions.mapHeight,
            dimensions.mapLeft, dimensions.mapTop, 'absolute');
        this.mapScene.camera.setZoom(0); // Setting to smallest zoom level
        this.mapScene.requireCompleteRefresh();
    }

    /** Activates the map scene for rendering
     *
     * @return {boolean} whether the method actually changed the activation state of the map scene
     */
    private _activateMapScene() {
        if (!this.isInGame) {
            AnimationController.addScene(this.mapScene);
            //AnimationController.addScene(this.actorManager);
            this.isInGame = true;
            return true;
        }

        return false;
    };
}