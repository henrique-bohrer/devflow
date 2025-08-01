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
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
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

// Elementos do Patinho Ajudante
const openDuckChatBtn = document.getElementById('open-duck-chat-btn');
const closeDuckChatBtn = document.getElementById('close-duck-chat-btn');
const duckChatModal = document.getElementById('duck-chat-modal');
const duckChatContainer = document.getElementById('duck-chat-container');
const duckChatBody = document.getElementById('duck-chat-body');
const duckChatForm = document.getElementById('duck-chat-form');
const duckChatInput = document.getElementById('duck-chat-input');

let timerInterval;
let timeLeft;

const pomodoroPresets = {
    'test': { name: 'Teste (1min)', settings: { focusDuration: 60, shortBreakDuration: 10, longBreakDuration: 20, cyclesBeforeLongBreak: 2 } },
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
let chatHistory = [];

// --- LÓGICA DO PATINHO AJUDANTE ---
const DUCK_PERSONALITY_PROMPT = `Você é o 'Patinho DevFlow', um amigável pato de borracha assistente para programadores. Sua missão é ajudar os usuários a resolverem seus próprios problemas através do método 'Rubber Duck Debugging'. Nunca dê a solução direta ou escreva código. Em vez disso, faça perguntas abertas e guiadas para que o usuário pense sobre o problema. Use frases curtas, encorajadoras e um tom amigável. Comece suas respostas com 'Quack!'.`;

function openDuckChat() {
    duckChatModal.classList.remove('hidden');
    setTimeout(() => duckChatContainer.classList.add('scale-100', 'opacity-100'), 10);
    if (chatHistory.length === 0) {
        addMessageToDuckChat("Quack! Olá! Estou aqui para ajudar. Qual problema você está tentando resolver hoje?", 'duck');
    }
}

function closeDuckChat() {
    duckChatContainer.classList.remove('scale-100', 'opacity-100');
    setTimeout(() => duckChatModal.classList.add('hidden'), 300);
}

function addMessageToDuckChat(message, sender) {
    const messageEl = document.createElement('div');
    const isUser = sender === 'user';
    messageEl.className = `w-fit max-w-xs md:max-w-md p-3 rounded-2xl mb-3 ${isUser ? 'bg-indigo-600 text-white ml-auto rounded-br-lg' : 'bg-slate-700 text-slate-200 mr-auto rounded-bl-lg'}`;
    messageEl.textContent = message;
    duckChatBody.appendChild(messageEl);
    duckChatBody.scrollTop = duckChatBody.scrollHeight;
}

async function handleDuckChatSubmit(e) {
    e.preventDefault();
    const userInput = duckChatInput.value.trim();
    if (!userInput) return;

    addMessageToDuckChat(userInput, 'user');
    duckChatInput.value = '';

    chatHistory.push({ role: "user", parts: [{ text: userInput }] });

    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'w-fit max-w-xs p-3 rounded-2xl mb-3 bg-slate-700 text-slate-400 mr-auto rounded-bl-lg';
    typingIndicator.innerHTML = '<span class="animate-pulse">Quack... (pensando)</span>';
    duckChatBody.appendChild(typingIndicator);
    duckChatBody.scrollTop = duckChatBody.scrollHeight;

    try {
        const response = await fetch('gemini-proxy.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: "user", parts: [{ text: DUCK_PERSONALITY_PROMPT }] },
                    { role: "model", parts: [{ text: "Quack! Entendido. Estou pronto para ajudar." }] },
                    ...chatHistory
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        const duckResponse = data.candidates[0].content.parts[0].text;

        chatHistory.push({ role: "model", parts: [{ text: duckResponse }] });

        duckChatBody.removeChild(typingIndicator);
        addMessageToDuckChat(duckResponse, 'duck');

    } catch (error) {
        duckChatBody.removeChild(typingIndicator);
        addMessageToDuckChat(`Quack! Ocorreu um erro de conexão. Tente novamente. (${error.message})`, 'duck');
    }
}

// --- FIM DA LÓGICA DO PATINHO ---

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
    currentPresetIndex += direction;
    if (currentPresetIndex < 0) currentPresetIndex = presetKeys.length - 1;
    else if (currentPresetIndex >= presetKeys.length) currentPresetIndex = 0;
    updatePresetDisplay(false, direction);
}

// ✅ --- LÓGICA DA RÁDIO CORRIGIDA ---
function setupRadioPlayer() {
    const lofiStreamURL = 'http://stream.laut.fm/lofi';
    localAudioPlayer.src = lofiStreamURL;
    playerCurrentTrackName.textContent = 'Rádio Lo-Fi';
}

function toggleMusicPlayer() {
    if (localAudioPlayer.paused) {
        localAudioPlayer.load(); // Essencial para reiniciar o stream se ele parar
        localAudioPlayer.play().catch(e => console.error("Erro ao tocar rádio:", e));
    } else {
        localAudioPlayer.pause();
    }
}
// --- FIM DA LÓGICA DA RÁDIO ---


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
    timerDisplay.classList.remove('timer-tick');
    void timerDisplay.offsetWidth;
    timerDisplay.classList.add('timer-tick');
}

function updateModeDisplay() {
    modeButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-mode="${currentMode}"]`)?.classList.add('active');
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
    resetTimerBtn.addEventListener('click', () => setMode('focus', true));
    modeButtons.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));

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

    openDuckChatBtn.addEventListener('click', openDuckChat);
    closeDuckChatBtn.addEventListener('click', closeDuckChat);
    duckChatModal.addEventListener('click', (e) => {
        if (e.target === duckChatModal) closeDuckChat();
    });
    duckChatForm.addEventListener('submit', handleDuckChatSubmit);

    currentYearSpan.textContent = new Date().getFullYear();

    loadPomodoroSettings();
    updateVolumeSlider();
    setupRadioPlayer();

    requestNotificationPermission();
    renderTasks();
});
