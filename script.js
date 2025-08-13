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
const playPauseIconContainer = document.getElementById('play-pause-icon-container');
const playerVolumeSlider = document.getElementById('player-volume-slider');
const playerCurrentTrackName = document.getElementById('player-current-track-name');
const volumeTooltip = document.getElementById('volume-tooltip');
const volumeControlContainer = document.getElementById('volume-control-container');
const toggleVolumeBtn = document.getElementById('toggle-volume-btn');
const notificationSound = document.getElementById('notification-sound');
const breakNotificationSound = document.getElementById('break-notification-sound');
const warningSound = document.getElementById('warning-sound');
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

// Agenda Elements
const toggleAgendaBtn = document.getElementById('toggle-agenda-btn');
const agendaModal = document.getElementById('agenda-modal');
const closeAgendaBtn = document.getElementById('close-agenda-btn');
const agendaInput = document.getElementById('agenda-input');
const viewMonthBtn = document.getElementById('view-month-btn');
const viewYearBtn = document.getElementById('view-year-btn');

// PIX Modal Elements
const pixDonationBtn = document.getElementById('pix-donation-btn');
const pixModal = document.getElementById('pix-modal');
const closePixModalBtn = document.getElementById('close-pix-modal-btn');
const copyPixKeyBtn = document.getElementById('copy-pix-key-btn');
const pixKey = document.getElementById('pix-key');

// AI Assistant Elements
const aiAssistantBtn = document.getElementById('ai-assistant-btn');
const aiChatWindow = document.getElementById('ai-chat-window');
const closeChatBtn = document.getElementById('close-chat-btn');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');


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

// --- LÓGICA DE AUTENTICAÇÃO E AGENDA ---
async function checkUser() {
    const { data: { session } } = await _supabase.auth.getSession();
    user = session?.user;
    updateUIForUser();
    // A lógica da agenda agora é puramente local, mas esta estrutura pode ser usada no futuro
}
function updateUIForUser() {
    if (user) {
        userSessionDisplay.innerHTML = `
            <div class="flex items-center gap-4">
                <span class="text-slate-300 font-semibold">Olá, ${user.email.split('@')[0]}</span>
                <button id="logout-btn" class="text-sm text-indigo-400 hover:underline">Sair</button>
            </div>`;
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
    } else {
        userSessionDisplay.innerHTML = `
            <button id="login-btn-main" class="btn py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                Fazer Login / Cadastrar
            </button>`;
        const loginBtn = document.getElementById('login-btn-main');
        if (loginBtn && authModal) {
            loginBtn.addEventListener('click', () => authModal.classList.add('is-open'));
        }
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
        await loadAgendaContent(selectedDate); // Load content for the currently selected date
        authModal.classList.remove('is-open');
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
    // When logging out, reload the agenda content, which will clear it since user is null
    loadAgendaContent(selectedDate);
}
function showLoginView() {
    if (loginView && registerView) {
        loginView.classList.remove('hidden');
        registerView.classList.add('hidden');
    }
}
function showRegisterView() {
    if (loginView && registerView) {
        loginView.classList.add('hidden');
        registerView.classList.remove('hidden');
    }
}

// --- LÓGICA DA AGENDA ---
let agendaSaveTimeout;
let selectedDate = new Date();
let calendarInstance = null;

function getFormattedDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function loadAgendaContent(date) {
    const formattedDate = getFormattedDate(date);
    const agendaTitle = document.getElementById('agenda-title');
    if (agendaTitle) {
        agendaTitle.textContent = `Agenda de ${date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`;
    }

    if (!agendaInput) return;
    agendaInput.innerHTML = '<div class="text-gray-400">Carregando...</div>'; // Visual feedback

    if (!user) {
        agendaInput.innerHTML = '<div class="text-gray-400">Faça login para salvar suas tarefas.</div>';
        return;
    }

    try {
        const { data, error } = await _supabase
            .from('tasks')
            .select('content')
            .eq('user_id', user.id)
            .eq('date', formattedDate)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Erro ao carregar anotação:', error);
            agendaInput.innerHTML = '<div class="text-red-500">Erro ao carregar dados.</div>';
        } else {
            const content = data ? data.content : '';
            const tasks = content.split('\n');
            agendaInput.innerHTML = ''; // Clear loading message

            if (tasks.length === 0 || (tasks.length === 1 && tasks[0] === '')) {
                // If no tasks, create one empty editable div
                const taskDiv = document.createElement('div');
                taskDiv.contentEditable = true;
                taskDiv.className = 'task-item';
                agendaInput.appendChild(taskDiv);
            } else {
                tasks.forEach(taskText => {
                    const taskDiv = document.createElement('div');
                    taskDiv.contentEditable = true;
                    taskDiv.className = 'task-item';
                    taskDiv.textContent = taskText;
                    agendaInput.appendChild(taskDiv);
                });
            }
        }
    } catch (error) {
        console.error('Erro inesperado ao carregar:', error);
        agendaInput.innerHTML = '<div class="text-red-500">Erro de conexão.</div>';
    }
}

