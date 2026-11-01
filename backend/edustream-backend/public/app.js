// The UI can be opened either from the Express server (same-origin) or from
// VS Code Live Server/static hosting during development.
// Override with window.__EDUSTREAM_API_URL when using a different backend host.
const LOCAL_STATIC_PORTS = new Set(['5500', '5501', '3000', '5173', '4173']);
const API_BASE_URL = window.__EDUSTREAM_API_URL ||
    (LOCAL_STATIC_PORTS.has(window.location.port)
        ? 'http://localhost:5000/api/v1'
        : '/api/v1');
const STORAGE_KEY = 'edustream_session';
const APP_STATE = {
    currentView: 'landing',
    classrooms: [],
    activeRoomContext: null,
    session: null,
    loading: new Set()
};

const DOM_CACHE = { sections: null, navButtons: null };

const $ = (id) => document.getElementById(id);

function getSession() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
    catch { return null; }
}

async function apiRequest(path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
    if (APP_STATE.session?.token) headers.Authorization = `Bearer ${APP_STATE.session.token}`;
    try {
        const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, signal: controller.signal });
        const contentType = response.headers.get('content-type') || '';
        const payload = contentType.includes('application/json') ? await response.json() : { message: await response.text() };
        if (!response.ok) {
            const error = new Error(payload.error || payload.message || `Request failed (${response.status})`);
            error.status = response.status;
            throw error;
        }
        return payload;
    } finally {
        clearTimeout(timeout);
    }
}

function setStatus(message, type = 'info') {
    const el = $('global-status');
    if (!el) return;
    el.textContent = message;
    el.className = `status-banner ${type}`;
    clearTimeout(setStatus.timer);
    setStatus.timer = setTimeout(() => el.classList.add('hidden'), 5000);
}

function logActivity(type, text) {
    const container = $('activity-logs');
    if (!container) return;
    const entry = document.createElement('div');
    entry.className = `log-entry ${type.toLowerCase()}`;
    entry.textContent = `[${type}]: ${text}`;
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
}

function navigateToView(viewId) {
    if (!APP_STATE.session && ['dashboard', 'classroom'].includes(viewId)) viewId = 'auth';
    APP_STATE.currentView = viewId;
    if (!DOM_CACHE.sections) DOM_CACHE.sections = document.querySelectorAll('.view-section');
    if (!DOM_CACHE.navButtons) DOM_CACHE.navButtons = document.querySelectorAll('.nav-btn');
    DOM_CACHE.sections.forEach(section => section.classList.toggle('active', section.id === `view-${viewId}`));
    DOM_CACHE.navButtons.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-target') === viewId));
    if (viewId === 'dashboard' && APP_STATE.session) loadDashboardData();
    if (viewId === 'classroom' && APP_STATE.activeRoomContext) renderClassroom(APP_STATE.activeRoomContext);
    logActivity('SYSTEM', `Mapped route to: /${viewId}`);
}

function updateSessionUI() {
    if (!APP_STATE.session) return;
    $('session-user').textContent = APP_STATE.session.email;
    $('session-role').textContent = `Role: ${APP_STATE.session.role}`;
}

async function loadDashboardData() {
    if (!APP_STATE.session) return;
    $('dashboard-empty').textContent = 'Loading classrooms…';
    try {
        const data = await apiRequest('/dashboard');
        APP_STATE.classrooms = data.classrooms || [];
        $('metric-rooms').textContent = data.metrics.activeRooms;
        $('metric-students').textContent = data.metrics.connectedStudents;
        $('metric-accuracy').textContent = data.metrics.avgAccuracy;
        renderDashboardClassrooms();
    } catch (error) {
        if ([401, 403].includes(error.status)) return forceLogout('Your session expired. Please sign in again.');
        $('dashboard-empty').textContent = 'Could not load classrooms. Start the backend and retry.';
        setStatus(error.message, 'error');
        logActivity('ERROR', error.message);
    }
}

function renderDashboardClassrooms() {
    const listContainer = $('rooms-list-container');
    listContainer.innerHTML = '';
    if (!APP_STATE.classrooms.length) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = 'No classrooms found for this instructor.';
        listContainer.appendChild(empty);
        return;
    }
    APP_STATE.classrooms.forEach(room => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'room-card';
        card.innerHTML = `<h4>${escapeHtml(room.title)}</h4><p>Recorded submissions: ${room.studentsEnrolled}</p>`;
        card.addEventListener('click', () => loadClassroomContext(room.id));
        listContainer.appendChild(card);
    });
}

async function loadClassroomContext(roomId) {
    try {
        setStatus('Synchronizing classroom…', 'info');
        const data = await apiRequest(`/classrooms/${encodeURIComponent(roomId)}`);
        APP_STATE.activeRoomContext = data;
        renderClassroom(data);
        navigateToView('classroom');
        setStatus('Classroom synchronized.', 'success');
    } catch (error) {
        if ([401, 403].includes(error.status)) return forceLogout('Your session expired. Please sign in again.');
        setStatus(error.message, 'error');
        logActivity('ERROR', `Classroom sync failed: ${error.message}`);
    }
}

