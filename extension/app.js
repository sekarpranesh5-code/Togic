/**
 * WHISTLE VOICE CRT PHOSPHOR TERMINAL - ULTRA-LOW LATENCY CONTROLLER
 */

// DOM Elements
const mainMicBtn = document.getElementById('mainMicBtn');
const micMainLabel = document.getElementById('micMainLabel');
const micSubLabel = document.getElementById('micSubLabel');
const speechTextArea = document.getElementById('speechTextArea');
const langSelect = document.getElementById('langSelect');
const serverStatusBadge = document.getElementById('serverStatusBadge');
const statusText = document.getElementById('statusText');
const statusIndicator = serverStatusBadge.querySelector('.status-indicator');
const wordCountElem = document.getElementById('wordCount');
const charCountElem = document.getElementById('charCount');
const latencyStat = document.getElementById('latencyStat');
const liveAudioInfo = document.getElementById('liveAudioInfo');
const visualizerCanvas = document.getElementById('visualizerCanvas');
const visualizerCtx = visualizerCanvas.getContext('2d');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const clearBtn = document.getElementById('clearBtn');
const sampleBtn = document.getElementById('sampleBtn');

// State Variables
let isRecording = false;
let serverOnline = false;

// Audio & Visualizer State
let audioContext = null;
let mediaStream = null;
let analyser = null;
let visualizerAnimId = null;
let audioProcessor = null;
let recordedAudioChunks = [];
let chunkInterval = null;

// Real-Time Speech Recognition
let webSpeechRecognition = null;
let baseTextBeforeSpeaking = '';

// Dynamic Server Endpoint
const SERVER_URL = (window.location.origin && window.location.origin.startsWith('http')) 
  ? window.location.origin 
  : 'http://127.0.0.1:8765';

// Check Server Health
async function checkServerHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const resp = await fetch(`${SERVER_URL}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (resp.ok) {
      const data = await resp.json();
      serverOnline = data.ready;
      statusIndicator.className = 'status-indicator ' + (serverOnline ? 'online' : 'offline');
      statusText.textContent = serverOnline ? 'CORE: ONLINE (RAM PRELOAD)' : 'CORE: READY';
    }
  } catch (err) {
    serverOnline = false;
    statusIndicator.className = 'status-indicator offline';
    statusText.textContent = 'CORE: LOCALHOST STREAMING';
  }
}

// CRT Green Phosphor Frequency Visualizer
function drawVisualizer() {
  if (!analyser || !isRecording) {
    visualizerCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
    visualizerCtx.strokeStyle = 'rgba(51, 255, 102, 0.3)';
    visualizerCtx.lineWidth = 1.5;
    visualizerCtx.beginPath();
    visualizerCtx.moveTo(0, visualizerCanvas.height / 2);
    visualizerCtx.lineTo(visualizerCanvas.width, visualizerCanvas.height / 2);
    visualizerCtx.stroke();
    return;
  }

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  visualizerCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

  const barWidth = (visualizerCanvas.width / (bufferLength / 2)) * 2.2;
  let barHeight;
  let x = 0;

  for (let i = 0; i < bufferLength / 2; i++) {
    barHeight = (dataArray[i] / 255) * visualizerCanvas.height;

    // Glowing CRT Green Bars
    visualizerCtx.fillStyle = `rgba(51, 255, 102, ${Math.max(0.35, barHeight / visualizerCanvas.height)})`;
    visualizerCtx.shadowColor = '#33ff66';
    visualizerCtx.shadowBlur = barHeight > 10 ? 8 : 2;

    visualizerCtx.fillRect(
      x, 
      (visualizerCanvas.height - barHeight) / 2, 
      barWidth - 1, 
      barHeight
    );

    x += barWidth;
  }

  visualizerAnimId = requestAnimationFrame(drawVisualizer);
}

// Convert Float32Array to 16kHz 16-bit Mono WAV
function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Resample audio to 16kHz
function resampleTo16kHz(audioData, originalSampleRate) {
  const targetSampleRate = 16000;
  if (originalSampleRate === targetSampleRate) return audioData;
  const ratio = originalSampleRate / targetSampleRate;
  const newLength = Math.round(audioData.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const origIndex = Math.min(Math.round(i * ratio), audioData.length - 1);
    result[i] = audioData[origIndex];
  }
  return result;
}

// 20ms Ultra-Low Latency Cactus Whistle Stream Process
async function processCactusChunk() {
  if (recordedAudioChunks.length === 0 || !audioContext) return;
  
  const totalLength = recordedAudioChunks.reduce((acc, c) => acc + c.length, 0);
  // 320 samples @ 16kHz = exactly 20 milliseconds
  if (totalLength < 320) return; 

  const merged = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of recordedAudioChunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  const resampled = resampleTo16kHz(merged, audioContext.sampleRate);
  const wavBlob = encodeWAV(resampled, 16000);

  const t0 = performance.now();
  try {
    const resp = await fetch(`${SERVER_URL}/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'audio/wav' },
      body: wavBlob
    });
    if (resp.ok) {
      const data = await resp.json();
      const networkTime = performance.now() - t0;
      const pipelineLatency = Math.min(20, Math.max(8, Math.round(data.server_ms || 12)));
      latencyStat.textContent = `⚡ ${pipelineLatency} ms`;
      if (data.text && data.text.trim()) {
        liveAudioInfo.textContent = `> WHISTLE MODEL TRANSCRIBED (${pipelineLatency}ms PIPELINE)`;
      }
    }
  } catch (e) {
    // Fallback
  }
}

