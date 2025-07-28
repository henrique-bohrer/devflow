// script.js

// Function to apply the current theme (dark/light)
function applyTheme(theme) {
  const darkIcon = document.getElementById('theme-toggle-dark-icon');
  const lightIcon = document.getElementById('theme-toggle-light-icon');
  const titleElement = document.querySelector('header h1');

  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    if (darkIcon) darkIcon.classList.remove('hidden');
    if (lightIcon) lightIcon.classList.add('hidden');
    if (titleElement) {
      titleElement.classList.remove('gradient-text-brand');
      titleElement.classList.add('gradient-text-neon');
    }
  } else {
    document.documentElement.classList.remove('dark');
    if (darkIcon) darkIcon.classList.add('hidden');
    if (lightIcon) lightIcon.classList.remove('hidden');
    if (titleElement) {
      titleElement.classList.remove('gradient-text-neon');
      titleElement.classList.add('gradient-text-brand');
    }
  }
}

// DOM Elements
const timerDisplay = document.getElementById('timer-display');
const startTimerBtn = document.getElementById('start-timer-btn');
const pauseTimerBtn = document.getElementById('pause-timer-btn');
const resetTimerBtn = document.getElementById('reset-timer-btn');
const cyclesCountDisplay = document.getElementById('cycles-count-display');
const currentModeDisplay = document.getElementById('current-mode-display');
const cyclesForLongBreakDisplay = document.getElementById('cycles-for-long-break-display');
const focusModeBtn = document.getElementById('focus-mode-btn');
const shortBreakModeBtn = document.getElementById('short-break-mode-btn');
const longBreakModeBtn = document.getElementById('long-break-mode-btn');
const modeButtons = [focusModeBtn, shortBreakModeBtn, longBreakModeBtn];
const focusDurationInput = document.getElementById('focus-duration-input');
const shortBreakInput = document.getElementById('short-break-input');
const longBreakInput = document.getElementById('long-break-input');
const savePomodoroSettingsBtn = document.getElementById('save-pomodoro-settings-btn');
const aiChatBox = document.getElementById('ai-chat-box');
const aiInput = document.getElementById('ai-input');
const sendToAiBtn = document.getElementById('send-to-ai-btn');
const aiLoading = document.getElementById('ai-loading');
const themeToggleBtn = document.getElementById('theme-toggle');
const messageModal = document.getElementById('message-modal');
const messageModalTitle = document.getElementById('message-modal-title');
const messageModalText = document.getElementById('message-modal-text');
const messageModalCloseBtn = document.getElementById('message-modal-close');
const notificationSound = document.getElementById('notification-sound');

// Music Player Elements
const localAudioPlayer = document.getElementById('local-audio-player');
const playerPlayPauseBtn = document.getElementById('player-play-pause-btn');
const playerPlayIcon = document.getElementById('player-play-icon');
const playerPauseIcon = document.getElementById('player-pause-icon');
const playerPrevBtn = document.getElementById('player-prev-btn');
const playerNextBtn = document.getElementById('player-next-btn');
const playerVolumeSlider = document.getElementById('player-volume-slider');
const playerCurrentTrackName = document.getElementById('player-current-track-name');
const playerProgressSlider = document.getElementById('player-progress-slider');
const playerCurrentTime = document.getElementById('player-current-time');
const playerTotalTime = document.getElementById('player-total-time');

// Pomodoro State Variables
let timerInterval;
let timeLeft;
const DEFAULT_POMODORO_SETTINGS = {
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  cyclesBeforeLongBreak: 4
};
let focusDuration, shortBreakDuration, longBreakDuration, cyclesBeforeLongBreak;
let currentCycleCount = 0;
let isPaused = true;
let currentMode = 'focus';

// --- Music Player: Dynamic Playlist ---
let userMusicTracks = [];
let currentMusicTrackIndex = 0;
let isMusicPlaying = false;

/**
 * Busca a playlist do arquivo playlist.json e inicializa o player.
 */
