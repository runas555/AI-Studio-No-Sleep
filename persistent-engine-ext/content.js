/**
 * PERSISTENT ENGINE - CONTENT SCRIPT (v1.4 - Minimized Fixed)
 * Bypasses Chrome requestAnimationFrame throttling and minimized freezes.
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
        'heartbeatRate'
    ], (result) => {
        config = { ...config, ...result };
        if (config.engineActive) {
            initEngine();
        }
    });

    function initEngine() {
        console.log('[PersistentEngine] Keep-alive systems active.');

        if (config.audioKeepAlive) {
            enableAudioPulse();
        }

        if (config.activitySimulation) {
            startVirtualInteractionLoop();
        }

        // Connect and listen for background external wake-up ticks
        setupBackgroundListener();
    }

    function injectDOMHook() {
        try {
            const script = document.createElement('script');
            script.textContent = `
                (function() {
                    'use strict';
                    
                    console.log('[PersistentEngine/DOM] Injecting rAF and visibility overrides...');

                    // 1. Visibility state override
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

                    // 3. Capturing phase event blocker
                    const silentBlocker = function(e) {
                        e.stopImmediatePropagation();
                        e.preventDefault();
                    };
                    const eventsToCatch = ['visibilitychange', 'webkitvisibilitychange', 'blur', 'focusout', 'pagehide', 'freeze'];
                    eventsToCatch.forEach(eventName => {
                        window.addEventListener(eventName, silentBlocker, true);
                        document.addEventListener(eventName, silentBlocker, true);
                    });

                    // 4. requestAnimationFrame (rAF) BUSTER
                    // Stores page render callbacks to force-run them when window is minimized
                    const activeRafCallbacks = new Map();
                    let rafIdCounter = 0;

                    const nativerAF = window.requestAnimationFrame;
                    window.requestAnimationFrame = function(callback) {
                        const id = ++rafIdCounter;
                        activeRafCallbacks.set(id, callback);
                        
                        // Let native rAF try to process normally if window is open
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

                    // External trigger to flush rendering queue when minimized
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
            `;
            (document.head || document.documentElement).appendChild(script);
            script.remove();
        } catch (e) {
            console.error('[PersistentEngine] DOM injection failed:', e);
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
        }, interval);
    }

    function setupBackgroundListener() {
        // Listen for fast background wake-up pulses (active even when minimized)
        chrome.runtime.onMessage.addListener((message) => {
            if (message && message.type === 'WAKE_UP_PULSE') {
                // Post event to MAIN world to force flush the rAF render queue
                window.postMessage({ type: 'FORCE_RENDER_TICK' }, '*');
            }
        });
    }
})();
