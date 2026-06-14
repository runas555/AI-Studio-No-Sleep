/**
 * ============================================================================
 * PATCH SCRIPT v1.2: Corrects race conditions, event capturing, and keep-alive.
 * File: patch.cjs
 * Runtime: Node.js (CommonJS)
 * ============================================================================
 */

"use strict";

const fs = require('fs');
const path = require('path');

const targetFolder = path.join(process.cwd(), 'persistent-engine-ext');
const contentFile = path.join(targetFolder, 'content.js');
const backgroundFile = path.join(targetFolder, 'background.js');

function log(msg, type = 'info') {
    const colors = {
        info: '\x1b[36m[INFO]\x1b[0m',
        success: '\x1b[32m[SUCCESS]\x1b[0m',
        error: '\x1b[31m[ERROR]\x1b[0m'
    };
    console.log(`${colors[type] || '[LOG]'} ${msg}`);
}

// --- UPDATED SYNCHRONOUS CONTENT SCRIPT ---
const updatedContentJs = `
/**
 * PERSISTENT ENGINE - CONTENT SCRIPT (Core Injection v1.3 - Patched)
 * Features: Immediate Sync DOM injection, Capture-phase event suppression.
 */
(function() {
    'use strict';

    // FIRST DEFENSE LINE: Inject hook synchronously at document_start to avoid race conditions
    injectDOMHook();

    let config = {
        engineActive: true,
        preventThrottling: true,
        audioKeepAlive: true,
        activitySimulation: true,
        heartbeatRate: 15
    };

    // Load user configurations asynchronously for sub-modules
    chrome.storage.local.get([
        'engineActive', 
        'preventThrottling', 
        'audioKeepAlive', 
        'activitySimulation', 
        'heartbeatRate'
    ], (result) => {
        config = { ...config, ...result };
        if (config.engineActive) {
            initEngine();
        }
    });

    function initEngine() {
        console.log('[PersistentEngine] Initializing secondary keep-alive modules...');

        if (config.audioKeepAlive) {
            enableAudioPulse();
        }

        if (config.activitySimulation) {
            startVirtualInteractionLoop();
        }

        keepAliveConnection();
    }

    function injectDOMHook() {
        try {
            const script = document.createElement('script');
            script.textContent = \`
                (function() {
                    'use strict';
                    
                    console.log('[PersistentEngine/DOM] Force Overwriting state properties...');

                    // 1. Immutable Property Spoofing
                    Object.defineProperty(document, 'visibilityState', {
                        get: () => 'visible',
                        configurable: true
                    });

                    Object.defineProperty(document, 'hidden', {
                        get: () => false,
                        configurable: true
                    });

                    document.hasFocus = function() { return true; };

                    // 2. Clear property event targets
                    const blockProperties = ['onvisibilitychange', 'onwebkitvisibilitychange', 'onblur', 'onfocus'];
                    blockProperties.forEach(prop => {
                        Object.defineProperty(document, prop, {
                            get: () => null,
                            set: () => {},
                            configurable: true
                        });
                        Object.defineProperty(window, prop, {
                            get: () => null,
                            set: () => {},
                            configurable: true
                        });
                    });

                    // 3. CAPTURING PHASE SUPPRESSION (No prototype pollution of addEventListener)
                    const silentBlocker = function(e) {
                        e.stopImmediatePropagation();
                        e.preventDefault();
                    };

                    const eventsToCatch = ['visibilitychange', 'webkitvisibilitychange', 'blur', 'focusout', 'pagehide', 'freeze'];
                    eventsToCatch.forEach(eventName => {
                        window.addEventListener(eventName, silentBlocker, true);
                        document.addEventListener(eventName, silentBlocker, true);
                    });
                })();
            \`;
            (document.head || document.documentElement).appendChild(script);
            script.remove();
        } catch (e) {
            console.error('[PersistentEngine] Synchronous DOM injection failed:', e);
        }
    }

    function enableAudioPulse() {
        let audioContext;
        const startAudio = () => {
            if (audioContext) return;
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1, audioContext.currentTime);
                gain.gain.setValueAtTime(0.001, audioContext.currentTime);
                
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.start();
                
                console.log('[PersistentEngine] Audio keeps alive.');
                window.removeEventListener('click', startAudio);
                window.removeEventListener('keydown', startAudio);
            } catch (err) {
                console.warn('[PersistentEngine] Audio waiting:', err);
            }
        };
        window.addEventListener('click', startAudio, { passive: true });
        window.addEventListener('keydown', startAudio, { passive: true });
    }

    function startVirtualInteractionLoop() {
        const interval = (config.heartbeatRate || 15) * 1000;
        setInterval(() => {
            if (!config.engineActive) return;

            const moveEvent = new MouseEvent('mousemove', {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: Math.floor(Math.random() * window.innerWidth),
                clientY: Math.floor(Math.random() * window.innerHeight)
            });
            window.dispatchEvent(moveEvent);

            chrome.runtime.sendMessage({ type: 'SIGNAL_PREVENT_PAUSE' }, () => {
                if (chrome.runtime.lastError) return;
            });
        }, interval);
    }

    function keepAliveConnection() {
        setInterval(() => {
            chrome.runtime.sendMessage({ type: 'KEEP_ALIVE' }, () => {
                if (chrome.runtime.lastError) return;
            });
        }, 20000);
    }
})();
`;

// --- UPDATED BACKGROUND SCRIPT WITH KEEP_ALIVE HANDLER ---
const updatedBackgroundJs = `
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        engineActive: true,
        preventThrottling: true,
        audioKeepAlive: true,
        activitySimulation: true,
        heartbeatRate: 15,
        savedCyclesCount: 0
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'SIGNAL_PREVENT_PAUSE') {
        chrome.storage.local.get(['savedCyclesCount'], (res) => {
            const current = res.savedCyclesCount || 0;
            chrome.storage.local.set({ savedCyclesCount: current + 1 });
            sendResponse({ ack: true, currentCount: current + 1 });
        });
        return true; 
    }
    
    if (request.type === 'KEEP_ALIVE') {
        // Resolve channel cleanly to prevent extension port exceptions
        sendResponse({ alive: true });
        return false;
    }
});
`;

function executePatch() {
    if (!fs.existsSync(contentFile) || !fs.existsSync(backgroundFile)) {
        log('Required extension files not found. Make sure "persistent-engine-ext" folder exists.', 'error');
        process.exit(1);
    }

    try {
        fs.writeFileSync(contentFile, updatedContentJs.trim() + '\n', 'utf8');
        log('Patched content.js successfully (Race conditions resolved, Event capturing applied).', 'success');

        fs.writeFileSync(backgroundFile, updatedBackgroundJs.trim() + '\n', 'utf8');
        log('Patched background.js successfully (Keep-alive channel warnings fixed).', 'success');

        log('----------------------------------------------------', 'success');
        log('Bugfix complete. Please reload the extension inside edge://extensions/ to apply changes.', 'info');
    } catch (e) {
        log(`Failed to apply patch: ${e.message}`, 'error');
    }
}

executePatch();