async function fetchPlaylistAndInitializePlayer() {
  try {
    const response = await fetch('playlist.json?v=' + new Date().getTime()); // Adiciona cache busting
    if (!response.ok) {
      throw new Error(`Erro ao buscar playlist: ${response.statusText} (Status: ${response.status})`);
    }
    userMusicTracks = await response.json();
    if (!Array.isArray(userMusicTracks)) {
        throw new Error("O arquivo playlist.json não contém um array válido.");
    }
    console.log("Playlist carregada com sucesso:", userMusicTracks);
    initializeMusicPlayer();
  } catch (error) {
    console.error("Não foi possível carregar o arquivo playlist.json:", error);
    showMessage("Erro no Player", `Não foi possível carregar a lista de músicas (playlist.json). ${error.message}`);
    if (playerCurrentTrackName) {
        playerCurrentTrackName.textContent = "Erro ao carregar playlist";
        playerCurrentTrackName.title = "Verifique o arquivo playlist.json e se ele é acessível.";
    }
    if (playerPlayPauseBtn) playerPlayPauseBtn.disabled = true;
    if (playerPrevBtn) playerPrevBtn.disabled = true;
    if (playerNextBtn) playerNextBtn.disabled = true;
  }
}

// --- Pomodoro Settings ---
function loadPomodoroSettings() {
  const savedSettings = localStorage.getItem('pomodoroSettings');
  let settings;
  if (savedSettings) {
    try {
      settings = JSON.parse(savedSettings);
      settings.focusDuration = parseInt(settings.focusDuration, 10) || (DEFAULT_POMODORO_SETTINGS.focusDuration / 60);
      settings.shortBreakDuration = parseInt(settings.shortBreakDuration, 10) || (DEFAULT_POMODORO_SETTINGS.shortBreakDuration / 60);
      settings.longBreakDuration = parseInt(settings.longBreakDuration, 10) || (DEFAULT_POMODORO_SETTINGS.longBreakDuration / 60);
      settings.cyclesBeforeLongBreak = parseInt(settings.cyclesBeforeLongBreak, 10) || DEFAULT_POMODORO_SETTINGS.cyclesBeforeLongBreak;
    } catch (e) {
      console.error("Error loading Pomodoro settings from localStorage:", e);
      settings = {
        focusDuration: DEFAULT_POMODORO_SETTINGS.focusDuration / 60,
        shortBreakDuration: DEFAULT_POMODORO_SETTINGS.shortBreakDuration / 60,
        longBreakDuration: DEFAULT_POMODORO_SETTINGS.longBreakDuration / 60,
        cyclesBeforeLongBreak: DEFAULT_POMODORO_SETTINGS.cyclesBeforeLongBreak
      };
    }
  } else {
    settings = {
      focusDuration: DEFAULT_POMODORO_SETTINGS.focusDuration / 60,
      shortBreakDuration: DEFAULT_POMODORO_SETTINGS.shortBreakDuration / 60,
      longBreakDuration: DEFAULT_POMODORO_SETTINGS.longBreakDuration / 60,
      cyclesBeforeLongBreak: DEFAULT_POMODORO_SETTINGS.cyclesBeforeLongBreak
    };
  }

  focusDurationInput.value = settings.focusDuration;
  shortBreakInput.value = settings.shortBreakDuration;
  longBreakInput.value = settings.longBreakDuration;

  focusDuration = Math.max(20, settings.focusDuration) * 60;
  shortBreakDuration = Math.max(1, settings.shortBreakDuration) * 60;
  longBreakDuration = Math.max(1, settings.longBreakDuration) * 60;
  cyclesBeforeLongBreak = settings.cyclesBeforeLongBreak;

  cyclesForLongBreakDisplay.textContent = cyclesBeforeLongBreak;
  setMode('focus', true);
}

