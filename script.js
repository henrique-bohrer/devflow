'use strict';

// Elementos do DOM
const timerDisplay = document.getElementById('timer-display');
const startTimerBtn = document.getElementById('start-timer-btn');
const pauseTimerBtn = document.getElementById('pause-timer-btn');
const resetTimerBtn = document.getElementById('reset-timer-btn');
const cyclesCountDisplay = document.getElementById('cycles-count-display');
const currentModeDisplay = document.getElementById('current-mode-display');
const modeButtons = document.querySelectorAll('.pomodoro-mode-btn');
const notificationSound = document.getElementById('notification-sound');
const breakNotificationSound = document.getElementById('break-notification-sound');
const warningSound = document.getElementById('warning-sound');
const localAudioPlayer = document.getElementById('local-audio-player');
const playerPlayPauseBtn = document.getElementById('player-play-pause-btn');
const playerPlayIcon = document.getElementById('player-play-icon');
const playerPauseIcon = document.getElementById('player-pause-icon');
const playerVolumeSlider = document.getElementById('player-volume-slider');
const playerCurrentTrackName = document.getElementById('player-current-track-name');
const currentYearSpan = document.getElementById('current-year');
const presetDisplay = document.getElementById('preset-display');
const prevPresetBtn = document.getElementById('prev-preset-btn');
const nextPresetBtn = document.getElementById('next-preset-btn');
const volumeTooltip = document.getElementById('volume-tooltip');
const taskPanel = document.getElementById('task-panel');
const toggleTasksBtn = document.getElementById('toggle-tasks-btn');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');

let timerInterval;
let timeLeft;

const pomodoroPresets = {
    'default': { name: 'Padrão (4x25)', settings: { focusDuration: 25 * 60, shortBreakDuration: 5 * 60, longBreakDuration: 15 * 60, cyclesBeforeLongBreak: 4 } },
    'intense': { name: 'Intenso (4x30)', settings: { focusDuration: 30 * 60, shortBreakDuration: 5 * 60, longBreakDuration: 15 * 60, cyclesBeforeLongBreak: 4 } },
    'long': { name: 'Longo (2x50)', settings: { focusDuration: 50 * 60, shortBreakDuration: 10 * 60, longBreakDuration: 20 * 60, cyclesBeforeLongBreak: 2 } }
};

const presetKeys = Object.keys(pomodoroPresets);
let currentPresetIndex = 0;

let focusDuration, shortBreakDuration, longBreakDuration, cyclesBeforeLongBreak;
let currentCycleCount = 0;
let isPaused = true;
let currentMode = 'focus';
let notificationPermission = "default";
let tasks = JSON.parse(localStorage.getItem('pomodoroTasks')) || [];
let areSoundsUnlocked = false;

function updatePresetDisplay(isInitial = false, direction = 0) {
    const currentPresetKey = presetKeys[currentPresetIndex];
    const presetName = pomodoroPresets[currentPresetKey].name;

    if (isInitial) {
        presetDisplay.textContent = presetName;
        applyPreset(currentPresetKey);
        return;
    }

    const outClass = direction === 1 ? 'slide-out-to-left' : 'slide-out-to-right';
    const inClass = direction === 1 ? 'slide-in-from-right' : 'slide-in-from-left';

    presetDisplay.classList.add(outClass);

    presetDisplay.addEventListener('animationend', () => {
        presetDisplay.classList.remove(outClass);
        presetDisplay.textContent = presetName;
        presetDisplay.classList.add(inClass);
        applyPreset(currentPresetKey);

        presetDisplay.addEventListener('animationend', () => {
            presetDisplay.classList.remove(inClass);
        }, { once: true });

    }, { once: true });
}

function navigatePresets(direction) {
    if (!isPaused) return;
    currentPresetIndex += direction;
    if (currentPresetIndex < 0) currentPresetIndex = presetKeys.length - 1;
    else if (currentPresetIndex >= presetKeys.length) currentPresetIndex = 0;
    updatePresetDisplay(false, direction);
}