async function saveAgendaContent() {
    if (!agendaInput || !user) {
        return;
    }

    const taskItems = agendaInput.querySelectorAll('.task-item');
    const tasks = Array.from(taskItems).map(div => div.textContent);
    const content = tasks.join('\n');

    const formattedDate = getFormattedDate(selectedDate);

    try {
        const { error } = await _supabase
            .from('tasks')
            .upsert(
                {
                    user_id: user.id,
                    date: formattedDate,
                    content: content,
                },
                {
                    onConflict: 'user_id, date',
                }
            );

        if (error) {
            console.error('Erro ao salvar anotação:', error);
        }
    } catch (error) {
        console.error('Erro inesperado ao salvar:', error);
    }
}

function handleAgendaInput() {
    clearTimeout(agendaSaveTimeout);
    agendaSaveTimeout = setTimeout(saveAgendaContent, 500); // Auto-save 500ms after user stops typing
}

function switchCalendarView(type) {
    if (calendarInstance) {
        calendarInstance.destroy();
        calendarInstance = null;
    }
    initializeAgendaCalendar(type);

    if (viewMonthBtn && viewYearBtn) {
        viewMonthBtn.classList.toggle('active', type === 'default');
        viewYearBtn.classList.toggle('active', type === 'year');
    }
}

function initializeAgendaCalendar(type = 'default') {
    if (calendarInstance || !document.getElementById('monthly-calendar')) return;

    const checkInterval = setInterval(() => {
        if (window.VanillaCalendarPro && window.VanillaCalendarPro.Calendar) {
            clearInterval(checkInterval);

            const { Calendar } = window.VanillaCalendarPro;
            calendarInstance = new Calendar('#monthly-calendar', {
                type: type,
                actions: {
                    clickDay(event, self) {
                        if (!self.selectedDates[0]) return;
                        selectedDate = new Date(self.selectedDates[0]);
                        loadAgendaContent(selectedDate);
                    },
                    clickMonth(event, self) {
                        selectedDate.setMonth(self.selectedMonth);
                        switchCalendarView('default');
                    },
                    clickYear(event, self) {
                        selectedDate.setFullYear(self.selectedYear);
                        switchCalendarView('default');
                    },
                    onUpdate(self) {
                        const calendarContainer = document.getElementById('monthly-calendar');
                        if (calendarContainer) {
                            // Use a timeout to ensure the class is removed before re-adding
                            calendarContainer.classList.remove('is-updating');
                            setTimeout(() => {
                                calendarContainer.classList.add('is-updating');
                            }, 10);

                            const animationEndHandler = () => {
                                calendarContainer.classList.remove('is-updating');
                                calendarContainer.removeEventListener('animationend', animationEndHandler);
                            };
                            calendarContainer.addEventListener('animationend', animationEndHandler);
                        }
                    },
                },
                settings: {
                    lang: 'pt-BR',
                    visibility: {
                        theme: 'light',
                    },
                    selection: {
                        day: 'single',
                    },
                    selected: {
                        dates: [getFormattedDate(selectedDate)],
                        month: selectedDate.getMonth(),
                        year: selectedDate.getFullYear(),
                    }
                },
                layouts: {
                    default: `
                        <div class="vc-header-nav" role="toolbar" aria-label="Calendar Navigation">
                            <button type="button" class="vc-arrow-btn" id="cal-prev-year" aria-label="Previous year"><i class="fa-solid fa-angles-left"></i></button>
                            <button type="button" class="vc-arrow-btn" id="cal-prev-week" aria-label="Previous week"><i class="fa-solid fa-angle-left"></i></button>
                            <#ArrowPrev [month] />
                            <div class="vc-header__content" data-vc-header="content"><#Month /><#Year /></div>
                            <#ArrowNext [month] />
                            <button type="button" class="vc-arrow-btn" id="cal-next-week" aria-label="Next week"><i class="fa-solid fa-angle-right"></i></button>
                            <button type="button" class="vc-arrow-btn" id="cal-next-year" aria-label="Next year"><i class="fa-solid fa-angles-right"></i></button>
                        </div>
                        <div class="vc-wrapper" data-vc="wrapper"><#WeekNumbers /><div class="vc-content" data-vc="content"><#Week /><#Dates /></div></div>`,
                    year: `
                        <div class="vc-header-nav" role="toolbar" aria-label="Calendar Navigation">
                            <#ArrowPrev [year] />
                            <div class="vc-header__content" data-vc-header="content"><#Year /></div>
                            <#ArrowNext [year] />
                        </div>
                        <div class="vc-wrapper" data-vc="wrapper"><div class="vc-content" data-vc="content"><#Months /></div></div>`
                },
            });
            calendarInstance.init();

            // Add event listeners for new navigation buttons only in default view
            if (type === 'default') {
                const navButtons = [
                    { id: 'cal-prev-year', action: () => selectedDate.setFullYear(selectedDate.getFullYear() - 1) },
                    { id: 'cal-next-year', action: () => selectedDate.setFullYear(selectedDate.getFullYear() + 1) },
                    { id: 'cal-prev-week', action: () => selectedDate.setDate(selectedDate.getDate() - 7) },
                    { id: 'cal-next-week', action: () => selectedDate.setDate(selectedDate.getDate() + 7) }
                ];

                navButtons.forEach(({ id, action }) => {
                    const button = document.getElementById(id);
                    if (button) {
                        button.addEventListener('click', () => {
                            action();
                            calendarInstance.settings.selected.dates = [getFormattedDate(selectedDate)];
                            calendarInstance.update({ dates: true });
                            loadAgendaContent(selectedDate);
                        });
                    }
                });
            }
        }
    }, 100); // Check every 100ms
}

