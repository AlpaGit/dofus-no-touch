import {Buffer} from "buffer";

export default class BigEndianReader {
    static readonly INT_SIZE = 32;
    static readonly SHORT_SIZE = 16;
    static readonly SHORT_MIN_VALUE = -0x8000;
    static readonly SHORT_MAX_VALUE = 0x7fff;
    static readonly USHORT_MAX_VALUE = 0x10000;

    static readonly CHUNCK_BIT_SIZE = 7;

    static readonly MASK_10000000 = 128;
    static readonly MASK_01111111 = 127;

    private buffer: Buffer;
    private length: number;
    private pointer: number = 0;

    constructor(buffer: Buffer) {
        this.buffer = buffer;
        this.length = buffer.byteLength;
    }

    static from(buffer: Buffer): BigEndianReader {
        const copiedBuffer = Buffer.allocUnsafe(buffer.byteLength);
        buffer.copy(copiedBuffer);

        return new BigEndianReader(copiedBuffer);
    }

    readVarInt(): number {
        let value: number = 0;
        let size: number = 0;

        while (size < BigEndianReader.INT_SIZE) {
            const byte: number = this.readByte();
            const bit: boolean =
                (byte & BigEndianReader.MASK_10000000) == BigEndianReader.MASK_10000000;

            if (size > 0) {
                value |= (byte & BigEndianReader.MASK_01111111) << size;
            } else {
                value |= byte & BigEndianReader.MASK_01111111;
            }

            size += BigEndianReader.CHUNCK_BIT_SIZE;

            if (bit === false) {
                return value;
            }
        }

        throw "Overflow varint : too much data";
    }

    readVarUInt(): number {
        return this.readVarInt() >>> 0;
    }

    readVarShort(): number {
        let value: number = 0;
        let offset: number = 0;

        while (offset < BigEndianReader.SHORT_SIZE) {
            const byte: number = this.readByte();
            const bit: boolean =
                (byte & BigEndianReader.MASK_10000000) == BigEndianReader.MASK_10000000;

            if (offset > 0) {
                value |= (byte & BigEndianReader.MASK_01111111) << offset;
            } else {
                value |= byte & BigEndianReader.MASK_01111111;
            }

            offset += BigEndianReader.CHUNCK_BIT_SIZE;

            if (!bit) {
                if (value > BigEndianReader.SHORT_MAX_VALUE) {
                    value -= BigEndianReader.USHORT_MAX_VALUE;
                }

                return value;
            }
        }

        throw "Overflow var short : too much data";
    }

    readVarUShort(): number {
        return this.readVarShort() >>> 0;
    }

    readVarLong(): number {
        let low: number | bigint = 0;
        let high: number | bigint = 0;

        let size: number = 0;

        let lastByte: number = 0;

        while (size < 28) {
            lastByte = this.readByte();

            if (
                (lastByte & BigEndianReader.MASK_10000000) ==
                BigEndianReader.MASK_10000000
            ) {
                low |= (lastByte & BigEndianReader.MASK_01111111) << size;
                size += 7;
            } else {
                low |= lastByte << size;

                return low;
            }
        }

        lastByte = this.readByte();

        if (
            (lastByte & BigEndianReader.MASK_10000000) ==
            BigEndianReader.MASK_10000000
        ) {
            low |= (lastByte & BigEndianReader.MASK_01111111) << size;
            high = (lastByte & BigEndianReader.MASK_01111111) >> 4;

            size = 3;

            while (size < 32) {
                lastByte = this.readByte();

                if (
                    (lastByte & BigEndianReader.MASK_10000000) ==
                    BigEndianReader.MASK_10000000
                ) {
                    high |= (lastByte & BigEndianReader.MASK_01111111) << size;
                } else {
                    break;
                }

                size += 7;
            }

            high |= lastByte << size;

            return (low & 0xffffffff) | (high << 32);
        }

        low |= lastByte << size;
        high = lastByte >> 4;

        return (low & 0xffffffff) | (high << 32);
    }

    readVarULong(): number {
        let array: Uint32Array = new Uint32Array([this.readVarLong()]);

        return array[0];
    }

    readByte(): number {
        const value = this.buffer.readUInt8(this.pointer);

        this.pointer += 1;

        return value;
    }

    readChar(): string {
        return String.fromCharCode(this.readByte());
    }

    readBoolean(): boolean {
        const value = this.buffer.readUInt8(this.pointer) === 1;

        this.pointer += 1;

        return value;
    }

    readShort(): number {
        const value = this.buffer.readInt16BE(this.pointer);

        this.pointer += 2;

        return value;
    }

    readUShort(): number {
        const value = this.buffer.readUInt16BE(this.pointer);

        this.pointer += 2;

        return value;
    }

    readInt(): number {
        const value = this.buffer.readInt32BE(this.pointer);

        this.pointer += 4;

        return value;
    }

    readUInt(): number {
        const value = this.buffer.readUInt32BE(this.pointer);

        this.pointer += 4;

        return value;
    }

    readLong(): number {
        const value = this.buffer.readInt32BE(this.pointer);

        this.pointer += 8;

        return value;
    }

    readULong(): number {
        const value = this.buffer.readUInt32BE(this.pointer);

        this.pointer += 4;

        return value;
    }

    readFloat(): number {
        const value = this.buffer.readFloatBE(this.pointer);

        this.pointer += 4;

        return value;
    }

    readDouble(): number {
        const value = this.buffer.readDoubleBE(this.pointer);

        this.pointer += 8;

        return value;
    }

    readUTF(): string {
        const length = this.readUShort();

        const prevPointer = this.pointer;

        this.pointer += length;

        return this.buffer
            .subarray(prevPointer, prevPointer + length)
            .toString("utf8");
    }

    readUTFBytes(length: number): string {
        const prevPointer = this.pointer;

        this.pointer += length;

        return this.buffer
            .subarray(prevPointer, prevPointer + length)
            .toString("utf8");
    }

    getBuffer(): Buffer {
        return this.buffer.subarray(this.pointer);
    }

    getPointer(): number {
        return this.pointer;
    }

    getRemaining(): number {
        return this.length - this.pointer;
    }

    readToEnd(): Buffer {
        const prevPointer = this.pointer;
        this.pointer = this.length;
        return this.buffer.subarray(prevPointer);
    }

    setPointer(pointer: number): this {
        if (pointer < 0) {
            throw "Invalid pointer";
        }
        this.pointer = pointer < 0 ? 0 : pointer;

        return this;
    }
}