const API = 'https://taskflow-backend-yk00.onrender.com/api';
const SOCKET_URL = 'https://taskflow-backend-yk00.onrender.com';

// 👇 Ab TEAM_ID static nahi hai, localStorage se aayega
let TEAM_ID = localStorage.getItem('activeTeamId') || null; 
let TEAM_NAME = localStorage.getItem('activeTeamName') || 'Alpha Team';

let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');
let socket = null;
let tasks = [];
let searchQuery = '';

/* ============ TOAST ============ */
function toast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.getElementById('toastContainer').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(400px)';
    t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, 3000);
}

/* ============ THEME ============ */
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
themeToggle.onclick = () => {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  themeToggle.textContent = next === 'dark' ? '🌙' : '☀️';
  localStorage.setItem('theme', next);
  if (document.getElementById('tab-analytics').classList.contains('active')) drawCharts();
};

/* ============ TEAM MODAL ============ */
window.openTeamModal = () => document.getElementById('teamModal').classList.add('active');
window.closeTeamModal = () => document.getElementById('teamModal').classList.remove('active');

window.createTeam = async () => {
  const name = document.getElementById('newTeamName').value;
  if (!name) return toast('Team name required', 'error');
  const res = await fetch(`${API}/team/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name })
  });
  const data = await res.json();
  if (res.ok) {
    switchTeam(data.teamId, data.name);
  } else {
    toast(data.error || 'Failed to create team', 'error');
  }
};

window.joinTeam = async () => {
  const teamId = document.getElementById('joinTeamId').value.trim().toUpperCase();
  if (!teamId) return toast('Team ID required', 'error');
  const res = await fetch(`${API}/team/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ teamId })
  });
  const data = await res.json();
  if (res.ok) {
    switchTeam(data.team.teamId, data.team.name);
  } else {
    toast(data.error || 'Invalid Team ID', 'error');
  }
};

function switchTeam(id, name) {
  localStorage.setItem('activeTeamId', id);
  localStorage.setItem('activeTeamName', name);
  location.reload(); // Reload to fetch new team's data
}

/* ============ AUTH ============ */
const authScreen = document.getElementById('authScreen');
const appScreen = document.getElementById('appScreen');
const authForm = document.getElementById('authForm');
const authError = document.getElementById('authError');
let mode = 'login';

document.getElementById('tabLogin').onclick = () => setMode('login');
document.getElementById('tabRegister').onclick = () => setMode('register');

function setMode(m) {
  mode = m;
  document.getElementById('tabLogin').classList.toggle('active', m === 'login');
  document.getElementById('tabRegister').classList.toggle('active', m === 'register');
  document.getElementById('nameField').style.display = m === 'register' ? 'block' : 'none';
  document.getElementById('authBtnText').textContent = m === 'login' ? 'Login' : 'Create Account';
}

document.getElementById('passField').oninput = (e) => {
  const bar = document.getElementById('passStrength');
  const p = e.target.value;
  let score = 0;
  if (p.length >= 6) score++;
  if (p.length >= 10) score++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  bar.className = 'pass-strength ' + (score >= 4 ? 'strong' : score >= 2 ? 'medium' : p ? 'weak' : '');
};

authForm.onsubmit = async (e) => {
  e.preventDefault();
  authError.textContent = '';
  const body = {
    email: document.getElementById('emailField').value,
    password: document.getElementById('passField').value
  };
  if (mode === 'register') body.name = document.getElementById('nameField').value;
  try {
    const res = await fetch(`${API}/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    token = data.token;
    currentUser = data.user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(currentUser));
    toast(`Welcome, ${currentUser.name}! 🎉`, 'success');
    startApp();
  } catch (err) { authError.textContent = err.message; }
};

document.getElementById('logoutBtn').onclick = () => {
  if (socket) socket.disconnect();
  localStorage.clear();
  location.reload();
};

/* ============ INIT ============ */
async function startApp() {
  authScreen.style.display = 'none';
  appScreen.style.display = 'flex';
  
  // Show Team Selector
  document.getElementById('teamSelector').style.display = 'block';
  document.getElementById('currentTeamName').textContent = TEAM_NAME;
  document.getElementById('teamIdDisplay').textContent = TEAM_ID || 'No Team Joined';

  const av = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.name)}`;
  document.getElementById('userBadge').innerHTML =
    `<img src="${av}" alt="" /> <span>${escapeHtml(currentUser.name)}</span>`;
    
  // Agar pehli baar login kiya hai aur koi team nahi hai, toh modal open karo
  if (!TEAM_ID) {
    openTeamModal();
    // Make board empty and return
    tasks = [];
    renderBoard();
    return;
  }

  initSocket();
  loadTasks();
  loadTeam();
  requestNotificationPermission();
}

if (token && currentUser) startApp();

/* ============ NAV ============ */
function switchTab(tab) {
  document.querySelectorAll('.nav-btn, .bn-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  if (tab === 'analytics') setTimeout(drawCharts, 50);
}
document.querySelectorAll('.nav-btn, .bn-btn').forEach(btn => {
  btn.onclick = () => switchTab(btn.dataset.tab);
});

/* ============ NOTIFICATIONS ============ */
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
function notify(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: 'https://api.dicebear.com/7.x/avataaars/svg?seed=x' });
  }
}
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 800; gain.gain.value = 0.05;
    osc.start(); osc.stop(ctx.currentTime + 0.1);
  } catch {}
}

