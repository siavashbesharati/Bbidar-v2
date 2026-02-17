const crypto = require('crypto');

const db = {
  tenants: new Map()
};

function ensureTenant(tenantId) {
  if (!db.tenants.has(tenantId)) {
    db.tenants.set(tenantId, {
      id: tenantId,
      sessions: new Map(),
      groups: [
        {
          id: 'grp-sales',
          name: 'Sales Team',
          members: [
            { phone: '+989121111111', name: 'Ali' },
            { phone: '+989121111112', name: 'Sara' }
          ]
        },
        {
          id: 'grp-support',
          name: 'Support Team',
          members: [
            { phone: '+989121111113', name: 'Mina' },
            { phone: '+989121111114', name: 'Reza' }
          ]
        }
      ]
    });
  }

  return db.tenants.get(tenantId);
}

function createSession(tenantId) {
  const tenant = ensureTenant(tenantId);
  const session = {
    id: crypto.randomUUID(),
    status: 'starting',
    qr: null,
    qrDataUrl: null,
    aiModeEnabled: false,
    aiProvider: 'gemini',
    createdAt: new Date().toISOString()
  };

  tenant.sessions.set(session.id, session);
  return session;
}

function getSession(tenantId, sessionId) {
  const tenant = ensureTenant(tenantId);
  return tenant.sessions.get(sessionId);
}

function updateSession(tenantId, sessionId, update) {
  const session = getSession(tenantId, sessionId);
  if (!session) return null;

  Object.assign(session, update);
  return session;
}

module.exports = {
  ensureTenant,
  createSession,
  getSession,
  updateSession
};