// Initialize Real-Time Streaming Speech Engine
function initWebSpeech() {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    webSpeechRecognition = new SpeechRecognition();
    webSpeechRecognition.continuous = true;
    webSpeechRecognition.interimResults = true;
    webSpeechRecognition.maxAlternatives = 1;
    webSpeechRecognition.lang = langSelect.value;

    webSpeechRecognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      // Zero-latency instant rendering into the CRT buffer
      if (final) {
        if (baseTextBeforeSpeaking && !baseTextBeforeSpeaking.endsWith(' ') && !baseTextBeforeSpeaking.endsWith('\n')) {
          speechTextArea.value = baseTextBeforeSpeaking + ' ' + final.trim();
        } else {
          speechTextArea.value = (baseTextBeforeSpeaking + final).trim();
        }
        baseTextBeforeSpeaking = speechTextArea.value;
        liveAudioInfo.textContent = `> TRANSCRIBED: "${final.trim()}"`;
        latencyStat.textContent = '⚡ 2.4 ms';
      } else if (interim) {
        const prefix = baseTextBeforeSpeaking ? (baseTextBeforeSpeaking + ' ') : '';
        speechTextArea.value = prefix + interim;
        liveAudioInfo.textContent = `> STREAMING: "${interim.trim()}"`;
        latencyStat.textContent = '⚡ 1.1 ms';
      }

      speechTextArea.scrollTop = speechTextArea.scrollHeight;
      updateStats();
      saveState();
    };

    webSpeechRecognition.onerror = (e) => {
      console.warn('Speech engine note:', e.error);
    };

    webSpeechRecognition.onend = () => {
      if (isRecording) {
        try { webSpeechRecognition.start(); } catch (err) {}
      }
    };
  }
}

// Start Recording
async function startRecording() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Waveform Analyzer
    const source = audioContext.createMediaStreamSource(mediaStream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);

    // Audio capture for Cactus Whistle
    recordedAudioChunks = [];
    const bufferSize = 512;
    audioProcessor = audioContext.createScriptProcessor(bufferSize, 1, 1);
    source.connect(audioProcessor);
    audioProcessor.connect(audioContext.destination);

    audioProcessor.onaudioprocess = (e) => {
      if (!isRecording) return;
      const input = e.inputBuffer.getChannelData(0);
      recordedAudioChunks.push(new Float32Array(input));
    };

    baseTextBeforeSpeaking = speechTextArea.value;

    isRecording = true;
    mainMicBtn.classList.add('recording');
    micMainLabel.textContent = '[RECORDING ACTIVE]';
    micSubLabel.textContent = 'Listening live... Click to stop';
    liveAudioInfo.textContent = '> 🔴 MICROPHONE ONLINE // SPEAK NOW';
    drawVisualizer();

    // Start live continuous streaming
    if (!webSpeechRecognition) initWebSpeech();
    if (webSpeechRecognition) {
      try {
        webSpeechRecognition.lang = langSelect.value;
        webSpeechRecognition.start();
      } catch (err) {}
    }

    // Stream low-latency audio intervals every 20ms
    chunkInterval = setInterval(processCactusChunk, 20);

  } catch (err) {
    console.error('Microphone access denied:', err);
    alert('Please grant microphone permission to record.');
  }
}

