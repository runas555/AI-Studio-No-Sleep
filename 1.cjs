/**
 * ============================================================================
 * PATCH SCRIPT: Replaces text counter with a beautiful live visual pulse monitor.
 * File: patch-visual-pulse.cjs
 * Runtime: Node.js (CommonJS)
 * ============================================================================
 */

"use strict";

const fs = require('fs');
const path = require('path');

const targetFolder = path.join(process.cwd(), 'persistent-engine-ext');
const htmlFile = path.join(targetFolder, 'popup.html');
const jsFile = path.join(targetFolder, 'popup.js');

function log(msg, type = 'info') {
    const colors = {
        info: '\x1b[36m[INFO]\x1b[0m',
        success: '\x1b[32m[SUCCESS]\x1b[0m',
        error: '\x1b[31m[ERROR]\x1b[0m'
    };
    console.log(`${colors[type] || '[LOG]'} ${msg}`);
}

// --- UPDATED POPUP.HTML WITH CSS-ANIMATED PULSE WAVE ---
const pulseHtml = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Studio No Sleep</title>
    <style>
        :root {
            --bg-main: #0b1329;
            --bg-card: #1c2541;
            --text-main: #f8fafc;
            --text-muted: #8da9c4;
            --accent: #3b82f6;
            --success: #10b981;
            --danger: #ef4444;
            --border: #1e293b;
        }
        body {
            width: 320px;
            font-family: system-ui, -apple-system, sans-serif;
            background-color: var(--bg-main);
            color: var(--text-main);
            margin: 0;
            padding: 16px;
            user-select: none;
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            padding-bottom: 12px;
            margin-bottom: 16px;
        }
        .logo {
            display: flex;
            align-items: center;
            gap: 6px;
            font-weight: 700;
            font-size: 14px;
        }
        .logo-dot {
            width: 8px;
            height: 8px;
            background-color: var(--success);
            border-radius: 50%;
            box-shadow: 0 0 6px var(--success);
        }
        
        /* Language switcher */
        .lang-selector {
            display: flex;
            gap: 2px;
            background-color: rgba(255,255,255,0.05);
            border-radius: 4px;
            padding: 2px;
        }
        .lang-btn {
            display: flex;
            align-items: center;
            gap: 4px;
            background: none;
            border: none;
            color: var(--text-muted);
            padding: 2px 6px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            font-weight: 600;
        }
        .lang-btn.active {
            background-color: var(--bg-card);
            color: var(--text-main);
        }
        .lang-btn svg {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }

        .card {
            background-color: var(--bg-card);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 12px;
        }
        .flex-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .toggle-label {
            font-size: 13px;
            font-weight: 600;
        }
        .toggle-desc {
            font-size: 10px;
            color: var(--text-muted);
            margin-top: 3px;
            line-height: 1.3;
        }
        
        /* Switch */
        .switch {
            position: relative;
            display: inline-block;
            width: 36px;
            height: 18px;
        }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider {
            position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
            background-color: #475569; transition: .2s; border-radius: 18px;
        }
        .slider:before {
            position: absolute; content: ""; height: 12px; width: 12px; left: 3px; bottom: 3px;
            background-color: white; transition: .2s; border-radius: 50%;
        }
        input:checked + .slider { background-color: var(--success); }
        input:checked + .slider:before { transform: translateX(18px); }

        /* GRAPHICAL HEARTBEAT MONITOR */
        .monitor-card {
            background-color: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 8px;
            padding: 16px 12px;
            margin-bottom: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 14px;
        }
        .monitor-title {
            font-size: 10px;
            color: var(--text-muted);
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        
        .pulse-visualizer {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            width: 100%;
        }
        
        /* Laser scanning line */
        .scan-line {
            position: relative;
            width: 80%;
            height: 2px;
            background: rgba(255, 255, 255, 0.08);
            border-radius: 1px;
            overflow: hidden;
        }
        .scan-glow {
            position: absolute;
            left: -40%;
            width: 40%;
            height: 100%;
            background: linear-gradient(90deg, transparent, var(--success), transparent);
        }
        
        /* Bouncing Equalizer Wave */
        .equalizer {
            display: flex;
            align-items: flex-end;
            justify-content: center;
            gap: 5px;
            height: 20px;
        }
        .equalizer .bar {
            width: 3px;
            height: 20%;
            background-color: #475569;
            border-radius: 1.5px;
            transition: background-color 0.3s ease, height 0.3s ease;
        }

        /* Active animations */
        .pulse-visualizer.active .scan-glow {
            animation: scan 1.4s infinite linear;
        }
        .pulse-visualizer.active .bar {
            background-color: var(--success);
            box-shadow: 0 0 5px var(--success);
            animation: bounce 0.8s infinite ease-in-out alternate;
        }
        .pulse-visualizer.active .bar:nth-child(1) { animation-delay: 0.1s; height: 30%; }
        .pulse-visualizer.active .bar:nth-child(2) { animation-delay: 0.4s; height: 60%; }
        .pulse-visualizer.active .bar:nth-child(3) { animation-delay: 0.2s; height: 90%; }
        .pulse-visualizer.active .bar:nth-child(4) { animation-delay: 0.5s; height: 40%; }
        .pulse-visualizer.active .bar:nth-child(5) { animation-delay: 0.3s; height: 70%; }

        @keyframes scan {
            0% { left: -40%; }
            100% { left: 100%; }
        }
        @keyframes bounce {
            0% { height: 15%; opacity: 0.4; }
            100% { height: 100%; opacity: 1; }
        }

        .status-badge {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
            transition: color 0.3s ease;
        }
        .stats-text {
            font-size: 9px;
            color: rgba(255,255,255,0.2);
            text-transform: uppercase;
            font-weight: 600;
            margin-top: 4px;
        }

        /* Collapsible Advanced Panel */
        .advanced-toggle {
            display: block;
            width: 100%;
            background: none;
            border: none;
            color: var(--text-muted);
            font-size: 11px;
            text-align: center;
            cursor: pointer;
            padding: 4px 0;
            text-decoration: underline;
        }
        .advanced-panel {
            display: none;
            margin-top: 10px;
            border-top: 1px solid rgba(255,255,255,0.05);
            padding-top: 10px;
            flex-direction: column;
            gap: 12px;
        }
        .advanced-panel.open {
            display: flex;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">
            <div class="logo-dot"></div>
            <span id="txt-logo">AI STUDIO NO SLEEP</span>
        </div>
        
        <div class="lang-selector">
            <button id="langBtnEN" class="lang-btn">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <clipPath id="c1"><circle cx="50" cy="50" r="50"/></clipPath>
                    <g clip-path="url(#c1)">
                        <rect width="100" height="100" fill="#00247d"/>
                        <path d="M0,0 L100,100 M100,0 L0,100" stroke="#fff" stroke-width="12"/>
                        <path d="M0,0 L100,100 M100,0 L0,100" stroke="#cf142b" stroke-width="6"/>
                        <path d="M50,0 L50,100 M0,50 L100,50" stroke="#fff" stroke-width="20"/>
                        <path d="M50,0 L50,100 M0,50 L100,50" stroke="#cf142b" stroke-width="12"/>
                    </g>
                </svg>
                <span>EN</span>
            </button>
            <button id="langBtnRU" class="lang-btn active">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <clipPath id="c2"><circle cx="50" cy="50" r="50"/></clipPath>
                    <g clip-path="url(#c2)">
                        <rect y="0" width="100" height="33.3" fill="#fff"/>
                        <rect y="33.3" width="100" height="33.4" fill="#0039a6"/>
                        <rect y="66.7" width="100" height="33.3" fill="#d52b1e"/>
                    </g>
                </svg>
                <span>RU</span>
            </button>
        </div>
    </div>

    <!-- Main Switch -->
    <div class="card flex-row">
        <div style="max-width: 210px;">
            <div id="txt-engine-title" class="toggle-label">Работа в фоне</div>
            <div id="txt-engine-desc" class="toggle-desc">Текст продолжит создаваться, даже если вы свернете браузер или перейдете в другую вкладку.</div>
        </div>
        <label class="switch">
            <input type="checkbox" id="engineActive">
            <span class="slider"></span>
        </label>
    </div>

    <!-- Graphic Heartbeat Monitor Card -->
    <div class="monitor-card">
        <div id="txt-met-prevented" class="monitor-title">Активность защиты</div>
        
        <!-- Live Neon Visualizer -->
        <div id="pulseVisualizer" class="pulse-visualizer active">
            <div class="scan-line">
                <div class="scan-glow"></div>
            </div>
            
            <div class="equalizer">
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
            </div>
        </div>

        <div id="statusLabel" class="status-badge" style="color: var(--success);">ЗАЩИТА РАБОТАЕТ</div>
        
        <!-- Hidden/Subtle numerical cycle backup -->
        <div class="stats-text">
            <span id="txt-cycles-label">Циклы активности:</span> <span id="counterVal">0</span>
        </div>
    </div>

    <!-- Collapsible settings -->
    <button id="toggleAdvanced" class="advanced-toggle">Показать дополнительные настройки</button>
    
    <div id="advancedPanel" class="advanced-panel">
        <div class="flex-row">
            <div>
                <div id="txt-mod-throttle-title" class="toggle-label" style="font-size: 12px;">Ускорение работы в фоне</div>
                <div id="txt-mod-throttle-desc" class="toggle-desc">Позволяет тексту генерироваться с обычной скоростью.</div>
            </div>
            <input type="checkbox" id="preventThrottling">
        </div>

        <div class="flex-row" style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px;">
            <div>
                <div id="txt-mod-audio-title" class="toggle-label" style="font-size: 12px;">Защита от засыпания вкладки</div>
                <div id="txt-mod-audio-desc" class="toggle-desc">Не дает браузеру «усыпить» или закрыть фоновую вкладку.</div>
            </div>
            <input type="checkbox" id="audioKeepAlive">
        </div>

        <div class="flex-row" style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px;">
            <div>
                <div id="txt-mod-pulse-title" class="toggle-label" style="font-size: 12px;">Имитация движений мыши</div>
                <div id="txt-mod-pulse-desc" class="toggle-desc">Двигает виртуальную мышь для обхода защиты сайтов от бездействия.</div>
            </div>
            <input type="checkbox" id="activitySimulation">
        </div>
    </div>

    <div class="footer-note" id="txt-footer">
        Совместимо с Microsoft Edge и Google Chrome
    </div>

    <script src="popup.js"></script>
</body>
</html>
`;

// --- UPDATED POPUP.JS WITH STATE-DRIVEN ANIMATION CONTROL ---
const pulseJs = `
/**
 * SIMPLIFIED UI CONTROLLER WITH NEON VISUAL PULSE
 */

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
            dom.pulseVisualizer.classList.add('active'); // Start neon animations
        } else {
            dom.statusLabel.innerText = t.statusIdle;
            dom.statusLabel.style.color = 'var(--danger)';
            dom.pulseVisualizer.classList.remove('active'); // Freeze neon animations
        }
    }

    dom.toggleAdvanced.addEventListener('click', () => {
        const panel = dom.advancedPanel;
        const isOpen = panel.classList.toggle('open');
        const t = LOCALIZATION[currentLang];
        dom.toggleAdvanced.innerText = isOpen ? t.btnHideAdv : t.btnShowAdv;
    });

    // Load initial states
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

    // Live update counter
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
    if (!fs.existsSync(htmlFile) || !fs.existsSync(jsFile)) {
        log('Target directory is missing. Make sure setup.cjs has run.', 'error');
        process.exit(1);
    }

    try {
        fs.writeFileSync(htmlFile, pulseHtml.trim() + '\n', 'utf8');
        log('popup.html successfully updated with high-tech neon visual pulse.', 'success');

        fs.writeFileSync(jsFile, pulseJs.trim() + '\n', 'utf8');
        log('popup.js updated (integrated neon state triggers).', 'success');
        
        log('Graphical Pulse Update complete!', 'success');
    } catch (e) {
        log(`Failed to apply graphical patch: ${e.message}`, 'error');
    }
}

run();