// --- LÓGICA DO ASSISTENTE DE IA ---
function addMessageToChat(sender, message) {
    if (!chatMessages) return;
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${sender}`;

    if (sender === 'ai' && message === 'typing') {
        messageElement.innerHTML = '<div class="typing-indicator"><span></span></div>';
        messageElement.id = 'typing-indicator';
    } else {
        messageElement.textContent = message;
    }

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function callGeminiAPI(prompt) {
    if (typeof GEMINI_API_KEY === 'undefined' || GEMINI_API_KEY === "SUA_CHAVE_DE_API_AQUI") {
        return "Por favor, configure sua chave de API no arquivo config.js para usar o assistente.";
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const requestBody = {
        contents: [{
            parts: [{ "text": prompt }]
        }]
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Erro da API Gemini:", errorData);
            return `Ocorreu um erro ao contatar a IA. Detalhes: ${errorData.error.message}`;
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Erro de rede ou fetch:", error);
        return "Não foi possível conectar à IA. Verifique sua conexão de rede ou a configuração da API.";
    }
}

async function handleChatSubmit(e) {
    e.preventDefault();
    const userInput = chatInput.value.trim();
    if (!userInput) return;

    addMessageToChat('user', userInput);
    chatInput.value = '';

    addMessageToChat('ai', 'typing');

    const aiResponse = await callGeminiAPI(userInput);

    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }

    addMessageToChat('ai', aiResponse);
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
    localAudioPlayer.src = 'https://lofi.stream.laut.fm/lofi';
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
    timerDisplay.classList.remove('timer-glowing');
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
    timerDisplay.classList.add('timer-glowing');
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
    timerDisplay.classList.remove('timer-glowing');
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
    if (closeAuthModalBtn && authModal) {
        closeAuthModalBtn.addEventListener('click', () => authModal.classList.remove('is-open'));
    }
    if (showRegisterBtn) showRegisterBtn.addEventListener('click', showRegisterView);
    if (showLoginBtn) showLoginBtn.addEventListener('click', showLoginView);
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    // Pomodoro
    if (startTimerBtn) startTimerBtn.addEventListener('click', startTimer);
    if (pauseTimerBtn) pauseTimerBtn.addEventListener('click', pauseTimer);
    if (resetTimerBtn) resetTimerBtn.addEventListener('click', () => {
        setMode('focus', true);
        if (prevPresetBtn) prevPresetBtn.disabled = false;
        if (nextPresetBtn) nextPresetBtn.disabled = false;
    });
    if (modeButtons) modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isPaused && btn.dataset.mode === 'focus') setMode('focus');
        });
    });
    if (prevPresetBtn) prevPresetBtn.addEventListener('click', () => navigatePresets(-1));
    if (nextPresetBtn) nextPresetBtn.addEventListener('click', () => navigatePresets(1));

    // Player
    if (playerPlayPauseBtn) playerPlayPauseBtn.addEventListener('click', toggleMusicPlayer);
    if (localAudioPlayer) {
        localAudioPlayer.addEventListener('play', () => {
            if (playPauseIconContainer) playPauseIconContainer.innerHTML = `<i class="fa-solid fa-pause fa-lg"></i>`;
        });
        localAudioPlayer.addEventListener('pause', () => {
            if (playPauseIconContainer) playPauseIconContainer.innerHTML = `<i class="fa-solid fa-play fa-lg"></i>`;
        });
    }
    if (playerVolumeSlider) playerVolumeSlider.addEventListener('input', () => {
        if (localAudioPlayer) localAudioPlayer.volume = playerVolumeSlider.value / 100;
        updateVolumeSlider();
    });

    if (toggleVolumeBtn && volumeControlContainer) {
        toggleVolumeBtn.addEventListener('click', () => {
            volumeControlContainer.classList.toggle('hidden');
            volumeControlContainer.classList.toggle('flex');
        });
    }

    // Agenda
    if (toggleAgendaBtn && agendaModal) {
        toggleAgendaBtn.addEventListener('click', () => {
            agendaModal.classList.add('is-open');
            // Delay initialization to allow for CSS transition
            setTimeout(() => switchCalendarView('default'), 300); // Use a shorter delay
        });
    }
    if (viewMonthBtn) {
        viewMonthBtn.addEventListener('click', () => switchCalendarView('default'));
    }
    if (viewYearBtn) {
        viewYearBtn.addEventListener('click', () => switchCalendarView('year'));
    }
    if (closeAgendaBtn && agendaModal) {
        closeAgendaBtn.addEventListener('click', () => {
            agendaModal.classList.remove('is-open');
        });
    }
    if (agendaInput) {
        // Still use the input event on the container for debounced saving
        agendaInput.addEventListener('input', handleAgendaInput);

        // Handle creating new tasks with the Enter key
        agendaInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Stop default Enter behavior

                const newTaskDiv = document.createElement('div');
                newTaskDiv.className = 'task-item';
                newTaskDiv.contentEditable = true;

                const currentTask = document.activeElement;
                // Ensure we are inside a task item before inserting after it
                if (currentTask && currentTask.classList.contains('task-item') && currentTask.closest('#agenda-input')) {
                    currentTask.insertAdjacentElement('afterend', newTaskDiv);
                } else {
                    // Fallback if focus is lost or somewhere else, just add to the end
                    agendaInput.appendChild(newTaskDiv);
                }

                // Set focus to the new task
                newTaskDiv.focus();
            }
        });
    }

    // Assistente de IA
    if (aiAssistantBtn && aiChatWindow) {
        aiAssistantBtn.addEventListener('click', () => {
            aiChatWindow.classList.toggle('is-chat-open');
        });
    }
    if (closeChatBtn && aiChatWindow) {
        closeChatBtn.addEventListener('click', () => {
            aiChatWindow.classList.remove('is-chat-open');
        });
    }
    if (chatForm) {
        chatForm.addEventListener('submit', handleChatSubmit);
    }

    // Lógica do Modal PIX
    if (pixDonationBtn && pixModal) {
        pixDonationBtn.addEventListener('click', () => pixModal.classList.add('is-open'));
    }
    if (closePixModalBtn && pixModal) {
        closePixModalBtn.addEventListener('click', () => pixModal.classList.remove('is-open'));
    }
    if (copyPixKeyBtn && pixKey) {
        copyPixKeyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(pixKey.textContent).then(() => {
                copyPixKeyBtn.textContent = 'Copiado!';
                setTimeout(() => {
                    copyPixKeyBtn.textContent = 'Copiar Chave';
                }, 2000);
            });
        });
    }

    // Inicialização Geral
    const currentYearEl = document.getElementById('current-year');
    if (currentYearEl) currentYearEl.textContent = new Date().getFullYear();

    // Inicialização Geral
    loadAgendaContent(selectedDate); // Load today's content initially
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
