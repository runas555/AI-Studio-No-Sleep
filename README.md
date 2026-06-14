# AI Studio No Sleep

A secure, privacy-focused extension engineered exclusively for **Google AI Studio** (`aistudio.google.com`). It ensures that long-running text and code generation tasks continue operating smoothly in the background, even when the browser window is completely minimized, occluded, or when you switch to other active desktop applications.

---

## 📖 Table of Contents
- [The Problem vs. The Solution](#-the-problem-vs-the-solution)
- [Key Features](#-key-features)
- [How to Install](#-how-to-install)
- [Advanced OS-Level Configuration](#-advanced-os-level-configuration)
- [User Interface](#-user-interface)
- [Project Architecture](#-project-architecture)
- [Privacy & Security](#-privacy--security)

---

## 🧠 The Problem vs. The Solution

### The Background Freezing Problem
Modern Chromium-based browsers (such as Microsoft Edge and Google Chrome) employ aggressive power-saving and memory-reduction algorithms. When a tab is backgrounded or its window is minimized:
1. **CPU Throttling:** JavaScript timer queues (`setInterval`/`setTimeout`) are clamped to 1 tick per minute or suspended entirely.
2. **rAF Suspension:** The browser completely halts the `requestAnimationFrame` loop (0 Hz), breaking the rendering of incoming text streams.
3. **Angular CDK Virtual Scroll Freeze:** Since Google AI Studio uses Angular's virtual viewport rendering, simply moving the cursor away blocks the DOM from updating and rendering newly generated text, resulting in a paused generation state that only resumes upon manual tab activation (the "cold start" latency).

### Our Architectural Solution
"AI Studio No Sleep" bypasses these browser constraints using a coordinated multi-layered approach:
* **Infrasound Media Priority (1 Hz Hack):** Plays a mathematically silent **1 Hz infrasound wave** at `0.02` volume. This is completely silent to human ears and pets, but forces Chromium to register the tab as an active media player. The tab is granted **Media Priority**, exempting its main thread from background CPU throttling.
* **Event-Driven Angular CDK Scroll Buster:** Overrides scroll mechanics by dispatching native `scroll` events and simulating hardware `End` keyboard presses on the active viewport. This forces Angular to digest changes and render streamed content.
* **Long-Lived Message Ports:** Establishes permanent background channels to prevent the extension service worker from going to sleep.

---

## 🌟 Key Features

| Feature | Description | Technical Implementation |
| :--- | :--- | :--- |
| **Infrasound Priority** | Prevents the browser from sleeping when minimized. | 1 Hz Sine Wave Oscillator |
| **System Wake Lock** | Blocks the computer monitor and OS from sleeping during heavy tasks. | HTML5 Screen Wake Lock API |
| **Adaptive Scroll** | Keeps long streams scrolled to the absolute bottom in real-time. | Angular CDK DOM event dispatcher |
| **Anti-Accidental Close** | Prompts before close only when generation is running. | Capture-phase `beforeunload` lock |
| **Dynamic Toolbar Badge** | Shows active status (`ON`) and turns into a checkmark (`✓`) on finish. | `chrome.action` badge controller |
| **Desktop Notifications** | Sends a native OS notification with the exact generation time. | `chrome.notifications` API |
| **Invisible On-Page Footprint**| Leaves the original Google AI Studio UI completely clean. | DOM-isolated background script |

---

## 🚀 How to Install

### Microsoft Edge & Google Chrome (Unpacked Mode)

1. **Download the Codebase:**
   Make sure you have the `persistent-engine-ext` folder prepared on your local drive.

2. **Open Extensions Page:**
   * In **Microsoft Edge**, navigate to `edge://extensions/`
   * In **Google Chrome**, navigate to `chrome://extensions/`

3. **Enable Developer Mode:**
   Turn on the **Developer mode** toggle switch (usually found in the left sidebar or top right corner).

4. **Load the Extension:**
   * Click the **Load unpacked** (Загрузить распакованное) button.
   * Select the `persistent-engine-ext` directory.

5. **Pin to Toolbar:**
   Click the Extension puzzle icon in your browser toolbar and pin **AI Studio No Sleep** to keep its visual status badge visible.

---

## ⚙️ Advanced OS-Level Configuration

On some laptops, system-level battery-saving profiles can override browser-level policies. To guarantee background execution, we highly recommend adding a permanent exemption in Microsoft Edge:

1. Open Edge settings by navigating to `edge://settings/system`
2. Scroll down to the **Optimizing performance** (Оптимизация производительности) section.
3. Locate the list named **Never put these sites to sleep** (Никогда не переводить эти сайты в спящий режим).
4. Click **Add** (Добавить) and type: `aistudio.google.com`
5. Click **Add** to save.

---

## 🎨 User Interface

We designed the extension popup to be incredibly clean, modern, and accessible to non-technical users. 

* **Dual-Language Segmented Toggle:** Easily switch between English and Russian with stylized circular vector SVG flags.
* **Neon Pulse Monitor:** Includes a high-tech glowing scan line and vertical equalizer bars. When the engine is active, the wave fluctuates dynamically. When turned off, the animation freezes and turns gray to clearly indicate standby mode.
* **Collapsible Advanced Options:** Complex subsystem toggles (mouse simulation, background audio priority, and CPU acceleration) are safely tucked under an expandable advanced panel, keeping the main interface simple and clutter-free.

---

## 📁 Project Architecture

The directory contains the following modular assets:

```bash
persistent-engine-ext/
├── manifest.json       # Secure MV3 configuration locked to aistudio.google.com
├── content.js          # Direct DOM hooks, Infrasound, Auto-Scroll, & Anti-Close Guard
├── background.js       # System Wake-Locks, Keep-Alive Port, & Toolbar Badges
├── popup.html          # Responsive Dark-Theme control panel with custom SVG flags
├── popup.js            # UI Localization & live animation state triggers
└── icons/
    ├── icon16.png      # Stylized AI Sparkle & Activity Ring icon (16x16)
    ├── icon48.png      # Medium Extension Icon (48x48)
    └── icon128.png     # High-Resolution Extension Icon (128x128)
```

### Automation & Deployment Pipeline
We have included robust CommonJS helper scripts in the root directory:
* `setup.cjs` - Installs package dependencies and generates the initial clean directory structure.
* `rollback.cjs` - Reverts the workspace to a pristine git commit state if needed.
* `dump-current.cjs` - Creates a consolidated `dump.txt` file containing the exact state of all active files for audits and verification.

---

## 🔒 Privacy & Security

* **Strict Sandboxing:** The extension is locked exclusively to `https://aistudio.google.com/*`. It does not request access to any other websites, keeping your personal browsing data completely secure.
* **Zero Analytics:** No tracking scripts, no external server connections, and no telemetry tracking. All metrics and configurations are stored locally on your machine via `chrome.storage.local`.
* **Zero Audible Footprint:** The infrasound wave operates at 1 Hz, which is completely silent to human ears and will not cause discomfort or audible interference.