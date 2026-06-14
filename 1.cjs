/**
 * ============================================================================
 * DUMP GENERATOR: Aggregates extension source files into a single text dump.
 * File: dump.cjs
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
        error: '\x1b[31m[ERROR]\x1b[0m'
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
        log(`Folder "${path.basename(targetFolder)}" not found in ${process.cwd()}. Please run the setup script first.`, 'error');
        process.exit(1);
    }

    let dumpContent = "================================================================================\n";
    dumpContent += "PERSISTENT ENGINE - CURRENT IMPLEMENTATION DUMP\n";
    dumpContent += `Generated: ${new Date().toISOString()}\n`;
    dumpContent += "================================================================================\n\n";

    let collectedCount = 0;

    targetFiles.forEach(fileName => {
        const filePath = path.join(targetFolder, fileName);
        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf8');
            dumpContent += `--- START OF FILE: ${fileName} ---\n`;
            dumpContent += fileData.trim() + '\n';
            dumpContent += `--- END OF FILE: ${fileName} ---\n\n`;
            collectedCount++;
            log(`Added to dump: ${fileName}`, 'info');
        } else {
            log(`File not found, skipped: ${fileName}`, 'warning');
        }
    });

    dumpContent += "================================================================================\n";
    dumpContent += "END OF DUMP\n";
    dumpContent += "================================================================================\n";

    try {
        fs.writeFileSync(outputFile, dumpContent, 'utf8');
        log(`Successfully created dump with ${collectedCount} files: ${path.basename(outputFile)}`, 'success');
        log('Please run this script and notify us of completion so we can begin auditing the code for bugs.', 'info');
    } catch (e) {
        log(`Failed to write dump file: ${e.message}`, 'error');
    }
}

generateDump();