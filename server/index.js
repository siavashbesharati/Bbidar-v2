const express = require('express');
const cors = require('cors');
const path = require('path');
const store = require('./store');
const whatsappManager = require('./whatsappManager');
const aiService = require('./aiService');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

app.post('/api/tenants/:tenantId/sessions/connect', async (req, res) => {
  const { tenantId } = req.params;
  const session = store.createSession(tenantId);

  try {
    await whatsappManager.createClient({
      tenantId,
      sessionId: session.id,
      onQr: (qr) => store.updateSession(tenantId, session.id, { qr, status: 'pending_qr' }),
      onOpen: () => store.updateSession(tenantId, session.id, { status: 'connected', qr: null }),
      onClose: (reason) => store.updateSession(tenantId, session.id, { status: reason }),
      onMessage: async ({ remoteJid, msg, sock }) => {
        const current = store.getSession(tenantId, session.id);
        if (!current?.aiModeEnabled) return;

        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        if (!text) return;

        const reply = await aiService.generateReply({ text, tenantId });
        await sock.sendMessage(remoteJid, { text: reply });
      }
    });
  } catch (error) {
    store.updateSession(tenantId, session.id, { status: 'error', error: error.message });
  }

  res.status(201).json(session);
});

app.get('/api/tenants/:tenantId/sessions/:sessionId', (req, res) => {
  const { tenantId, sessionId } = req.params;
  const session = store.getSession(tenantId, sessionId);

  if (!session) return res.status(404).json({ message: 'Session not found' });
  return res.json(session);
});

app.patch('/api/tenants/:tenantId/sessions/:sessionId/ai-mode', (req, res) => {
  const { tenantId, sessionId } = req.params;
  const { enabled } = req.body;

  const session = store.updateSession(tenantId, sessionId, { aiModeEnabled: Boolean(enabled) });
  if (!session) return res.status(404).json({ message: 'Session not found' });

  return res.json(session);
});

app.get('/api/tenants/:tenantId/groups', (req, res) => {
  const tenant = store.ensureTenant(req.params.tenantId);
  const groups = tenant.groups.map((g) => ({
    id: g.id,
    name: g.name,
    memberCount: g.members.length
  }));

  return res.json(groups);
});

app.get('/api/tenants/:tenantId/groups/:groupId/members.csv', (req, res) => {
  const tenant = store.ensureTenant(req.params.tenantId);
  const group = tenant.groups.find((item) => item.id === req.params.groupId);

  if (!group) return res.status(404).json({ message: 'Group not found' });

  const csv = ['name,phone', ...group.members.map((m) => `${m.name},${m.phone}`)].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${group.id}-members.csv"`);
  return res.send(csv);
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Bbidar dashboard running on http://localhost:${port}`);
  });
}

module.exports = app;