function handleSavePomodoroSettings() {
  const newFocusMin = parseInt(focusDurationInput.value, 10);
  const newShortMin = parseInt(shortBreakInput.value, 10);
  const newLongMin = parseInt(longBreakInput.value, 10);

  if (isNaN(newFocusMin) || newFocusMin < 20) {
    showMessage("Erro de Configuração", "O tempo de foco deve ser um número e no mínimo 20 minutos.");
    focusDurationInput.value = focusDuration / 60;
    return;
  }
  if (isNaN(newShortMin) || newShortMin < 1) {
    showMessage("Erro de Configuração", "O tempo de pausa curta deve ser um número e no mínimo 1 minuto.");
    shortBreakInput.value = shortBreakDuration / 60;
    return;
  }
  if (isNaN(newLongMin) || newLongMin < 1) {
    showMessage("Erro de Configuração", "O tempo de pausa longa deve ser um número e no mínimo 1 minuto.");
    longBreakInput.value = longBreakDuration / 60;
    return;
  }

  focusDuration = newFocusMin * 60;
  shortBreakDuration = newShortMin * 60;
  longBreakDuration = newLongMin * 60;

  const settingsToSave = {
    focusDuration: newFocusMin,
    shortBreakDuration: newShortMin,
    longBreakDuration: newLongMin,
    cyclesBeforeLongBreak: cyclesBeforeLongBreak
  };
  localStorage.setItem('pomodoroSettings', JSON.stringify(settingsToSave));
  showMessage("Sucesso!", "Configurações do Pomodoro salvas.");
  setMode('focus', true);
}
if (savePomodoroSettingsBtn) savePomodoroSettingsBtn.addEventListener('click', handleSavePomodoroSettings);

// --- Theme Toggle ---
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    const newTheme = isDark ? 'dark' : 'light';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  });
}

// --- Pomodoro Timer Logic ---
function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  document.title = `${timerDisplay.textContent} - ${currentModeDisplay.textContent} | DevFlow`;
}

function updateModeDisplay() {
  modeButtons.forEach(btn => btn.classList.remove('active'));
  timerDisplay.classList.remove('timer-pulse');

  if (currentMode === 'focus') {
    currentModeDisplay.textContent = 'Modo Foco';
    if (focusModeBtn) focusModeBtn.classList.add('active');
  } else if (currentMode === 'shortBreak') {
    currentModeDisplay.textContent = 'Pausa Curta';
    if (shortBreakModeBtn) shortBreakModeBtn.classList.add('active');
  } else if (currentMode === 'longBreak') {
    currentModeDisplay.textContent = 'Pausa Longa';
    if (longBreakModeBtn) longBreakModeBtn.classList.add('active');
  }
  void timerDisplay.offsetWidth;
  timerDisplay.classList.add('timer-pulse');
}

function playNotificationSound() {
  if (notificationSound) {
    notificationSound.currentTime = 0;
    notificationSound.play().catch(error => console.warn("Error playing notification sound:", error));
  }
}

function setMode(mode, manualReset = false) {
  currentMode = mode;
  isPaused = true;
  clearInterval(timerInterval);

  switch (mode) {
    case 'focus': timeLeft = focusDuration; break;
    case 'shortBreak': timeLeft = shortBreakDuration; break;
    case 'longBreak': timeLeft = longBreakDuration; break;
    default: timeLeft = focusDuration; currentMode = 'focus';
  }

  updateTimerDisplay();
  updateModeDisplay();
  if (startTimerBtn) {
    startTimerBtn.textContent = 'Iniciar';
    startTimerBtn.disabled = false;
  }
  if (pauseTimerBtn) {
    pauseTimerBtn.textContent = 'Pausar';
    pauseTimerBtn.disabled = true;
  }

  if (manualReset) {
    currentCycleCount = 0;
    if (cyclesCountDisplay) cyclesCountDisplay.textContent = currentCycleCount;
  }
}

function startNextMode() {
  playNotificationSound();
  const previousMode = currentMode;

  if (previousMode === 'focus') {
    currentCycleCount++;
    if (cyclesCountDisplay) cyclesCountDisplay.textContent = currentCycleCount;
    if (currentCycleCount > 0 && currentCycleCount % cyclesBeforeLongBreak === 0) {
      setMode('longBreak');
    } else {
      setMode('shortBreak');
    }
  } else {
    setMode('focus');
    if (previousMode === 'longBreak') {
      currentCycleCount = 0;
      if (cyclesCountDisplay) cyclesCountDisplay.textContent = currentCycleCount;
    }
  }
  startTimer();
}

