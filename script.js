'use strict';

function applyTheme(theme) {
    const darkIcon = document.getElementById('theme-toggle-dark-icon');
    const lightIcon = document.getElementById('theme-toggle-light-icon');
    document.documentElement.classList.toggle('dark', theme === 'dark');
    darkIcon.classList.toggle('hidden', theme !== 'dark');
    lightIcon.classList.toggle('hidden', theme === 'dark');
}

// Elementos do DOM
const timerDisplay = document.getElementById('timer-display');
const startTimerBtn = document.getElementById('start-timer-btn');
const pauseTimerBtn = document.getElementById('pause-timer-btn');
const resetTimerBtn = document.getElementById('reset-timer-btn');
const cyclesCountDisplay = document.getElementById('cycles-count-display');
const currentModeDisplay = document.getElementById('current-mode-display');
const modeButtons = document.querySelectorAll('.pomodoro-mode-btn');
const presetSelect = document.getElementById('pomodoro-preset-select');
const themeToggleBtn = document.getElementById('theme-toggle');
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
const currentYearSpan = document.getElementById('current-year');


let timerInterval;
let timeLeft;
const pomodoroPresets = {
    'test': { focusDuration: 60, shortBreakDuration: 10, longBreakDuration: 20, cyclesBeforeLongBreak: 2 },
    'default': { focusDuration: 25 * 60, shortBreakDuration: 5 * 60, longBreakDuration: 15 * 60, cyclesBeforeLongBreak: 4 },
    'intense': { focusDuration: 30 * 60, shortBreakDuration: 5 * 60, longBreakDuration: 15 * 60, cyclesBeforeLongBreak: 4 },
    'long': { focusDuration: 50 * 60, shortBreakDuration: 10 * 60, longBreakDuration: 20 * 60, cyclesBeforeLongBreak: 2 }
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
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        userMusicTracks = await response.json();
        initializeMusicPlayer();
    } catch (error) {
        console.error("Não foi possível carregar playlist.json:", error);
        playerCurrentTrackName.textContent = "Erro na Playlist";
    }
}

function applyPreset() {
    const selectedPreset = presetSelect.value;
    const settings = pomodoroPresets[selectedPreset];
    if (!settings) {
        console.error(`Preset "${selectedPreset}" não encontrado! Usando 'default'.`);
        settings = pomodoroPresets['default'];
    }
    focusDuration = settings.focusDuration;
    shortBreakDuration = settings.shortBreakDuration;
    longBreakDuration = settings.longBreakDuration;
    cyclesBeforeLongBreak = settings.cyclesBeforeLongBreak;
    localStorage.setItem('pomodoroPreset', selectedPreset);
    setMode('focus', true);
}

function loadPomodoroSettings() {
    const savedPreset = localStorage.getItem('pomodoroPreset') || 'default';
    presetSelect.value = savedPreset;
    applyPreset();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.title = `${timerDisplay.textContent} - DevFlow Pomodoro`;
}

function updateModeDisplay() {
    modeButtons.forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`[data-mode="${currentMode}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const modeTexts = { focus: 'Modo Foco', shortBreak: 'Pausa Curta', longBreak: 'Descanso Longo' };
    currentModeDisplay.textContent = modeTexts[currentMode];
}

function setMode(mode, manualReset = false) {
    currentMode = mode;
    isPaused = true;
    clearInterval(timerInterval);
    timeLeft = { focus: focusDuration, shortBreak: shortBreakDuration, longBreak: longBreakDuration }[mode];
    updateTimerDisplay();
    updateModeDisplay();
    startTimerBtn.classList.remove('hidden');
    pauseTimerBtn.classList.add('hidden');
    if (manualReset) {
        currentCycleCount = 0;
        cyclesCountDisplay.textContent = currentCycleCount;
    }
}

function startTimer() {
    if (!isPaused) return;
    isPaused = false;
    startTimerBtn.classList.add('hidden');
    pauseTimerBtn.classList.remove('hidden');
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
    startTimerBtn.classList.remove('hidden');
    pauseTimerBtn.classList.add('hidden');
}

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${String(sec).padStart(2, '0')}`;
}

function initializeMusicPlayer() {
    if (userMusicTracks.length > 0) {
        [playerPlayPauseBtn, playerPrevBtn, playerNextBtn].forEach(btn => btn.disabled = false);
        loadMusicTrack(0);
    } else {
        playerCurrentTrackName.textContent = "Playlist Vazia";
    }
}

