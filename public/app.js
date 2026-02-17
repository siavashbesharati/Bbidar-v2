const tenantInput = document.getElementById('tenantId');
const connectBtn = document.getElementById('connectBtn');
const aiToggleBtn = document.getElementById('aiToggleBtn');
const qrWrap = document.getElementById('qrWrap');
const qrImage = document.getElementById('qrImage');
const sessionMeta = document.getElementById('sessionMeta');
const connectionHint = document.getElementById('connectionHint');
const groupsHint = document.getElementById('groupsHint');
const groupsBox = document.getElementById('groups');

let currentSessionId = null;
let aiEnabled = false;
let statusTimer = null;

function qrUrlFromText(text) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
}

async function connectTenant() {
  const tenantId = tenantInput.value.trim();
  if (!tenantId) return;

  connectBtn.disabled = true;
  groupsBox.innerHTML = '';
  groupsHint.textContent = 'Waiting for WhatsApp connection before loading groups...';

  const res = await fetch(`/api/tenants/${tenantId}/sessions/connect`, { method: 'POST' });
  const session = await res.json();

  currentSessionId = session.id;
  sessionMeta.textContent = `Session: ${session.id} | Status: ${session.status}`;
  connectionHint.textContent = 'Scan the QR code with WhatsApp to finish connection.';
  aiToggleBtn.disabled = true;

  if (session.qr) {
    qrImage.src = qrUrlFromText(session.qr);
    qrWrap.hidden = false;
  }

  startPollingSession();
}

function startPollingSession() {
  if (statusTimer) clearInterval(statusTimer);

  statusTimer = setInterval(async () => {
    const tenantId = tenantInput.value.trim();
    if (!tenantId || !currentSessionId) return;

    const res = await fetch(`/api/tenants/${tenantId}/sessions/${currentSessionId}`);
    if (!res.ok) return;

    const session = await res.json();
    sessionMeta.textContent = `Session: ${session.id} | Status: ${session.status}`;

    if (session.qr) {
      qrImage.src = qrUrlFromText(session.qr);
      qrWrap.hidden = false;
    }

    if (session.status === 'connected') {
      clearInterval(statusTimer);
      statusTimer = null;
      qrWrap.hidden = true;
      connectionHint.textContent = 'Connected successfully. You can now enable AI mode and manage groups.';
      aiToggleBtn.disabled = false;
      connectBtn.disabled = false;
      await loadGroups();
    }

    if (session.status === 'logged_out' || session.status === 'error') {
      clearInterval(statusTimer);
      statusTimer = null;
      connectionHint.textContent = `Connection stopped: ${session.status}`;
      connectBtn.disabled = false;
    }
  }, 2000);
}

async function toggleAiMode() {
  const tenantId = tenantInput.value.trim();
  if (!tenantId || !currentSessionId) return;

  aiEnabled = !aiEnabled;
  const res = await fetch(`/api/tenants/${tenantId}/sessions/${currentSessionId}/ai-mode`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: aiEnabled })
  });

  const session = await res.json();
  aiToggleBtn.textContent = session.aiModeEnabled ? 'Disable AI Mode' : 'Enable AI Mode (Gemini)';
}

async function loadGroups() {
  const tenantId = tenantInput.value.trim();
  const res = await fetch(`/api/tenants/${tenantId}/groups`);
  const groups = await res.json();

  groupsHint.textContent = groups.length ? 'Connected groups:' : 'No groups found for this tenant yet.';
  groupsBox.innerHTML = groups
    .map(
      (group) => `
      <article class="group-card">
        <h3>${group.name}</h3>
        <p class="muted">${group.memberCount} members</p>
        <a href="/api/tenants/${tenantId}/groups/${group.id}/members.csv">Download members CSV</a>
      </article>
    `
    )
    .join('');
}

connectBtn.addEventListener('click', connectTenant);
aiToggleBtn.addEventListener('click', toggleAiMode);
