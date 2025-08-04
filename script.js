'use strict';

// Elementos do DOM (Pomodoro)
const timerDisplay = document.getElementById('timer-display');
const startTimerBtn = document.getElementById('start-timer-btn');
const pauseTimerBtn = document.getElementById('pause-timer-btn');
const resetTimerBtn = document.getElementById('reset-timer-btn');
const cyclesCountDisplay = document.getElementById('cycles-count-display');
const currentModeDisplay = document.getElementById('current-mode-display');
const modeButtons = document.querySelectorAll('.pomodoro-mode-btn');
const presetDisplay = document.getElementById('preset-display');
const prevPresetBtn = document.getElementById('prev-preset-btn');
const nextPresetBtn = document.getElementById('next-preset-btn');

// Elementos do DOM (Player)
const localAudioPlayer = document.getElementById('local-audio-player');
const playerPlayPauseBtn = document.getElementById('player-play-pause-btn');
const playerPlayIcon = document.getElementById('player-play-icon');
const playerPauseIcon = document.getElementById('player-pause-icon');
const playerVolumeSlider = document.getElementById('player-volume-slider');
const playerCurrentTrackName = document.getElementById('player-current-track-name');
const volumeTooltip = document.getElementById('volume-tooltip');

// Elementos do DOM (Sons)
const notificationSound = document.getElementById('notification-sound');
const breakNotificationSound = document.getElementById('break-notification-sound');
const warningSound = document.getElementById('warning-sound');

// Elementos do DOM (Tarefas)
const taskPanel = document.getElementById('task-panel');
const toggleTasksBtn = document.getElementById('toggle-tasks-btn');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const tasksContent = document.getElementById('tasks-content');
const loginPrompt = document.getElementById('login-prompt');

// Elementos do DOM (Autenticação)
const userSessionDisplay = document.getElementById('user-session-display');
const authModal = document.getElementById('auth-modal');
const closeAuthModalBtn = document.getElementById('close-auth-modal-btn');
const loginView = document.getElementById('login-view');
const registerView = document.getElementById('register-view');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterBtn = document.getElementById('show-register-btn');
const showLoginBtn = document.getElementById('show-login-btn');
const loginBtnPanel = document.getElementById('login-btn-panel');


// Variáveis de Estado
let timerInterval;
let timeLeft;
let currentCycleCount = 0;
let isPaused = true;
let currentMode = 'focus';
let tasks = [];
let areSoundsUnlocked = false;
let isLoggedIn = false;
let notificationPermission = "default"; // ✅ CORREÇÃO: Variável declarada

const pomodoroPresets = {
    'default': { name: 'Padrão (4x25)', settings: { focusDuration: 25 * 60, shortBreakDuration: 5 * 60, longBreakDuration: 15 * 60, cyclesBeforeLongBreak: 4 } },
    'intense': { name: 'Intenso (4x30)', settings: { focusDuration: 30 * 60, shortBreakDuration: 5 * 60, longBreakDuration: 15 * 60, cyclesBeforeLongBreak: 4 } },
    'long': { name: 'Longo (2x50)', settings: { focusDuration: 50 * 60, shortBreakDuration: 10 * 60, longBreakDuration: 20 * 60, cyclesBeforeLongBreak: 2 } }
};
const presetKeys = Object.keys(pomodoroPresets);
let currentPresetIndex = 0;
let focusDuration, shortBreakDuration, longBreakDuration, cyclesBeforeLongBreak;

// --- LÓGICA DE AUTENTICAÇÃO E TAREFAS ---

async function checkSession() {
    try {
        const response = await fetch('api/auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'check_session' })
        });
        const data = await response.json();
        if (data.loggedIn) {
            isLoggedIn = true;
            updateUIForLoggedInUser(data.username);
            await fetchTasks();
        } else {
            isLoggedIn = false;
            updateUIForGuest();
            loadTasksFromLocalStorage();
        }
    } catch (error) {
        console.error("Erro ao verificar sessão, usando modo local:", error);
        isLoggedIn = false;
        updateUIForGuest();
        loadTasksFromLocalStorage();
    }
}