function loadMusicTrack(index) {
    currentMusicTrackIndex = (index + userMusicTracks.length) % userMusicTracks.length;
    const track = userMusicTracks[currentMusicTrackIndex];
    if (track && track.file) {
        localAudioPlayer.src = track.file;
        playerCurrentTrackName.textContent = track.title || "Faixa Desconhecida";
    }
}

function toggleMusicPlayer() {
    if (localAudioPlayer.paused) {
        localAudioPlayer.play().catch(e => console.error("Erro ao tocar música:", e));
    } else {
        localAudioPlayer.pause();
    }
}

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission().then(p => notificationPermission = p);
    }
}

function showNotification(title, body) {
    if (Notification.permission === "granted") {
        new Notification(title, { body });
    }
}

function saveTasks() {
    localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
}

function renderTasks() {
    if (!taskList) return;
    taskList.innerHTML = '';
    if (tasks.length === 0) {
        taskList.innerHTML = `<li class="text-center text-slate-500 dark:text-slate-400 p-2">Nenhuma tarefa adicionada.</li>`;
        return;
    }
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = `flex items-center justify-between p-3 rounded-lg transition-colors ${task.done ? 'bg-green-500/10 text-slate-500' : 'bg-slate-100 dark:bg-slate-800'}`;
        li.innerHTML = `
            <span class="flex-grow cursor-pointer ${task.done ? 'line-through' : ''}" data-action="toggle" data-index="${index}">${task.text}</span>
            <button data-action="delete" data-index="${index}" class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors">
                <i class="fa-solid fa-times pointer-events-none"></i>
            </button>`;
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
    const target = e.target;
    const action = target.dataset.action;
    const index = parseInt(target.dataset.index, 10);
    if (isNaN(index)) return;

    if (action === 'toggle') {
        tasks[index].done = !tasks[index].done;
    } else if (action === 'delete') {
        tasks.splice(index, 1);
    }

    saveTasks();
    renderTasks();
}

document.addEventListener('DOMContentLoaded', () => {
    applyTheme(localStorage.getItem('theme') || 'dark');
    themeToggleBtn.addEventListener('click', () => {
        const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });

    startTimerBtn.addEventListener('click', startTimer);
    pauseTimerBtn.addEventListener('click', pauseTimer);
    resetTimerBtn.addEventListener('click', () => setMode('focus', true));
    presetSelect.addEventListener('change', applyPreset);
    modeButtons.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));

    playerPlayPauseBtn.addEventListener('click', toggleMusicPlayer);
    playerPrevBtn.addEventListener('click', () => { loadMusicTrack(currentMusicTrackIndex - 1); if (isMusicPlaying) localAudioPlayer.play(); });
    playerNextBtn.addEventListener('click', () => { loadMusicTrack(currentMusicTrackIndex + 1); if (isMusicPlaying) localAudioPlayer.play(); });

    localAudioPlayer.addEventListener('play', () => { isMusicPlaying = true; playerPlayIcon.classList.add('hidden'); playerPauseIcon.classList.remove('hidden'); });
    localAudioPlayer.addEventListener('pause', () => { isMusicPlaying = false; playerPlayIcon.classList.remove('hidden'); playerPauseIcon.classList.add('hidden'); });
    localAudioPlayer.addEventListener('ended', () => playerNextBtn.click());
    localAudioPlayer.addEventListener('loadedmetadata', () => playerTotalTime.textContent = formatTime(localAudioPlayer.duration));
    localAudioPlayer.addEventListener('timeupdate', () => {
        playerCurrentTime.textContent = formatTime(localAudioPlayer.currentTime);
        if(document.activeElement !== playerProgressSlider) {
            playerProgressSlider.value = localAudioPlayer.currentTime;
        }
        playerProgressSlider.max = localAudioPlayer.duration || 0;
    });

    playerProgressSlider.addEventListener('input', (e) => localAudioPlayer.currentTime = e.target.value);
    playerVolumeSlider.addEventListener('input', (e) => localAudioPlayer.volume = e.target.value / 100);
    localAudioPlayer.volume = playerVolumeSlider.value / 100;

    taskForm.addEventListener('submit', addTask);
    taskList.addEventListener('click', handleTaskListClick);

    currentYearSpan.textContent = new Date().getFullYear();
    loadPomodoroSettings();
    fetchPlaylistAndInitializePlayer();
    requestNotificationPermission();
    renderTasks();
});