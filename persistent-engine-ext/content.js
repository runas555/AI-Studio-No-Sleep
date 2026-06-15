/**
 * AI STUDIO NO SLEEP - CONTENT SCRIPT (v2.9 - Unbreakable Scroll)
 * Features: Infrasound Priority, Screen Wake Lock, Event-Driven Angular CDK Scroll, Delayed Finish Notifications.
 */
(function() {
    'use strict';

    // SAFE SEND MESSAGE HELPER (Предотвращает падение при обновлении контекста)
    function safeSendMessage(message, callback) {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
            chrome.runtime.sendMessage(message, (response) => {
                const lastError = chrome.runtime.lastError;
                if (callback) {
                    callback(response, lastError);
                }
            });
        } else {
            console.warn('[AI Studio No Sleep] Context invalidated. Message skipped:', message.type);
        }
    }


    /* DOM Hooking перенесен в MAIN world через manifest.json */

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
            startMediaKeepAlive(); // Активация невидимого видеопотока для обхода троттлинга
        }

        if (config.activitySimulation) {
            startVirtualInteractionLoop();
        }

        setupLongLivedPort();
        startGenerationObserver(lang);
    }

    function injectDOMHook() {
        // Пересылка сигналов предотвращения паузы из MAIN world в фоновый сервис-воркер
        window.addEventListener('PERSISTENT_EVENT_BLOCKED', () => {
            safeSendMessage({ type: 'SIGNAL_PREVENT_PAUSE' });
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

            safeSendMessage({ type: 'SIGNAL_PREVENT_PAUSE' }, () => {
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
                    safeSendMessage({ type: 'SIGNAL_PREVENT_PAUSE' });
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

    // --- ADAPTIVE UNBREAKABLE SCROLL ENGINE ---
    // Forces coordinates and dispatches native 'scroll' events to trigger Angular CDK digests
    function performAdaptiveScroll() {
        // 1. Force native document bottom
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });

        // 2. Вычисление скролл-контейнеров на основе их реального CSS-состояния
        const targets = document.querySelectorAll('cdk-virtual-scroll-viewport, div, section, main');
        targets.forEach(el => {
            try {
                const style = window.getComputedStyle(el);
                const isScrollable = (style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
                if (isScrollable) {
                    el.scrollTop = el.scrollHeight + 5000;
                    el.dispatchEvent(new Event('scroll', { bubbles: true, cancelable: true }));
                }
            } catch (e) {}
        });

        // 3. LOW-LEVEL KEYBOARD EMULATION: Эмуляция клавиши End на активном элементе
        try {
            const activeEl = document.activeElement || document.body;
            const endEvent = new KeyboardEvent('keydown', {
                key: 'End',
                code: 'End',
                keyCode: 35,
                which: 35,
                bubbles: true,
                cancelable: true
            });
            activeEl.dispatchEvent(endEvent);
        } catch (e) {}
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
            document.title = `⚡ [${minutes}:${seconds}] Generating... | AI Studio`;
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

        safeSendMessage({ 
            type: 'SHOW_OS_NOTIFICATION', 
            duration: `${minutes}:default${seconds}` 
        });

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
                
                safeSendMessage({ type: 'SET_BADGE_ON' });
                
                window.addEventListener('beforeunload', preventTabClose, { capture: true });
                
            } else if (!hasStopButton && isGenerating) {
                isGenerating = false;
                
                releaseWakeLock();
                stopAutoScroll();
                
                // MICRO-LOOP HARD COORD RESET (Fires 3 times to sync late Angular rendering chunks)
                performAdaptiveScroll();
                
                setTimeout(() => { performAdaptiveScroll(); }, 60);
                setTimeout(() => { performAdaptiveScroll(); }, 120);
                
                // Finalize only after the final render ticks have landed and synced
                setTimeout(() => {
                    performAdaptiveScroll(); // One last check
                    stopStopwatch();
                    triggerFinishNotifications(lang);
                    
                    safeSendMessage({ type: 'SET_BADGE_CHECKMARK' });
                }, 220);
                
                window.removeEventListener('beforeunload', preventTabClose, { capture: true });
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // СИНТЕЗАТОР НЕВИДИМОГО ВИДЕОПОТОКА (Обход системного троттлинга Chromium)
    function startMediaKeepAlive() {
        try {
            if (document.getElementById('ai-no-sleep-media-keepalive')) return;

            const canvas = document.createElement('canvas');
            canvas.id = 'ai-no-sleep-media-keepalive';
            canvas.width = 1;
            canvas.height = 1;
            canvas.style.display = 'none';
            (document.body || document.documentElement).appendChild(canvas);

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = 'rgba(0,0,0,0.01)';
                ctx.fillRect(0, 0, 1, 1);
            }

            const stream = canvas.captureStream ? canvas.captureStream(1) : null;
            if (stream) {
                const video = document.createElement('video');
                video.muted = true;
                video.loop = true;
                video.srcObject = stream;
                video.style.display = 'none';
                (document.body || document.documentElement).appendChild(video);
                
                // Автозапуск замутированного видео разрешен политикой браузера
                video.play().catch(() => {});
                console.log('[AI Studio No Sleep] Canvas-to-Video keepalive engaged.');
            }
        } catch (e) {
            console.warn('[AI Studio No Sleep] Media keepalive failed:', e);
        }
    }
})();
