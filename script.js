'use strict';

// --- CONFIGURAÇÃO DO SUPABASE ---
const SUPABASE_URL = 'https://xrbthqnegxbeerkjlcjx.supabase.co/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYnRocW5lZ3hiZWVya2psY2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTE3NjUsImV4cCI6MjA2OTk4Nzc2NX0.jkeBlZfc_JLTXjlXMKH6dH8imyoVUndL-q8nY4pcTOA';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elementos do DOM
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
const localAudioPlayer = document.getElementById('local-audio-player');
const playerPlayPauseBtn = document.getElementById('player-play-pause-btn');
const playerPlayIcon = document.getElementById('player-play-icon');
const playerPauseIcon = document.getElementById('player-pause-icon');
const playerVolumeSlider = document.getElementById('player-volume-slider');
const playerCurrentTrackName = document.getElementById('player-current-track-name');
const volumeTooltip = document.getElementById('volume-tooltip');
const notificationSound = document.getElementById('notification-sound');
const breakNotificationSound = document.getElementById('break-notification-sound');
const warningSound = document.getElementById('warning-sound');
const taskPanel = document.getElementById('task-panel');
const toggleTasksBtn = document.getElementById('toggle-tasks-btn');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const tasksContent = document.getElementById('tasks-content');
const userSessionDisplay = document.getElementById('user-session-display');
const authModal = document.getElementById('auth-modal');
const closeAuthModalBtn = document.getElementById('close-auth-modal-btn');
const loginView = document.getElementById('login-view');
const registerView = document.getElementById('register-view');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterBtn = document.getElementById('show-register-btn');
const showLoginBtn = document.getElementById('show-login-btn');
const loader = document.getElementById('loader');
const loaderParagraph = document.getElementById('loader-paragraph');
const closeTasksBtn = document.getElementById('close-tasks-btn');

// Variáveis de Estado
let timerInterval;
let timeLeft;
let currentCycleCount = 0;
let isPaused = true;
let currentMode = 'focus';
let tasks = [];
let areSoundsUnlocked = false;
let user = null;

const pomodoroPresets = {
    'default': { name: 'Padrão (4x25)', settings: { focusDuration: 25 * 60, shortBreakDuration: 5 * 60, longBreakDuration: 15 * 60, cyclesBeforeLongBreak: 4 } },
    'intense': { name: 'Intenso (4x30)', settings: { focusDuration: 30 * 60, shortBreakDuration: 5 * 60, longBreakDuration: 15 * 60, cyclesBeforeLongBreak: 4 } },
    'long': { name: 'Longo (2x50)', settings: { focusDuration: 50 * 60, shortBreakDuration: 10 * 60, longBreakDuration: 20 * 60, cyclesBeforeLongBreak: 2 } }
};
const presetKeys = Object.keys(pomodoroPresets);
let currentPresetIndex = 0;
let focusDuration, shortBreakDuration, longBreakDuration, cyclesBeforeLongBreak;

// --- LÓGICA DE AUTENTICAÇÃO E TAREFAS (SUPABASE) ---
async function checkUser() {
    const { data: { session } } = await _supabase.auth.getSession();
    user = session?.user;
    updateUIForUser();
    if (user) {
        await fetchTasks();
    } else {
        loadTasksFromLocalStorage();
    }
}
function updateUIForUser() {
    if (user) {
        userSessionDisplay.innerHTML = `
            <div class="flex items-center gap-4">
                <span class="text-slate-300 font-semibold">Olá, ${user.email.split('@')[0]}</span>
                <button id="logout-btn" class="text-sm text-indigo-400 hover:underline">Sair</button>
            </div>`;
        document.getElementById('logout-btn').addEventListener('click', handleLogout);
    } else {
        userSessionDisplay.innerHTML = `
            <button id="login-btn-main" class="py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                Fazer Login / Cadastrar
            </button>`;
        document.getElementById('login-btn-main').addEventListener('click', () => authModal.classList.remove('hidden'));
    }
}
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) {
        alert(error.message);
    } else {
        user = data.user;
        updateUIForUser();
        await fetchTasks();
        authModal.classList.add('hidden');
    }
}
async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    if (password !== passwordConfirm) {
        alert('As senhas não correspondem.');
        return;
    }
    const { data, error } = await _supabase.auth.signUp({ email, password });
    if (error) {
        alert(error.message);
    } else {
        alert('Registro bem-sucedido! Verifique seu e-mail para confirmar.');
        showLoginView();
    }
}
async function handleLogout() {
    await _supabase.auth.signOut();
    user = null;
    updateUIForUser();
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
function loadTasksFromLocalStorage() {
    const localTasks = localStorage.getItem('pomodoroTasks');
    tasks = localTasks ? JSON.parse(localTasks) : [];
    renderTasks();
}
async function fetchTasks() {
    if (!user) return;
    try {
        const { data, error } = await _supabase.from('tasks').select('*').order('created_at');
        if (error) throw error;
        tasks = data;
        renderTasks();
    } catch (error) {
        console.error("Erro ao buscar tarefas:", error);
    }
}
async function addTask(e) {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;

    if (user) {
        const { data, error } = await _supabase.from('tasks').insert({ text: text, user_id: user.id }).select();
        if (error) {
            console.error('Erro ao adicionar tarefa:', error);
        } else {
            tasks.push(data[0]);
        }
    } else {
        const newTask = { id: Date.now(), text, done: false, created_at: new Date().toISOString() };
        tasks.push(newTask);
        localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
    }
    taskInput.value = '';
    renderTasks();
}
async function updateTaskStatus(id, done) {
    if (user) {
        await _supabase.from('tasks').update({ done }).eq('id', id);
    } else {
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex > -1) {
            tasks[taskIndex].done = done;
            localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
        }
    }
}
async function deleteTask(id) {
    if (user) {
        await _supabase.from('tasks').delete().eq('id', id);
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
    if (Notification.permission === "granted") new Notification(title, { body });
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
    closeTasksBtn.addEventListener('click', () => taskPanel.classList.remove('is-open'));

    // Inicialização Geral
    document.getElementById('current-year').textContent = new Date().getFullYear();
    loadPomodoroSettings();
    updateVolumeSlider();
    setupRadioPlayer();
    requestNotificationPermission();
    checkUser();
});

// ✅ LÓGICA DA TELA DE CARREGAMENTO COM TEXTO DIGITADO
window.addEventListener('load', () => {
    if (loader) {
        const text = "Organize suas tarefas. Aumente sua produtividade.";
        let i = 0;

        // Atraso inicial para as animações de entrada terminarem
        setTimeout(() => {
            loaderParagraph.classList.add('typing');

            function typeWriter() {
                if (i < text.length) {
                    loaderParagraph.innerHTML += text.charAt(i);
                    i++;
                    setTimeout(typeWriter, 60); // Velocidade da digitação
                } else {
                    // Fim da animação
                    setTimeout(() => {
                        loader.classList.add('hidden');
                    }, 1500); // Tempo de espera após a digitação
                }
            }
            typeWriter();
        }, 2000); // Inicia a digitação após 2 segundos
    }
});
