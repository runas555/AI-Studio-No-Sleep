/**
 * ============================================================================
 * PATCH SCRIPT: Focuses on Google AI Studio, renames to "AI Studio No Sleep",
 * and adds an elegant in-page floating status indicator.
 * File: patch-aistudio-only.cjs
 * Runtime: Node.js (CommonJS)
 * ============================================================================
 */

"use strict";

const fs = require('fs');
const path = require('path');

const targetFolder = path.join(process.cwd(), 'persistent-engine-ext');
const manifestFile = path.join(targetFolder, 'manifest.json');
const contentFile = path.join(targetFolder, 'content.js');
const htmlFile = path.join(targetFolder, 'popup.html');
const jsFile = path.join(targetFolder, 'popup.js');

function log(msg, type = 'info') {
    const colors = {
        info: '\x1b[36m[INFO]\x1b[0m',
        success: '\x1b[32m[SUCCESS]\x1b[0m',
        error: '\x1b[31m[ERROR]\x1b[0m'
    };
    console.log(`${colors[type] || '[LOG]'} ${msg}`);
}

// --- 1. UPDATE MANIFEST (Target strict AI Studio URL) ---
function updateManifest() {
    if (!fs.existsSync(manifestFile)) return false;
    try {
        const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
        
        manifest.name = "AI Studio No Sleep";
        manifest.description = "Prevents Google AI Studio from pausing text generation in background tabs.";
        
        // Restrict matches only to AI Studio
        manifest.content_scripts = [
            {
                matches: ["https://aistudio.google.com/*"],
                js: ["content.js"],
                run_at: "document_start",
                all_frames: true
            }
        ];
        
        // Restrict host permissions
        manifest.host_permissions = ["https://aistudio.google.com/*"];
        
        fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 4), 'utf8');
        log('manifest.json updated for strict aistudio.google.com matches.', 'success');
        return true;
    } catch (e) {
        log(`Failed to update manifest: ${e.message}`, 'error');
        return false;
    }
}

// --- 2. UPDATE CONTENT SCRIPT WITH FLOATING ON-PAGE HUD ---
const updatedContentJs = `
/**
 * AI STUDIO NO SLEEP - CONTENT SCRIPT (v1.6)
 * Specifically optimized for aistudio.google.com
 */
(function() {
    'use strict';

    // Synchronous DOM Hook to intercept visibility and rAF
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
        console.log('[AI Studio No Sleep] Active protection layer engaged.');

        if (config.audioKeepAlive) {
            enableAudioPulse();
        }

        if (config.activitySimulation) {
            startVirtualInteractionLoop();
        }

        setupBackgroundListener();
        
        // Render beautiful non-intrusive indicator in the bottom-right corner of AI Studio
        createOnPageIndicator(lang);
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

                    // requestAnimationFrame Bypass
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

    function setupBackgroundListener() {
        chrome.runtime.onMessage.addListener((message) => {
            if (message && message.type === 'WAKE_UP_PULSE') {
                window.postMessage({ type: 'FORCE_RENDER_TICK' }, '*');
                if (Math.random() > 0.8) {
                    chrome.runtime.sendMessage({ type: 'SIGNAL_PREVENT_PAUSE' });
                }
            }
        });
    }

    // Creates an elegant status card inside AI Studio web page
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
            pointer-events: none;
            transition: opacity 0.3s ease;
        \`;

        const dot = document.createElement('div');
        dot.style.cssText = \`
            width: 8px;
            height: 8px;
            background-color: #10b981;
            border-radius: 50%;
            box-shadow: 0 0 8px #10b981;
        \`;

        // Pulse keyframe animation using standard style tag
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
})();
`;

// --- 3. PATCH POPUP HTML LOGOS ---
function updateHtml() {
    if (!fs.existsSync(htmlFile)) return false;
    try {
        let html = fs.readFileSync(htmlFile, 'utf8');
        // Update main branding text
        html = html.replace('ЗАЩИТА ОТ ПАУЗ', 'AI STUDIO NO SLEEP');
        html = html.replace('PERSISTENT ENGINE', 'AI STUDIO NO SLEEP');
        fs.writeFileSync(htmlFile, html, 'utf8');
        log('popup.html brand names updated.', 'success');
        return true;
    } catch (e) {
        log(`Failed to update html: ${e.message}`, 'error');
        return false;
    }
}

// --- 4. PATCH POPUP JS LOCALIZATION ---
function updateJs() {
    if (!fs.existsSync(jsFile)) return false;
    try {
        let js = fs.readFileSync(jsFile, 'utf8');
        // Simple string replaces for new names
        js = js.replace('logo: "ЗАЩИТА ОТ ПАУЗ"', 'logo: "AI STUDIO NO SLEEP"');
        js = js.replace('logo: "ANTI-PAUSE GUARD"', 'logo: "AI STUDIO NO SLEEP"');
        fs.writeFileSync(jsFile, js, 'utf8');
        log('popup.js localizations updated.', 'success');
        return true;
    } catch (e) {
        log(`Failed to update js: ${e.message}`, 'error');
        return false;
    }
}

function run() {
    log('Transitioning project focus exclusively to Google AI Studio...', 'info');
    const m = updateManifest();
    const c = fs.writeFileSync(contentFile, updatedContentJs.trim() + '\n', 'utf8');
    log('content.js updated with floating On-Page status indicator.', 'success');
    const h = updateHtml();
    const j = updateJs();

    if (m && h && j) {
        log('----------------------------------------------------', 'success');
        log('AI Studio No Sleep branding and scope lock complete!', 'success');
        log('The extension will now only execute on aistudio.google.com tabs.', 'success');
        log('Please reload the extension inside edge://extensions/.', 'info');
    }
}

run();