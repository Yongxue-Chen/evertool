/*
 * Ported from Transitional: Alpha Mask Processor
 * https://github.com/aaron6172/TransitionalAlphaMaskProcessor (MIT License)
 * Copyright (c) aaron6172
 */
class MetadataHandler {
    constructor() {
        this.KEYWORD = "TransitionKernel";
    }

    /**
     * Reads the TransitionKernel metadata from a PNG Blob.
     * @param {Blob} blob 
     * @returns {Promise<Object|null>} JSON object or null
     */
    async readKernelParams(blob) {
        const buffer = await blob.arrayBuffer();
        const data = new Uint8Array(buffer);

        // PNG Signature: 89 50 4E 47 0D 0A 1A 0A
        if (data[0] !== 0x89 || data[1] !== 0x50) return null; // Not PNG

        let offset = 8;
        const view = new DataView(buffer);

        while (offset < data.length) {
            const length = view.getUint32(offset);
            const type = String.fromCharCode(
                data[offset + 4], data[offset + 5], data[offset + 6], data[offset + 7]
            );

            if (type === 'tEXt') {
                // Read content
                const contentStart = offset + 8;
                const contentEnd = contentStart + length;
                const chunkData = data.slice(contentStart, contentEnd);

                // tEXt format: Keyword + Null + Text
                let nullSepIndex = -1;
                for (let i = 0; i < chunkData.length; i++) {
                    if (chunkData[i] === 0) {
                        nullSepIndex = i;
                        break;
                    }
                }

                if (nullSepIndex !== -1) {
                    const keyword = new TextDecoder().decode(chunkData.slice(0, nullSepIndex));
                    if (keyword === this.KEYWORD) {
                        const text = new TextDecoder().decode(chunkData.slice(nullSepIndex + 1));
                        try {
                            return JSON.parse(text);
                        } catch (e) {
                            console.error("Invalid JSON in metadata", e);
                        }
                    }
                }
            } else if (type === 'IEND') {
                break;
            }

            offset += 8 + length + 4; // Length + Type + Data + CRC
        }

        return null;
    }

    /**
     * Injects the kernel parameters into the PNG Blob.
     * @param {Blob} blob Original PNG blob
     * @param {Object} params JSON parameters
     * @returns {Promise<Blob>} New Blob with metadata
     */
    async injectKernelParams(blob, params) {
        const text = JSON.stringify(params);
        const encoder = new TextEncoder();
        const keywordBytes = encoder.encode(this.KEYWORD);
        const textBytes = encoder.encode(text);

        // tEXt Chunk: Length(4) + Type(4) + Data(Keyword + 0 + Text) + CRC(4)
        const dataLen = keywordBytes.length + 1 + textBytes.length;
        const totalLen = 4 + 4 + dataLen + 4;

        const chunk = new Uint8Array(totalLen);
        const view = new DataView(chunk.buffer);

        // Length
        view.setUint32(0, dataLen);

        // Type 'tEXt'
        chunk[4] = 0x74; // t
        chunk[5] = 0x45; // E
        chunk[6] = 0x58; // X
        chunk[7] = 0x74; // t

        // Data
        let p = 8;
        chunk.set(keywordBytes, p);
        p += keywordBytes.length;
        chunk[p] = 0; // Null separator
        p += 1;
        chunk.set(textBytes, p);

        // CRC Calculation
        const crcTrack = chunk.slice(4, 4 + 4 + dataLen); // Type + Data
        const crc = this.crc32(crcTrack);
        view.setUint32(totalLen - 4, crc);

        // We need to insert this BEFORE IEND.
        // It's easier to just append it before IEND if we find IEND.
        // Or blindly append? PNG spec says tEXt can be anywhere.
        // But most readers stop at IEND. So valid PNG must have IEND last.

        // Re-read original blob
        const originalBuffer = await blob.arrayBuffer();
        const originalData = new Uint8Array(originalBuffer);

        // Find IEND
        // Search from end, it's usually the last 12 bytes.
        // IEND chunk is Length(0) + IEND + CRC. 00 00 00 00 49 45 4E 44 ae 42 60 82
        // Length 12 bytes.

        // We will construct: [Data before IEND] + [New Chunk] + [IEND]

        // Let's find start of IEND.
        let iendStart = -1;
        // Simple search scan from end
        for (let i = originalData.length - 12; i >= 8; i--) {
            if (originalData[i] === 0x00 &&
                originalData[i + 1] === 0x00 &&
                originalData[i + 2] === 0x00 &&
                originalData[i + 3] === 0x00 &&
                originalData[i + 4] === 0x49 && // I
                originalData[i + 5] === 0x45 && // E
                originalData[i + 6] === 0x4E && // N
                originalData[i + 7] === 0x44) { // D
                iendStart = i;
                break;
            }
        }

        if (iendStart === -1) {
            console.error("IEND not found, valid PNG?");
            // Fallback: just append (might be broken but readable by some) used to be allowed but technically wrong. 
            // We'll return original blob to avoid corruption.
            return blob;
        }

        const part1 = originalData.slice(0, iendStart);
        const iend = originalData.slice(iendStart);

        const finalBlob = new Blob([part1, chunk, iend], { type: 'image/png' });
        return finalBlob;
    }

    crc32(data) {
        const table = new Uint32Array(256);
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let k = 0; k < 8; k++) {
                if (c & 1) c = 0xedb88320 ^ (c >>> 1);
                else c = c >>> 1;
            }
            table[i] = c;
        }

        let crc = -1;
        for (let i = 0; i < data.length; i++) {
            crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff];
        }
        return (crc ^ -1) >>> 0;
    }
}
