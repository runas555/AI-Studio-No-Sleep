/**
 * UI CONTROLLER (With Multilingual SVG Flag Controller)
 */

const LOCALIZATION = {
    EN: {
        logo: "PERSISTENT ENGINE",
        engineTitle: "Active Simulation Shield",
        engineDesc: "Keeps tab execution active",
        metPrevented: "PREVENTED PAUSES",
        metStatus: "ENGINE STATE",
        statusActive: "ACTIVE",
        statusIdle: "OFFLINE",
        modulesHeader: "SUB-SYSTEM CONFIGURATION",
        modThrottleTitle: "Timer Optimization Bypass",
        modThrottleDesc: "Forces background worker threads",
        modAudioTitle: "Audio Keep-Alive Loop",
        modAudioDesc: "Trick Edge from sleeping tab mode",
        modPulseTitle: "Random Activity Pulse",
        modPulseDesc: "Inject virtual mouse events"
    },
    RU: {
        logo: "АКТИВНЫЙ РЕЖИМ",
        engineTitle: "Симуляция активности",
        engineDesc: "Предотвращает засыпание вкладки",
        metPrevented: "БЛОКИРОВАНО ПАУЗ",
        metStatus: "СТАТУС СИСТЕМЫ",
        statusActive: "АКТИВЕН",
        statusIdle: "ВЫКЛЮЧЕН",
        modulesHeader: "КОНФИГУРАЦИЯ СУБМОДУЛЕЙ",
        modThrottleTitle: "Обход оптимизации таймеров",
        modThrottleDesc: "Запуск фоновых потоков Web Worker",
        modAudioTitle: "Аудио Keep-Alive",
        modAudioDesc: "Обход режима сна в Edge",
        modPulseTitle: "Импульсы активности",
        modPulseDesc: "Эмуляция движения мыши"
    }
};

document.addEventListener('DOMContentLoaded', () => {
    let currentLang = 'EN';

    const dom = {
        langBtnEN: document.getElementById('langBtnEN'),
        langBtnRU: document.getElementById('langBtnRU'),
        logo: document.getElementById('txt-logo'),
        engineTitle: document.getElementById('txt-engine-title'),
        engineDesc: document.getElementById('txt-engine-desc'),
        metPrevented: document.getElementById('txt-met-prevented'),
        metStatus: document.getElementById('txt-met-status'),
        statusLabel: document.getElementById('statusLabel'),
        modulesHeader: document.getElementById('txt-modules-header'),
        modThrottleTitle: document.getElementById('txt-mod-throttle-title'),
        modThrottleDesc: document.getElementById('txt-mod-throttle-desc'),
        modAudioTitle: document.getElementById('txt-mod-audio-title'),
        modAudioDesc: document.getElementById('txt-mod-audio-desc'),
        modPulseTitle: document.getElementById('txt-mod-pulse-title'),
        modPulseDesc: document.getElementById('txt-mod-pulse-desc'),

        engineActive: document.getElementById('engineActive'),
        preventThrottling: document.getElementById('preventThrottling'),
        audioKeepAlive: document.getElementById('audioKeepAlive'),
        activitySimulation: document.getElementById('activitySimulation'),
        counterVal: document.getElementById('counterVal')
    };

    function updateLanguage(lang) {
        currentLang = lang;
        
        // Toggle active segment buttons
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
        dom.metStatus.innerText = t.metStatus;
        dom.modulesHeader.innerText = t.modulesHeader;
        dom.modThrottleTitle.innerText = t.modThrottleTitle;
        dom.modThrottleDesc.innerText = t.modThrottleDesc;
        dom.modAudioTitle.innerText = t.modAudioTitle;
        dom.modAudioDesc.innerText = t.modAudioDesc;
        dom.modPulseTitle.innerText = t.modPulseTitle;
        dom.modPulseDesc.innerText = t.modPulseDesc;

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

    // Load actual sync states
    chrome.storage.local.get([
        'engineActive', 'preventThrottling', 'audioKeepAlive', 'activitySimulation', 'savedCyclesCount', 'uiLang'
    ], (result) => {
        dom.engineActive.checked = result.engineActive !== false;
        dom.preventThrottling.checked = result.preventThrottling !== false;
        dom.audioKeepAlive.checked = result.audioKeepAlive !== false;
        dom.activitySimulation.checked = result.activitySimulation !== false;
        dom.counterVal.innerText = (result.savedCyclesCount || 0).toLocaleString();
        
        const lang = result.uiLang || 'EN';
        updateLanguage(lang);
    });

    // Event listeners for segment switchers
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
        chrome.storage.local.set({ engineActive: dom.engineActive.checked }, updateStatusLabel);
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
