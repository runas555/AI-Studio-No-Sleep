/**
 * ============================================================================
 * PATCH SCRIPT: Renders custom Google AI Sparkle & Activity Ring PNG icons.
 * File: patch-icon.cjs
 * Runtime: Node.js (CommonJS)
 * ============================================================================
 */

"use strict";

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const targetFolder = path.join(process.cwd(), 'persistent-engine-ext', 'icons');

function log(msg, type = 'info') {
    const colors = {
        info: '\x1b[36m[INFO]\x1b[0m',
        success: '\x1b[32m[SUCCESS]\x1b[0m',
        error: '\x1b[31m[ERROR]\x1b[0m'
    };
    console.log(`${colors[type] || '[LOG]'} ${msg}`);
}

// --- PROGRAMMATIC PNG GENERATION ENGINE WITH GOOGLE AI DESIGN ---
class GoogleAIPngGenerator {
    static crc32Table() {
        if (this._crc32Table) return this._crc32Table;
        const table = [];
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let j = 0; j < 8; j++) {
                c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            }
            table[i] = c;
        }
        this._crc32Table = table;
        return table;
    }

    static crc32(buffer) {
        const table = this.crc32Table();
        let crc = 0xFFFFFFFF;
        for (let i = 0; i < buffer.length; i++) {
            crc = table[(crc ^ buffer[i]) & 0xFF] ^ (crc >>> 8);
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    static createChunk(type, data) {
        const len = data.length;
        const buf = Buffer.alloc(8 + len + 4);
        buf.writeUInt32BE(len, 0);
        buf.write(type, 4, 4, 'ascii');
        data.copy(buf, 8);
        const crcVal = this.crc32(buf.subarray(4, 8 + len));
        buf.writeUInt32BE(crcVal, 8 + len);
        return buf;
    }

    /**
     * Renders Google AI Sparkle (Astroid Math) & glowing green Keep-Alive ring.
     */
    static generateIconBuffer(size) {
        const rawPixels = Buffer.alloc(size * size * 4);
        const center = size / 2;
        const ringRadius = size * 0.38;
        const ringThickness = Math.max(1.5, size * 0.05);
        const starRadius = size * 0.24;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = (y * size + x) * 4;
                const dx = x - center;
                const dy = y - center;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // 1. Math check for outer Active Ring
                const inRing = Math.abs(dist - ringRadius) <= (ringThickness / 2);

                // 2. Math check for Google AI Sparkle (Astroid equation: x^(2/3) + y^(2/3) <= 1)
                const ndx = Math.abs(dx) / starRadius;
                const ndy = Math.abs(dy) / starRadius;
                const inStar = (Math.pow(ndx, 2/3) + Math.pow(ndy, 2/3)) <= 1;

                if (inStar) {
                    // Radiant Google AI core: White center fading to vibrant magenta-violet edges
                    const starDist = Math.pow(ndx, 2/3) + Math.pow(ndy, 2/3); // 0 at core, 1 at edge
                    rawPixels[idx] = Math.round(255 - starDist * 60);      // R (White to Light Violet)
                    rawPixels[idx + 1] = Math.round(255 - starDist * 200);  // G
                    rawPixels[idx + 2] = 255;                              // B
                    rawPixels[idx + 3] = 255;                              // Alpha
                } else if (inRing) {
                    // Glowing Emerald Green Protection Ring
                    rawPixels[idx] = 16;                                   // R
                    rawPixels[idx + 1] = 185;                              // G
                    rawPixels[idx + 2] = 129;                              // B
                    rawPixels[idx + 3] = 255;                              // Alpha
                } else {
                    // Transparent pixels for modern look
                    rawPixels[idx] = 0;
                    rawPixels[idx + 1] = 0;
                    rawPixels[idx + 2] = 0;
                    rawPixels[idx + 3] = 0;
                }
            }
        }
        return rawPixels;
    }

    static buildPNG(size) {
        const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
        const ihdrData = Buffer.alloc(13);
        ihdrData.writeUInt32BE(size, 0);
        ihdrData.writeUInt32BE(size, 4);
        ihdrData[8] = 8; ihdrData[9] = 6; ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0;
        const ihdrChunk = this.createChunk('IHDR', ihdrData);

        const rawPixels = this.generateIconBuffer(size);
        const filteredData = Buffer.alloc(size * (size * 4 + 1));
        let srcOffset = 0; let destOffset = 0;

        for (let y = 0; y < size; y++) {
            filteredData[destOffset++] = 0;
            rawPixels.copy(filteredData, destOffset, srcOffset, srcOffset + size * 4);
            destOffset += size * 4; srcOffset += size * 4;
        }

        const deflated = zlib.deflateSync(filteredData, { level: 9 });
        const idatChunk = this.createChunk('IDAT', deflated);
        const iendChunk = this.createChunk('IEND', Buffer.alloc(0));

        return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
    }
}

// --- RUN DESIGN TRANSFORMATION ---
function execute() {
    if (!fs.existsSync(targetFolder)) {
        log(`Folder not found: ${targetFolder}. Please make sure setup has run first.`, 'error');
        process.exit(1);
    }

    try {
        const sizes = [16, 48, 128];
        for (const size of sizes) {
            const pngBuf = GoogleAIPngGenerator.buildPNG(size);
            const iconPath = path.join(targetFolder, `icon${size}.png`);
            fs.writeFileSync(iconPath, pngBuf);
            log(`Rendered custom Google AI style PNG: icon${size}.png`, 'success');
        }
        log('----------------------------------------------------', 'success');
        log('AI Studio No Sleep design successfully updated!', 'success');
        log('Please reload the extension inside edge://extensions/ to see the new gorgeous icons.', 'info');
    } catch (e) {
        log(`Failed to apply new design patch: ${e.message}`, 'error');
    }
}

execute();