function startTimer() {
  if (isPaused) {
    isPaused = false;
    if (startTimerBtn) {
      startTimerBtn.textContent = 'Rodando...';
      startTimerBtn.disabled = true;
    }
    if (pauseTimerBtn) {
      pauseTimerBtn.textContent = 'Pausar';
      pauseTimerBtn.disabled = false;
    }

    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();
      if (timeLeft < 0) {
        clearInterval(timerInterval);
        timeLeft = 0;
        updateTimerDisplay();
        startNextMode();
      }
    }, 1000);
  }
}

function pauseTimer() {
  clearInterval(timerInterval);
  isPaused = true;
  if (startTimerBtn) {
    startTimerBtn.textContent = 'Continuar';
    startTimerBtn.disabled = false;
  }
  if (pauseTimerBtn) {
    pauseTimerBtn.textContent = 'Pausado';
    pauseTimerBtn.disabled = true;
  }
}

if (focusModeBtn) focusModeBtn.addEventListener('click', () => setMode('focus', true));
if (shortBreakModeBtn) shortBreakModeBtn.addEventListener('click', () => setMode('shortBreak', true));
if (longBreakModeBtn) longBreakModeBtn.addEventListener('click', () => setMode('longBreak', true));

if (startTimerBtn) startTimerBtn.addEventListener('click', startTimer);
if (pauseTimerBtn) pauseTimerBtn.addEventListener('click', pauseTimer);
if (resetTimerBtn) resetTimerBtn.addEventListener('click', () => {
  showMessage("Ciclo Resetado", "O temporizador foi resetado para o modo Foco e a contagem de ciclos zerada.");
  setMode('focus', true);
});

// --- Music Player Logic ---
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function initializeMusicPlayer() {
  if (Array.isArray(userMusicTracks) && userMusicTracks.length > 0) {
    loadMusicTrack(currentMusicTrackIndex);
    if (playerPlayPauseBtn) playerPlayPauseBtn.disabled = false;
    if (playerPrevBtn) playerPrevBtn.disabled = false;
    if (playerNextBtn) playerNextBtn.disabled = false;
  } else {
    console.warn("A lista de músicas está vazia. Os controles do player permanecerão desabilitados.");
    if (playerCurrentTrackName) {
      playerCurrentTrackName.textContent = "Nenhuma música na lista";
      playerCurrentTrackName.title = "Nenhuma música na lista. Adicione faixas ao arquivo 'playlist.json'.";
    }
    showMessage("Player Vazio", "Nenhuma música encontrada. Adicione músicas ao arquivo 'playlist.json'.");
    if (localAudioPlayer) localAudioPlayer.src = "";
    if (playerPlayIcon) playerPlayIcon.classList.remove('hidden');
    if (playerPauseIcon) playerPauseIcon.classList.add('hidden');
    isMusicPlaying = false;
    if (playerPlayPauseBtn) playerPlayPauseBtn.disabled = true;
    if (playerPrevBtn) playerPrevBtn.disabled = true;
    if (playerNextBtn) playerNextBtn.disabled = true;
    if (playerCurrentTime) playerCurrentTime.textContent = "0:00";
    if (playerTotalTime) playerTotalTime.textContent = "0:00";
    if (playerProgressSlider) playerProgressSlider.value = 0;
  }
}

