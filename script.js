// script.js (Versão Final e Corrigida)
'use strict';

function applyTheme(theme) {
  const darkIcon = document.getElementById('theme-toggle-dark-icon');
  const lightIcon = document.getElementById('theme-toggle-light-icon');

  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    if (darkIcon) darkIcon.classList.remove('hidden');
    if (lightIcon) lightIcon.classList.add('hidden');
  } else {
    document.documentElement.classList.remove('dark');
    if (darkIcon) darkIcon.classList.add('hidden');
    if (lightIcon) lightIcon.classList.remove('hidden');
  }
}

const timerDisplay = document.getElementById('timer-display');
const startTimerBtn = document.getElementById('start-timer-btn');
const pauseTimerBtn = document.getElementById('pause-timer-btn');
const resetTimerBtn = document.getElementById('reset-timer-btn');
const cyclesCountDisplay = document.getElementById('cycles-count-display');
const currentModeDisplay = document.getElementById('current-mode-display');
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
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
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
let userMusicTracks = [];
let currentMusicTrackIndex = 0;
let isMusicPlaying = false;
let notificationPermission = "default";
let tasks = JSON.parse(localStorage.getItem('pomodoroTasks')) || [];

async function fetchPlaylistAndInitializePlayer() {
  try {
    const response = await fetch('playlist.json?v=' + new Date().getTime());
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    const playlist = await response.json();
    if (!Array.isArray(playlist)) {
        throw new Error("Formato do JSON inválido.");
    }
    userMusicTracks = playlist;
    console.log("Playlist carregada com sucesso:", userMusicTracks);
    initializeMusicPlayer();
  } catch (error) {
    console.error("Não foi possível carregar playlist.json:", error);
    showMessage("Erro no Player", `Não foi possível carregar a lista de músicas. Verifique o arquivo playlist.json e o console.`);
    if (playerCurrentTrackName) playerCurrentTrackName.textContent = "Erro ao carregar";
  }
}

function loadPomodoroSettings() {
  const savedSettings = localStorage.getItem('pomodoroSettings') ? JSON.parse(localStorage.getItem('pomodoroSettings')) : {};

  focusDurationInput.value = savedSettings.focusDuration || (DEFAULT_POMODORO_SETTINGS.focusDuration / 60);
  shortBreakInput.value = savedSettings.shortBreakDuration || (DEFAULT_POMODORO_SETTINGS.shortBreakDuration / 60);
  longBreakInput.value = savedSettings.longBreakDuration || (DEFAULT_POMODORO_SETTINGS.longBreakDuration / 60);

  focusDuration = (parseInt(focusDurationInput.value, 10)) * 60;
  shortBreakDuration = (parseInt(shortBreakInput.value, 10)) * 60;
  longBreakDuration = (parseInt(longBreakInput.value, 10)) * 60;
  cyclesBeforeLongBreak = savedSettings.cyclesBeforeLongBreak || DEFAULT_POMODORO_SETTINGS.cyclesBeforeLongBreak;

  setMode('focus', true);
}

function handleSavePomodoroSettings() {
  const newFocusMin = parseInt(focusDurationInput.value, 10);
  const newShortMin = parseInt(shortBreakInput.value, 10);
  const newLongMin = parseInt(longBreakInput.value, 10);
  if (isNaN(newFocusMin) || newFocusMin < 1 || isNaN(newShortMin) || newShortMin < 1 || isNaN(newLongMin) || newLongMin < 1) {
    showMessage("Erro", "Por favor, insira valores numéricos válidos e maiores que zero.");
    return;
  }
  focusDuration = newFocusMin * 60;
  shortBreakDuration = newShortMin * 60;
  longBreakDuration = newLongMin * 60;
  localStorage.setItem('pomodoroSettings', JSON.stringify({
    focusDuration: newFocusMin,
    shortBreakDuration: newShortMin,
    longBreakDuration: newLongMin,
    cyclesBeforeLongBreak: cyclesBeforeLongBreak
  }));
  showMessage("Sucesso", "Configurações salvas.");
  setMode('focus', true);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  document.title = `${timerDisplay.textContent} - DevFlow`;
}

function updateModeDisplay() {
  modeButtons.forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`[data-mode="${currentMode}"]`);
  if (activeBtn) activeBtn.classList.add('active');
  currentModeDisplay.textContent = {
    focus: 'Modo Foco',
    shortBreak: 'Pausa Curta',
    longBreak: 'Pausa Longa'
  }[currentMode];
}

