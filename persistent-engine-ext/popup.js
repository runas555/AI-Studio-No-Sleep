const LOCALIZATION = {
    EN: {
        logo: "AI STUDIO NO SLEEP",
        engineTitle: "Background protection",
        engineDesc: "Text will keep generating even if you minimize the browser or switch to another tab.",
        metPrevented: "PROTECTION HEALTH",
        statusActive: "PROTECTION ACTIVE",
        statusIdle: "PROTECTION PAUSED",
        btnShowAdv: "Show extra options",
        btnHideAdv: "Hide extra options",
        cyclesLabel: "Activity cycles: ",
        modThrottleTitle: "Force Background Speed",
        modThrottleDesc: "Ensure text continues loading at normal speed in the background.",
        modAudioTitle: "Prevent Tab Sleep Mode",
        modAudioDesc: "Prevents browser from putting your background tab to sleep.",
        modPulseTitle: "Imitate Activity",
        modPulseDesc: "Moves a virtual cursor to bypass site idle detectors.",
        modScrollTitle: "Auto-Scroll Page",
        modScrollDesc: "Automatically scrolls down to the bottom during text generation.",
        footer: "Compatible with Microsoft Edge & Google Chrome"
    },
    RU: {
        logo: "AI STUDIO NO SLEEP",
        engineTitle: "Работа в фоне",
        engineDesc: "Текст продолжит создаваться, даже если вы свернете браузер или перейдете в другую вкладку.",
        metPrevented: "АКТИВНОСТЬ ЗАЩИТЫ",
        statusActive: "ЗАЩИТА РАБОТАЕТ",
        statusIdle: "ЗАЩИТА НА ПАУЗЕ",
        btnShowAdv: "Показать дополнительные настройки",
        btnHideAdv: "Скрыть дополнительные настройки",
        cyclesLabel: "Циклы активности: ",
        modThrottleTitle: "Ускорение работы в фоне",
        modThrottleDesc: "Позволяет тексту генерироваться с обычной скоростью в фоне.",
        modAudioTitle: "Защита от засыпания вкладки",
        modAudioDesc: "Не дает браузеру переводить фоновую вкладку в режим энергосбережения.",
        modPulseTitle: "Имитация активности",
        modPulseDesc: "Двигает виртуальную мышь для обхода защиты сайтов от бездействия.",
        modScrollTitle: "Автопрокрутка экрана",
        modScrollDesc: "Автоматически опускает экран вниз при генерации ответа.",
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
        cyclesLabel: document.getElementById('txt-cycles-label'),
        pulseVisualizer: document.getElementById('pulseVisualizer'),
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
        modScrollTitle: document.getElementById('txt-mod-scroll-title'),
        modScrollDesc: document.getElementById('txt-mod-scroll-desc'),
        autoScrollActive: document.getElementById('autoScrollActive'),
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
        dom.cyclesLabel.innerText = t.cyclesLabel;
        dom.modThrottleTitle.innerText = t.modThrottleTitle;
        dom.modThrottleDesc.innerText = t.modThrottleDesc;
        dom.modAudioTitle.innerText = t.modAudioTitle;
        dom.modAudioDesc.innerText = t.modAudioDesc;
        dom.modPulseTitle.innerText = t.modPulseTitle;
        dom.modPulseDesc.innerText = t.modPulseDesc;
        dom.modScrollTitle.innerText = t.modScrollTitle;
        dom.modScrollDesc.innerText = t.modScrollDesc;
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
            dom.pulseVisualizer.classList.add('active');
        } else {
            dom.statusLabel.innerText = t.statusIdle;
            dom.statusLabel.style.color = 'var(--danger)';
            dom.pulseVisualizer.classList.remove('active');
        }
    }

    dom.toggleAdvanced.addEventListener('click', () => {
        const panel = dom.advancedPanel;
        const isOpen = panel.classList.toggle('open');
        const t = LOCALIZATION[currentLang];
        dom.toggleAdvanced.innerText = isOpen ? t.btnHideAdv : t.btnShowAdv;
    });

    chrome.storage.local.get([
        'engineActive', 'preventThrottling', 'audioKeepAlive', 'activitySimulation', 'savedCyclesCount', 'uiLang'
    ], (result) => {
        dom.engineActive.checked = result.engineActive !== false;
        dom.preventThrottling.checked = result.preventThrottling !== false;
        dom.audioKeepAlive.checked = result.audioKeepAlive !== false;
        dom.activitySimulation.checked = result.activitySimulation !== false;
        dom.autoScrollActive.checked = result.autoScrollActive !== false;
        dom.counterVal.innerText = (result.savedCyclesCount || 0).toLocaleString();
        const lang = result.uiLang || 'RU';
        updateLanguage(lang);
    });

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
