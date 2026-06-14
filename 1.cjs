/**
 * ============================================================================
 * PATCH SCRIPT: Integrates OS Screen Wake Lock and Smart Auto-Scroll loops.
 * File: patch-system-lock.cjs
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

// --- UPDATED CONTENT SCRIPT WITH WAKE LOCK & AUTO SCROLL ---
const systemLockContentJs = `
/**
 * AI STUDIO NO SLEEP - CONTENT SCRIPT (v1.8 - Wake Lock & Auto-Scroll)
 * Strictly targeted to aistudio.google.com with active system lock.
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
        console.log('[AI Studio No Sleep] Activation protocols online.');

        if (config.audioKeepAlive) {
            enableAudioPulse();
        }

        if (config.activitySimulation) {
            startVirtualInteractionLoop();
        }

        setupLongLivedPort();
        createOnPageIndicator(lang);
        
        // Start watching for generation completion (Now with Wake Lock & Auto-Scroll)
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

        container.addEventListener('mouseenter', () => {
            container.style.opacity = '0.1';
            container.style.pointerEvents = 'none';
        });

        window.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const padding = 50;
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

    function playChime() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15);
            osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.3);

            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.6);
        } catch (e) {}
    }

    // --- SMART AUTO-SCROLL CONTROLLER ---
    let scrollInterval = null;
    function startAutoScroll() {
        if (scrollInterval) clearInterval(scrollInterval);
        
        scrollInterval = setInterval(() => {
            // 1. Smooth scroll primary viewport window
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            
            // 2. Smooth scroll any inner scrollable workspace containers
            const elements = document.querySelectorAll('div, section, main, md-block');
            elements.forEach(el => {
                const overflow = window.getComputedStyle(el).overflowY;
                if (el.scrollHeight > el.clientHeight && (overflow === 'auto' || overflow === 'scroll')) {
                    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
                }
            });
        }, 800); // Trigger smooth micro-scrolls every 800ms during active stream
    }

    function stopAutoScroll() {
        if (scrollInterval) {
            clearInterval(scrollInterval);
            scrollInterval = null;
        }
    }

    // --- SCREEN WAKE LOCK MANAGER ---
    let wakeLockInstance = null;
    async function requestWakeLock() {
        if (wakeLockInstance) return;
        try {
            if ('wakeLock' in navigator) {
                wakeLockInstance = await navigator.wakeLock.request('screen');
                console.log('[AI Studio No Sleep] OS Screen Wake Lock successfully active.');
            }
        } catch (e) {
            console.warn('[AI Studio No Sleep] System Wake Lock request rejected:', e);
        }
    }

    function releaseWakeLock() {
        if (wakeLockInstance) {
            wakeLockInstance.release().then(() => {
                wakeLockInstance = null;
                console.log('[AI Studio No Sleep] OS Screen Wake Lock released.');
            });
        }
    }

    // Watches AI Studio DOM state transitions
    function startGenerationObserver() {
        let isGenerating = false;

        const observer = new MutationObserver(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const hasStopButton = buttons.some(btn => {
                const text = btn.innerText ? btn.innerText.toLowerCase() : '';
                return text.includes('stop') || text.includes('cancel');
            });

            if (hasStopButton && !isGenerating) {
                isGenerating = true;
                console.log('[AI Studio No Sleep] Generation started.');
                
                // Engage physical protection systems
                requestWakeLock();
                startAutoScroll();
                
            } else if (!hasStopButton && isGenerating) {
                isGenerating = false;
                console.log('[AI Studio No Sleep] Generation finished.');
                
                // Release protection systems
                releaseWakeLock();
                stopAutoScroll();
                
                playChime();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }
})();
`;

function run() {
    if (!fs.existsSync(contentFile)) {
        log('Extension content.js file missing. Please run setup.cjs first.', 'error');
        process.exit(1);
    }

    try {
        fs.writeFileSync(contentFile, systemLockContentJs.trim() + '\n', 'utf8');
        log('Successfully integrated OS Screen Wake Lock & Smart Auto-Scroll inside content.js.', 'success');
        log('Please reload the extension inside edge://extensions/ to apply changes.', 'info');
    } catch (e) {
        log(`Failed to apply system lock patch: ${e.message}`, 'error');
    }
}

run();