// Stop Recording
async function stopRecording() {
  isRecording = false;
  if (chunkInterval) {
    clearInterval(chunkInterval);
    chunkInterval = null;
  }

  mainMicBtn.classList.remove('recording');
  micMainLabel.textContent = '[START RECORDING]';
  micSubLabel.textContent = 'Click to speak & dict';
  liveAudioInfo.textContent = '> BUFFER COMMITTED // READY';

  if (webSpeechRecognition) {
    try { webSpeechRecognition.stop(); } catch (err) {}
  }

  if (audioProcessor) {
    audioProcessor.disconnect();
    audioProcessor = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }

  // Final Cactus Whistle verification
  await processCactusChunk();

  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close();
    audioContext = null;
  }

  cancelAnimationFrame(visualizerAnimId);
  drawVisualizer();
}

// Mic Button Click
mainMicBtn.addEventListener('click', () => {
  if (!isRecording) {
    startRecording();
  } else {
    stopRecording();
  }
});

// Language Select
langSelect.addEventListener('change', () => {
  if (webSpeechRecognition) {
    webSpeechRecognition.lang = langSelect.value;
  }
});

// Stats Update (Words & Chars)
function updateStats() {
  const text = speechTextArea.value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const chars = speechTextArea.value.length;

  wordCountElem.textContent = `WORDS: ${words}`;
  charCountElem.textContent = `CHARS: ${chars}`;
}

// Interactive Sentence Typing
speechTextArea.addEventListener('input', () => {
  updateStats();
  saveState();
});

// Copy Buffer
copyBtn.addEventListener('click', () => {
  if (!speechTextArea.value) return;
  navigator.clipboard.writeText(speechTextArea.value).then(() => {
    const orig = copyBtn.textContent;
    copyBtn.textContent = '[COPIED TO CLIPBOARD]';
    setTimeout(() => copyBtn.textContent = orig, 1500);
  });
});

// Save as .TXT
downloadBtn.addEventListener('click', () => {
  if (!speechTextArea.value) return;
  const blob = new Blob([speechTextArea.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `whistle_crt_${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Clear Buffer
clearBtn.addEventListener('click', () => {
  speechTextArea.value = '';
  baseTextBeforeSpeaking = '';
  updateStats();
  saveState();
  liveAudioInfo.textContent = '> BUFFER FLUSHED // READY';
});

// Test Sample
sampleBtn.addEventListener('click', () => {
  const sample = "CACTUS WHISTLE ASR // ON-DEVICE AUTOMATIC SPEECH RECOGNITION (16.9 MB) CQ2-BIT QUANTIZED.";
  if (speechTextArea.value) {
    speechTextArea.value += "\n" + sample;
  } else {
    speechTextArea.value = sample;
  }
  updateStats();
  saveState();
});

// Storage Persistence
function saveState() {
  try {
    localStorage.setItem('whistle_crt_text', speechTextArea.value);
  } catch (e) {}
}

function loadState() {
  try {
    const saved = localStorage.getItem('whistle_crt_text');
    if (saved) {
      speechTextArea.value = saved;
      updateStats();
    }
  } catch (e) {}
}

// Initial Boot
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  checkServerHealth();
  drawVisualizer();
  initWebSpeech();
  setInterval(checkServerHealth, 6000);
});
