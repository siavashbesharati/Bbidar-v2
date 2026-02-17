# Bbidar Enterprise WhatsApp Dashboard (Starter)

This repository provides a **multi-tenant starter architecture** for your WhatsApp + AI platform using Baileys.

## What is included
- Multi-tenant session API (`tenantId` based).
- QR-based session bootstrapping endpoint with real QR image payload (`qrDataUrl`).
- AI mode toggle per WhatsApp session.
- Group listing endpoint.
- Group-member CSV export endpoint.
- Clean dashboard UI to manage all the above.

## Run locally
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

## Key APIs
- `POST /api/tenants/:tenantId/sessions/connect`
- `GET /api/tenants/:tenantId/sessions/:sessionId`
- `PATCH /api/tenants/:tenantId/sessions/:sessionId/ai-mode`
- `GET /api/tenants/:tenantId/groups`
- `GET /api/tenants/:tenantId/groups/:groupId/members.csv`

## Enterprise roadmap recommendations
1. Replace in-memory store with PostgreSQL + Redis.
2. Move Baileys socket handling to queue workers (BullMQ).
3. Add tenant auth (JWT + RBAC + API keys).
4. Add observability (OpenTelemetry, Prometheus, Grafana).
5. Add Gemini production adapter with retries and safety filters.
6. Add billing and usage metering per tenant.
7. Add webhook/event delivery for audit and integrations.

## Important note
The sample includes demo group data and a mock Gemini response formatter, but QR generation is real from Baileys `connection.update` events. The wiring is ready for real Gemini SDK integration where needed.
