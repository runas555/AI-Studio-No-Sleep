/**
 * ============================================================================
 * PATCH SCRIPT: Fixes Angular Custom Scrollbars and re-orders finish sequence.
 * File: patch-angular-scroll.cjs
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

// --- UPDATED CONTENT SCRIPT WITH ANGULAR SCROLL DISCOVERY & SEQUENTIAL NOTIFICATIONS ---
const angularScrollContentJs = `
/**
 * AI STUDIO NO SLEEP - CONTENT SCRIPT (v2.7 - Angular Scroll & Sequence Fixed)
 * Features: Infrasound Priority, Screen Wake Lock, Adaptive Angular Scroll, Delayed Finish Notifications.
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
        console.log('[AI Studio No Sleep] Safety protocols active.');

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

    function enableInfrasoundPulse() {
        let audioContext;
        const startAudio = () => {
            if (audioContext) return;
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1, audioContext.currentTime); 
                gain.gain.setValueAtTime(0.02, audioContext.currentTime); 
                
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
            performAdaptiveScroll();
        }, 800);
    }

    function stopAutoScroll() {
        if (scrollInterval) {
            clearInterval(scrollInterval);
            scrollInterval = null;
        }
    }

    // --- ADAPTIVE ANGULAR & NATIVE SCROLL ENGINE ---
    // Finds custom Angular scroll viewports and forces scroll position to maximum height
    function performAdaptiveScroll() {
        // 1. Scroll main window
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

        // 2. Discover and scroll native scrollable elements
        const elements = document.querySelectorAll('div, section, main, md-block');
        elements.forEach(el => {
            const overflow = window.getComputedStyle(el).overflowY;
            if (el.scrollHeight > el.clientHeight && (overflow === 'auto' || overflow === 'scroll')) {
                el.scrollTop = el.scrollHeight;
            }
        });

        // 3. TARGET ANGULAR CUSTOM SCROLLBARS (Finds scrollbar-handle and traces back to viewport)
        const customHandles = document.querySelectorAll('.scrollbar-handle, .ng-scrollbar-handle, [class*="scrollbar-handle"]');
        customHandles.forEach(handle => {
            let parent = handle.parentElement;
            // Traverse up to find the wrapped viewport container
            while (parent && parent !== document.body) {
                const innerViewports = parent.querySelectorAll('[class*="viewport"], [class*="scroll"], div');
                innerViewports.forEach(vp => {
                    if (vp.scrollHeight > vp.clientHeight) {
                        vp.scrollTop = vp.scrollHeight;
                    }
                });
                parent = parent.parentElement;
            }
        });
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

    function triggerFinishNotifications(lang) {
        const minutes = Math.floor(stopwatchSeconds / 60).toString().padStart(2, '0');
        const seconds = (stopwatchSeconds % 60).toString().padStart(2, '0');

        // Trigger OS notification banner
        chrome.runtime.sendMessage({ 
            type: 'SHOW_OS_NOTIFICATION', 
            duration: \`\${minutes}:\${seconds}\` 
        });

        // Trigger browser tab flashing
        startTabTitleFlashing(lang);
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

    const preventTabClose = (e) => {
        e.preventDefault();
        e.returnValue = 'AI Studio is actively generating text in the background. Are you sure you want to exit?';
        return e.returnValue;
    };

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
                
                window.addEventListener('beforeunload', preventTabClose, { capture: true });
                
            } else if (!hasStopButton && isGenerating) {
                isGenerating = false;
                
                releaseWakeLock();
                stopAutoScroll();
                
                // 1. Force guaranteed scroll to bottom on custom scroll containers immediately
                performAdaptiveScroll();
                
                // 2. Delay notifications for 150ms to let the DOM settle and finish rendering the scroll position
                setTimeout(() => {
                    performAdaptiveScroll(); // Double-check final coordinate lock
                    stopStopwatch();
                    triggerFinishNotifications(lang);
                }, 150);
                
                window.removeEventListener('beforeunload', preventTabClose, { capture: true });
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
        fs.writeFileSync(contentFile, angularScrollContentJs.trim() + '\n', 'utf8');
        log('Successfully resolved Angular Custom Scrollbar bypass and re-ordered finish notifications.', 'success');
        log('Please reload the extension inside edge://extensions/.', 'info');
    } catch (e) {
        log(`Failed to patch angular scroll: ${e.message}`, 'error');
    }
}

run();