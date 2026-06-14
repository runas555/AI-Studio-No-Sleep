/**
 * ============================================================================
 * PATCH SCRIPT: Introduces SVG flag language selectors (No emojis, pure SVG).
 * File: patch-lang.cjs
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

// --- UPDATED POPUP.HTML ---
const updatedPopupHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Persistent Engine Panel</title>
    <style>
        :root {
            --bg-main: #0f172a;
            --bg-card: #1e293b;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --accent: #3b82f6;
            --success: #10b981;
            --danger: #ef4444;
            --border: #334155;
        }
        body {
            width: 340px;
            font-family: system-ui, -apple-system, sans-serif;
            background-color: var(--bg-main);
            color: var(--text-main);
            margin: 0;
            padding: 16px;
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--border);
            padding-bottom: 12px;
            margin-bottom: 16px;
        }
        .logo {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 800;
            font-size: 15px;
            letter-spacing: -0.5px;
        }
        .logo-dot {
            width: 10px;
            height: 10px;
            background-color: var(--success);
            border-radius: 50%;
            box-shadow: 0 0 8px var(--success);
        }
        
        /* Segmented Language Selector */
        .lang-selector {
            display: flex;
            gap: 4px;
            background-color: #1e293b;
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 2px;
        }
        .lang-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            background: none;
            border: none;
            color: var(--text-muted);
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 600;
            transition: all 0.2s ease;
        }
        .lang-btn.active {
            background-color: #334155;
            color: var(--text-main);
            box-shadow: 0 0 4px rgba(59, 130, 246, 0.2);
        }
        .lang-btn svg {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            display: block;
        }

        .card {
            background-color: var(--bg-card);
            border: 1px solid var(--border);
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
            margin-top: 2px;
        }
        
        /* Toggle Switch */
        .switch {
            position: relative;
            display: inline-block;
            width: 40px;
            height: 20px;
        }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider {
            position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
            background-color: #475569; transition: .2s; border-radius: 20px;
        }
        .slider:before {
            position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px;
            background-color: white; transition: .2s; border-radius: 50%;
        }
        input:checked + .slider { background-color: var(--success); }
        input:checked + .slider:before { transform: translateX(20px); }

        .metrics {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 12px;
        }
        .metric-card {
            background-color: #1a2238;
            border: 1px solid #2e3b5e;
            border-radius: 8px;
            padding: 10px;
            text-align: center;
        }
        .metric-title { font-size: 9px; color: var(--text-muted); font-weight: 600; }
        .metric-value { font-size: 18px; font-weight: 800; color: var(--accent); margin-top: 4px; }

        .footer-note {
            font-size: 10px;
            color: #475569;
            text-align: center;
            margin-top: 16px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">
            <div class="logo-dot"></div>
            <span id="txt-logo">PERSISTENT ENGINE</span>
        </div>
        
        <!-- Segmented Flag Switcher -->
        <div class="lang-selector">
            <button id="langBtnEN" class="lang-btn active">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <clipPath id="circleView"><circle cx="50" cy="50" r="50"/></clipPath>
                    <g clip-path="url(#circleView)">
                        <rect width="100" height="100" fill="#00247d"/>
                        <path d="M0,0 L100,100 M100,0 L0,100" stroke="#fff" stroke-width="12"/>
                        <path d="M0,0 L100,100 M100,0 L0,100" stroke="#cf142b" stroke-width="6"/>
                        <path d="M50,0 L50,100 M0,50 L100,50" stroke="#fff" stroke-width="20"/>
                        <path d="M50,0 L50,100 M0,50 L100,50" stroke="#cf142b" stroke-width="12"/>
                    </g>
                </svg>
                <span>EN</span>
            </button>
            <button id="langBtnRU" class="lang-btn">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <clipPath id="circleViewRU"><circle cx="50" cy="50" r="50"/></clipPath>
                    <g clip-path="url(#circleViewRU)">
                        <rect y="0" width="100" height="33.3" fill="#fff"/>
                        <rect y="33.3" width="100" height="33.4" fill="#0039a6"/>
                        <rect y="66.7" width="100" height="33.3" fill="#d52b1e"/>
                    </g>
                </svg>
                <span>RU</span>
            </button>
        </div>
    </div>

    <!-- Main Engine Activation Toggle -->
    <div class="card flex-row">
        <div>
            <div id="txt-engine-title" class="toggle-label">Active Simulation Shield</div>
            <div id="txt-engine-desc" class="toggle-desc">Keeps tab execution active</div>
        </div>
        <label class="switch">
            <input type="checkbox" id="engineActive">
            <span class="slider"></span>
        </label>
    </div>

    <!-- Telemetry Metrics -->
    <div class="metrics">
        <div class="metric-card">
            <div id="txt-met-prevented" class="metric-title">PREVENTED PAUSES</div>
            <div id="counterVal" class="metric-value">0</div>
        </div>
        <div class="metric-card">
            <div id="txt-met-status" class="metric-title">ENGINE STATE</div>
            <div id="statusLabel" class="metric-value" style="font-size: 13px; margin-top: 8px; color: var(--success);">ACTIVE</div>
        </div>
    </div>

    <!-- Module Settings -->
    <div class="card" style="display: flex; flex-direction: column; gap: 10px;">
        <div id="txt-modules-header" style="font-size: 11px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px;">SUB-SYSTEM CONFIGURATION</div>
        
        <div class="flex-row">
            <div>
                <div id="txt-mod-throttle-title" class="toggle-label" style="font-size: 12px;">Timer Optimization Bypass</div>
                <div id="txt-mod-throttle-desc" class="toggle-desc">Forces background worker threads</div>
            </div>
            <input type="checkbox" id="preventThrottling">
        </div>

        <div class="flex-row" style="border-top: 1px solid var(--border); padding-top: 8px;">
            <div>
                <div id="txt-mod-audio-title" class="toggle-label" style="font-size: 12px;">Audio Keep-Alive Loop</div>
                <div id="txt-mod-audio-desc" class="toggle-desc">Trick Edge from sleeping tab mode</div>
            </div>
            <input type="checkbox" id="audioKeepAlive">
        </div>

        <div class="flex-row" style="border-top: 1px solid var(--border); padding-top: 8px;">
            <div>
                <div id="txt-mod-pulse-title" class="toggle-label" style="font-size: 12px;">Random Activity Pulse</div>
                <div id="txt-mod-pulse-desc" class="toggle-desc">Inject virtual mouse events</div>
            </div>
            <input type="checkbox" id="activitySimulation">
        </div>
    </div>

    <div class="footer-note">
        Microsoft Edge & Chromium Stable Compatibility Mode
    </div>

    <script src="popup.js"></script>
</body>
</html>
`;

// --- UPDATED POPUP.JS ---
const updatedPopupJs = `
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
`;

function runPatch() {
    if (!fs.existsSync(htmlFile) || !fs.existsSync(jsFile)) {
        log(`Target extension directory or assets are missing in ${targetFolder}`, 'error');
        process.exit(1);
    }

    try {
        fs.writeFileSync(htmlFile, updatedPopupHtml.trim() + '\n', 'utf8');
        log('popup.html updated with beautiful SVG flags.', 'success');

        fs.writeFileSync(jsFile, updatedPopupJs.trim() + '\n', 'utf8');
        log('popup.js updated to support Segment Language Switcher.', 'success');
        
        log('Multilingual update with vector flags successfully applied!', 'success');
    } catch (e) {
        log(`Patch execution error: ${e.message}`, 'error');
    }
}

runPatch();