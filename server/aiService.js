class AiService {
  async generateReply({ text, tenantId }) {
    return `🤖 [Gemini:${tenantId}] پاسخ پیشنهادی: ${text}`;
  }
}

module.exports = new AiService();
