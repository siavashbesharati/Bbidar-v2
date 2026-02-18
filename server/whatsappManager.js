const path = require('path');
const fs = require('fs');
const { Boom } = require('@hapi/boom');
const P = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');

const logger = P({ level: 'silent' });

class WhatsAppManager {
  constructor() {
    this.clients = new Map();
  }

  async createClient({ tenantId, sessionId, onQr, onOpen, onClose, onMessage }) {
    const authDir = path.join(process.cwd(), 'baileys_sessions', tenantId, sessionId);
    fs.mkdirSync(authDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const sock = makeWASocket({
      logger,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger)
      },
      printQRInTerminal: false,
      browser: ['Bbidar Enterprise', 'Chrome', '1.0.0']
    });

    sock.ev.process(async (events) => {
      if (events['connection.update']) {
        const { connection, lastDisconnect, qr } = events['connection.update'];

        if (qr && onQr) await onQr(qr);

        if (connection === 'open' && onOpen) await onOpen();

        if (connection === 'close') {
          const statusCode =
            lastDisconnect?.error instanceof Boom ? lastDisconnect.error.output.statusCode : 0;

          if (statusCode !== DisconnectReason.loggedOut) {
            if (onClose) await onClose('reconnecting');
          } else if (onClose) {
            await onClose('logged_out');
          }
        }
      }

      if (events['creds.update']) {
        await saveCreds();
      }

      if (events['messages.upsert']) {
        const upsert = events['messages.upsert'];
        if (upsert.type !== 'notify') return;

        for (const msg of upsert.messages) {
          if (msg.key.fromMe || !msg.message) continue;
          const remoteJid = msg.key.remoteJid;
          if (onMessage) await onMessage({ remoteJid, msg, sock });
        }
      }
    });

    this.clients.set(sessionId, sock);
    return sock;
  }

  getClient(sessionId) {
    return this.clients.get(sessionId);
  }
}

module.exports = new WhatsAppManager();
