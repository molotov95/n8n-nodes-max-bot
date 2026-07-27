# Память, сессии и контроль доступа для MAX-бота

## Архитектура

```
Пользователь → MAX → n8n (polling)
                         │
                    ┌────▼────┐
                    │ Проверка │  ← PostgreSQL: trusted_users
                    │ свой/чужой│
                    └──┬───┬──┘
                  НЕТ  │   │  ДА
              ┌────────▼─┐ ┌─▼─────────┐
              │ Запросить │ │ Загрузить  │  ← PostgreSQL: bot_sessions (JSONB)
              │  доступ   │ │ контекст   │
              └───────────┘ └──┬─────────┘
                              ┌─▼──────────┐
                              │ llama.cpp  │  ← полная история диалога
                              │ /v1/chat   │
                              └──┬─────────┘
                              ┌──▼──────────┐
                              │ Сохранить   │  ← UPSERT сессии
                              │ сессию      │
                              └──┬──────────┘
                              ┌──▼──────────┐
                              │ Ответ       │
                              │ пользователю│
                              └─────────────┘
```

## Этап 1: PostgreSQL + инициализация

### 1.1 Создать docker-compose.yml и init.sql

Скопируй файлы с локальной машины на сервер:

```bash
# На локальной машине (PowerShell)
scp n8n-nodes-max-bot\docker\compose.yml user@109.248.135.183:/home/anton/n8n/docker-compose.yml
scp n8n-nodes-max-bot\docker\init.sql user@109.248.135.183:/home/anton/n8n/init.sql
```

### 1.2 Пересоздать контейнеры

```bash
cd ~/n8n
docker compose down
docker compose up -d
docker compose ps
# Должны быть видны n8n и postgres
```

### 1.3 Проверить Postgres

```bash
# Проверить, что база создалась и таблицы есть
docker exec -it n8n-postgres psql -U n8n -d n8n -c "\dt"
# Должны быть: bot_sessions, trusted_users
```

---

## Этап 2: Workflow "Память + контроль доступа"

Создай новый workflow в n8n. Вот пошагово каждая нода.

### 2.1 Нода: MAX Bot Trigger Polling

Events: `message_created`, `message_callback`
Poll Interval: `5`

### 2.2 Нода: Postgres — Проверить доступ

Выбери PostgreSQL credential (создай: Host=`postgres`, Port=5432, DB=`n8n`, User=`n8n`, Password=`n8npass`).

Operation: `Execute Query`
Query:
```sql
SELECT * FROM trusted_users WHERE user_id = {{ $json.message.sender.user_id }} AND is_verified = true
```

### 2.3 Нода: IF — Свой или чужой

Type: `Boolean`
Value 1: `={{ $json.id }}`
Operation: `Exists`

### 2.4 Ветка ДА (свой): Нода Postgres — Загрузить контекст

Operation: `Execute Query`
Query:
```sql
SELECT messages FROM bot_sessions
WHERE chat_id = {{ $('MAX Bot Trigger Polling').item.json.message.recipient.chat_id }}
  AND user_id = {{ $('MAX Bot Trigger Polling').item.json.message.sender.user_id }}
```

### 2.5 Нода: Code — Собрать контекст

Mode: `Run Once for All Items`
Language: `JavaScript`

```javascript
const triggerNode = $('MAX Bot Trigger Polling');
const userMessage = triggerNode.first().json.message.body.text;
const senderId = triggerNode.first().json.message.sender.user_id;

// Старые сообщения из сессии (если есть)
let oldMessages = [];
const sessionRows = $input.all();
if (sessionRows.length > 0 && sessionRows[0].json.messages) {
  try {
    oldMessages = typeof sessionRows[0].json.messages === 'string'
      ? JSON.parse(sessionRows[0].json.messages)
      : sessionRows[0].json.messages;
  } catch (e) {
    oldMessages = [];
  }
}

// Системный промпт
const systemPrompt = {
  role: 'system',
  content: 'Ты — AI CityDrive Helper. Отвечай кратко, по делу и на русском языке.'
};

// Держим последние 20 сообщений (≈ контекстное окно)
if (oldMessages.length > 20) {
  oldMessages = oldMessages.slice(oldMessages.length - 20);
}

// Собираем итоговый массив
const fullMessages = [systemPrompt, ...oldMessages, { role: 'user', content: userMessage }];

return [{
  json: {
    messages: fullMessages,
    userMessage: userMessage,
    senderId: senderId,
    oldMessages: oldMessages
  }
}];
```

### 2.6 Нода: HTTP Request — llama.cpp

Method: `POST`
URL: `http://192.168.1.127:8081/v1/chat/completions`
Send Body: ✅

Body (JSON):
```json
{
  "messages": {{ JSON.stringify($json.messages) }},
  "temperature": 0.7,
  "max_tokens": 500
}
```

### 2.7 Нода: Code — Обновить сессию

Mode: `Run Once for All Items`
Language: `JavaScript`