function updateUIForLoggedInUser(username) {
    tasksContent.classList.remove('hidden');
    loginPrompt.classList.add('hidden');
    userSessionDisplay.innerHTML = `
        <div class="flex items-center gap-4">
            <span class="text-slate-300 font-semibold">Olá, ${username}</span>
            <button id="logout-btn" class="text-sm text-indigo-400 hover:underline">Sair</button>
        </div>`;
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
}

function updateUIForGuest() {
    tasksContent.classList.remove('hidden');
    loginPrompt.classList.add('hidden');
    userSessionDisplay.innerHTML = `
        <button id="login-btn-main" class="py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
            Fazer Login / Cadastrar
        </button>`;
    document.getElementById('login-btn-main').addEventListener('click', () => authModal.classList.remove('hidden'));
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const response = await fetch('api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username, password })
    });
    const data = await response.json();
    if (data.success) {
        isLoggedIn = true;
        updateUIForLoggedInUser(data.username);
        await fetchTasks();
        authModal.classList.add('hidden');
    } else {
        alert(data.message);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;

    if (password !== passwordConfirm) {
        alert('As senhas não correspondem. Tente novamente.');
        return;
    }

    const response = await fetch('api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', username, password })
    });
    const data = await response.json();
    if (data.success) {
        alert(data.message);
        showLoginView();
    } else {
        alert(data.message);
    }
}

async function handleLogout() {
    await fetch('api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
    });
    isLoggedIn = false;
    updateUIForGuest();
    loadTasksFromLocalStorage();
}

function showLoginView() {
    loginView.classList.remove('hidden');
    registerView.classList.add('hidden');
}
function showRegisterView() {
    loginView.classList.add('hidden');
    registerView.classList.remove('hidden');
}

// --- LÓGICA DE TAREFAS (COM API E LOCALSTORAGE) ---

function loadTasksFromLocalStorage() {
    const localTasks = localStorage.getItem('pomodoroTasks');
    tasks = localTasks ? JSON.parse(localTasks) : [];
    renderTasks();
}

async function fetchTasks() {
    if (!isLoggedIn) return;
    try {
        const response = await fetch('api/tasks.php');
        tasks = await response.json();
        renderTasks();
    } catch (error) {
        console.error("Erro ao buscar tarefas:", error);
    }
}

async function addTask(e) {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;

    if (isLoggedIn) {
        const response = await fetch('api/tasks.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        const newTask = await response.json();
        if (newTask.success) {
            tasks.push(newTask);
        }
    } else {
        const newTask = { id: Date.now(), text, done: false };
        tasks.push(newTask);
        localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
    }
    taskInput.value = '';
    renderTasks();
}

async function updateTaskStatus(id, done) {
    if (isLoggedIn) {
        await fetch('api/tasks.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, done })
        });
    } else {
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex > -1) {
            tasks[taskIndex].done = done;
            localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
        }
    }
}

async function deleteTask(id) {
    if (isLoggedIn) {
        await fetch(`api/tasks.php?id=${id}`, { method: 'DELETE' });
    } else {
        tasks = tasks.filter(t => t.id !== id);
        localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
    }
}

function renderTasks() {
    taskList.innerHTML = '';
    if (tasks.length === 0) {
        taskList.innerHTML = `<li class="text-center text-slate-400 p-2">Nenhuma tarefa adicionada.</li>`;
        return;
    }
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `flex items-center justify-between p-3 rounded-lg transition-colors ${task.done ? 'bg-green-500/10 text-slate-500' : 'bg-slate-700'}`;
        li.innerHTML = `
            <span class="flex-grow cursor-pointer ${task.done ? 'line-through' : ''}" data-action="toggle" data-id="${task.id}">${task.text}</span>
            <button data-action="delete" data-id="${task.id}" class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors">
                <i class="fa-solid fa-times pointer-events-none"></i>
            </button>`;
        taskList.appendChild(li);
    });
}

