/**
 * CONTENT SCRIPT: Tab Presence Emulator Core
 * Directly intercepts visibility states, focus tracking, and event propagation.
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

    // Load configs safely
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
        console.log('[PersistentEngine] Initializing active defense layers...');

        // 1. Inject DOM Hook to MAIN world to override Native APIs before page scripts load
        injectDOMHook();

        // 2. High-rate activity loop (Audio keep alive to trick Edge sleeping tabs and tab discarded mechanics)
        if (config.audioKeepAlive) {
            enableAudioPulse();
        }

        // 3. Keep-alive Activity simulator (Trusted interaction simulation)
        if (config.activitySimulation) {
            startVirtualInteractionLoop();
        }
    }

    function injectDOMHook() {
        try {
            const script = document.createElement('script');
            script.textContent = `
                (function() {
                    'use strict';
                    
                    console.log('[PersistentEngine/DOM] Force Overwriting document APIs...');

                    // Spoof document state variables
                    Object.defineProperty(document, 'visibilityState', {
                        get: () => 'visible',
                        configurable: true
                    });

                    Object.defineProperty(document, 'hidden', {
                        get: () => false,
                        configurable: true
                    });

                    // Force report focus active
                    document.hasFocus = function() { return true; };

                    // Hijack event listeners to drop tab blur notifications
                    const interceptedEvents = ['visibilitychange', 'webkitvisibilitychange', 'blur', 'focusout', 'pagehide', 'freeze'];
                    
                    const nativeAddEventListener = EventTarget.prototype.addEventListener;
                    EventTarget.prototype.addEventListener = function(type, listener, options) {
                        if (interceptedEvents.includes(type)) {
                            // Intercept, notify console, but do not register listeners that trigger pause
                            console.log('[PersistentEngine/Interceptor] Bypassed listener for event:', type);
                            // Some apps require an empty dummy callback instead of flat block to prevent crashes
                            const modifiedDummyListener = function(e) {
                                e.stopImmediatePropagation();
                                e.preventDefault();
                            };
                            return nativeAddEventListener.call(this, type, modifiedDummyListener, options);
                        }
                        return nativeAddEventListener.call(this, type, listener, options);
                    };

                    // Prevent tab throttling through window animation frames bypass
                    const nativeRequestAnimationFrame = window.requestAnimationFrame;
                    window.requestAnimationFrame = function(callback) {
                        return nativeRequestAnimationFrame(function(timestamp) {
                            try {
                                callback(timestamp);
                            } catch (e) {
                                console.error('[PersistentEngine/Anim] Inner callback failed', e);
                            }
                        });
                    };
                })();
            `;
            document.documentElement.appendChild(script);
            script.remove();
        } catch (e) {
            console.error('[PersistentEngine] Error executing DOM context hook', e);
        }
    }

    function enableAudioPulse() {
        let audioContext;
        const initiateAudioCtx = () => {
            try {
                if (audioContext) return;
                
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                // Low-level silent oscillator loop to register active audio playback inside Chromium
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1, audioContext.currentTime); // Inaudible frequency
                gain.gain.setValueAtTime(0.001, audioContext.currentTime); // Virtually muted but structurally active
                
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.start();
                
                console.log('[PersistentEngine] Silent audio priority keep-alive activated successfully.');
                
                // Clean up listeners once unlocked
                window.removeEventListener('click', initiateAudioCtx);
                window.removeEventListener('keydown', initiateAudioCtx);
            } catch (err) {
                console.error('[PersistentEngine/Audio] Failed starting priority context', err);
            }
        };

        // Browser require gesture interaction to start AudioContexts
        window.addEventListener('click', initiateAudioCtx, { passive: true });
        window.addEventListener('keydown', initiateAudioCtx, { passive: true });
    }

    function startVirtualInteractionLoop() {
        const rateMs = (config.heartbeatRate || 15) * 1000;
        
        setInterval(() => {
            if (!config.engineActive) return;

            // Generate virtual interaction events
            const mouseEvent = new MouseEvent('mousemove', {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: Math.floor(Math.random() * window.innerWidth),
                clientY: Math.floor(Math.random() * window.innerHeight)
            });
            
            window.dispatchEvent(mouseEvent);

            // Report state cycle saved to background system
            chrome.runtime.sendMessage({ type: 'SIGNAL_PREVENT_PAUSE' }, (res) => {
                if (chrome.runtime.lastError) {
                    // Suppress messaging exceptions
                    return;
                }
                if (res && res.ack) {
                    console.log('[PersistentEngine] Signaled active state metrics updated.');
                }
            });

        }, rateMs);
    }
})();
