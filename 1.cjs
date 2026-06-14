/**
 * ============================================================================
 * PATCH SCRIPT: Core Infrasound (1Hz) & chrome.power API integration.
 * File: patch-cold-start-final.cjs
 * Runtime: Node.js (CommonJS)
 * ============================================================================
 */

"use strict";

const fs = require('fs');
const path = require('path');

const targetFolder = path.join(process.cwd(), 'persistent-engine-ext');
const manifestFile = path.join(targetFolder, 'manifest.json');
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

// --- 1. UPDATE MANIFEST WITH SYSTEM POWER API PERMISSION ---
function patchManifest() {
    if (!fs.existsSync(manifestFile)) return false;
    try {
        const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
        
        if (!manifest.permissions.includes('power')) {
            manifest.permissions.push('power');
        }
        
        fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 4), 'utf8');
        log('Added system "power" keep-awake permission to manifest.json.', 'success');
        return true;
    } catch (e) {
        log(`Failed to patch manifest: ${e.message}`, 'error');
        return false;
    }
}

// --- 2. UPDATE BACKGROUND WITH POWER AWAKE FORCE ---
const updatedBackgroundJs = `
let activePulseInterval = null;
const connectedPorts = new Set();

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        engineActive: true,
        preventThrottling: true,
        audioKeepAlive: true,
        activitySimulation: true,
        heartbeatRate: 15,
        savedCyclesCount: 0
    });
    updateToolbarBadge();
});

// Force-keep the system process awake using official Chrome Power API
function requestSystemAwake() {
    try {
        chrome.power.requestKeepAwake('system');
        console.log('[AI Studio No Sleep] System background process wake-lock engaged.');
    } catch (e) {
        console.warn('[AI Studio No Sleep] Failed to lock system state:', e);
    }
}

function broadcastWakeUp() {
    connectedPorts.forEach(port => {
        try {
            port.postMessage({ type: 'WAKE_UP_PULSE' });
        } catch (e) {
            connectedPorts.add(port);
        }
    });

    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            if (tab.url && tab.url.includes('aistudio.google.com')) {
                chrome.tabs.update(tab.id, { autoDiscardable: false }, () => {
                    if (chrome.runtime.lastError) return;
                });
            }
        });
    });
}

function startGlobalPulse() {
    requestSystemAwake();
    if (activePulseInterval) clearInterval(activePulseInterval);
    activePulseInterval = setInterval(broadcastWakeUp, 500);
}

function updateToolbarBadge() {
    chrome.storage.local.get(['engineActive'], (res) => {
        const active = res.engineActive !== false;
        if (active) {
            chrome.action.setBadgeText({ text: "ON" });
            chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
        } else {
            chrome.action.setBadgeText({ text: "OFF" });
            chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
        }
    });
}

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "KeepAlivePort") {
        connectedPorts.add(port);
        if (!activePulseInterval) startGlobalPulse();

        port.onDisconnect.addListener(() => {
            connectedPorts.delete(port);
            if (connectedPorts.size === 0 && activePulseInterval) {
                clearInterval(activePulseInterval);
                activePulseInterval = null;
                try { chrome.power.releaseKeepAwake(); } catch (e) {}
            }
        });
    }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.storage.local.get(['engineActive'], (res) => {
        if (res.engineActive !== false) {
            chrome.tabs.update(activeInfo.tabId, { autoDiscardable: false }, () => {
                if (chrome.runtime.lastError) return;
            });
        }
    });
});

startGlobalPulse();

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
        if (!activePulseInterval) startGlobalPulse();
        sendResponse({ alive: true });
        return false;
    }
    if (request.type === 'TOGGLE_ACTIVE') {
        setTimeout(updateToolbarBadge, 100);
        sendResponse({ ack: true });
        return false;
    }
});
`;