/* ============ SOCKET ============ */
function initSocket() {
  socket = io(SOCKET_URL);
  socket.emit('join:team', { teamId: TEAM_ID, userId: currentUser.id });

  socket.on('task:created', (t) => {
    if (t.teamId !== TEAM_ID) return; // Ignore other team tasks
    if (!tasks.find(x => x._id === t._id)) tasks.push(t);
    renderBoard(); toast('New task added!', 'success'); beep();
  });
  socket.on('task:updated', (t) => {
    if (t.teamId !== TEAM_ID) return;
    const i = tasks.findIndex(x => x._id === t._id);
    if (i >= 0) tasks[i] = t; else tasks.push(t);
    renderBoard();
  });
  socket.on('task:deleted', (id) => {
    tasks = tasks.filter(t => t._id !== id);
    renderBoard();
  });
  socket.on('chat:message', (msg) => {
    const isMine = msg.senderName === currentUser.name;
    addChatMessage('chatMessages', msg.senderName, msg.text, isMine ? 'mine' : 'other');
    if (!isMine) { notify(`${msg.senderName}`, msg.text); beep(); }
  });

  loadMessages();
}

async function loadMessages() {
  // 👇 URL me /chat/${TEAM_ID} use kiya hai
  const res = await fetch(`${API}/chat/${TEAM_ID}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.ok) {
    const msgs = await res.json();
    msgs.forEach(m => {
      const isMine = m.senderName === currentUser.name;
      addChatMessage('chatMessages', m.senderName, m.text, isMine ? 'mine' : 'other');
    });
  }
}

/* ============ TASKS ============ */
async function loadTasks() {
  // 👇 URL me ?teamId=${TEAM_ID} add kiya hai (Security check ke liye)
  const res = await fetch(`${API}/tasks?teamId=${TEAM_ID}`, { 
    headers: { Authorization: `Bearer ${token}` } 
  });
  if (res.ok) { tasks = await res.json(); renderBoard(); }
  else if (res.status === 403) {
    toast('Access Denied to this team', 'error');
  }
}

function getFilteredTasks() {
  if (!searchQuery) return tasks;
  const q = searchQuery.toLowerCase();
  return tasks.filter(t =>
    (t.title || '').toLowerCase().includes(q) ||
    (t.description || '').toLowerCase().includes(q) ||
    (t.tags || []).some(tag => tag.toLowerCase().includes(q))
  );
}

function renderBoard() {
  const filtered = getFilteredTasks();
  ['todo', 'progress', 'done'].forEach(status => {
    const col = document.getElementById(`col-${status}`);
    if (!col) return;
    col.innerHTML = '';
    const items = filtered.filter(t => t.status === status);
    document.getElementById(`count-${status}`).textContent = items.length;
    items.forEach(t => col.appendChild(makeCard(t)));
  });

  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('boardMeta').textContent =
    `${done}/${total} completed · ${pct}% done`;
}

function makeCard(t) {
  const card = document.createElement('div');
  card.className = `task-card ${t.priority}`;
  card.draggable = true;
  card.dataset.id = t._id;
  card.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', t._id);
    card.classList.add('dragging');
  });
  card.addEventListener('dragend', () => card.classList.remove('dragging'));

  let dueHtml = '';
  if (t.dueDate) {
    const d = new Date(t.dueDate);
    const now = new Date();
    const days = Math.ceil((d - now) / 86400000);
    const cls = days < 0 ? 'overdue' : days <= 2 ? 'soon' : '';
    const label = days < 0 ? `⚠️ Overdue` : days === 0 ? '📅 Today' : `📅 ${days}d left`;
    dueHtml = `<span class="due ${cls}">${label}</span>`;
  }

  const tagsHtml = (t.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('');

  card.innerHTML = `
    <h5>${escapeHtml(t.title)}</h5>
    ${t.description ? `<p>${escapeHtml(t.description)}</p>` : ''}
    ${tagsHtml ? `<div class="task-tags">${tagsHtml}</div>` : ''}
    <div class="task-meta">${dueHtml}<span class="muted">${t.priority}</span></div>
    <div class="task-actions">
      <button onclick="moveTask('${t._id}','todo')">Todo</button>
      <button onclick="moveTask('${t._id}','progress')">Active</button>
      <button onclick="moveTask('${t._id}','done')">Done</button>
      <button class="del" onclick="deleteTask('${t._id}')">✕</button>
    </div>`;
  return card;
}

window.moveTask = async (id, status) => {
  await fetch(`${API}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status })
  });
};

