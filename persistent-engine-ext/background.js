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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'SIGNAL_PREVENT_PAUSE') {
        chrome.storage.local.get(['savedCyclesCount'], (res) => {
            const current = res.savedCyclesCount || 0;
            chrome.storage.local.set({ savedCyclesCount: current + 1 });
            sendResponse({ ack: true, currentCount: current + 1 });
        });
        return true; 
    }
});