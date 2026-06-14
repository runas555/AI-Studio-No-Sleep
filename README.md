# AI Studio No Sleep

A lightweight Chromium (Microsoft Edge and Google Chrome) extension designed to prevent Google AI Studio from pausing, throttling, or suspending long text generation runs when the tab is minimized, placed in the background, or when the computer is left unattended.

---

## Technical Overview

Modern Chromium-based browsers employ aggressive resource-saving mechanisms, such as **Sleeping Tabs**, **CPU timer clamping**, and **requestAnimationFrame (rAF) suspension**, which can stall active connections or pause streaming responses in background tabs. 

This extension mitigates these issues by implementing a multi-layered background priority and simulated activity engine:

1. **Infrasound Media Priority (1Hz):** Instantiates an inaudible low-frequency `AudioContext` sine wave at 1 Hz with a minimal gain (`0.02`). This registers the tab as an active media player in Chromium's scheduler, securing high-priority CPU execution cycles even when fully minimized.
2. **System Wake Lock API:** Dynamically requests a screen/system wake lock when generation starts, preventing the host operating system from sleeping or locking the screen during long active runs.
3. **Adaptive Scroll Engine:** Automatically scroll-locks both standard DOM elements and custom Angular CDK virtual viewports (used by Google AI Studio) to the bottom, ensuring the entire generated content is rendered and visible.
4. **Anti-Accidental Close Guard:** Temporarily intercepts `beforeunload` events during active generation to prevent data loss from accidental tab or browser closure.
5. **Long-Lived Message Ports:** Establishes a persistent port connection between the content script and the background service worker, preventing Manifest V3 background thread termination.
6. **Dynamic Badges & Tab Cues:** Animates the browser toolbar badge to show active protection (`ON`) and completion (`✓`). Flashes the browser tab title (`✅ DONE!`) when background generation finishes.

---

## Extension Structure

* **`manifest.json`:** Standard Manifest V3 setup restricting host permissions exclusively to `https://aistudio.google.com/*` for optimal security and privacy.
* **`content.js`:** The core page-level injection script. Handles immediate, synchronous API overrides (`visibilityState`, `hidden`, `hasFocus`), captures blur/visibility events, manages the 1Hz infrasound, and monitors the generation state.
* **`background.js`:** Manages the system-wide wake lock via the `chrome.power` API, handles long-lived ports, and coordinates the toolbar badge states.
* **`popup.html` & `popup.js`:** A clean, minimal dark-mode-compatible user interface featuring real-time neon pulse visualizations (ECG scanline and equalizer bars) to show active protection status, with Russian and English localization support.

---

## Installation Instructions

To load the unpacked extension in Microsoft Edge or Google Chrome:

1. Download or clone this repository containing the `persistent-engine-ext` folder.
2. Open your browser and navigate to the extensions management page:
   * **Microsoft Edge:** `edge://extensions/`
   * **Google Chrome:** `chrome://extensions/`
3. Enable **Developer mode** using the toggle switch (usually found in the top-right or bottom-left corner).
4. Click the **Load unpacked** (Загрузить распакованное расширение) button.
5. Select the `persistent-engine-ext` folder from your local file system.
6. The extension is now loaded and active. 

---

## Recommended Browser Configuration

To ensure optimal performance and prevent operating system battery-saving policies from overriding the browser, it is highly recommended to add a permanent exemption for Google AI Studio:

1. Open your browser settings and navigate to the System and Performance section:
   * **Microsoft Edge:** `edge://settings/system`
   * **Google Chrome:** `chrome://settings/performance`
2. Locate the **Efficiency mode** or **Sleeping tabs** configuration blocks.
3. Find the option labeled **Never put these sites to sleep** (Никогда не переводить эти сайты в спящий режим) and click **Add** (Добавить).
4. Enter the domain: `aistudio.google.com` and click **Add**.

---

## License

This project is licensed under the MIT License.