function setupRadioPlayer() {
    const lofiStreamURL = 'http://stream.laut.fm/lofi';
    localAudioPlayer.src = lofiStreamURL;
    playerCurrentTrackName.textContent = 'Rádio Lo-Fi';
}

function toggleMusicPlayer() {
    if (localAudioPlayer.paused) {
        localAudioPlayer.load();
        localAudioPlayer.play().catch(e => console.error("Erro ao tocar rádio:", e));
    } else {
        localAudioPlayer.pause();
    }
}

function applyPreset(presetKey) {
    if (!presetKey || !pomodoroPresets[presetKey]) return;
    const settings = pomodoroPresets[presetKey].settings;
    focusDuration = settings.focusDuration;
    shortBreakDuration = settings.shortBreakDuration;
    longBreakDuration = settings.longBreakDuration;
    cyclesBeforeLongBreak = settings.cyclesBeforeLongBreak;
    localStorage.setItem('pomodoroPreset', presetKey);
    setMode('focus', true);
}

function loadPomodoroSettings() {
    const savedPresetKey = localStorage.getItem('pomodoroPreset') || 'default';
    const savedIndex = presetKeys.indexOf(savedPresetKey);
    currentPresetIndex = (savedIndex !== -1) ? savedIndex : 0;
    updatePresetDisplay(true);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.title = `${timerDisplay.textContent} - DevFlow Pomodoro`;

    if (!isPaused) {
        timerDisplay.classList.remove('timer-tick');
        void timerDisplay.offsetWidth;
        timerDisplay.classList.add('timer-tick');
    }
}

