export default class MemoryChunk {
    public start: number;
    public nBytes: number;
    public update: number = 0;

    public prevChunk: MemoryChunk | null = null;
    public nextChunk: MemoryChunk | null = null;

    public id: string | null = null;
    public obj: any | null = null;
    public ref: any | null = null;
    public nLocks: number = 0;

    constructor(start: number, nBytes: number) {
        this.start = start;
        this.nBytes = nBytes
    }

    public set(start: number, nBytes: number, update: number) {
        this.start = start;
        this.nBytes = nBytes;
        this.update = update;
    }
}