// --- 3. UPDATE CONTENT WITH 1HZ INFRASOUND HACK ---
const updatedContentJs = `
/**
 * AI STUDIO NO SLEEP - CONTENT SCRIPT (v2.3 - Final Cold Start Fix)
 * Features: Infrasound Media Priority (1Hz) to completely bypass Edge sleeping mode.
 */
(function() {
    'use strict';

    injectDOMHook();

    let config = {
        engineActive: true,
        preventThrottling: true,
        audioKeepAlive: true,
        activitySimulation: true,
        heartbeatRate: 15
    };

    chrome.storage.local.get([
        'engineActive', 
        'preventThrottling', 
        'audioKeepAlive', 
        'activitySimulation', 
        'heartbeatRate',
        'uiLang'
    ], (result) => {
        config = { ...config, ...result };
        if (config.engineActive) {
            initEngine(result.uiLang || 'RU');
        }
    });

    function initEngine(lang) {
        console.log('[AI Studio No Sleep] Initializing infrasound shield...');

        if (config.audioKeepAlive) {
            enableInfrasoundPulse();
        }

        if (config.activitySimulation) {
            startVirtualInteractionLoop();
        }

        setupLongLivedPort();
        startGenerationObserver(lang);
    }

    function injectDOMHook() {
        try {
            const script = document.createElement('script');
            script.textContent = \`
                (function() {
                    'use strict';
                    
                    Object.defineProperty(document, 'visibilityState', {
                        get: () => 'visible',
                        configurable: true
                    });

                    Object.defineProperty(document, 'hidden', {
                        get: () => false,
                        configurable: true
                    });

                    document.hasFocus = function() { return true; };

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

                    const silentBlocker = function(e) {
                        e.stopImmediatePropagation();
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('PERSISTENT_EVENT_BLOCKED'));
                    };
                    const eventsToCatch = ['visibilitychange', 'webkitvisibilitychange', 'blur', 'focusout', 'pagehide', 'freeze'];
                    eventsToCatch.forEach(eventName => {
                        window.addEventListener(eventName, silentBlocker, true);
                        document.addEventListener(eventName, silentBlocker, true);
                    });

                    // requestAnimationFrame queue
                    const activeRafCallbacks = new Map();
                    let rafIdCounter = 0;

                    const nativerAF = window.requestAnimationFrame;
                    window.requestAnimationFrame = function(callback) {
                        const id = ++rafIdCounter;
                        activeRafCallbacks.set(id, callback);
                        
                        nativerAF(function(timestamp) {
                            if (activeRafCallbacks.has(id)) {
                                activeRafCallbacks.delete(id);
                                try { callback(timestamp); } catch(e) {}
                            }
                        });
                        return id;
                    };

                    const nativeCancelRAF = window.cancelAnimationFrame;
                    window.cancelAnimationFrame = function(id) {
                        if (activeRafCallbacks.has(id)) {
                            activeRafCallbacks.delete(id);
                        } else {
                            nativeCancelRAF(id);
                        }
                    };

                    window.addEventListener('message', function(event) {
                        if (event.data && event.data.type === 'FORCE_RENDER_TICK') {
                            if (activeRafCallbacks.size > 0) {
                                const now = performance.now();
                                const callbacks = Array.from(activeRafCallbacks.entries());
                                activeRafCallbacks.clear();
                                
                                callbacks.forEach(function([id, cb]) {
                                    try { cb(now); } catch(err) {}
                                });
                            }
                        }
                    });
                })();
            \`;
            (document.head || document.documentElement).appendChild(script);
            script.remove();
        } catch (e) {
            console.error('[AI Studio No Sleep] DOM injection failed:', e);
        }

        window.addEventListener('PERSISTENT_EVENT_BLOCKED', () => {
            chrome.runtime.sendMessage({ type: 'SIGNAL_PREVENT_PAUSE' });
        });
    }

    // INFRASOUND HACK: Plays 1Hz at 0.02 volume (100% silent, completely forces Edge media priority)
    function enableInfrasoundPulse() {
        let audioContext;
        const startAudio = () => {
            if (audioContext) return;
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1, audioContext.currentTime); // 1Hz infrasound
                gain.gain.setValueAtTime(0.02, audioContext.currentTime); 
                
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.start();
                
                console.log('[AI Studio No Sleep] Infrasound Priority locked.');
                
                window.removeEventListener('click', startAudio);
                window.removeEventListener('keydown', startAudio);
            } catch (err) {}
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
                clientX: 10,
                clientY: 10
            });
            window.dispatchEvent(moveEvent);

            chrome.runtime.sendMessage({ type: 'SIGNAL_PREVENT_PAUSE' }, () => {
                if (chrome.runtime.lastError) return;
            });
        }, interval);
    }

    function setupLongLivedPort() {
        const port = chrome.runtime.connect({ name: "KeepAlivePort" });
        
        port.onMessage.addListener((msg) => {
            if (msg.type === 'WAKE_UP_PULSE') {
                window.postMessage({ type: 'FORCE_RENDER_TICK' }, '*');
                if (Math.random() > 0.8) {
                    chrome.runtime.sendMessage({ type: 'SIGNAL_PREVENT_PAUSE' });
                }
            }
        });

        port.onDisconnect.addListener(() => {
            setTimeout(setupLongLivedPort, 1000);
        });
    }

    let scrollInterval = null;
    function startAutoScroll() {
        if (scrollInterval) clearInterval(scrollInterval);
        scrollInterval = setInterval(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            const elements = document.querySelectorAll('div, section, main, md-block');
            elements.forEach(el => {
                const overflow = window.getComputedStyle(el).overflowY;
                if (el.scrollHeight > el.clientHeight && (overflow === 'auto' || overflow === 'scroll')) {
                    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
                }
            });
        }, 800);
    }

    function stopAutoScroll() {
        if (scrollInterval) {
            clearInterval(scrollInterval);
            scrollInterval = null;
        }
    }

    let wakeLockInstance = null;
    async function requestWakeLock() {
        if (wakeLockInstance) return;
        try {
            if ('wakeLock' in navigator) {
                wakeLockInstance = await navigator.wakeLock.request('screen');
            }
        } catch (e) {}
    }

    function releaseWakeLock() {
        if (wakeLockInstance) {
            wakeLockInstance.release().then(() => {
                wakeLockInstance = null;
            });
        }
    }

    let stopwatchInterval = null;
    let stopwatchSeconds = 0;
    let flashTitleInterval = null;
    let originalTitle = document.title || "Google AI Studio";

    function startStopwatch() {
        stopwatchSeconds = 0;
        if (stopwatchInterval) clearInterval(stopwatchInterval);

        stopwatchInterval = setInterval(() => {
            stopwatchSeconds++;
            const minutes = Math.floor(stopwatchSeconds / 60).toString().padStart(2, '0');
            const seconds = (stopwatchSeconds % 60).toString().padStart(2, '0');
            document.title = \`⚡ [\${minutes}:\${seconds}] Generating... | AI Studio\`;
        }, 1000);
    }

    function stopStopwatch() {
        if (stopwatchInterval) {
            clearInterval(stopwatchInterval);
            stopwatchInterval = null;
        }
    }

    function startTabTitleFlashing(lang) {
        if (flashTitleInterval) clearInterval(flashTitleInterval);
        
        let toggle = false;
        const state1 = lang === 'RU' ? '✅ Готово! | AI Studio' : '✅ DONE! | AI Studio';
        const state2 = lang === 'RU' ? '★ Ответ готов! ★' : '★ AI Answer Ready! ★';

        flashTitleInterval = setInterval(() => {
            document.title = toggle ? state1 : state2;
            toggle = !toggle;
        }, 1000);
    }

    function stopTabTitleFlashing() {
        if (flashTitleInterval) {
            clearInterval(flashTitleInterval);
            flashTitleInterval = null;
        }
        document.title = originalTitle;
    }

    window.addEventListener('focus', () => {
        stopTabTitleFlashing();
    });

    function startGenerationObserver(lang) {
        let isGenerating = false;

        setTimeout(() => {
            if (document.title && !document.title.includes('Generating')) {
                originalTitle = document.title;
            }
        }, 2000);

        const observer = new MutationObserver(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const hasStopButton = buttons.some(btn => {
                const text = btn.innerText ? btn.innerText.toLowerCase() : '';
                return text.includes('stop') || text.includes('cancel');
            });

            if (hasStopButton && !isGenerating) {
                isGenerating = true;
                
                stopTabTitleFlashing();
                requestWakeLock();
                startAutoScroll();
                startStopwatch();
                
            } else if (!hasStopButton && isGenerating) {
                isGenerating = false;
                
                releaseWakeLock();
                stopAutoScroll();
                stopStopwatch();
                startTabTitleFlashing(lang);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }
})();
`;

function run() {
    if (!fs.existsSync(contentFile) || !fs.existsSync(backgroundFile)) {
        log('Extension assets missing. Run setup.cjs first.', 'error');
        process.exit(1);
    }

    try {
        patchManifest();
        fs.writeFileSync(contentFile, updatedContentJs.trim() + '\n', 'utf8');
        fs.writeFileSync(backgroundFile, updatedBackgroundJs.trim() + '\n', 'utf8');
        log('Applied ultimate Infrasound (1Hz) + chrome.power System keep-awake patches.', 'success');
        log('Please reload the extension inside edge://extensions/.', 'info');
    } catch (e) {
        log(`Failed to patch final cold start: ${e.message}`, 'error');
    }
}

run();