function updateModeDisplay() {
    modeButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-mode="${currentMode}"]`)?.classList.add('active');
    const modeTexts = { focus: 'Modo Foco', shortBreak: 'Pausa Curta', longBreak: 'Descanso Longo' };
    currentModeDisplay.textContent = modeTexts[currentMode];
}

function setVolumeByMode(mode) {
    const targetVolume = (mode === 'focus') ? 0.2 : 0.05;
    localAudioPlayer.volume = targetVolume;
    playerVolumeSlider.value = targetVolume * 100;
    updateVolumeSlider();
}

function setMode(mode, manualReset = false) {
    currentMode = mode;
    isPaused = true;
    clearInterval(timerInterval);
    timeLeft = { focus: focusDuration, shortBreak: shortBreakDuration, longBreak: longBreakDuration }[mode];

    timerDisplay.classList.remove('timer-warning');

    updateTimerDisplay();
    updateModeDisplay();
    startTimerBtn.classList.remove('hidden');
    pauseTimerBtn.classList.add('hidden');

    if (manualReset) {
        currentCycleCount = 0;
        cyclesCountDisplay.textContent = currentCycleCount;
        modeButtons.forEach(btn => {
            btn.disabled = (btn.dataset.mode !== 'focus');
        });
    }

    setVolumeByMode(mode);
}

function playSound(soundElement) {
    soundElement.currentTime = 0;
    soundElement.play().catch(e => console.error("Erro ao tocar som:", e));
}

function startTimer() {
    if (!isPaused) return;

    if (!areSoundsUnlocked) {
        notificationSound.play().then(() => notificationSound.pause());
        breakNotificationSound.play().then(() => breakNotificationSound.pause());
        warningSound.play().then(() => warningSound.pause());
        areSoundsUnlocked = true;
    }

    if (localAudioPlayer.paused) {
        toggleMusicPlayer();
    }

    isPaused = false;
    startTimerBtn.classList.add('hidden');
    pauseTimerBtn.classList.remove('hidden');

    modeButtons.forEach(btn => btn.disabled = true);
    prevPresetBtn.disabled = true;
    nextPresetBtn.disabled = true;


    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft === 10) {
            playSound(warningSound);
            timerDisplay.classList.add('timer-warning');
        }

        if (timeLeft < 0) {
            clearInterval(timerInterval);
            if (currentMode === 'focus') {
                currentCycleCount++;
                cyclesCountDisplay.textContent = currentCycleCount;
                playSound(notificationSound);
                setMode(currentCycleCount % cyclesBeforeLongBreak === 0 ? 'longBreak' : 'shortBreak');
            } else {
                playSound(breakNotificationSound);
                setMode('focus');
            }
            showNotification("Ciclo Concluído!", "Hora de mudar de atividade.");
            startTimer();
        }
    }, 1000);
}

function pauseTimer() {
    isPaused = true;
    clearInterval(timerInterval);
    startTimerBtn.classList.remove('hidden');
    pauseTimerBtn.classList.remove('hidden');
    modeButtons.forEach(btn => btn.disabled = true);
    prevPresetBtn.disabled = true;
    nextPresetBtn.disabled = true;
}

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission().then(p => notificationPermission = p);
    }
}

function showNotification(title, body) {
    if (Notification.permission === "granted") new Notification(title, { body });
}

function saveTasks() {
    localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
}

function renderTasks() {
    if (!taskList) return;
    taskList.innerHTML = '';
    if (tasks.length === 0) {
        taskList.innerHTML = `<li class="text-center text-slate-400 p-2">Nenhuma tarefa adicionada.</li>`;
        return;
    }
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = `flex items-center justify-between p-3 rounded-lg transition-colors ${task.done ? 'bg-green-500/10 text-slate-500' : 'bg-slate-700'}`;
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
    if (action === 'toggle') tasks[index].done = !tasks[index].done;
    else if (action === 'delete') tasks.splice(index, 1);
    saveTasks();
    renderTasks();
}

function updateVolumeSlider() {
    const volume = playerVolumeSlider.value;
    const percentage = `${volume}%`;
    volumeTooltip.textContent = percentage;
    const sliderWidth = playerVolumeSlider.offsetWidth;
    const thumbPosition = (volume / 100) * sliderWidth;
    const tooltipOffset = thumbPosition - (volumeTooltip.offsetWidth / 2) + 8;
    volumeTooltip.style.left = `${tooltipOffset}px`;
    playerVolumeSlider.style.background = `linear-gradient(to right, var(--accent-primary) ${percentage}, var(--border-color) ${percentage})`;
}

document.addEventListener('DOMContentLoaded', () => {
    startTimerBtn.addEventListener('click', startTimer);
    pauseTimerBtn.addEventListener('click', pauseTimer);

    resetTimerBtn.addEventListener('click', () => {
        setMode('focus', true);
        prevPresetBtn.disabled = false;
        nextPresetBtn.disabled = false;
    });

    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isPaused && btn.dataset.mode === 'focus') {
                setMode('focus');
            }
        });
    });

    prevPresetBtn.addEventListener('click', () => navigatePresets(-1));
    nextPresetBtn.addEventListener('click', () => navigatePresets(1));

    playerPlayPauseBtn.addEventListener('click', toggleMusicPlayer);

    localAudioPlayer.addEventListener('play', () => {
        playerPlayIcon.classList.add('hidden');
        playerPauseIcon.classList.remove('hidden');
    });
    localAudioPlayer.addEventListener('pause', () => {
        playerPlayIcon.classList.remove('hidden');
        playerPauseIcon.classList.add('hidden');
    });

    playerVolumeSlider.addEventListener('input', () => {
        localAudioPlayer.volume = playerVolumeSlider.value / 100;
        updateVolumeSlider();
    });

    taskForm.addEventListener('submit', addTask);
    taskList.addEventListener('click', handleTaskListClick);

    toggleTasksBtn.addEventListener('click', () => {
        taskPanel.classList.toggle('is-open');
    });

    currentYearSpan.textContent = new Date().getFullYear();

    loadPomodoroSettings();
    updateVolumeSlider();
    setupRadioPlayer();

    requestNotificationPermission();
    renderTasks();
});
