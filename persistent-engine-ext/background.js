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
});

// High-frequency tick initiator
function startGlobalPulse() {
    if (activePulseInterval) clearInterval(activePulseInterval);
    
    activePulseInterval = setInterval(() => {
        chrome.storage.local.get(['engineActive'], (res) => {
            if (res.engineActive !== false) {
                // Query all tabs and send wake-up triggers
                chrome.tabs.query({}, (tabs) => {
                    tabs.forEach(tab => {
                        // Safe dispatch avoiding internal extension pages
                        if (tab.url && tab.url.startsWith('http')) {
                            chrome.tabs.sendMessage(tab.id, { type: 'WAKE_UP_PULSE' }, () => {
                                // Clear last error to suppress console noise for inactive frames
                                if (chrome.runtime.lastError) return;
                            });
                        }
                    });
                });
            }
        });
    }, 500); // 500ms Wake up intervals to bypass minimized task freezing
}

// Keep connection alive on install/restart
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
        // Make sure background pulse is running
        if (!activePulseInterval) startGlobalPulse();
        sendResponse({ alive: true });
        return false;
    }
});
