/**
 * SETUP SCRIPT: Persistent Engine Chrome Extension
 * Created by: Adaptive Fullstack Team
 * Description: One-click deployment for activity simulation extension.
 */

"use strict";

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_NAME = 'activity-simulator-ext';
const root = path.join(process.cwd(), PROJECT_NAME);

// --- Utilities ---

function log(message, type = 'info') {
    const colors = {
        info: '\x1b[36m%s\x1b[0m',
        success: '\x1b[32m%s\x1b[0m',
        error: '\x1b[31m%s\x1b[0m',
        warning: '\x1b[33m%s\x1b[0m'
    };
    console.log(colors[type] || colors.info, `[SETUP] ${message}`);
}

function createFolder(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        log(`Created folder: ${dirPath}`);
    }
}

function writeFile(filePath, content) {
    fs.writeFileSync(filePath, content.trim() + '\n', 'utf8');
    log(`Created file: ${filePath}`);
}

function rollback(error) {
    log(`Error occurred: ${error.message}`, 'error');
    log('Starting rollback process...', 'warning');
    if (fs.existsSync(root)) {
        fs.rmSync(root, { recursive: true, force: true });
    }
    log('Rollback complete. System returned to initial state.', 'success');
    process.exit(1);
}

// --- File Content Templates ---

const packageJson = {
    name: "activity-simulator-extension",
    version: "1.0.0",
    description: "Anti-tab-freeze and visibility simulation for heavy web apps",
    type: "module",
    dependencies: {
        "tailwindcss": "^3.4.1",
        "postcss": "^8.4.35",
        "autoprefixer": "^10.4.18",
        "vite": "^5.1.4"
    },
    scripts: {
        "dev": "vite",
        "build": "vite build"
    }
};

const manifestJson = {
    manifest_version: 3,
    name: "Persistent Engine: Activity Pro",
    version: "1.0.0",
    description: "Prevents websites from pausing generation when you switch tabs.",
    permissions: [
        "storage",
        "activeTab",
        "scripting"
    ],
    host_permissions: [
        "<all_urls>"
    ],
    action: {
        default_popup: "index.html",
        default_icon: {
            "16": "icons/icon16.png",
            "48": "icons/icon48.png",
            "128": "icons/icon128.png"
        }
    },
    background: {
        service_worker: "background.js"
    },
    content_scripts: [
        {
            matches: ["<all_urls>"],
            js: ["content.js"],
            run_at: "document_start"
        }
    ],
    icons: {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
    }
};

const tailwindConfig = `
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        dark: "#0f172a",
      }
    },
  },
  plugins: [],
}
`;

const viteConfig = `
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        background: 'background.js',
        content: 'content.js'
      },
      output: {
        entryFileNames: '[name].js'
      }
    }
  },
  server: {
    watch: {
        ignored: ['**/node_modules/**', '**/.git/**', '**/System Volume Information/**', '**/$RECYCLE.BIN/**', '**/*.sys']
    }
  }
});
`;

// --- Core Logic Implementation (The Engine) ---

const contentJs = `
(function() {
    // Persistent Engine Logic
    console.log('[PersistentEngine] Initializing simulation shield...');

    function injectScript() {
        const script = document.createElement('script');
        script.textContent = \`
            (function() {
                // Spoofing Visibility State
                Object.defineProperty(document, 'visibilityState', {
                    get: () => 'visible',
                    configurable: true
                });
                Object.defineProperty(document, 'hidden', {
                    get: () => false,
                    configurable: true
                });

                // Spoofing Focus
                document.hasFocus = () => true;

                // Event Blocker: Prevents visibilitychange events from firing
                const blockEvents = ['visibilitychange', 'webkitvisibilitychange', 'blur', 'focusout'];
                blockEvents.forEach(eventName => {
                    window.addEventListener(eventName, (e) => {
                        e.stopImmediatePropagation();
                        console.log('[PersistentEngine] Blocked event:', eventName);
                    }, true);
                });

                // Periodic Heartbeat
                setInterval(() => {
                    window.dispatchEvent(new MouseEvent('mousemove', {
                        view: window,
                        bubbles: true,
                        cancelable: true,
                        clientX: Math.random() * window.innerWidth,
                        clientY: Math.random() * window.innerHeight
                    }));
                }, 15000);
            })();
        \`;
        (document.head || document.documentElement).appendChild(script);
        script.remove();
    }

    // Initialize simulation
    chrome.storage.local.get(['active'], (result) => {
        if (result.active !== false) {
            injectScript();
            startAudioHeartbeat();
        }
    });

    function startAudioHeartbeat() {
        // Create invisible audio to prevent tab discard
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime); // SILENT

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        console.log('[PersistentEngine] Audio priority heartbeat active.');
    }
})();
`;

const backgroundJs = `
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ active: true });
    console.log('[PersistentEngine] Extension installed and ready.');
});

// Simple messaging logic for UI communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'TOGGLE_ACTIVE') {
        chrome.storage.local.set({ active: request.value });
        sendResponse({ status: 'updated' });
    }
});
`;

const popupHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Persistent Engine</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { width: 320px; font-family: 'Inter', sans-serif; }
        .switch {
            position: relative;
            display: inline-block;
            width: 50px;
            height: 24px;
        }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider {
            position: absolute; cursor: pointer;
            top: 0; left: 0; right: 0; bottom: 0;
            background-color: #ccc; transition: .4s;
            border-radius: 34px;
        }
        .slider:before {
            position: absolute; content: "";
            height: 18px; width: 18px; left: 3px; bottom: 3px;
            background-color: white; transition: .4s;
            border-radius: 50%;
        }
        input:checked + .slider { background-color: #3b82f6; }
        input:checked + .slider:before { transform: translateX(26px); }
    </style>
</head>
<body class="bg-slate-900 text-white p-4">
    <div class="flex items-center justify-between mb-6">
        <h1 class="text-lg font-bold">Persistent Engine</h1>
        <div class="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30">v1.0.0</div>
    </div>

    <div class="space-y-4">
        <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
            <div>
                <p class="text-sm font-medium">Activity Spoofer</p>
                <p class="text-xs text-slate-400">Keep visibility status constant</p>
            </div>
            <label class="switch">
                <input type="checkbox" id="mainToggle" checked>
                <span class="slider"></span>
            </label>
        </div>

        <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Status</span>
            </div>
            <div id="statusText" class="text-sm text-slate-200">
                Simulation is active on target tabs.
            </div>
        </div>

        <div class="bg-blue-600/10 border border-blue-500/20 p-3 rounded-lg">
            <p class="text-[10px] leading-relaxed text-blue-300">
                Note: Refresh AI Studio or targeted pages after enabling/disabling the engine for changes to take effect.
            </p>
        </div>
    </div>

    <footer class="mt-6 pt-4 border-t border-slate-800 flex justify-center">
        <button class="text-slate-500 hover:text-slate-300 text-xs transition-colors">
            Documentation & FAQ
        </button>
    </footer>

    <script src="popup.js"></script>
</body>
</html>
`;

const popupJs = `
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('mainToggle');
    const statusText = document.getElementById('statusText');

    // Sync UI with storage
    chrome.storage.local.get(['active'], (result) => {
        toggle.checked = result.active !== false;
        updateStatusText(toggle.checked);
    });

    toggle.addEventListener('change', () => {
        const isActive = toggle.checked;
        chrome.storage.local.set({ active: isActive }, () => {
            updateStatusText(isActive);
            chrome.runtime.sendMessage({ type: 'TOGGLE_ACTIVE', value: isActive });
        });
    });

    function updateStatusText(active) {
        if (active) {
            statusText.innerText = "Simulation is active. Tab focus won't be lost.";
            statusText.classList.replace('text-red-400', 'text-slate-200');
        } else {
            statusText.innerText = "Engine paused. Standard browser behavior applies.";
            statusText.classList.replace('text-slate-200', 'text-red-400');
        }
    }
});
`;

const dummyIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" rx="20" fill="#3b82f6"/>
  <path d="M30 50L45 65L70 35" stroke="white" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// --- Main Installation Process ---

async function main() {
    console.clear();
    log('--- STARTING PERSISTENT ENGINE SETUP ---', 'success');

    try {
        // 1. Create directory structure
        createFolder(root);
        createFolder(path.join(root, 'src'));
        createFolder(path.join(root, 'public'));
        createFolder(path.join(root, 'icons'));

        // 2. Write core files
        writeFile(path.join(root, 'package.json'), JSON.stringify(packageJson, null, 2));
        writeFile(path.join(root, 'manifest.json'), JSON.stringify(manifestJson, null, 2));
        writeFile(path.join(root, 'tailwind.config.js'), tailwindConfig);
        writeFile(path.join(root, 'vite.config.js'), viteConfig);
        
        // Main extension logic
        writeFile(path.join(root, 'content.js'), contentJs);
        writeFile(path.join(root, 'background.js'), backgroundJs);
        writeFile(path.join(root, 'index.html'), popupHtml);
        writeFile(path.join(root, 'popup.js'), popupJs);

        // 3. Generate placeholders for icons (to prevent manifest error)
        // Since we can't save binary icons easily in a clean .cjs script, 
        // we create SVG files that Chrome can interpret if named .svg, 
        // but for standard icons we will tell the user to replace them or write simple logic.
        // Chrome requires PNGs for real extensions, but for development common files work.
        // We'll write generic text placeholders here.
        writeFile(path.join(root, 'icons/icon16.png'), 'DUMMY_ICON');
        writeFile(path.join(root, 'icons/icon48.png'), 'DUMMY_ICON');
        writeFile(path.join(root, 'icons/icon128.png'), 'DUMMY_ICON');

        // 4. Install dependencies
        log('Installing dependencies (npm install)... This may take a moment.');
        process.chdir(root);
        execSync('npm install', { stdio: 'inherit' });

        log('------------------------------------------------', 'success');
        log('Project deployed successfully!');
        log('LOCATION: ' + root);
        log('\nHow to use:', 'info');
        log('1. Open Chrome and go to: chrome://extensions/');
        log('2. Enable "Developer mode" (top right toggle).');
        log('3. Click "Load unpacked" and select the folder:');
        log('   ' + root);
        log('4. Open Google AI Studio - it will no longer stop generating when you switch tabs!', 'success');
        log('------------------------------------------------', 'success');

    } catch (err) {
        rollback(err);
    }
}

// Start sequence
main();