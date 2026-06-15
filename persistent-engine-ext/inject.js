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

    // ПЕРЕОПРЕДЕЛЕНИЕ INTERSECTIONOBSERVER для обхода виртуализации Angular CDK
    // Заставляет виртуальный скролл верить, что элементы всегда находятся в зоне видимости экрана
    const NativeIntersectionObserver = window.IntersectionObserver;
    if (NativeIntersectionObserver) {
        window.IntersectionObserver = class MockIntersectionObserver {
            constructor(callback, options) {
                this.callback = callback;
                this.options = options;
                this.observedElements = new Set();
                
                this.nativeObserver = new NativeIntersectionObserver((entries, observer) => {
                    const mockedEntries = entries.map(entry => {
                        return {
                            time: entry.time,
                            rootBounds: entry.rootBounds,
                            boundingClientRect: entry.boundingClientRect,
                            intersectionRect: entry.boundingClientRect, // Имитируем полное пересечение границ
                            isIntersecting: true,                      // Всегда true
                            intersectionRatio: 1.0,                    // Всегда 100% видимости
                            target: entry.target
                        };
                    });
                    try { callback(mockedEntries, this); } catch(e) {}
                }, options);
            }

            observe(target) {
                this.observedElements.add(target);
                this.nativeObserver.observe(target);
                
                // Мгновенный принудительный триггер видимости для инициализации рендеринга Angular
                setTimeout(() => {
                    if (this.observedElements.has(target)) {
                        const mockEntry = [{
                            time: performance.now(),
                            rootBounds: null,
                            boundingClientRect: target.getBoundingClientRect(),
                            intersectionRect: target.getBoundingClientRect(),
                            isIntersecting: true,
                            intersectionRatio: 1.0,
                            target: target
                        }];
                        try { this.callback(mockEntry, this); } catch(e) {}
                    }
                }, 0);
            }

            unobserve(target) {
                this.observedElements.delete(target);
                this.nativeObserver.unobserve(target);
            }

            disconnect() {
                this.observedElements.clear();
                this.nativeObserver.disconnect();
            }
        };
    }

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