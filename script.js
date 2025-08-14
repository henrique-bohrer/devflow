'use strict';

// --- CONFIGURAÇÃO DO SUPABASE ---
const SUPABASE_URL = 'https://xrbthqnegxbeerkjlcjx.supabase.co/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYnRocW5lZ3hiZWVya2psY2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTE3NjUsImV4cCI6MjA2OTk4Nzc2NX0.jkeBlZfc_JLTXjlXMKH6dH8imyoVUndL-q8nY4pcTOA';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- SELEÇÃO DE ELEMENTOS DO DOM ---

// Elementos do Pomodoro, Player, etc. (Mantidos)
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
const loader = document.getElementById('loader');
const loaderParagraph = document.getElementById('loader-paragraph');

// Elementos de Autenticação (Mantidos)
const userSessionDisplay = document.getElementById('user-session-display');
const authModal = document.getElementById('auth-modal');
const closeAuthModalBtn = document.getElementById('close-auth-modal-btn');
const loginView = document.getElementById('login-view');
const registerView = document.getElementById('register-view');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterBtn = document.getElementById('show-register-btn');
const showLoginBtn = document.getElementById('show-login-btn');

// ✅ NOVOS E ATUALIZADOS ELEMENTOS DA AGENDA
const toggleAgendaBtn = document.getElementById('toggle-agenda-btn');
const agendaModal = document.getElementById('agenda-modal');
const closeAgendaBtn = document.getElementById('close-agenda-btn');
const upcomingEventsList = document.getElementById('upcoming-events-list');
const addNewEventBtn = document.getElementById('add-new-event-btn');
const agendaTitle = document.getElementById('agenda-title');
const agendaInput = document.getElementById('agenda-input'); // Usado para exibir detalhes

// ✅ NOVOS ELEMENTOS DO MODAL DE EDIÇÃO DE EVENTO
const eventEditorModal = document.getElementById('event-editor-modal');
const eventEditorForm = document.getElementById('event-editor-form');
const eventEditorTitle = document.getElementById('event-editor-title');
const eventIdInput = document.getElementById('event-id');
const eventTitleInput = document.getElementById('event-title-input');
const eventTasksInput = document.getElementById('event-tasks-input');
const cancelEventEditorBtn = document.getElementById('cancel-event-editor-btn');
const eventDatepickerEl = document.getElementById('event-datepicker');

// Outros Elementos (Mantidos)
const pixDonationBtn = document.getElementById('pix-donation-btn');
const pixModal = document.getElementById('pix-modal');
const closePixModalBtn = document.getElementById('close-pix-modal-btn');
const copyPixKeyBtn = document.getElementById('copy-pix-key-btn');
const pixKey = document.getElementById('pix-key');
const aiAssistantBtn = document.getElementById('ai-assistant-btn');
const aiChatWindow = document.getElementById('ai-chat-window');
const closeChatBtn = document.getElementById('close-chat-btn');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');


// --- VARIÁVEIS DE ESTADO ---
let timerInterval;
let timeLeft;
let currentCycleCount = 0;
let isPaused = true;
let currentMode = 'focus';
let areSoundsUnlocked = false;
let user = null;
let eventDatepickerInstance = null; // Instância do calendário do editor
let eventsCache = []; // Cache para guardar os eventos carregados

const pomodoroPresets = {
    'default': { name: 'Padrão (4x25)', settings: { focusDuration: 25 * 60, shortBreakDuration: 5 * 60, longBreakDuration: 15 * 60, cyclesBeforeLongBreak: 4 } },
    'intense': { name: 'Intenso (4x30)', settings: { focusDuration: 30 * 60, shortBreakDuration: 5 * 60, longBreakDuration: 15 * 60, cyclesBeforeLongBreak: 4 } },
    'long': { name: 'Longo (2x50)', settings: { focusDuration: 50 * 60, shortBreakDuration: 10 * 60, longBreakDuration: 20 * 60, cyclesBeforeLongBreak: 2 } }
};
const presetKeys = Object.keys(pomodoroPresets);
let currentPresetIndex = 0;
let focusDuration, shortBreakDuration, longBreakDuration, cyclesBeforeLongBreak;


// --- LÓGICA DE AUTENTICAÇÃO --- (Mantida e integrada com a nova agenda)
async function checkUser() {
    const { data: { session } } = await _supabase.auth.getSession();
    user = session?.user;
    updateUIForUser();
    if (user) {
        await loadUpcomingEvents();
    }
}