window.deleteTask = async (id) => {
  if (!confirm('Delete this task?')) return;
  await fetch(`${API}/tasks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  toast('Task deleted', 'success');
};

/* ============ DRAG & DROP ============ */
document.querySelectorAll('.column').forEach(col => {
  col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('drag-over'); });
  col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
  col.addEventListener('drop', (e) => {
    e.preventDefault();
    col.classList.remove('drag-over');
    const id = e.dataTransfer.getData('text/plain');
    const status = col.querySelector('.cards').dataset.status;
    moveTask(id, status);
  });
});

/* ============ SEARCH ============ */
document.getElementById('searchInput').oninput = (e) => {
  searchQuery = e.target.value;
  renderBoard();
};

/* ============ TASK MODAL ============ */
const taskModal = document.getElementById('taskModal');
document.getElementById('addTaskBtn').onclick = () => {
  if (!TEAM_ID) return toast('Join a team first!', 'error');
  taskModal.classList.add('active');
  setTimeout(() => document.getElementById('tTitle').focus(), 100);
};
window.closeTaskModal = () => taskModal.classList.remove('active');

document.getElementById('saveTask').onclick = async () => {
  const title = document.getElementById('tTitle').value.trim();
  if (!title) return toast('Title required', 'error');
  const body = {
    title,
    description: document.getElementById('tDesc').value,
    priority: document.getElementById('tPriority').value,
    status: document.getElementById('tStatus').value,
    tags: document.getElementById('tTags').value.split(',').map(s => s.trim()).filter(Boolean),
    dueDate: document.getElementById('tDue').value || null,
    teamId: TEAM_ID
  };
  const res = await fetch(`${API}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  if (res.ok) {
    taskModal.classList.remove('active');
    document.getElementById('tTitle').value = '';
    document.getElementById('tDesc').value = '';
    document.getElementById('tTags').value = '';
    document.getElementById('tDue').value = '';
    toast('Task created! ✨', 'success');
  }
};

/* ============ CHAT ============ */
document.getElementById('sendChatBtn').onclick = () => {
  if (!TEAM_ID) return toast('Join a team first!', 'error');
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  socket.emit('chat:message', {
    teamId: TEAM_ID,
    senderId: currentUser.id,
    senderName: currentUser.name,
    text
  });
  input.value = '';
};
document.getElementById('chatInput').onkeydown = (e) => {
  if (e.key === 'Enter') document.getElementById('sendChatBtn').click();
};

function addChatMessage(cid, sender, text, cls) {
  const container = document.getElementById(cid);
  const div = document.createElement('div');
  div.className = `msg ${cls}`;
  
  // Markdown Bold support
  const formattedText = escapeHtml(text).replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  
  div.innerHTML = `<span class="name">${escapeHtml(sender || '')}</span>${formattedText}`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

/* ============ AI ============ */
window.quickPrompt = (text) => {
  document.getElementById('aiInput').value = text;
  document.getElementById('sendAiBtn').click();
};
document.getElementById('sendAiBtn').onclick = async () => {
  const input = document.getElementById('aiInput');
  const message = input.value.trim();
  if (!message) return;
  addChatMessage('aiMessages', 'You', message, 'mine');
  input.value = '';
  try {
    const res = await fetch(`${API}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message })
    });
    const data = await res.json();
    addChatMessage('aiMessages', '🤖 Assistant', data.reply, 'bot');
  } catch {
    addChatMessage('aiMessages', '🤖 Assistant', 'Connection error.', 'bot');
  }
};
document.getElementById('aiInput').onkeydown = (e) => {
  if (e.key === 'Enter') document.getElementById('sendAiBtn').click();
};

/* ============ TEAM ============ */
async function loadTeam() {
  if (!TEAM_ID) return;
  // 👇 API endpoint changed
  const res = await fetch(`${API}/team/${TEAM_ID}/members`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return;
  const members = await res.json();
  const grid = document.getElementById('teamGrid');
  grid.innerHTML = members.map(m => `
    <div class="team-card">
      <img src="${m.avatar}" alt="" />
      <h5>${escapeHtml(m.name)}</h5>
      <p>${escapeHtml(m.email)}</p>
    </div>`).join('');
}

/* ============ ANALYTICS (Pure Canvas) ============ */
function drawCharts() {
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const progress = tasks.filter(t => t.status === 'progress').length;
  const todo = tasks.filter(t => t.status === 'todo').length;
  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length;

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statDone').textContent = done;
  document.getElementById('statProgress').textContent = progress;
  document.getElementById('statOverdue').textContent = overdue;

  const css = getComputedStyle(document.documentElement);
  const text = css.getPropertyValue('--text').trim() || '#e2e8f0';

  const pie = document.getElementById('chartPie');
  if (pie) {
    const ctx = pie.getContext('2d');
    ctx.clearRect(0, 0, 300, 300);
    const data = [
      { v: todo, c: '#64748b' },
      { v: progress, c: '#f59e0b' },
      { v: done, c: '#22c55e' }
    ];
    const sum = data.reduce((a, b) => a + b.v, 0) || 1;
    let start = -Math.PI / 2;
    data.forEach(d => {
      const angle = (d.v / sum) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(150, 150);
      ctx.arc(150, 150, 100, start, start + angle);
      ctx.closePath();
      ctx.fillStyle = d.c;
      ctx.fill();
      start += angle;
    });
    ctx.beginPath();
    ctx.arc(150, 150, 60, 0, Math.PI * 2);
    ctx.fillStyle = css.getPropertyValue('--surface').trim() || '#1e293b';
    ctx.fill();
    ctx.fillStyle = text;
    ctx.font = 'bold 24px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(total, 150, 150);
    ctx.font = '12px system-ui';
    ctx.fillText('Total', 150, 168);
  }

  const bar = document.getElementById('chartBar');
  if (bar) {
    const ctx = bar.getContext('2d');
    ctx.clearRect(0, 0, 600, 200);
    const prios = [
      { l: 'Low', v: tasks.filter(t => t.priority === 'low').length, c: '#22c55e' },
      { l: 'Medium', v: tasks.filter(t => t.priority === 'medium').length, c: '#f59e0b' },
      { l: 'High', v: tasks.filter(t => t.priority === 'high').length, c: '#ef4444' }
    ];
    const max = Math.max(...prios.map(p => p.v), 1);
    prios.forEach((p, i) => {
      const x = 60 + i * 170;
      const h = (p.v / max) * 140;
      ctx.fillStyle = p.c;
      ctx.fillRect(x, 180 - h, 120, h);
      ctx.fillStyle = text;
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(p.v, x + 60, 175 - h);
      ctx.font = '13px system-ui';
      ctx.fillText(p.l, x + 60, 198);
    });
  }
}

/* ============ CONTACT ============ */
document.getElementById('contactForm').onsubmit = async (e) => {
  e.preventDefault();
  const body = {
    name: document.getElementById('cName').value,
    email: document.getElementById('cEmail').value,
    subject: document.getElementById('cSubject').value,
    message: document.getElementById('cMessage').value
  };
  const res = await fetch(`${API}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const status = document.getElementById('contactStatus');
  if (res.ok) {
    status.textContent = "✅ Message sent! We'll reply soon.";
    status.style.color = 'var(--success)';
    e.target.reset();
    toast('Message sent!', 'success');
  } else {
    status.textContent = '❌ Failed. Try again.';
    status.style.color = 'var(--danger)';
  }
};

/* ============ KEYBOARD SHORTCUTS ============ */
document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea, select')) {
    if (e.key === 'Escape') e.target.blur();
    return;
  }
  if (e.key === 'n' || e.key === 'N') { e.preventDefault(); document.getElementById('addTaskBtn').click(); }
  if (e.key === '/') { e.preventDefault(); document.getElementById('searchInput').focus(); }
  if (e.key === 'Escape') closeTaskModal();
});

/* ============ UTIL ============ */
function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/* ============ SERVICE WORKER (offline) ============ */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
