/**
 * ============================================================================
 * PATCH SCRIPT: Restores the activity counter and enables real-time UI updates.
 * File: patch-counter-fix.cjs
 * Runtime: Node.js (CommonJS)
 * ============================================================================
 */

"use strict";

const fs = require('fs');
const path = require('path');

const targetFolder = path.join(process.cwd(), 'persistent-engine-ext');
const contentFile = path.join(targetFolder, 'content.js');
const jsFile = path.join(targetFolder, 'popup.js');

function log(msg, type = 'info') {
    const colors = {
        info: '\x1b[36m[INFO]\x1b[0m',
        success: '\x1b[32m[SUCCESS]\x1b[0m',
        error: '\x1b[31m[ERROR]\x1b[0m'
    };
    console.log(`${colors[type] || '[LOG]'} ${msg}`);
}

// --- FIXED CONTENT.JS (With active message signals on block & loop) ---
const fixedContentJs = `
/**
 * PERSISTENT ENGINE - CONTENT SCRIPT (v1.5 - Counter Restored)
 * Bypasses Chrome throttling and restores real-time activity metrics.
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

        setupBackgroundListener();
    }

    function injectDOMHook() {
        try {
            const script = document.createElement('script');
            script.textContent = \`
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
                        
                        // Notify that we intercepted a sleeping event
                        window.dispatchEvent(new CustomEvent('PERSISTENT_EVENT_BLOCKED'));
                    };
                    const eventsToCatch = ['visibilitychange', 'webkitvisibilitychange', 'blur', 'focusout', 'pagehide', 'freeze'];
                    eventsToCatch.forEach(eventName => {
                        window.addEventListener(eventName, silentBlocker, true);
                        document.addEventListener(eventName, silentBlocker, true);
                    });

                    // 4. requestAnimationFrame (rAF) BUSTER
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
            console.error('[PersistentEngine] DOM injection failed:', e);
        }

        // Catch the block notification from page context to increment metrics
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

            // FIX: Restore sending pause-prevention signal to background database
            chrome.runtime.sendMessage({ type: 'SIGNAL_PREVENT_PAUSE' }, () => {
                if (chrome.runtime.lastError) return;
            });
        }, interval);
    }

    function setupBackgroundListener() {
        chrome.runtime.onMessage.addListener((message) => {
            if (message && message.type === 'WAKE_UP_PULSE') {
                window.postMessage({ type: 'FORCE_RENDER_TICK' }, '*');
                
                // Slowly increment counter during active background guard execution
                if (Math.random() > 0.8) { // Once every few pulses (approx 2-3 seconds)
                    chrome.runtime.sendMessage({ type: 'SIGNAL_PREVENT_PAUSE' });
                }
            }
        });
    }
})();
`;