function setMode(mode, manualReset = false) {
  currentMode = mode;
  isPaused = true;
  clearInterval(timerInterval);
  timeLeft = { focus: focusDuration, shortBreak: shortBreakDuration, longBreak: longBreakDuration }[mode];
  updateTimerDisplay();
  updateModeDisplay();
  startTimerBtn.disabled = false;
  pauseTimerBtn.disabled = true;
  if (manualReset) {
    currentCycleCount = 0;
    cyclesCountDisplay.textContent = currentCycleCount;
  }
}

function startTimer() {
  if (!isPaused) return;
  isPaused = false;
  startTimerBtn.disabled = true;
  pauseTimerBtn.disabled = false;
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft < 0) {
      clearInterval(timerInterval);
      if (currentMode === 'focus') {
        currentCycleCount++;
        cyclesCountDisplay.textContent = currentCycleCount;
        setMode(currentCycleCount % cyclesBeforeLongBreak === 0 ? 'longBreak' : 'shortBreak');
      } else {
        setMode('focus');
      }
      notificationSound.play();
      showNotification("Ciclo Concluído!", "Hora de mudar de atividade.");
      startTimer();
    }
  }, 1000);
}

function pauseTimer() {
  isPaused = true;
  clearInterval(timerInterval);
  startTimerBtn.disabled = false;
  pauseTimerBtn.disabled = true;
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${String(sec).padStart(2, '0')}`;
}

function initializeMusicPlayer() {
  if (userMusicTracks.length > 0) {
    playerPlayPauseBtn.disabled = false;
    playerPrevBtn.disabled = false;
    playerNextBtn.disabled = false;
    loadMusicTrack(0);
  } else {
    playerCurrentTrackName.textContent = "Playlist vazia";
  }
}

function loadMusicTrack(index) {
  currentMusicTrackIndex = (index + userMusicTracks.length) % userMusicTracks.length;
  const track = userMusicTracks[currentMusicTrackIndex];
  if (track && track.src) {
    localAudioPlayer.src = track.src;
    playerCurrentTrackName.textContent = track.name || "Faixa Desconhecida";
  }
}

function toggleMusicPlayer() {
  if (localAudioPlayer.paused) {
    localAudioPlayer.play().catch(e => showMessage("Erro de Áudio", "Não foi possível tocar o arquivo. Verifique o caminho no playlist.json."));
  } else {
    localAudioPlayer.pause();
  }
}

function requestNotificationPermission() {
    if ('Notification' in window) Notification.requestPermission().then(p => notificationPermission = p);
}

function showNotification(title, body) {
    if (notificationPermission === "granted") new Notification(title, { body, icon: 'icon.png' });
}

function saveTasks() {
    localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
}

function renderTasks() {
    if(!taskList) return;
    taskList.innerHTML = '';
    if (tasks.length === 0) {
        taskList.innerHTML = `<li class="text-center text-slate-500 dark:text-gray-400">Nenhuma tarefa ainda.</li>`;
        return;
    }
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = `flex items-center justify-between p-2 rounded-md transition-colors ${task.done ? 'bg-green-100 dark:bg-green-900/50' : 'bg-slate-100 dark:bg-[#011E28]'}`;
        li.innerHTML = `
            <span class="flex-grow ${task.done ? 'line-through text-slate-500' : ''}">${task.text}</span>
            <div class="flex items-center gap-2">
                <button data-action="toggle" data-index="${index}" class="toggle-task-btn p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200">
                    <i class="fa-solid fa-check pointer-events-none"></i>
                </button>
                <button data-action="delete" data-index="${index}" class="delete-task-btn p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200">
                    <i class="fa-solid fa-times pointer-events-none"></i>
                </button>
            </div>
        `;
        taskList.appendChild(li);
    });
}

function addTask(e) {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (text) {
        tasks.push({ text: text, done: false });
        taskInput.value = '';
        saveTasks();
        renderTasks();
    }
}

function handleTaskListClick(e) {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    const { action, index } = button.dataset;
    if (action === 'toggle') tasks[index].done = !tasks[index].done;
    if (action === 'delete') tasks.splice(index, 1);
    saveTasks();
    renderTasks();
}

async function handleAISubmit() {
  const prompt = aiInput.value.trim();
  if (!prompt) return;
  addMessageToChat(prompt, 'user');
  aiInput.value = '';
  aiLoading.classList.remove('hidden');
  sendToAiBtn.disabled = true;
  try {
    const response = await fetch('gemini-proxy.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }) });
    if (!response.ok) throw new Error(`Erro da API: ${response.statusText}`);
    const result = await response.json();
    if (result.candidates?.[0]?.content?.parts?.[0]) {
      addMessageToChat(result.candidates[0].content.parts[0].text, 'ai');
    } else {
      addMessageToChat("Não recebi uma resposta válida.", 'ai');
    }
  } catch (error) {
    addMessageToChat(`Desculpe, ocorreu um erro: ${error.message}.`, 'ai');
  } finally {
    aiLoading.classList.add('hidden');
    sendToAiBtn.disabled = false;
    aiInput.focus();
  }
}

function addMessageToChat(message, sender = 'user') {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('chat-message', 'mb-2', 'p-3', 'rounded-lg', 'max-w-xs', 'md:max-w-md', 'break-words', 'text-sm');
  if (sender === 'user') {
    messageDiv.classList.add('bg-indigo-600', 'text-white', 'ml-auto');
    messageDiv.textContent = message;
  } else {
    messageDiv.classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-800', 'dark:text-gray-200', 'mr-auto');
    messageDiv.innerHTML = message.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-gray-800 text-white p-2 rounded-md my-2 overflow-x-auto"><code>$2</code></pre>');
  }
  aiChatBox.appendChild(messageDiv);
  aiChatBox.scrollTop = aiChatBox.scrollHeight;
}

function showMessage(title, text) {
  messageModalTitle.textContent = title;
  messageModalText.textContent = text;
  messageModal.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  const currentTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(currentTheme);

  themeToggleBtn.addEventListener('click', () => {
    const newTheme = document.documentElement.classList.toggle('dark') ? 'dark' : 'light';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  });

  startTimerBtn.addEventListener('click', startTimer);
  pauseTimerBtn.addEventListener('click', pauseTimer);
  resetTimerBtn.addEventListener('click', () => setMode('focus', true));
  savePomodoroSettingsBtn.addEventListener('click', handleSavePomodoroSettings);
  modeButtons.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));

  playerPlayPauseBtn.addEventListener('click', toggleMusicPlayer);
  playerPrevBtn.addEventListener('click', () => { loadMusicTrack(currentMusicTrackIndex - 1); if(isMusicPlaying) localAudioPlayer.play(); });
  playerNextBtn.addEventListener('click', () => { loadMusicTrack(currentMusicTrackIndex + 1); if(isMusicPlaying) localAudioPlayer.play(); });
  localAudioPlayer.addEventListener('play', () => { isMusicPlaying = true; playerPlayIcon.classList.add('hidden'); playerPauseIcon.classList.remove('hidden'); });
  localAudioPlayer.addEventListener('pause', () => { isMusicPlaying = false; playerPlayIcon.classList.remove('hidden'); playerPauseIcon.classList.add('hidden'); });
  localAudioPlayer.addEventListener('loadedmetadata', () => { playerTotalTime.textContent = formatTime(localAudioPlayer.duration); playerProgressSlider.max = localAudioPlayer.duration; });
  localAudioPlayer.addEventListener('timeupdate', () => { playerCurrentTime.textContent = formatTime(localAudioPlayer.currentTime); playerProgressSlider.value = localAudioPlayer.currentTime; });
  localAudioPlayer.addEventListener('ended', () => playerNextBtn.click());
  localAudioPlayer.addEventListener('error', () => showMessage("Erro de Áudio", "Não foi possível carregar o arquivo de música."));
  playerProgressSlider.addEventListener('input', () => localAudioPlayer.currentTime = playerProgressSlider.value);
  playerVolumeSlider.addEventListener('input', () => localAudioPlayer.volume = playerVolumeSlider.value / 100);
  localAudioPlayer.volume = playerVolumeSlider.value / 100;

  taskForm.addEventListener('submit', addTask);
  taskList.addEventListener('click', handleTaskListClick);
  sendToAiBtn.addEventListener('click', handleAISubmit);
  aiInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAISubmit(); } });

  messageModalCloseBtn.addEventListener('click', () => messageModal.classList.add('hidden'));

  loadPomodoroSettings();
  if (document.getElementById('current-year')) document.getElementById('current-year').textContent = new Date().getFullYear();
  fetchPlaylistAndInitializePlayer();
  requestNotificationPermission();
  renderTasks();
});