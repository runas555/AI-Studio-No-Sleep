let activePulseInterval = null;
const connectedPorts = new Set();

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        engineActive: true,
        preventThrottling: true,
        audioKeepAlive: true,
        activitySimulation: true,
        heartbeatRate: 15,
        savedCyclesCount: 0
    });
    updateToolbarBadge();
});

// Force-keep the system process awake using official Chrome Power API
function requestSystemAwake() {
    try {
        chrome.power.requestKeepAwake('system');
        console.log('[AI Studio No Sleep] System background process wake-lock engaged.');
    } catch (e) {
        console.warn('[AI Studio No Sleep] Failed to lock system state:', e);
    }
}

function broadcastWakeUp() {
    connectedPorts.forEach(port => {
        try {
            port.postMessage({ type: 'WAKE_UP_PULSE' });
        } catch (e) {
            connectedPorts.add(port);
        }
    });

    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            if (tab.url && tab.url.includes('aistudio.google.com')) {
                chrome.tabs.update(tab.id, { autoDiscardable: false }, () => {
                    if (chrome.runtime.lastError) return;
                });
            }
        });
    });
}

function startGlobalPulse() {
    requestSystemAwake();
    if (activePulseInterval) clearInterval(activePulseInterval);
    activePulseInterval = setInterval(broadcastWakeUp, 500);
}

function updateToolbarBadge() {
    chrome.storage.local.get(['engineActive'], (res) => {
        const active = res.engineActive !== false;
        if (active) {
            chrome.action.setBadgeText({ text: "ON" });
            chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
        } else {
            chrome.action.setBadgeText({ text: "OFF" });
            chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
        }
    });
}

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "KeepAlivePort") {
        connectedPorts.add(port);
        if (!activePulseInterval) startGlobalPulse();

        port.onDisconnect.addListener(() => {
            connectedPorts.delete(port);
            if (connectedPorts.size === 0 && activePulseInterval) {
                clearInterval(activePulseInterval);
                activePulseInterval = null;
                try { chrome.power.releaseKeepAwake(); } catch (e) {}
            }
        });
    }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.storage.local.get(['engineActive'], (res) => {
        if (res.engineActive !== false) {
            chrome.tabs.update(activeInfo.tabId, { autoDiscardable: false }, () => {
                if (chrome.runtime.lastError) return;
            });
        }
    });
});

startGlobalPulse();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'SIGNAL_PREVENT_PAUSE') {
        chrome.storage.local.get(['savedCyclesCount'], (res) => {
            const current = res.savedCyclesCount || 0;
            chrome.storage.local.set({ savedCyclesCount: current + 1 });
            sendResponse({ ack: true, currentCount: current + 1 });
        });
        return true; 
    }
    if (request.type === 'KEEP_ALIVE') {
        if (!activePulseInterval) startGlobalPulse();
        sendResponse({ alive: true });
        return false;
    }
    if (request.type === 'TOGGLE_ACTIVE') {
        setTimeout(updateToolbarBadge, 100);
        sendResponse({ ack: true });
        return false;
    }
});
