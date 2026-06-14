/**
 * PERSISTENT ENGINE - CONTENT SCRIPT (Core Injection v1.2)
 * Clean, CSP-compliant, non-destructive tab lock logic.
 */
(function() {
    'use strict';

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
        console.log('[PersistentEngine] Initiating safe bypass layers...');
        injectDOMHook();

        if (config.audioKeepAlive) {
            enableAudioPulse();
        }

        if (config.activitySimulation) {
            startVirtualInteractionLoop();
        }

        // Establish keep-alive port with background script to prevent tab discard
        keepAliveConnection();
    }

    function injectDOMHook() {
        try {
            const script = document.createElement('script');
            script.textContent = `
                (function() {
                    'use strict';
                    
                    console.log('[PersistentEngine/DOM] Injecting safe API overrides...');

                    // 1. Spoof Document State Properties (Direct Overwrites)
                    Object.defineProperty(document, 'visibilityState', {
                        get: () => 'visible',
                        configurable: true
                    });

                    Object.defineProperty(document, 'hidden', {
                        get: () => false,
                        configurable: true
                    });

                    document.hasFocus = function() { return true; };

                    // 2. Safeguard against direct 'on' property assignments (onblur, onvisibilitychange)
                    const blockProperties = ['onvisibilitychange', 'onwebkitvisibilitychange', 'onblur', 'onfocus'];
                    blockProperties.forEach(prop => {
                        Object.defineProperty(document, prop, {
                            get: () => null,
                            set: () => console.log('[PersistentEngine] Blocked direct document property:', prop),
                            configurable: true
                        });
                        Object.defineProperty(window, prop, {
                            get: () => null,
                            set: () => console.log('[PersistentEngine] Blocked direct window property:', prop),
                            configurable: true
                        });
                    });

                    // 3. Block propagation of visibility/focus loss events
                    const interceptedEvents = ['visibilitychange', 'webkitvisibilitychange', 'blur', 'focusout', 'pagehide', 'freeze'];
                    const nativeAddEventListener = EventTarget.prototype.addEventListener;
                    EventTarget.prototype.addEventListener = function(type, listener, options) {
                        if (interceptedEvents.includes(type)) {
                            const dummyListener = function(e) {
                                e.stopImmediatePropagation();
                                e.preventDefault();
                            };
                            return nativeAddEventListener.call(this, type, dummyListener, options);
                        }
                        return nativeAddEventListener.call(this, type, listener, options);
                    };
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
                
                console.log('[PersistentEngine] Silent priority audio registered.');
                window.removeEventListener('click', startAudio);
                window.removeEventListener('keydown', startAudio);
            } catch (err) {
                console.warn('[PersistentEngine] Audio deferred:', err);
            }
        };
        window.addEventListener('click', startAudio, { passive: true });
        window.addEventListener('keydown', startAudio, { passive: true });
    }

    function startVirtualInteractionLoop() {
        const interval = (config.heartbeatRate || 15) * 1000;
        setInterval(() => {
            if (!config.engineActive) return;

            // Emulate minor micro-movements to reset idle limits
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
        // Keeps background worker awake and informs browser the tab is actively communicating
        setInterval(() => {
            chrome.runtime.sendMessage({ type: 'KEEP_ALIVE' }, () => {
                if (chrome.runtime.lastError) return;
            });
        }, 20000);
    }
})();
