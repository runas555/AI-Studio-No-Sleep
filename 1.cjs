/**
 * ============================================================================
 * PATCH SCRIPT: Removes all on-page DOM visual indicators (Invisible Edition).
 * File: patch-invisible.cjs
 * Runtime: Node.js (CommonJS)
 * ============================================================================
 */

"use strict";

const fs = require('fs');
const path = require('path');

const targetFolder = path.join(process.cwd(), 'persistent-engine-ext');
const contentFile = path.join(targetFolder, 'content.js');

function log(msg, type = 'info') {
    const colors = {
        info: '\x1b[36m[INFO]\x1b[0m',
        success: '\x1b[32m[SUCCESS]\x1b[0m',
        error: '\x1b[31m[ERROR]\x1b[0m'
    };
    console.log(`${colors[type] || '[LOG]'} ${msg}`);
}

// --- UPDATED INVISIBLE CONTENT SCRIPT ---
const invisibleContentJs = `
/**
 * AI STUDIO NO SLEEP - CONTENT SCRIPT (v2.2 - Invisible Edition)
 * Zero page-DOM modifications. Pure background execution.
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
        console.log('[AI Studio No Sleep] Background shield running invisibly.');

        if (config.audioKeepAlive) {
            enableUltrasoundPulse();
        }

        if (config.activitySimulation) {
            startVirtualInteractionLoop();
        }

        setupLongLivedPort();
        
        // Starts observers for StopWatch, Auto-Scroll, Wake-Lock
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

    function enableUltrasoundPulse() {
        let audioContext;
        const startAudio = () => {
            if (audioContext) return;
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(19000, audioContext.currentTime); 
                gain.gain.setValueAtTime(0.002, audioContext.currentTime); 
                
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.start();
                
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

    // --- BACKEND STOPWATCH & TAB FLASH ---
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
    if (!fs.existsSync(contentFile)) {
        log('Extension assets missing. Run setup.cjs first.', 'error');
        process.exit(1);
    }

    try {
        fs.writeFileSync(contentFile, invisibleContentJs.trim() + '\n', 'utf8');
        log('Removed all on-page HUD rendering. Extension is now 100% invisible on AI Studio.', 'success');
        log('Please reload the extension inside edge://extensions/ to apply modifications.', 'info');
    } catch (e) {
        log(`Failed to patch invisible mode: ${e.message}`, 'error');
    }
}

run();