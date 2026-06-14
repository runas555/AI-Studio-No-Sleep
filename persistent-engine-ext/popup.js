/**
 * UI Panel controller logic
 * Binds DOM inputs directly to local Chrome/Edge Storage structure.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Element mapping
    const engineActive = document.getElementById('engineActive');
    const sliderBtn = document.getElementById('sliderBtn');
    const statusLabel = document.getElementById('statusLabel');
    const counterVal = document.getElementById('counterVal');
    const preventThrottling = document.getElementById('preventThrottling');
    const audioKeepAlive = document.getElementById('audioKeepAlive');
    const activitySimulation = document.getElementById('activitySimulation');
    const heartbeatRate = document.getElementById('heartbeatRate');
    const rateLabel = document.getElementById('rateLabel');

    const elementsToSync = {
        engineActive: engineActive,
        preventThrottling: preventThrottling,
        audioKeepAlive: audioKeepAlive,
        activitySimulation: activitySimulation
    };

    // Load actual configurations and display state
    chrome.storage.local.get([
        'engineActive',
        'preventThrottling',
        'audioKeepAlive',
        'activitySimulation',
        'heartbeatRate',
        'savedCyclesCount'
    ], (result) => {
        // Toggle Switch Display Configuration
        engineActive.checked = result.engineActive !== false;
        adjustToggleDisplay(engineActive.checked);

        // Map general toggles
        preventThrottling.checked = result.preventThrottling !== false;
        audioKeepAlive.checked = result.audioKeepAlive !== false;
        activitySimulation.checked = result.activitySimulation !== false;

        // Display telemetry values
        const count = result.savedCyclesCount || 0;
        counterVal.innerText = count.toLocaleString();

        const rate = result.heartbeatRate || 15;
        heartbeatRate.value = rate;
        rateLabel.innerText = rate + 's';
    });

    // Toggle styling handler
    function adjustToggleDisplay(isActive) {
        if (isActive) {
            sliderBtn.style.backgroundColor = '#10b981';
            // Custom translation emulation inside pure CSS
            sliderBtn.style.boxShadow = 'inset 22px 0 0 #10b981, inset 0 0 0 2px #10b981';
            statusLabel.innerText = "Simulation Engine Engaged";
            statusLabel.style.color = '#10b981';
        } else {
            sliderBtn.style.backgroundColor = '#475569';
            sliderBtn.style.boxShadow = 'none';
            statusLabel.innerText = "Engine Idle / Decoupled";
            statusLabel.style.color = '#ef4444';
        }
    }

    // Active change listeners
    engineActive.addEventListener('change', () => {
        const checked = engineActive.checked;
        adjustToggleDisplay(checked);
        chrome.storage.local.set({ engineActive: checked });
    });

    preventThrottling.addEventListener('change', () => {
        chrome.storage.local.set({ preventThrottling: preventThrottling.checked });
    });

    audioKeepAlive.addEventListener('change', () => {
        chrome.storage.local.set({ audioKeepAlive: audioKeepAlive.checked });
    });

    activitySimulation.addEventListener('change', () => {
        chrome.storage.local.set({ activitySimulation: activitySimulation.checked });
    });

    heartbeatRate.addEventListener('input', () => {
        const val = heartbeatRate.value;
        rateLabel.innerText = val + 's';
        chrome.storage.local.set({ heartbeatRate: parseInt(val, 10) });
    });
});
