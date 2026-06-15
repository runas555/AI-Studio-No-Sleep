(function() {
    'use strict';
    
    // Подмена видимости вкладки на уровне прототипа документа
    Object.defineProperty(document, 'visibilityState', {
        get: () => 'visible',
        configurable: true
    });

    Object.defineProperty(document, 'hidden', {
        get: () => false,
        configurable: true
    });

    document.hasFocus = function() { return true; };

    // Предотвращение регистрации ухода фокуса
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

    // Принудительный обход троттлинга requestAnimationFrame в фоновом режиме
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