```javascript
const prevNode = $input.first().json;
const codeNode = $('Code_SessionContext').first().json;  // замени на реальное имя ноды 2.5

const aiReply = prevNode.choices[0].message.content;
const userMessage = codeNode.userMessage;
const oldMessages = codeNode.oldMessages || [];
const senderId = codeNode.senderId;
const chatId = $('MAX Bot Trigger Polling').first().json.message.recipient.chat_id;

// Добавляем в историю
const updatedMessages = [
  ...oldMessages,
  { role: 'user', content: userMessage },
  { role: 'assistant', content: aiReply }
];

// Считаем примерное кол-во токенов
const contextTokens = JSON.stringify(updatedMessages).length / 4;

return [{
  json: {
    chat_id: chatId,
    user_id: senderId,
    messages: updatedMessages,
    context_tokens: Math.round(contextTokens),
    aiReply: aiReply
  }
}];
```

### 2.8 Нода: Postgres — Сохранить сессию

Operation: `Execute Query`
Query:
```sql
INSERT INTO bot_sessions (chat_id, user_id, messages, context_tokens, updated_at)
VALUES ({{ $json.chat_id }}, {{ $json.user_id }}, '{{ JSON.stringify($json.messages).replace(/'/g, "''") }}', {{ $json.context_tokens }}, NOW())
ON CONFLICT (chat_id, user_id)
DO UPDATE SET messages = '{{ JSON.stringify($json.messages).replace(/'/g, "''") }}', context_tokens = {{ $json.context_tokens }}, updated_at = NOW()
```

### 2.9 Нода: MAX Bot — Ответить

Resource: `Message`
Operation: `Send to User`
User ID: `={{ $('Code_SessionSave').item.json.user_id }}` (замени на имя ноды 2.7)
Text: `={{ $('Code_SessionSave').item.json.aiReply }}`

### 2.10 Ветка НЕТ (чужой): MAX Bot — Запросить доступ

Resource: `Message`
Operation: `Send to User`
User ID: `={{ $('MAX Bot Trigger Polling').item.json.message.sender.user_id }}`
Text: `У вас нет доступа к боту. Заявка на доступ отправлена администратору.`

Additional Options:
Inline Keyboard:
```json
[[{"type": "callback", "text": "Запросить доступ", "payload": "request_access"}]]
```

### 2.11 Нода (чужой): Postgres — Сохранить заявку

Operation: `Execute Query`
Query:
```sql
INSERT INTO trusted_users (user_id, first_name, username, access_level, is_verified)
VALUES (
  {{ $('MAX Bot Trigger Polling').item.json.message.sender.user_id }},
  '{{ $('MAX Bot Trigger Polling').item.json.message.sender.first_name }}',
  '{{ $('MAX Bot Trigger Polling').item.json.message.sender.username }}',
  'user',
  false
)
ON CONFLICT (user_id) DO NOTHING
```

---

## Этап 3: Одобрение пользователей (через callback)

### 3.1 Обработка callback "request_access"

В том же workflow добавь ещё одну ветку от триггера:

После **MAX Bot Trigger Polling** добавь:

**IF: message_callback**

Type: `String`
Value 1: `={{ $json.update_type }}`
Operation: `Equals`
Value 2: `message_callback`

**Ветка ДА:**

**Code: Обработать callback**

```javascript
const payload = $input.first().json.callback.payload;
const userId = $input.first().json.callback.user.user_id;

if (payload === 'request_access') {
  return [{
    json: {
      action: 'approve',
      user_id: userId,
      message: 'Заявка одобрена. Теперь вы можете пользоваться ботом.'
    }
  }];
}

return [{ json: { action: 'unknown' } }];
```

**Postgres: Одобрить**

```sql
UPDATE trusted_users
SET is_verified = true, verified_at = NOW()
WHERE user_id = {{ $json.user_id }}
```

**MAX Bot: Уведомить**

User ID: `={{ $json.user_id }}`
Text: `Доступ одобрен! Теперь вы можете общаться с ботом.`

### 3.2 Ручное одобрение (через SQL)

```bash
# Просмотреть неподтверждённых пользователей
docker exec -it n8n-postgres psql -U n8n -d n8n -c "SELECT * FROM trusted_users WHERE is_verified = false;"

# Одобрить пользователя
docker exec -it n8n-postgres psql -U n8n -d n8n -c "UPDATE trusted_users SET is_verified = true, verified_at = NOW() WHERE user_id = 370804869;"
```

---

## Этап 4: Управление контекстом

### Очистка сессии пользователя

```bash
docker exec -it n8n-postgres psql -U n8n -d n8n -c "DELETE FROM bot_sessions WHERE user_id = 370804869;"
```

### Просмотр всех сессий

```bash
docker exec -it n8n-postgres psql -U n8n -d n8n -c "SELECT chat_id, user_id, context_tokens, updated_at FROM bot_sessions;"
```
