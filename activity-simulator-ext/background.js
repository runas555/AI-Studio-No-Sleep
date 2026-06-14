chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ active: true });
    console.log('[PersistentEngine] Extension installed and ready.');
});

// Simple messaging logic for UI communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'TOGGLE_ACTIVE') {
        chrome.storage.local.set({ active: request.value });
        sendResponse({ status: 'updated' });
    }
});