async function handleTaskListClick(e) {
    const target = e.target;
    const action = target.dataset.action;
    const id = parseInt(target.dataset.id, 10);
    if (!action || isNaN(id)) return;

    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return;

    if (action === 'toggle') {
        tasks[taskIndex].done = !tasks[taskIndex].done;
        await updateTaskStatus(id, tasks[taskIndex].done);
    } else if (action === 'delete') {
        tasks.splice(taskIndex, 1);
        await deleteTask(id);
    }
    renderTasks();
}

// --- LÓGICA DO POMODORO (Existente) ---
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
        presetDisplay.addEventListener('animationend', () => presetDisplay.classList.remove(inClass), { once: true });
    }, { once: true });
}
function navigatePresets(direction) {
    if (!isPaused) return;
    currentPresetIndex = (currentPresetIndex + direction + presetKeys.length) % presetKeys.length;
    updatePresetDisplay(false, direction);
}
function setupRadioPlayer() {
    localAudioPlayer.src = 'http://stream.laut.fm/lofi';
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
    const settings = pomodoroPresets[presetKey]?.settings;
    if (!settings) return;
    focusDuration = settings.focusDuration;
    shortBreakDuration = settings.shortBreakDuration;
    longBreakDuration = settings.longBreakDuration;
    cyclesBeforeLongBreak = settings.cyclesBeforeLongBreak;
    localStorage.setItem('pomodoroPreset', presetKey);
    setMode('focus', true);
}
function loadPomodoroSettings() {
    const savedPresetKey = localStorage.getItem('pomodoroPreset') || 'default';
    currentPresetIndex = presetKeys.indexOf(savedPresetKey);
    if (currentPresetIndex === -1) currentPresetIndex = 0;
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
        modeButtons.forEach(btn => btn.disabled = (btn.dataset.mode !== 'focus'));
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
            const previousMode = currentMode;
            if (currentMode === 'focus') {
                currentCycleCount++;
                cyclesCountDisplay.textContent = currentCycleCount;
                setMode(currentCycleCount % cyclesBeforeLongBreak === 0 ? 'longBreak' : 'shortBreak');
                playSound(notificationSound);
            } else {
                setMode('focus');
                playSound(breakNotificationSound);
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
    if (notificationPermission === "granted") new Notification(title, { body });
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

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    // Autenticação
    loginBtnPanel.addEventListener('click', () => authModal.classList.remove('hidden'));
    closeAuthModalBtn.addEventListener('click', () => authModal.classList.add('hidden'));
    showRegisterBtn.addEventListener('click', showRegisterView);
    showLoginBtn.addEventListener('click', showLoginView);
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);

    // Pomodoro
    startTimerBtn.addEventListener('click', startTimer);
    pauseTimerBtn.addEventListener('click', pauseTimer);
    resetTimerBtn.addEventListener('click', () => {
        setMode('focus', true);
        prevPresetBtn.disabled = false;
        nextPresetBtn.disabled = false;
    });
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isPaused && btn.dataset.mode === 'focus') setMode('focus');
        });
    });
    prevPresetBtn.addEventListener('click', () => navigatePresets(-1));
    nextPresetBtn.addEventListener('click', () => navigatePresets(1));

    // Player
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

    // Tarefas
    taskForm.addEventListener('submit', addTask);
    taskList.addEventListener('click', handleTaskListClick);
    toggleTasksBtn.addEventListener('click', () => taskPanel.classList.toggle('is-open'));

    // Inicialização Geral
    document.getElementById('current-year').textContent = new Date().getFullYear();
    loadPomodoroSettings();
    updateVolumeSlider();
    setupRadioPlayer();
    requestNotificationPermission();
    checkSession();
});