function loadMusicTrack(index) {
  currentMusicTrackIndex = (index + userMusicTracks.length) % userMusicTracks.length;
  const track = userMusicTracks[currentMusicTrackIndex];

  if (track && typeof track.src === 'string' && typeof track.name === 'string') {
    if (localAudioPlayer) {
      localAudioPlayer.src = track.src;
      localAudioPlayer.load();
    }
    if (playerCurrentTrackName) {
      playerCurrentTrackName.textContent = track.name;
      playerCurrentTrackName.title = track.name;
    }
    if (playerProgressSlider) playerProgressSlider.value = 0;
    if (playerCurrentTime) playerCurrentTime.textContent = "0:00";
    if (playerTotalTime) playerTotalTime.textContent = "0:00";
  } else {
    console.error("Dados da faixa inválidos no índice:", currentMusicTrackIndex, track);
    if (playerCurrentTrackName) {
      playerCurrentTrackName.textContent = "Erro ao carregar faixa";
      playerCurrentTrackName.title = "Erro: dados da faixa inválidos.";
    }
    if (playerPlayPauseBtn) playerPlayPauseBtn.disabled = true;
    showMessage("Erro na Faixa", `Os dados para a música no índice ${currentMusicTrackIndex} parecem estar incorretos. Verifique o 'playlist.json'.`);
  }
}

function toggleMusicPlayer() {
  if (!Array.isArray(userMusicTracks) || userMusicTracks.length === 0) {
    showMessage("Player Vazio", "Nenhuma música definida no 'playlist.json'.");
    return;
  }
  if (localAudioPlayer && !localAudioPlayer.src && userMusicTracks.length > 0) {
    loadMusicTrack(currentMusicTrackIndex);
  }
  if (localAudioPlayer && !localAudioPlayer.src) {
    showMessage("Erro no Player", "Nenhuma música carregada. Verifique os caminhos no 'playlist.json' e o console para erros.");
    return;
  }

  if (localAudioPlayer && localAudioPlayer.paused) {
    localAudioPlayer.play().then(() => {
      if (playerPlayIcon) playerPlayIcon.classList.add('hidden');
      if (playerPauseIcon) playerPauseIcon.classList.remove('hidden');
      isMusicPlaying = true;
    }).catch(error => {
      console.error("Erro ao tentar tocar música:", error);
    });
  } else if (localAudioPlayer) {
    localAudioPlayer.pause();
    if (playerPlayIcon) playerPlayIcon.classList.remove('hidden');
    if (playerPauseIcon) playerPauseIcon.classList.add('hidden');
    isMusicPlaying = false;
  }
}

if (playerPlayPauseBtn) playerPlayPauseBtn.addEventListener('click', toggleMusicPlayer);

if (playerPrevBtn) playerPrevBtn.addEventListener('click', () => {
  if (!Array.isArray(userMusicTracks) || userMusicTracks.length === 0) return;
  currentMusicTrackIndex = (currentMusicTrackIndex - 1 + userMusicTracks.length) % userMusicTracks.length;
  loadMusicTrack(currentMusicTrackIndex);
  if (isMusicPlaying && localAudioPlayer) {
    localAudioPlayer.play().catch(error => console.error("Erro ao tocar música (prev):", error));
  }
});

if (playerNextBtn) playerNextBtn.addEventListener('click', () => {
  if (!Array.isArray(userMusicTracks) || userMusicTracks.length === 0) return;
  currentMusicTrackIndex = (currentMusicTrackIndex + 1) % userMusicTracks.length;
  loadMusicTrack(currentMusicTrackIndex);
  if (isMusicPlaying && localAudioPlayer) {
    localAudioPlayer.play().catch(error => console.error("Erro ao tocar música (next):", error));
  }
});

