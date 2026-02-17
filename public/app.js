const tenantInput = document.getElementById('tenantId');
const connectBtn = document.getElementById('connectBtn');
const aiToggleBtn = document.getElementById('aiToggleBtn');
const qrBox = document.getElementById('qrBox');
const sessionMeta = document.getElementById('sessionMeta');
const groupsBox = document.getElementById('groups');

let currentSessionId = null;
let aiEnabled = false;

async function connectTenant() {
  const tenantId = tenantInput.value.trim();
  if (!tenantId) return;

  const res = await fetch(`/api/tenants/${tenantId}/sessions/connect`, { method: 'POST' });
  const session = await res.json();

  currentSessionId = session.id;
  sessionMeta.textContent = `Session: ${session.id} | Status: ${session.status}`;
  qrBox.textContent = session.qr || 'Scan QR from real Baileys connection.';
  aiToggleBtn.disabled = false;

  await loadGroups();
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
