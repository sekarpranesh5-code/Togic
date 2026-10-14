let recognition = null;
let isRecording = false;

const micToggleBtn = document.getElementById('micToggleBtn');
const micStatusText = document.getElementById('micStatusText');
const listeningIndicator = document.getElementById('listeningIndicator');
const popupTextArea = document.getElementById('popupTextArea');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const openAppBtn = document.getElementById('openAppBtn');
const launchStudioBtn = document.getElementById('launchStudioBtn');

// Initialize Web Speech Recognition
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    isRecording = true;
    micToggleBtn.classList.add('recording');
    micStatusText.textContent = 'Stop Listening';
    listeningIndicator.classList.remove('hidden');
  };

  recognition.onresult = (event) => {
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript + ' ';
      }
    }
    if (finalTranscript) {
      if (popupTextArea.value && !popupTextArea.value.endsWith(' ')) {
        popupTextArea.value += ' ' + finalTranscript.trim();
      } else {
        popupTextArea.value += finalTranscript.trim();
      }
      popupTextArea.scrollTop = popupTextArea.scrollHeight;
      saveText();
    }
  };

  recognition.onerror = (event) => {
    console.error('Speech error:', event.error);
    stopRecording();
  };

  recognition.onend = () => {
    stopRecording();
  };
}

function stopRecording() {
  isRecording = false;
  micToggleBtn.classList.remove('recording');
  micStatusText.textContent = 'Click to Speak';
  listeningIndicator.classList.add('hidden');
}

micToggleBtn.addEventListener('click', () => {
  if (!recognition) {
    alert('Speech recognition is not supported in this browser window. Please click Open Studio.');
    return;
  }
  if (!isRecording) {
    try {
      recognition.start();
    } catch (e) {
      console.warn(e);
      recognition.stop();
    }
  } else {
    recognition.stop();
    stopRecording();
  }
});

copyBtn.addEventListener('click', () => {
  if (!popupTextArea.value) return;
  navigator.clipboard.writeText(popupTextArea.value).then(() => {
    const orig = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => copyBtn.textContent = orig, 1500);
  });
});

clearBtn.addEventListener('click', () => {
  popupTextArea.value = '';
  saveText();
});

popupTextArea.addEventListener('input', () => {
  saveText();
});

function openFullStudio() {
  if (chrome && chrome.tabs) {
    chrome.tabs.create({ url: chrome.runtime.getURL('app.html') });
  } else {
    window.open('app.html', '_blank');
  }
}

openAppBtn.addEventListener('click', openFullStudio);
launchStudioBtn.addEventListener('click', openFullStudio);

// Persist text state across popup opens
function saveText() {
  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ 'whistle_text': popupTextArea.value });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['whistle_text'], (result) => {
      if (result.whistle_text) {
        popupTextArea.value = result.whistle_text;
      }
    });
  }
});