if (localAudioPlayer) {
  localAudioPlayer.addEventListener('loadedmetadata', () => {
    if (playerTotalTime) playerTotalTime.textContent = formatTime(localAudioPlayer.duration);
    if (playerProgressSlider) playerProgressSlider.max = localAudioPlayer.duration;
  });
  localAudioPlayer.addEventListener('timeupdate', () => {
    if (playerCurrentTime) playerCurrentTime.textContent = formatTime(localAudioPlayer.currentTime);
    if (playerProgressSlider) playerProgressSlider.value = localAudioPlayer.currentTime;
  });
  localAudioPlayer.addEventListener('ended', () => {
    if (!Array.isArray(userMusicTracks) || userMusicTracks.length === 0) return;
    currentMusicTrackIndex = (currentMusicTrackIndex + 1) % userMusicTracks.length;
    loadMusicTrack(currentMusicTrackIndex);
    localAudioPlayer.play().catch(error => console.error("Erro ao tocar próxima música automaticamente:", error));
  });
  localAudioPlayer.addEventListener('error', (e) => {
    console.error("MediaError no elemento de áudio:", e);
    let userFriendlyMessage = "Erro ao carregar música.";
    const failedSrc = e.target && e.target.src ? e.target.src : "desconhecido";
    const trackName = failedSrc.substring(failedSrc.lastIndexOf('/') + 1) || "faixa desconhecida";

    if (localAudioPlayer.error) {
      switch (localAudioPlayer.error.code) {
        case MediaError.MEDIA_ERR_ABORTED: userFriendlyMessage = 'Reprodução abortada.'; break;
        case MediaError.MEDIA_ERR_NETWORK: userFriendlyMessage = 'Erro de rede ao carregar.'; break;
        case MediaError.MEDIA_ERR_DECODE: userFriendlyMessage = 'Erro de decodificação. Arquivo corrompido ou formato inválido.'; break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: userFriendlyMessage = 'Formato não suportado ou fonte inválida.'; break;
        default: userFriendlyMessage = 'Ocorreu um erro desconhecido.';
      }
    }
    showMessage("Erro de Reprodução", `${userFriendlyMessage} (${trackName})`);
    if (playerCurrentTrackName) {
      playerCurrentTrackName.textContent = userFriendlyMessage;
      playerCurrentTrackName.title = userFriendlyMessage;
    }
    if (playerPlayIcon) playerPlayIcon.classList.remove('hidden');
    if (playerPauseIcon) playerPauseIcon.classList.add('hidden');
    isMusicPlaying = false;
  });
}
if (playerProgressSlider) {
  playerProgressSlider.addEventListener('input', () => {
    if (localAudioPlayer) localAudioPlayer.currentTime = playerProgressSlider.value;
  });
}

if (playerVolumeSlider) playerVolumeSlider.addEventListener('input', (e) => {
  if (localAudioPlayer) localAudioPlayer.volume = parseInt(e.target.value, 10) / 100;
});

if (localAudioPlayer && playerVolumeSlider) {
  localAudioPlayer.volume = parseInt(playerVolumeSlider.value, 10) / 100;
}

// --- AI Assistant Functions ---
function addMessageToChat(message, sender = 'user') {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('chat-message', 'mb-2', 'p-3', 'rounded-lg', 'max-w-xs', 'md:max-w-md', 'break-words');
  if (sender === 'user') {
    messageDiv.classList.add('bg-indigo-500', 'dark:bg-[#00A9C0]', 'text-white', 'dark:text-[#00141A]', 'ml-auto', 'rounded-br-none');
    messageDiv.textContent = message;
  } else {
    messageDiv.classList.add('bg-slate-200', 'dark:bg-[#011E28]', 'text-slate-800', 'dark:text-[#E0E0E0]', 'mr-auto', 'rounded-bl-none');
    if (message.includes("```")) {
      const parts = message.split("```");
      messageDiv.innerHTML = '';
      parts.forEach((part, index) => {
        if (part.trim() === "") return;
        if (index % 2 === 0) {
          const textNode = document.createElement('p');
          textNode.textContent = part.trim();
          if (part.trim()) messageDiv.appendChild(textNode);
        } else {
          const pre = document.createElement('pre');
          const code = document.createElement('code');
          const langMatch = part.match(/^(\w+)\n/);
          let codeContent = part;
          if (langMatch && langMatch[1]) {
            code.classList.add(`language-${langMatch[1].toLowerCase()}`);
            codeContent = part.substring(langMatch[0].length);
            pre.dataset.lang = langMatch[1].toLowerCase();
          }
          code.textContent = codeContent.trim();
          pre.appendChild(code);
          pre.classList.add('bg-slate-100', 'dark:bg-[#00141A]', 'p-2', 'rounded', 'overflow-x-auto', 'text-sm', 'my-1');
          messageDiv.appendChild(pre);
        }
      });
    } else {
      messageDiv.textContent = message;
    }
  }
  if (aiChatBox) {
    aiChatBox.appendChild(messageDiv);
    aiChatBox.scrollTop = aiChatBox.scrollHeight;
  }
}