function updateUIForUser() {
    if (user) {
        userSessionDisplay.innerHTML = `
            <div class="flex items-center gap-4">
                <span class="text-slate-300 font-semibold">Olá, ${user.email.split('@')[0]}</span>
                <button id="logout-btn" class="text-sm text-indigo-400 hover:underline">Sair</button>
            </div>`;
        document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    } else {
        userSessionDisplay.innerHTML = `
            <button id="login-btn-main" class="btn py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                Fazer Login / Cadastrar
            </button>`;
        document.getElementById('login-btn-main')?.addEventListener('click', () => authModal.classList.add('is-open'));
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    user = data.user;
    updateUIForUser();
    await loadUpcomingEvents();
    authModal.classList.remove('is-open');
}

async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    if (password !== passwordConfirm) return alert('As senhas não correspondem.');

    const { error } = await _supabase.auth.signUp({ email, password });
    if (error) return alert(error.message);

    alert('Registro bem-sucedido! Verifique seu e-mail para confirmar.');
    showLoginView();
}

async function handleLogout() {
    await _supabase.auth.signOut();
    user = null;
    eventsCache = [];
    updateUIForUser();
    renderUpcomingEvents();
    resetAgendaDetails();
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

// =================================================================
// --- ✅ NOVA LÓGICA DA AGENDA DE EVENTOS (SUBSTITUI A ANTIGA) ---
// =================================================================

/**
 * Carrega os eventos futuros do Supabase e os armazena no cache.
 */
async function loadUpcomingEvents() {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);

    try {
        const { data, error } = await _supabase
            .from('events') // ATENÇÃO: Nome da sua tabela no Supabase.
            .select('id, title, date, content')
            .eq('user_id', user.id)
            .gte('date', today)
            .order('date', { ascending: true });

        if (error) throw error;
        eventsCache = data;
        renderUpcomingEvents();
    } catch (error) {
        console.error("Erro ao carregar eventos:", error);
        upcomingEventsList.innerHTML = '<p class="text-red-500">Não foi possível carregar os eventos.</p>';
    }
}

/**
 * Renderiza os eventos do cache na lista da interface.
 */
