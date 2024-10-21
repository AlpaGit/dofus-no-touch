import { EventEmitter } from 'events';
import Scene from "../../Common/Scene";
import Constants from "../../Common/Constants";
import WebGLRenderer from "../WebGLRenderer";
import MapRenderer from "../MapRenderer";
import Background from "../../Common/Background";

/** Main manager and renderer for map, actors and elements displayed on map.
 *
 * @author  Cedric Stoquer
 */
export default class IsoEngine  extends EventEmitter {
    public mapScene: Scene;
    public renderer: WebGLRenderer;
    public background: Background;

    constructor() {
        super();

        // Creation of roleplay canvas
        let canvasRoleplay = document.createElement('canvas');
        canvasRoleplay.id = 'engineCanvas';

        let dofusBody = document.getElementById('dofusBody');
        if(!dofusBody)
            throw new Error('No Dofus body found');

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
        let backgroundParams = {
            scene: this.mapScene,
            layer: Constants.MAP_LAYER_BACKGROUND,
            position: -1,
            x: -Constants.HORIZONTAL_OFFSET,
            y: -Constants.VERTICAL_OFFSET,
            w: Constants.MAP_SCENE_WIDTH,
            h: Constants.MAP_SCENE_HEIGHT,
            id: 'mapBackground'
        };

        // TODO: remove reference to WebGL Renderer
        this.renderer     = this.mapScene.renderer;
        this.background   = new Background(backgroundParams);
        //this.actorManager = new ActorManager({ isoEngine: this, scene: this.mapScene });
        this.mapRenderer  = new MapRenderer(this.mapScene, this.background);

    }


}