function renderClassroom(data) {
    $('current-room-title').textContent = data.classroom.title;
    $('roster-count').textContent = data.roster.length;
    $('roster-loading').classList.add('hidden');
    $('room-submissions').textContent = data.metrics.submissions;
    $('room-average').textContent = `${data.metrics.averageScore}%`;
    const roster = $('ui-roster-list');
    roster.innerHTML = '';
    data.roster.forEach(student => {
        const li = document.createElement('li');
        li.className = 'roster-item';
        li.innerHTML = `<span>${escapeHtml(student.name)}</span><span>connected</span>`;
        roster.appendChild(li);
    });
    $('roster-empty').classList.toggle('hidden', data.roster.length !== 0);
}

async function triggerQuiz() {
    const roomId = APP_STATE.activeRoomContext?.classroom?.id;
    if (!roomId) return setStatus('Open a classroom first.', 'error');
    const button = $('btn-trigger-quiz');
    button.disabled = true;
    try {
        const data = await apiRequest('/quizzes/trigger', { method: 'POST', body: JSON.stringify({ room_id: roomId }) });
        renderQuiz(data.quiz);
        logActivity('ACTION', 'Instructor triggered a server-backed evaluation.');
        setStatus('Pop quiz is live.', 'success');
    } catch (error) {
        setStatus(error.message, 'error');
        logActivity('ERROR', `Quiz trigger failed: ${error.message}`);
    } finally { button.disabled = false; }
}

function renderQuiz(quiz) {
    $('quiz-component').classList.remove('hidden');
    document.querySelector('.quiz-question').textContent = quiz.question;
    const options = $('quiz-component').querySelector('.quiz-options');
    options.innerHTML = '';
    quiz.options.forEach(option => {
        const label = document.createElement('label');
        label.className = 'option-label';
        label.innerHTML = `<input type="radio" name="quiz-opt" value="${escapeHtml(option.value)}"> ${escapeHtml(option.value)}) ${escapeHtml(option.label)}`;
        options.appendChild(label);
    });
}

async function submitQuiz() {
    const roomId = APP_STATE.activeRoomContext?.classroom?.id;
    const selected = document.querySelector('input[name="quiz-opt"]:checked')?.value;
    if (!selected) return setStatus('Select an option first.', 'error');
    const button = $('btn-submit-quiz');
    button.disabled = true;
    try {
        const data = await apiRequest('/quizzes/submit', {
            method: 'POST',
            body: JSON.stringify({ room_id: roomId, selection: selected })
        });
        $('quiz-component').classList.add('hidden');
        setStatus(data.isCorrect ? 'Correct answer recorded!' : 'Answer submitted. Keep learning!', data.isCorrect ? 'success' : 'info');
        logActivity(data.isCorrect ? 'SUCCESS' : 'ACTION', data.isCorrect ? 'Quiz score recorded: 100%.' : 'Quiz score recorded: 0%.');
        await loadClassroomContext(roomId);
    } catch (error) {
        setStatus(error.message, 'error');
        logActivity('ERROR', `Quiz submission failed: ${error.message}`);
    } finally { button.disabled = false; }
}

async function login(email, password) {
    const data = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    APP_STATE.session = { token: data.token, role: data.role, email };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(APP_STATE.session));
    updateSessionUI();
    setStatus('Signed in successfully.', 'success');
    navigateToView('dashboard');
}

function forceLogout(message) {
    APP_STATE.session = null;
    APP_STATE.activeRoomContext = null;
    localStorage.removeItem(STORAGE_KEY);
    if (message) setStatus(message, 'error');
    navigateToView('auth');
}

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function setupInteractionListeners() {
    document.querySelectorAll('[data-target]').forEach(btn => btn.addEventListener('click', () => navigateToView(btn.getAttribute('data-target'))));
    $('login-form').addEventListener('submit', async event => {
        event.preventDefault();
        const submit = event.currentTarget.querySelector('button[type="submit"]');
        submit.disabled = true;
        try { await login($('login-email').value.trim(), $('login-password').value); }
        catch (error) { setStatus(error.message, 'error'); logActivity('ERROR', `Login failed: ${error.message}`); }
        finally { submit.disabled = false; }
    });
    $('btn-use-demo').addEventListener('click', () => {
        $('login-email').value = 'prof@edustream.edu';
        $('login-password').value = 'password123';
        $('login-form').requestSubmit();
    });
    $('btn-logout').addEventListener('click', () => forceLogout('You have been signed out.'));
    $('cta-get-started').addEventListener('click', () => navigateToView(APP_STATE.session ? 'dashboard' : 'auth'));
    $('cta-learn-more').addEventListener('click', () => navigateToView(APP_STATE.session ? 'classroom' : 'auth'));
    $('btn-back-to-dash').addEventListener('click', () => navigateToView('dashboard'));
    $('btn-trigger-quiz').addEventListener('click', triggerQuiz);
    $('btn-submit-quiz').addEventListener('click', submitQuiz);
}

window.addEventListener('DOMContentLoaded', () => {
    APP_STATE.session = getSession();
    setupInteractionListeners();
    if (APP_STATE.session) {
        updateSessionUI();
        navigateToView('dashboard');
    } else {
        navigateToView('landing');
    }
});

if (typeof module !== 'undefined') module.exports = { APP_STATE, navigateToView, apiRequest };