function renderUpcomingEvents() {
    upcomingEventsList.innerHTML = '';
    if (eventsCache.length === 0) {
        upcomingEventsList.innerHTML = '<p class="text-gray-400 text-center mt-4">Nenhum evento futuro.</p>';
        resetAgendaDetails();
        return;
    }

    eventsCache.forEach(event => {
        const countdown = getCountdownText(event.date);
        const eventEl = document.createElement('div');
        eventEl.className = 'event-item p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-indigo-100';
        eventEl.dataset.eventId = event.id;

        eventEl.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="font-bold text-gray-700 truncate">${event.title}</span>
                <button data-edit-id="${event.id}" class="edit-event-btn text-gray-400 hover:text-indigo-600 w-8 h-8 rounded-full flex items-center justify-center">
                    <i class="fa-solid fa-pencil"></i>
                </button>
            </div>
            <p class="text-sm text-indigo-500 font-semibold">${countdown}</p>`;

        upcomingEventsList.appendChild(eventEl);

        eventEl.addEventListener('click', (e) => {
            if (!e.target.closest('.edit-event-btn')) displayEventDetails(event.id);
        });
        eventEl.querySelector('.edit-event-btn').addEventListener('click', () => openEventEditor(event.id));
    });
}

/**
 * Mostra os detalhes de um evento no painel direito.
 */
function displayEventDetails(eventId) {
    const event = eventsCache.find(e => e.id == eventId);
    if (!event) return;

    document.querySelectorAll('.event-item').forEach(el => {
        el.classList.toggle('bg-indigo-100', el.dataset.eventId == eventId);
    });

    agendaTitle.textContent = event.title;
    const formattedContent = (event.content || '').split('\n').map(line => `<p>${line || '&nbsp;'}</p>`).join('');
    agendaInput.innerHTML = formattedContent || '<p class="text-gray-500">Nenhuma tarefa para este evento.</p>';
}

/**
 * Limpa o painel de detalhes da agenda.
 */
function resetAgendaDetails() {
    agendaTitle.textContent = 'Selecione um evento';
    agendaInput.innerHTML = '<p class="text-gray-500" style="font-family: \'Inter\', sans-serif;">As tarefas do evento selecionado aparecerão aqui.</p>';
    document.querySelectorAll('.event-item').forEach(el => el.classList.remove('bg-indigo-100'));
}

/**
 * Calcula o texto da contagem regressiva para uma data.
 */
function getCountdownText(dateString) {
    const eventDate = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Evento passado";
    if (diffDays === 0) return "É hoje!";
    if (diffDays === 1) return "É amanhã!";
    return `Faltam ${diffDays} dias`;
}

/**
 * Abre o modal de edição para um novo evento ou um existente.
 */
function openEventEditor(eventId = null) {
    eventEditorForm.reset();
    if (eventId) {
        const event = eventsCache.find(e => e.id == eventId);
        if (!event) return;
        eventEditorTitle.textContent = "Editar Evento";
        eventIdInput.value = event.id;
        eventTitleInput.value = event.title;
        eventTasksInput.value = event.content;
        initializeEventDatePicker(new Date(event.date + 'T00:00:00'));
    } else {
        eventEditorTitle.textContent = "Adicionar Novo Evento";
        eventIdInput.value = '';
        initializeEventDatePicker(new Date());
    }
    eventEditorModal.classList.remove('hidden');
    eventEditorModal.classList.add('flex');
}

/**
 * Fecha o modal de edição de eventos.
 */
function closeEventEditor() {
    eventEditorModal.classList.add('hidden');
    eventEditorModal.classList.remove('flex');
    if (eventDatepickerInstance) {
        eventDatepickerInstance.destroy();
        eventDatepickerInstance = null;
    }
}

/**
 * Lida com o envio do formulário de evento.
 */
async function handleEventSubmit(e) {
    e.preventDefault();
    if (!user) return alert("Você precisa estar logado para salvar um evento.");

    const selectedDate = eventDatepickerInstance.selectedDates[0];
    if (!selectedDate) return alert("Por favor, selecione uma data para o evento.");

    const eventData = {
        user_id: user.id,
        title: eventTitleInput.value,
        content: eventTasksInput.value,
        date: selectedDate,
    };
    const eventId = eventIdInput.value;

    try {
        const { error } = eventId
            ? await _supabase.from('events').update(eventData).eq('id', eventId)
            : await _supabase.from('events').insert([eventData]);
        if (error) throw error;
        closeEventEditor();
        await loadUpcomingEvents();
    } catch (err) {
        console.error("Erro ao salvar evento:", err);
        alert("Não foi possível salvar o evento.");
    }
}

/**
 * Inicializa o calendário dentro do modal de edição.
 */
function initializeEventDatePicker(initialDate) {
    if (eventDatepickerInstance) eventDatepickerInstance.destroy();

    const checkInterval = setInterval(() => {
        if (window.VanillaCalendarPro) {
            clearInterval(checkInterval);
            eventDatepickerInstance = new window.VanillaCalendarPro.Calendar(eventDatepickerEl, {
                settings: {
                    lang: 'pt-BR',
                    visibility: { theme: 'dark' },
                    selection: { day: 'single' },
                    selected: { dates: [initialDate.toISOString().slice(0, 10)] }
                }
            });
            eventDatepickerInstance.init();
        }
    }, 100);
}

// --- LÓGICA DO POMODORO, PLAYER, IA, ETC. (CÓDIGO ORIGINAL MANTIDO) ---

// ... (todo o seu código de updatePresetDisplay, startTimer, callGeminiAPI, etc., vai aqui, exatamente como era antes)

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
    timerDisplay.classList.remove('timer-warning', 'timer-glowing');
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
    if (localAudioPlayer.paused) toggleMusicPlayer();
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
}

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
}

function showNotification(title, body) {
    if (Notification.permission === "granted") new Notification(title, { body });
}

function updateVolumeSlider() {
    if (!playerVolumeSlider) return;
    const volume = playerVolumeSlider.value;
    const percentage = `${volume}%`;
    volumeTooltip.textContent = percentage;
    const sliderWidth = playerVolumeSlider.offsetWidth;
    const thumbPosition = (volume / 100) * sliderWidth;
    const tooltipOffset = thumbPosition - (volumeTooltip.offsetWidth / 2) + 8;
    volumeTooltip.style.left = `${tooltipOffset}px`;
    playerVolumeSlider.style.background = `linear-gradient(to right, var(--accent-primary) ${percentage}, var(--border-color) ${percentage})`;
}

async function callGeminiAPI(prompt) {
    if (typeof GEMINI_API_KEY === 'undefined' || GEMINI_API_KEY === "SUA_CHAVE_DE_API_AQUI") {
        return "Por favor, configure sua chave de API no arquivo config.js para usar o assistente.";
    }
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const requestBody = { contents: [{ parts: [{ "text": prompt }] }] };
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            const errorData = await response.json();
            return `Ocorreu um erro: ${errorData.error.message}`;
        }
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        return "Não foi possível conectar à IA.";
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
    document.getElementById('typing-indicator')?.remove();
    addMessageToChat('ai', aiResponse);
}

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


// --- INICIALIZAÇÃO GERAL ---
// --- INICIALIZAÇÃO GERAL ---
document.addEventListener('DOMContentLoaded', () => {
    // Autenticação
    closeAuthModalBtn?.addEventListener('click', () => authModal.classList.remove('is-open'));
    showRegisterBtn?.addEventListener('click', showRegisterView);
    showLoginBtn?.addEventListener('click', showLoginView);
    loginForm?.addEventListener('submit', handleLogin);
    registerForm?.addEventListener('submit', handleRegister);

    // Pomodoro
    startTimerBtn?.addEventListener('click', startTimer);
    pauseTimerBtn?.addEventListener('click', pauseTimer);
    resetTimerBtn?.addEventListener('click', () => {
        setMode('focus', true);
        if (prevPresetBtn) prevPresetBtn.disabled = false;
        if (nextPresetBtn) nextPresetBtn.disabled = false;
    });
    modeButtons.forEach(btn => btn.addEventListener('click', () => {
        if (isPaused && btn.dataset.mode === 'focus') setMode('focus');
    }));
    prevPresetBtn?.addEventListener('click', () => navigatePresets(-1));
    nextPresetBtn?.addEventListener('click', () => navigatePresets(1));

    // Player
    playerPlayPauseBtn?.addEventListener('click', toggleMusicPlayer);
    localAudioPlayer?.addEventListener('play', () => playPauseIconContainer.innerHTML = `<i class="fa-solid fa-pause fa-lg"></i>`);
    localAudioPlayer?.addEventListener('pause', () => playPauseIconContainer.innerHTML = `<i class="fa-solid fa-play fa-lg"></i>`);
    playerVolumeSlider?.addEventListener('input', () => {
        if (localAudioPlayer) localAudioPlayer.volume = playerVolumeSlider.value / 100;
        updateVolumeSlider();
    });
    toggleVolumeBtn?.addEventListener('click', () => volumeControlContainer.classList.toggle('hidden'));

    // ✅ NOVA AGENDA DE EVENTOS (COM CORREÇÃO FINAL)
    toggleAgendaBtn?.addEventListener('click', () => {
        // CORREÇÃO: Usar a classe 'is-open' que o seu CSS espera.
        agendaModal.classList.add('is-open');
        loadUpcomingEvents();
    });

    closeAgendaBtn?.addEventListener('click', () => {
        // CORREÇÃO: Remover a classe 'is-open' para fechar.
        agendaModal.classList.remove('is-open');
    });

    addNewEventBtn?.addEventListener('click', () => openEventEditor());
    cancelEventEditorBtn?.addEventListener('click', closeEventEditor);
    eventEditorForm?.addEventListener('submit', handleEventSubmit);

    // Assistente de IA
    aiAssistantBtn?.addEventListener('click', () => aiChatWindow.classList.toggle('is-chat-open'));
    closeChatBtn?.addEventListener('click', () => aiChatWindow.classList.remove('is-chat-open'));
    chatForm?.addEventListener('submit', handleChatSubmit);

    // Modal PIX
    pixDonationBtn?.addEventListener('click', () => pixModal.classList.add('is-open'));
    closePixModalBtn?.addEventListener('click', () => pixModal.classList.remove('is-open'));
    copyPixKeyBtn?.addEventListener('click', () => {
        navigator.clipboard.writeText(pixKey.textContent).then(() => {
            copyPixKeyBtn.textContent = 'Copiado!';
            setTimeout(() => { copyPixKeyBtn.textContent = 'Copiar Chave'; }, 2000);
        });
    });

    // Setup Geral
    const currentYearEl = document.getElementById('current-year');
    if(currentYearEl) currentYearEl.textContent = new Date().getFullYear();
    loadPomodoroSettings();
    updateVolumeSlider();
    setupRadioPlayer();
    requestNotificationPermission();
    checkUser(); // Ponto de entrada que inicia a verificação de usuário e o carregamento de dados
});

window.addEventListener('load', () => {
    if (loader) {
        const text = "Organize suas tarefas. Aumente sua produtividade.";
        let i = 0;
        setTimeout(() => {
            loaderParagraph.classList.add('typing');
            function typeWriter() {
                if (i < text.length) {
                    loaderParagraph.innerHTML += text.charAt(i);
                    i++;
                    setTimeout(typeWriter, 60);
                } else {
                    setTimeout(() => loader.classList.add('hidden'), 1500);
                }
            }
            typeWriter();
        }, 2000);
    }
});