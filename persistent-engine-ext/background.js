let activePulseInterval = null;

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

// High-frequency tick initiator
function startGlobalPulse() {
    if (activePulseInterval) clearInterval(activePulseInterval);
    
    activePulseInterval = setInterval(() => {
        chrome.storage.local.get(['engineActive'], (res) => {
            if (res.engineActive !== false) {
                chrome.tabs.query({}, (tabs) => {
                    tabs.forEach(tab => {
                        if (tab.url && tab.url.startsWith('http')) {
                            // Send wake-up triggers
                            chrome.tabs.sendMessage(tab.id, { type: 'WAKE_UP_PULSE' }, () => {
                                if (chrome.runtime.lastError) return;
                            });

                            // CRITICAL EDGE FIX: Prevent Tab Discarding (sleeping tabs mode) on active pages
                            chrome.tabs.update(tab.id, { autoDiscardable: false }, () => {
                                if (chrome.runtime.lastError) return;
                            });
                        }
                    });
                });
            }
        });
    }, 500);
}

// Controls visual feedback Badge in Edge toolbar
function updateToolbarBadge() {
    chrome.storage.local.get(['engineActive'], (res) => {
        const active = res.engineActive !== false;
        if (active) {
            chrome.action.setBadgeText({ text: "ON" });
            chrome.action.setBadgeBackgroundColor({ color: "#10b981" }); // Emerald Green
        } else {
            chrome.action.setBadgeText({ text: "OFF" });
            chrome.action.setBadgeBackgroundColor({ color: "#ef4444" }); // Red
        }
    });
}

// Listen for tab switching to enforce non-discarding state dynamically
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
        setTimeout(() => {
            updateToolbarBadge();
        }, 100);
        sendResponse({ ack: true });
        return false;
    }
});
