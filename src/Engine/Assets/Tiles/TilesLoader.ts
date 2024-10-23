import BigEndianReader from "../Reader/BigEndianReader.ts";
import EleGraphical from "../Elements/EleGraphical.ts";
import EleGraphicalNormal from "../Elements/EleGraphicalNormal.ts";
import EleGraphicalBoundingBox from "../Elements/EleGraphicalBoundingBox.ts";
import EleGraphicalAnimated from "../Elements/EleGraphicalAnimated.ts";
import EleGraphicalParticles from "../Elements/EleGraphicalParticles.ts";
import EleGraphicalEntity from "../Elements/EleGraphicalEntity.ts";
import {EleGraphicalElementTypes} from "../Elements/EleGraphicalElementTypes.ts";
import {Buffer} from "buffer";
// @ts-ignore
import pako from 'pako';
import MapGraphicalElement from "../Maps/MapGraphicalElement.ts";

export class TileRequest {
    public image: HTMLImageElement | null = null;
    public element: EleGraphical | null = null;
    public gfx: MapGraphicalElement;
    public error: boolean = false;

    constructor(gfx: MapGraphicalElement) {
        this.gfx = gfx;
    }
}

export class TilesRequest {
    public tiles: TileRequest[];
    public progress: number;

    constructor(tiles: TileRequest[]) {
        this.tiles = tiles;
        this.progress = 0;
    }
}

const DEFINITION_URL = "/assets/tiles/tiles_references.json";
const TILES_URL = "/assets/tiles/";
const ELEMENTS_URL = "/assets/maps/elements.ele";

export default class TilesLoader {
    private static _tilesDefinitions: { [key: string]: string } = {};
    private static _elements: {[key: number]: EleGraphical} = {};

    public static async initialize() {
        await Promise.all([
            TilesLoader._loadDefinitions(),
            TilesLoader._loadElements()
        ]);
    }

    private static async _loadElements() : Promise<void> {
        let perfStart = performance.now();

        try {
            const res = await fetch(ELEMENTS_URL);
            const data = await res.blob();
            const arrayBuffer = await data.arrayBuffer();

            const reader = new BigEndianReader(Buffer.from(new Uint8Array(arrayBuffer)));

            let header = reader.readByte();

            if (header === 69) {
                TilesLoader._loadEleFile(reader);
                return;
            }

            // zlib compressed
            reader.setPointer(0);
            const decompressed = pako.inflate(Buffer.from(new Uint8Array(arrayBuffer)));
            const decompressedReader = new BigEndianReader(Buffer.from(decompressed));

            header = decompressedReader.readByte();

            if (header === 69) {
                TilesLoader._loadEleFile(decompressedReader);
                return;
            }

            throw new Error("Invalid header");
        }
        finally {
            let perfEnd = performance.now();
            console.log('Loaded elements in ' + (perfEnd - perfStart) + 'ms');
        }
    }

    private static _loadEleFile(reader: BigEndianReader) {
        const version = reader.readByte();
        const count = reader.readUInt();

        TilesLoader._elements = {};

        for(let i = 0; i < count; i++) {
            if (version >= 9) {
                // we skip a short
                reader.readShort();
            }

            const id = reader.readUInt();
            const type = reader.readByte();

            switch (type) {
                case EleGraphicalElementTypes.Normal:
                    TilesLoader._elements[i] = EleGraphicalNormal.fromRaw(reader, id);
                    break;
                case EleGraphicalElementTypes.BoundingBox:
                    TilesLoader._elements[i] = EleGraphicalBoundingBox.fromRaw(reader, id);
                    break;
                case EleGraphicalElementTypes.Animated:
                    TilesLoader._elements[i] = EleGraphicalAnimated.fromRawAnimated(reader, id, version);
                    break;
                case EleGraphicalElementTypes.Entity:
                    TilesLoader._elements[i] = EleGraphicalEntity.fromRawEntity(reader, id, version);
                    break;
                case EleGraphicalElementTypes.Particles:
                    TilesLoader._elements[i] = EleGraphicalParticles.fromRaw(reader, id);
                    break;
                case EleGraphicalElementTypes.Blended:
                    console.log("Blended");
                    break;
                default:
                    throw new Error(`Unknown element type ${type}`);
            }
        }
    }

    private static async _loadDefinitions() : Promise<void> {
        let perfStart = performance.now();

        const req = await fetch(DEFINITION_URL);
        TilesLoader._tilesDefinitions = await req.json();

        let perfEnd = performance.now();
        console.log('Loaded definitions in ' + (perfEnd - perfStart) + 'ms');
    }

    public static async load(request: TilesRequest) {
        return new Promise<void>((resolve) => {
            request.progress = 0;

            // we have to load all the files in parallel to avoid blocking the main thread
            for (let i = 0; i < request.tiles.length; i++) {
                let tile = request.tiles[i];
                // we have to check in the _elements object if the file is an element
                const element = TilesLoader._elements[tile.gfx.id];

                if(element === undefined || !(element instanceof EleGraphicalNormal)) {
                    request.progress++;
                    tile.error = true;

                    console.warn('Missing elements entry for gfx ', tile, element);
                    if(request.progress === request.tiles.length){
                        resolve();
                    }
                    continue;
                }

                tile.element = element;

                let fileIdentifier = element.gfx + ".png";

                const definition = TilesLoader._tilesDefinitions[fileIdentifier];

                if (definition === undefined) {
                    console.log('Missing definition for ', fileIdentifier);
                    tile.error = true;
                    request.progress++;
                    if (request.progress === request.tiles.length) {
                        resolve();
                    }
                    continue;
                }

                let fileUrl = TILES_URL + definition + "/" + fileIdentifier;

                let image = new Image();
                image.onload = function () {
                    request.progress++;
                    let percent = Math.round(request.progress / request.tiles.length * 100);
                    console.log('Loaded ' + tile.gfx.id + ' (' + percent + '%)');
                    if (request.progress === request.tiles.length) {
                        resolve();
                    }

                    tile.image = this as HTMLImageElement;
                    // Resetting callbacks to avoid memory leaks
                    this.onload  = null;
                    this.onerror = null;
                };

                image.onerror = function () {
                    request.progress++;
                    console.warn('Failed to load ' + tile.gfx.id);
                    if (request.progress === request.tiles.length) {
                        resolve();
                    }

                    // Resetting callbacks to avoid memory leaks
                    this.onload  = null;
                    this.onerror = null;
                }

                image.src = fileUrl;
            }
        });
    }



}