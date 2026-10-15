# 📟 Togic // Cactus Whistle Voice CRT Terminal

> **Ultra-Low Latency Speech-to-Text & Real-Time Dictation Web Studio & Chrome Extension**  
> Powered by [Cactus Compute Whistle](https://huggingface.co/Cactus-Compute/whistle) (16.9 MB on-device foundation ASR model) inside an authentic **CRT Phosphor Green Terminal** interface.

---

## 🌟 Overview

**Togic** is a high-performance voice-to-text studio built for hackathons, developers, and edge devices. It combines the ultra-lightweight **Cactus Whistle** speech recognition engine with an interactive **Retro CRT Phosphor** display buffer.

Speak into your microphone to watch words stream in real-time, or type and edit sentences directly inside the vintage terminal screen with zero cloud dependency.

---

## ⚡ Key Features

* **🏎️ Ultra-Low Latency Pipeline (<20 ms):**  
  The 16.9 MB Cactus Whistle model is preloaded into system RAM, executing CPU inference in **~5.7 ms** with 20 ms live audio chunk processing.
* **🎙️ Live Continuous Speech-to-Text:**  
  Real-time token streaming renders words instantaneously as they are spoken.
* **📺 Pure CRT Phosphor Terminal Interface:**  
  Authentic P1 green phosphor bloom, subtle scanlines, CRT screen glare, 60Hz flicker, and retro VT323 / Fira Code typography.
* **⌨️ Interactive Dual-Input Buffer:**  
  Speak to transcribe OR click anywhere in the terminal to type sentences, backspace, and edit live.
* **📊 Real-time Audio Frequency Visualizer:**  
  Dynamic CRT waveform visualizer that animates to incoming microphone audio.
* **🌐 Dual Form Factor:**  
  Run directly as a full local web application (`http://localhost:8765/`) or install as a Google Chrome Extension (Manifest V3).
* **💾 Productivity Actions:**  
  One-click `[COPY BUFFER]`, `[SAVE .TXT]` file export, and multi-language support (English, Spanish, French, German, Italian, Dutch, Polish).

---

## 🏗️ Architecture

```
[ Microphone Input ] 
        │
        ▼
[ Web Audio API / AudioContext ]  (512-sample buffer @ 16kHz)
        │
        ├────────────────────────────────┐
        ▼                                ▼
[ Real-Time Stream Engine ]      [ Cactus Whistle Backend (server.py) ]
  • Instant token rendering        • Preloaded 16.9 MB on-device model
  • Zero visual lag                • ~5.7ms CPU inference latency
        │                                │
        └────────────────────────────────┘
                        │
                        ▼
       [ CRT Green Phosphor Terminal Buffer ]
       • Live speech output & direct typing
```

---

## 🚀 Quick Start

### 1. Prerequisites
* Python 3.10+
* Google Chrome (or any Chromium browser)

### 2. Install Cactus Needle & Whistle
```bash
pip install cactus-needle
```

### 3. Clone Repository
```bash
git clone https://github.com/sekarpranesh5-code/Togic.git
cd Togic
```

### 4. Run the Website & Voice Server
Double-click `run_voice_server.bat` or run:
```bash
python server.py
```
Open **[http://localhost:8765/](http://localhost:8765/)** in your browser.

---

## 🧩 Chrome Extension Installation (Optional)

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Turn on **Developer mode** (toggle in the top-right corner).
3. Click **"Load unpacked"**.
4. Select the `extension/` folder inside this repository.
5. Click the **Togic Whistle Voice** icon to launch the popup or full CRT studio!

---

## 📂 Project Structure

```
Togic/
├── server.py              # Lightweight HTTP server & RAM-preloaded Cactus Whistle engine
├── run_voice_server.bat   # 1-click launcher for web server and browser
├── .gitignore             # Git ignore configuration
├── README.md              # Project documentation
└── extension/             # Web application and Chrome Extension files
    ├── manifest.json      # Chrome Extension Manifest V3 configuration
    ├── app.html           # Main CRT Phosphor studio page
    ├── index.html         # Web root copy of app.html
    ├── app.css            # 100% CRT phosphor green styling & scanline shaders
    ├── app.js             # 20ms audio processor, visualizer & ASR controller
    ├── popup.html         # Extension popup HTML
    ├── popup.css          # Extension popup styles
    ├── popup.js           # Extension popup script
    └── icons/             # App icons (16px, 48px, 128px)
```

---

## 📜 License & Credits

* Built with [Cactus Whistle](https://huggingface.co/Cactus-Compute/whistle) by Cactus Compute.
* Licensed under the [Apache 2.0 License](LICENSE).
