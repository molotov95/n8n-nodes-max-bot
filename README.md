# n8n-nodes-max-bot

[![npm version](https://img.shields.io/npm/v/n8n-nodes-max-bot)](https://www.npmjs.com/package/n8n-nodes-max-bot)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

n8n community node for [MAX Messenger Bot API](https://dev.max.ru/). Send messages, manage chats, upload files, and receive events from MAX platform.

## Nodes

| Node | Type | Description |
|------|------|-------------|
| **MAX Bot** | Regular | 24 operations: messages, chats, files, pins, actions, bot management |
| **MAX Bot Trigger** | Webhook Trigger | Real-time events via webhook (production) |
| **MAX Bot Trigger Polling** | Polling Trigger | Event polling via `GET /updates` (testing / no external access) |

One **credential** for all nodes: `MAX Bot API` (token + base URL).

## Quick Start

### 1. Install via npm (recommended)

Open n8n → **Settings → Community Nodes → Install** → enter `n8n-nodes-max-bot` → Install.

### 2. Install via Docker

```bash
# Build
git clone https://github.com/max-messenger/max-bot-api-client-ts.git
cd n8n-nodes-max-bot
npm install --ignore-scripts && npm run build && npm pack

# Deploy to n8n container
docker cp n8n-nodes-max-bot-0.1.0.tgz n8n:/tmp/
docker exec -it n8n sh -c "mkdir -p /home/node/.n8n/custom && cd /home/node/.n8n/custom && npm install /tmp/n8n-nodes-max-bot-0.1.0.tgz"
docker restart n8n
```

### 3. Configure Credential

In n8n: **Credentials → + Add Credential → MAX Bot API**:

| Field | Value |
|-------|-------|
| Bot Token | Your bot token from MAX platform |
| Base URL | `https://platform-api2.max.ru` |

### 4. Test

Add **MAX Bot** node → Resource: `Message` → Operation: `Send to User` → User ID: `YOUR_ID` → Text: `Hello from n8n!` → **Test step**.

## SSL Certificates (Russian CA)

The `platform-api2.max.ru` endpoint uses certificates signed by **Russian Trusted Sub CA**. If you get `unable to get local issuer certificate`:

```bash
# 1. Copy your Russian CA certs to a volume
mkdir -p certs
cp russian_trusted_root_ca.crt certs/
cp russian_trusted_sub_ca.crt certs/

# 2. Create bundle (IMPORTANT: newline between certs!)
cat certs/russian_trusted_root_ca.crt > certs/russian_bundle.crt
echo "" >> certs/russian_bundle.crt
cat certs/russian_trusted_sub_ca.crt >> certs/russian_bundle.crt

# 3. docker-compose.yml:
#   volumes:
#     - ./certs:/certs:ro
#   environment:
#     - NODE_EXTRA_CA_CERTS=/certs/russian_bundle.crt

docker compose down && docker compose up -d
```

Alternatively, switch **Base URL** to `https://platform-api.max.ru` (no Russian CA needed) or use `NODE_TLS_REJECT_UNAUTHORIZED=0` for testing only.

## Webhook Setup

For production webhooks, MAX requires your n8n to be accessible from the internet via HTTPS. Options:

| Method | Command |
|--------|---------|
| Direct IP + open port | Open port in firewall/ufw |
| serveo (simplest) | `ssh -R 80:localhost:7878 serveo.net` |
| Cloudflare Tunnel | `cloudflared tunnel create n8n` |

Then configure docker-compose:
```yaml
environment:
  - N8N_HOST=your-domain.example.com
  - WEBHOOK_URL=https://your-domain.example.com
  - N8N_PROTOCOL=https
```

## Operations

### Message
`sendToChat`, `sendToUser`, `edit`, `delete`, `get`, `getMany` — with Markdown/HTML formatting, inline keyboards, reply links.

### Chat
`get`, `getByLink`, `list`, `edit`, `getMembers`, `addMembers`, `removeMember`, `getAdmins`, `getMembership`.

### File
`uploadImage`, `uploadVideo`, `uploadAudio`, `uploadFile` — via binary data from HTTP Request / Read File nodes.

### Pin / Action / Bot
`pin`, `unpin`, `getPinned`, `sendTyping`, `leaveChat`, `getInfo`, `setCommands`.

## Example: AI Bot with llama.cpp

```
[MAX Bot Trigger Polling]  →  [HTTP Request]  →  [MAX Bot: Send to User]
  Events: message_created       POST llama.cpp      User ID: {{ sender.user_id }}
  Interval: 5                   /v1/chat/completions    Text: {{ choices[0].message.content }}
```

See [DOCUMENTATION.md](DOCUMENTATION.md) for full Russian docs, workflow examples, and troubleshooting.

## Troubleshooting

| Error | Solution |
|-------|----------|
| `unable to get local issuer certificate` | [SSL section](#ssl-certificates-russian-ca) |
| `PEM routines::bad end line` | Add newline between certs in bundle |
| `400 Bad Request` | Update to latest version — `user_id`/`chat_id` must be query params |
| `getaddrinfo EAI_AGAIN` | DNS issue inside container — check connectivity |
| Node not appearing | Check `docker logs n8n` and `/home/node/.n8n/custom/` |

## Development

```bash
npm install --ignore-scripts
npm run build        # tsc + gulp
npm run lint         # eslint
npm test             # jest
```

## License

MIT © MAX Messenger