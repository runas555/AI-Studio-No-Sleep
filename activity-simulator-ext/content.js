(function() {
    // Persistent Engine Logic
    console.log('[PersistentEngine] Initializing simulation shield...');

    function injectScript() {
        const script = document.createElement('script');
        script.textContent = `
            (function() {
                // Spoofing Visibility State
                Object.defineProperty(document, 'visibilityState', {
                    get: () => 'visible',
                    configurable: true
                });
                Object.defineProperty(document, 'hidden', {
                    get: () => false,
                    configurable: true
                });

                // Spoofing Focus
                document.hasFocus = () => true;

                // Event Blocker: Prevents visibilitychange events from firing
                const blockEvents = ['visibilitychange', 'webkitvisibilitychange', 'blur', 'focusout'];
                blockEvents.forEach(eventName => {
                    window.addEventListener(eventName, (e) => {
                        e.stopImmediatePropagation();
                        console.log('[PersistentEngine] Blocked event:', eventName);
                    }, true);
                });

                // Periodic Heartbeat
                setInterval(() => {
                    window.dispatchEvent(new MouseEvent('mousemove', {
                        view: window,
                        bubbles: true,
                        cancelable: true,
                        clientX: Math.random() * window.innerWidth,
                        clientY: Math.random() * window.innerHeight
                    }));
                }, 15000);
            })();
        `;
        (document.head || document.documentElement).appendChild(script);
        script.remove();
    }

    // Initialize simulation
    chrome.storage.local.get(['active'], (result) => {
        if (result.active !== false) {
            injectScript();
            startAudioHeartbeat();
        }
    });

    function startAudioHeartbeat() {
        // Create invisible audio to prevent tab discard
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime); // SILENT

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        console.log('[PersistentEngine] Audio priority heartbeat active.');
    }
})();
