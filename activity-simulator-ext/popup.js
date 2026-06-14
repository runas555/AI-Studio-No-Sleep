document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('mainToggle');
    const statusText = document.getElementById('statusText');

    // Sync UI with storage
    chrome.storage.local.get(['active'], (result) => {
        toggle.checked = result.active !== false;
        updateStatusText(toggle.checked);
    });

    toggle.addEventListener('change', () => {
        const isActive = toggle.checked;
        chrome.storage.local.set({ active: isActive }, () => {
            updateStatusText(isActive);
            chrome.runtime.sendMessage({ type: 'TOGGLE_ACTIVE', value: isActive });
        });
    });

    function updateStatusText(active) {
        if (active) {
            statusText.innerText = "Simulation is active. Tab focus won't be lost.";
            statusText.classList.replace('text-red-400', 'text-slate-200');
        } else {
            statusText.innerText = "Engine paused. Standard browser behavior applies.";
            statusText.classList.replace('text-slate-200', 'text-red-400');
        }
    }
});
