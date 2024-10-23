// Constants from dofus game

let Constants = {
    // Constants
    CELL_WIDTH: 86,
    CELL_HEIGHT: 43,
    CELL_SIDE: -1,
    MAP_SCENE_WIDTH_IN_CELLS: 14.5,
    MAP_SCENE_HEIGHT_IN_CELLS: 20.5,
    NB_CELLS: 560,
    MAP_SCENE_WIDTH: 0,
    MAP_SCENE_HEIGHT: 0,
    MAP_BORDER_H: 30,
    MAP_BORDER_V: 20,
    GRID_ALTITUDE_OFFSET: 22,
    HORIZONTAL_OFFSET: 53,
    VERTICAL_OFFSET: 15,
    WIDTH_PADDING: 20,
    HEIGHT_PADDING: -16,
    MAX_ZOOM_MAP: 1.1,
    PIXEL_RATIO: 1,
    CHAT_BTN_MIN_WIDTH: 68,
    CHAT_BTN_MIN_HEIGHT: 50,
    PING_EMOTE_BTN_NARROW_MIN_WIDTH: 50,
    PING_EMOTE_BTN_WIDE_MIN_HEIGHT: 50,
    PING_EMOTE_BTN_WIDE_MIN_WIDTH: 40,
    ICONBAR_CORNER_HEIGHT: 19,
    ICONBAR_CORNER_WIDTH: 36,
    ICONBAR_TAB_WIDTH: 42,
    ICONBAR_TAB_HEIGHT: 35,
    SHORTCUT_ICON_SIZE: 50,
    MENU_ICON_SIZE: 42,
    SHORTCUT_GAUGE_SIZE: 13,
    MISSING_TEXTURE_IMAGE_SRC: 'data:image/gif;base64,R0lGODlhAQABAIAAAOAv/wAAACwAAAAAAQABAAACAkQBADs=',
    EMPTY_IMAGE: new Image(),
    PRERENDER_RATIO_MAP: 1,
    PRERENDER_RATIO_WORLDMAP: 1,
    PRERENDER_RATIO_CHARACTER_DISPLAY: 1,
    MAX_MUSIC_SFX_MEMORY: 1000,
    MAX_TEXTURE_MEMORY_MAP: 102400000,
    MAX_TEXTURE_MEMORY_WORLDMAP: 51200000,
    MAX_TEXTURE_MEMORY_CHARACTER_DISPLAY: 20480000,
    MAX_SPRITES_BUFFER_MAP: 80000,
    MAX_SPRITES_BUFFER_WORLDMAP: 4000,
    MAX_SPRITES_BUFFER_CHARACTER_DISPLAY: 9000,
    MAX_ANIMATIONS: 30,
    // Layer positions of roleplay scene elements
    MAP_LAYER_BACKGROUND: -1,
    MAP_LAYER_PLAYGROUND: 0, // Actors / interactives are here
    MAP_LAYER_FOREGROUND: 1,
    MAP_LAYER_TRANSPARENT: 2,
    MAP_LAYER_ICONS: 3,
    MAP_LAYER_POINT_LABELS: 4,
    MAP_LAYER_TAP_FEEDBACK: 5,
    MAP_LAYER_TARGET_INDICATOR: 6,
    TRANSPARENT_MODE_ALPHA: 0.725,
    FPS: 60,
    TIME_UNITS_PER_SECOND: 25
};

Constants.CELL_SIDE = Math.sqrt(2 * Constants.CELL_HEIGHT * Constants.CELL_HEIGHT);
Constants.PIXEL_RATIO = (window.devicePixelRatio || 1);

Constants.MAP_SCENE_WIDTH  = (Constants.CELL_WIDTH  * Constants.MAP_SCENE_WIDTH_IN_CELLS)  + Constants.WIDTH_PADDING;
Constants.MAP_SCENE_HEIGHT = (Constants.CELL_HEIGHT * Constants.MAP_SCENE_HEIGHT_IN_CELLS) + Constants.HEIGHT_PADDING;

// Prerendering ratio of texture dynamically created
// TODO: use device performance to compute prerender ratio quality
// i.e the lower the performance of the device the smaller the prerendering quality
Constants.PRERENDER_RATIO_MAP = 1;
Constants.PRERENDER_RATIO_WORLDMAP          = Constants.PIXEL_RATIO;
Constants.PRERENDER_RATIO_CHARACTER_DISPLAY = 2 * Constants.PIXEL_RATIO;

Constants.EMPTY_IMAGE.src = Constants.MISSING_TEXTURE_IMAGE_SRC;
// There should be some minumum memory allocation for sprite buffers:
// TODO: find a way to avoid having to specify minimum memory allocations for sprite buffers
// 20000 minimum sprites in map buffer
// 2500 minimum sprites in worldmap buffer
// 4000 minimum sprites in ui characters buffer

/*if (false) {
    let capacity = deviceInfo.capacity || 512 * 1024 * 1024; // If no specified capacity we suppose a capacity of 512MB
    let allocationRatio = deviceInfo.isAndroid ? 0.3 : 0.5;
    let maxAllocation = capacity * allocationRatio * 0.4;

    // Maximum memory allocated to music and sfx (in seconds)
    exports.MAX_MUSIC_SFX_MEMORY = Math.round(0.43 * maxAllocation / bytesPerSecond); // in seconds

    // Maximum memory taken by textures (in bytes)
    // Retina screen devices should have enough memory to hold texture of higher resolution
    exports.MAX_TEXTURE_MEMORY_MAP               = Math.round(0.25 * maxAllocation);
    exports.MAX_TEXTURE_MEMORY_WORLDMAP          = Math.round(0.10 * maxAllocation);
    exports.MAX_TEXTURE_MEMORY_CHARACTER_DISPLAY = Math.round(0.05 * maxAllocation);

    // Maximum number of sprites that can be held by the vertex buffer
    exports.MAX_SPRITES_BUFFER_MAP               = Math.max(Math.round(0.04  * maxAllocation / spriteBytes), 20000);
    exports.MAX_SPRITES_BUFFER_WORLDMAP          = Math.max(Math.round(0.005 * maxAllocation / spriteBytes), 2500);
    exports.MAX_SPRITES_BUFFER_CHARACTER_DISPLAY = Math.max(Math.round(0.005 * maxAllocation / spriteBytes), 4000);

    exports.MAX_ANIMATIONS = Math.round(0.12 * maxAllocation / bytesPeAnimation);
} else {*/

// We are in browser, memory party!
// Maximum memory allocated to music and sfx (in seconds)
Constants.MAX_MUSIC_SFX_MEMORY = 1000;

// Maximum memory taken by textures (in bytes)
// Retina screen devices should have enough memory to hold texture of higher resolution
Constants.MAX_TEXTURE_MEMORY_MAP               = 1024 * 1024 * 100;
Constants.MAX_TEXTURE_MEMORY_WORLDMAP          = 1024 * 1024 * 50;
Constants.MAX_TEXTURE_MEMORY_CHARACTER_DISPLAY = 1024 * 1024 * 20;

// Maximum number of sprites that can be hold by the vertex buffer
Constants.MAX_SPRITES_BUFFER_MAP               = 80000;
Constants.MAX_SPRITES_BUFFER_WORLDMAP          = 4000;
Constants.MAX_SPRITES_BUFFER_CHARACTER_DISPLAY = 9000;

Constants.MAX_ANIMATIONS = 30;

Constants.TRANSPARENT_MODE_ALPHA = 0.725;

//}
export default Constants;