/**
 * ============================================================================
 * PATCH SCRIPT: Adds Long-Lived Ports, Hover-to-fade HUD, and generation chime.
 * File: patch-ultimate-features.cjs
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

// --- UPDATED CONTENT SCRIPT (Long-Lived Ports, Chime Observer, Fade HUD) ---
const ultimateContentJs = `
/**
 * AI STUDIO NO SLEEP - CONTENT SCRIPT (v1.7)
 * Strictly targeted to aistudio.google.com with active finish chime.
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
        console.log('[AI Studio No Sleep] Engagement layers initialized.');

        if (config.audioKeepAlive) {
            enableAudioPulse();
        }

        if (config.activitySimulation) {
            startVirtualInteractionLoop();
        }

        // Establish long-lived port connection to prevent Service Worker sleep
        setupLongLivedPort();
        
        createOnPageIndicator(lang);
        
        // Start watching for generation completion
        startGenerationObserver();
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

    // Long-lived port to keep background worker 100% active
    function setupLongLivedPort() {
        const port = chrome.runtime.connect({ name: "KeepAlivePort" });
        
        // Listen for pulses driven by background
        port.onMessage.addListener((msg) => {
            if (msg.type === 'WAKE_UP_PULSE') {
                window.postMessage({ type: 'FORCE_RENDER_TICK' }, '*');
                if (Math.random() > 0.8) {
                    chrome.runtime.sendMessage({ type: 'SIGNAL_PREVENT_PAUSE' });
                }
            }
        });

        port.onDisconnect.addListener(() => {
            console.log('[AI Studio No Sleep] Port disconnected. Re-establishing channel...');
            setTimeout(setupLongLivedPort, 1000);
        });
    }

    function createOnPageIndicator(lang) {
        const text = lang === 'RU' ? 'Без сна: Активен' : 'No Sleep: Active';
        
        const container = document.createElement('div');
        container.id = 'ai-studio-nosleep-hud';
        container.style.cssText = \`
            position: fixed;
            bottom: 12px;
            right: 12px;
            background-color: #1e293b;
            color: #f8fafc;
            border: 1px solid #334155;
            padding: 6px 12px;
            border-radius: 20px;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 11px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 999999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: opacity 0.2s ease, transform 0.2s ease;
            cursor: default;
        \`;

        // Hover-to-fade effect (prohibits HUD from blocking clicks)
        container.addEventListener('mouseenter', () => {
            container.style.opacity = '0.1';
            container.style.pointerEvents = 'none'; // Click through
        });

        // Restore when mouse leaves the bottom-right corner region
        window.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const padding = 50; // zone of restoration
            if (
                e.clientX < rect.left - padding || 
                e.clientX > rect.right + padding || 
                e.clientY < rect.top - padding || 
                e.clientY > rect.bottom + padding
            ) {
                container.style.opacity = '1';
                container.style.pointerEvents = 'auto';
            }
        });

        const dot = document.createElement('div');
        dot.style.cssText = \`
            width: 8px;
            height: 8px;
            background-color: #10b981;
            border-radius: 50%;
            box-shadow: 0 0 8px #10b981;
        \`;

        const style = document.createElement('style');
        style.textContent = \`
            @keyframes hudPulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.6; }
                100% { transform: scale(1); opacity: 1; }
            }
        \`;
        document.head.appendChild(style);
        dot.style.animation = 'hudPulse 2s infinite ease-in-out';

        const label = document.createElement('span');
        label.innerText = text;

        container.appendChild(dot);
        container.appendChild(label);
        document.body.appendChild(container);
    }

    // Synthesis chime sound upon completion
    function playChime() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 Note
            osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5 Note
            osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.3); // G5 Note

            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.6);
        } catch (e) {
            // Suppress browser context blockers
        }
    }

    // Watches AI Studio DOM state transitions (Generation Active -> Finish)
    function startGenerationObserver() {
        let isGenerating = false;

        const observer = new MutationObserver(() => {
            // AI Studio "Stop/Cancel" button usually appears when stream is active
            const buttons = Array.from(document.querySelectorAll('button'));
            const hasStopButton = buttons.some(btn => {
                const text = btn.innerText ? btn.innerText.toLowerCase() : '';
                return text.includes('stop') || text.includes('cancel');
            });

            if (hasStopButton && !isGenerating) {
                isGenerating = true; // Generation started
                console.log('[AI Studio No Sleep] Detected stream start.');
            } else if (!hasStopButton && isGenerating) {
                isGenerating = false; // Generation finished!
                console.log('[AI Studio No Sleep] Stream finished. Playing chime.');
                playChime();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }
})();
`;

// --- UPDATED BACKGROUND SCRIPT (Handles Keep-alive Port listeners) ---
const ultimateBackgroundJs = `
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

// Broadcast wake up pulse over active ports
function broadcastWakeUp() {
    connectedPorts.forEach(port => {
        try {
            port.postMessage({ type: 'WAKE_UP_PULSE' });
        } catch (e) {
            connectedPorts.delete(port);
        }
    });

    // Enforce anti-discard flag on all tabs
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

// Persistent Long-lived ports hub
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "KeepAlivePort") {
        connectedPorts.add(port);
        
        if (!activePulseInterval) startGlobalPulse();

        port.onDisconnect.addListener(() => {
            connectedPorts.delete(port);
            if (connectedPorts.size === 0 && activePulseInterval) {
                clearInterval(activePulseInterval);
                activePulseInterval = null;
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

function run() {
    if (!fs.existsSync(contentFile) || !fs.existsSync(backgroundFile)) {
        log('Extension files missing. Please run setup.cjs first.', 'error');
        process.exit(1);
    }

    try {
        fs.writeFileSync(contentFile, ultimateContentJs.trim() + '\n', 'utf8');
        log('content.js upgraded (Port Keep-alive, Hover-to-fade HUD, sound synth).', 'success');

        fs.writeFileSync(backgroundFile, ultimateBackgroundJs.trim() + '\n', 'utf8');
        log('background.js upgraded with Long-lived port handlers.', 'success');

        log('----------------------------------------------------', 'success');
        log('Ultimate optimization package successfully applied!', 'success');
        log('AI Studio is now completely stable, vocal and highly convenient.', 'success');
    } catch (e) {
        log(`Failed to apply patch: ${e.message}`, 'error');
    }
}

run();