// --- FIXED POPUP.JS (With Live Storage Updates) ---
const fixedPopupJs = `
/**
 * SIMPLIFIED UI CONTROLLER
 * Translated from developer terminology into plain, non-tech human language.
 */

const LOCALIZATION = {
    EN: {
        logo: "ANTI-PAUSE GUARD",
        engineTitle: "Background protection",
        engineDesc: "Text will keep generating even if you minimize the browser or switch to another tab.",
        metPrevented: "ACTIVE WORK CYCLES",
        statusActive: "PROTECTION WORKING",
        statusIdle: "PROTECTION PAUSED",
        btnShowAdv: "Show extra options",
        btnHideAdv: "Hide extra options",
        
        modThrottleTitle: "Force Background Speed",
        modThrottleDesc: "Ensure text continues loading at normal speed in the background.",
        modAudioTitle: "Prevent Tab Sleep Mode",
        modAudioDesc: "Prevents browser from putting your background tab to sleep.",
        modPulseTitle: "Imitate Activity",
        modPulseDesc: "Moves a virtual cursor to bypass site idle detectors.",
        footer: "Compatible with Microsoft Edge & Google Chrome"
    },
    RU: {
        logo: "ЗАЩИТА ОТ ПАУЗ",
        engineTitle: "Работа в фоне",
        engineDesc: "Текст продолжит создаваться, даже если вы свернете браузер или перейдете в другую вкладку.",
        metPrevented: "АКТИВНЫЕ ЦИКЛЫ РАБОТЫ",
        statusActive: "ЗАЩИТА РАБОТАЕТ",
        statusIdle: "ЗАЩИТА НА ПАУЗЕ",
        btnShowAdv: "Показать дополнительные настройки",
        btnHideAdv: "Скрыть дополнительные настройки",
        
        modThrottleTitle: "Ускорение работы в фоне",
        modThrottleDesc: "Позволяет тексту генерироваться с обычной скоростью в фоне.",
        modAudioTitle: "Защита от засыпания вкладки",
        modAudioDesc: "Не дает браузеру переводить фоновую вкладку в режим энергосбережения.",
        modPulseTitle: "Имитация активности",
        modPulseDesc: "Двигает виртуальную мышь для обхода защиты сайтов от бездействия.",
        footer: "Совместимо с Microsoft Edge и Google Chrome"
    }
};

document.addEventListener('DOMContentLoaded', () => {
    let currentLang = 'RU';

    const dom = {
        langBtnEN: document.getElementById('langBtnEN'),
        langBtnRU: document.getElementById('langBtnRU'),
        logo: document.getElementById('txt-logo'),
        engineTitle: document.getElementById('txt-engine-title'),
        engineDesc: document.getElementById('txt-engine-desc'),
        metPrevented: document.getElementById('txt-met-prevented'),
        statusLabel: document.getElementById('statusLabel'),
        
        toggleAdvanced: document.getElementById('toggleAdvanced'),
        advancedPanel: document.getElementById('advancedPanel'),
        
        modThrottleTitle: document.getElementById('txt-mod-throttle-title'),
        modThrottleDesc: document.getElementById('txt-mod-throttle-desc'),
        modAudioTitle: document.getElementById('txt-mod-audio-title'),
        modAudioDesc: document.getElementById('txt-mod-audio-desc'),
        modPulseTitle: document.getElementById('txt-mod-pulse-title'),
        modPulseDesc: document.getElementById('txt-mod-pulse-desc'),
        footer: document.getElementById('txt-footer'),

        engineActive: document.getElementById('engineActive'),
        preventThrottling: document.getElementById('preventThrottling'),
        audioKeepAlive: document.getElementById('audioKeepAlive'),
        activitySimulation: document.getElementById('activitySimulation'),
        counterVal: document.getElementById('counterVal')
    };

    function updateLanguage(lang) {
        currentLang = lang;
        
        if (lang === 'EN') {
            dom.langBtnEN.classList.add('active');
            dom.langBtnRU.classList.remove('active');
        } else {
            dom.langBtnRU.classList.add('active');
            dom.langBtnEN.classList.remove('active');
        }
        
        const t = LOCALIZATION[lang];
        dom.logo.innerText = t.logo;
        dom.engineTitle.innerText = t.engineTitle;
        dom.engineDesc.innerText = t.engineDesc;
        dom.metPrevented.innerText = t.metPrevented;
        
        dom.modThrottleTitle.innerText = t.modThrottleTitle;
        dom.modThrottleDesc.innerText = t.modThrottleDesc;
        dom.modAudioTitle.innerText = t.modAudioTitle;
        dom.modAudioDesc.innerText = t.modAudioDesc;
        dom.modPulseTitle.innerText = t.modPulseTitle;
        dom.modPulseDesc.innerText = t.modPulseDesc;
        dom.footer.innerText = t.footer;

        const isPanelOpen = dom.advancedPanel.classList.contains('open');
        dom.toggleAdvanced.innerText = isPanelOpen ? t.btnHideAdv : t.btnShowAdv;

        updateStatusLabel();
    }

    function updateStatusLabel() {
        const isActive = dom.engineActive.checked;
        const t = LOCALIZATION[currentLang];
        if (isActive) {
            dom.statusLabel.innerText = t.statusActive;
            dom.statusLabel.style.color = 'var(--success)';
        } else {
            dom.statusLabel.innerText = t.statusIdle;
            dom.statusLabel.style.color = 'var(--danger)';
        }
    }

    dom.toggleAdvanced.addEventListener('click', () => {
        const panel = dom.advancedPanel;
        const isOpen = panel.classList.toggle('open');
        const t = LOCALIZATION[currentLang];
        dom.toggleAdvanced.innerText = isOpen ? t.btnHideAdv : t.btnShowAdv;
    });

    // Load initial storage states
    chrome.storage.local.get([
        'engineActive', 'preventThrottling', 'audioKeepAlive', 'activitySimulation', 'savedCyclesCount', 'uiLang'
    ], (result) => {
        dom.engineActive.checked = result.engineActive !== false;
        dom.preventThrottling.checked = result.preventThrottling !== false;
        dom.audioKeepAlive.checked = result.audioKeepAlive !== false;
        dom.activitySimulation.checked = result.activitySimulation !== false;
        dom.counterVal.innerText = (result.savedCyclesCount || 0).toLocaleString();
        
        const lang = result.uiLang || 'RU';
        updateLanguage(lang);
    });

    // LIVE UPDATE LISTENER: React to storage changes immediately
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes.savedCyclesCount) {
            const newVal = changes.savedCyclesCount.newValue || 0;
            dom.counterVal.innerText = newVal.toLocaleString();
        }
    });

    dom.langBtnEN.addEventListener('click', () => {
        if (currentLang !== 'EN') {
            chrome.storage.local.set({ uiLang: 'EN' }, () => {
                updateLanguage('EN');
            });
        }
    });

    dom.langBtnRU.addEventListener('click', () => {
        if (currentLang !== 'RU') {
            chrome.storage.local.set({ uiLang: 'RU' }, () => {
                updateLanguage('RU');
            });
        }
    });

    dom.engineActive.addEventListener('change', () => {
        chrome.storage.local.set({ engineActive: dom.engineActive.checked }, () => {
            updateStatusLabel();
            chrome.runtime.sendMessage({ type: 'TOGGLE_ACTIVE' });
        });
    });

    dom.preventThrottling.addEventListener('change', () => {
        chrome.storage.local.set({ preventThrottling: dom.preventThrottling.checked });
    });

    dom.audioKeepAlive.addEventListener('change', () => {
        chrome.storage.local.set({ audioKeepAlive: dom.audioKeepAlive.checked });
    });

    dom.activitySimulation.addEventListener('change', () => {
        chrome.storage.local.set({ activitySimulation: dom.activitySimulation.checked });
    });
});
`;

function run() {
    if (!fs.existsSync(contentFile) || !fs.existsSync(jsFile)) {
        log('Extension source assets not found. Run setup.cjs first.', 'error');
        process.exit(1);
    }

    try {
        fs.writeFileSync(contentFile, fixedContentJs.trim() + '\n', 'utf8');
        log('Successfully restored signaling mechanics inside content.js.', 'success');

        fs.writeFileSync(jsFile, fixedPopupJs.trim() + '\n', 'utf8');
        log('Successfully integrated real-time storage listener (Live update) in popup.js.', 'success');
        
        log('Counter Fix successfully deployed!', 'success');
    } catch (e) {
        log(`Failed to apply counter fix: ${e.message}`, 'error');
    }
}

run();