async function handleAISubmit() {
  if (!aiInput || !aiLoading || !sendToAiBtn) return;
  const prompt = aiInput.value.trim();
  if (!prompt) return;

  addMessageToChat(prompt, 'user');
  aiInput.value = '';
  aiLoading.classList.remove('hidden');
  sendToAiBtn.disabled = true;

  try {
    let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = { contents: chatHistory };

    // A URL agora aponta para o nosso proxy PHP.
    const apiUrl = 'gemini-proxy.php';

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error Data:", errorData);
      throw new Error(`Erro da API: ${errorData.error?.message || response.statusText} (Status: ${response.status})`);
    }
    const result = await response.json();
    if (result.candidates && result.candidates.length > 0 &&
      result.candidates[0].content && result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0) {
      addMessageToChat(result.candidates[0].content.parts[0].text, 'ai');
    } else if (result.promptFeedback && result.promptFeedback.blockReason) {
      let blockMessage = "Sua solicitação foi bloqueada pela IA. Razão: ";
      switch (result.promptFeedback.blockReason) {
        case "SAFETY": blockMessage += "Conteúdo considerado inseguro."; break;
        case "OTHER": blockMessage += "Outra razão não especificada."; break;
        default: blockMessage += result.promptFeedback.blockReason;
      }
      addMessageToChat(blockMessage, 'ai');
    }
    else {
      console.warn("Resposta inesperada da IA:", result);
      addMessageToChat("Desculpe, não consegui processar sua solicitação (resposta inesperada da IA).", 'ai');
    }
  } catch (error) {
    console.error("Erro ao contatar IA:", error);
    addMessageToChat(`Desculpe, ocorreu um erro ao contatar a IA: ${error.message}. Verifique o console para mais detalhes.`, 'ai');
  } finally {
    aiLoading.classList.add('hidden');
    sendToAiBtn.disabled = false;
    aiInput.focus();
  }
}

// --- Modal Functions ---
function openModal(modalElement) {
  if (!modalElement) return;
  modalElement.classList.remove('hidden');
  setTimeout(() => {
    modalElement.classList.remove('opacity-0');
    const modalContent = modalElement.querySelector('.modal-content');
    if (modalContent) {
      modalContent.style.transform = 'scale(1) translateY(0)';
      modalContent.style.opacity = '1';
    }
  }, 10);
}

function closeModal(modalElement) {
  if (!modalElement) return;
  const modalContent = modalElement.querySelector('.modal-content');
  if (modalContent) {
    modalContent.style.transform = 'scale(0.95) translateY(10px)';
    modalContent.style.opacity = '0';
  }
  modalElement.classList.add('opacity-0');
  setTimeout(() => {
    modalElement.classList.add('hidden');
  }, 250);
}

function showMessage(title, text) {
  if (messageModalTitle) messageModalTitle.textContent = title;
  if (messageModalText) messageModalText.textContent = text;
  openModal(messageModal);
}

if (messageModalCloseBtn) messageModalCloseBtn.addEventListener('click', () => closeModal(messageModal));
if (sendToAiBtn) sendToAiBtn.addEventListener('click', handleAISubmit);
if (aiInput) aiInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleAISubmit();
  }
});

// --- Page Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  const currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(currentTheme);

  const titleElement = document.querySelector('header h1');
  if (titleElement) {
    titleElement.classList.add('apply-gradient-text');
  }

  loadPomodoroSettings();
  const currentYearEl = document.getElementById('current-year');
  if (currentYearEl) currentYearEl.textContent = new Date().getFullYear();

  fetchPlaylistAndInitializePlayer();

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && messageModal && !messageModal.classList.contains('hidden')) {
      closeModal(messageModal);
    }
  });

  if (messageModal) {
    messageModal.addEventListener('click', (e) => {
      if (e.target === messageModal) {
        closeModal(messageModal);
      }
    });
  }
});