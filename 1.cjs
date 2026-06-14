/**
 * ============================================================================
 * CURRENT DUMP GENERATOR: Records the exact state of files after rollback.
 * File: dump-current.cjs
 * Runtime: Node.js (CommonJS)
 * ============================================================================
 */

"use strict";

const fs = require('fs');
const path = require('path');

const targetFolder = path.join(process.cwd(), 'persistent-engine-ext');
const outputFile = path.join(process.cwd(), 'dump.txt');

function log(msg, type = 'info') {
    const colors = {
        info: '\x1b[36m[INFO]\x1b[0m',
        success: '\x1b[32m[SUCCESS]\x1b[0m',
        error: '\x1b[31m[ERROR]\x1b[0m',
        warning: '\x1b[33m[WARNING]\x1b[0m'
    };
    console.log(`${colors[type] || '[LOG]'} ${msg}`);
}

const targetFiles = [
    'manifest.json',
    'content.js',
    'background.js',
    'popup.html',
    'popup.js'
];

function generateDump() {
    if (!fs.existsSync(targetFolder)) {
        log(`Folder "${path.basename(targetFolder)}" not found in ${process.cwd()}.`, 'error');
        process.exit(1);
    }

    let dumpContent = "================================================================================\n";
    dumpContent += "PERSISTENT ENGINE - CURRENT STATE POST-ROLLBACK DUMP\n";
    dumpContent += `Generated: ${new Date().toISOString()}\n`;
    dumpContent += `Active Commit State: 6d7475123c52d551972dbbf5eebb3a0f85efad77\n`;
    dumpContent += "================================================================================\n\n";

    let collectedCount = 0;

    targetFiles.forEach(fileName => {
        const filePath = path.join(targetFolder, fileName);
        if (fs.existsSync(filePath)) {
            try {
                const fileData = fs.readFileSync(filePath, 'utf8');
                dumpContent += `--- START OF FILE: ${fileName} ---\n`;
                dumpContent += fileData.trim() + '\n';
                dumpContent += `--- END OF FILE: ${fileName} ---\n\n`;
                collectedCount++;
                log(`Successfully captured: ${fileName}`, 'info');
            } catch (e) {
                log(`Failed to read ${fileName}: ${e.message}`, 'error');
            }
        } else {
            log(`File not present in active codebase: ${fileName}`, 'warning');
        }
    });

    dumpContent += "================================================================================\n";
    dumpContent += "END OF DUMP\n";
    dumpContent += "================================================================================\n";

    try {
        fs.writeFileSync(outputFile, dumpContent, 'utf8');
        log('----------------------------------------------------', 'success');
        log(`Created verified dump with ${collectedCount} files: ${path.basename(outputFile)}`, 'success');
        log('Please run this script and paste/attach the contents of dump.txt here.', 'info');
    } catch (e) {
        log(`Failed to save dump file: ${e.message}`, 'error');
    }
}

generateDump();