# Документация n8n-nodes-max-bot

Пакет для интеграции [MAX Messenger Bot API](https://dev.max.ru/) с платформой автоматизации [n8n](https://n8n.io/).

---

## Содержание

1. [Обзор](#обзор)
2. [Установка и развёртывание](#установка-и-развёртывание)
3. [Настройка сертификатов (SSL)](#настройка-сертификатов-ssl)
4. [Credential](#credential)
5. [Нода MAX Bot — все операции](#нода-max-bot--все-операции)
6. [Нода MAX Bot Trigger (Webhook)](#нода-max-bot-trigger-webhook)
7. [Нода MAX Bot Trigger Polling](#нода-max-bot-trigger-polling)
8. [Webhook vs Polling — что выбрать](#webhook-vs-polling--что-выбрать)
9. [Примеры Workflow](#примеры-workflow)
10. [Устранение неполадок](#устранение-неполадок)
11. [Публикация](#публикация)

---

## Обзор

| Нода | Тип | Когда использовать |
|------|-----|-------------------|
| **MAX Bot** | Regular Node | Отправка сообщений, управление чатами, файлы, пины |
| **MAX Bot Trigger** | Webhook Trigger | Production — получение событий через webhook |
| **MAX Bot Trigger Polling** | Polling Trigger | Тестирование / нет внешнего доступа — опрос через GET /updates |

Одна **Credential** `MAX Bot API` для всех нод (токен бота + базовый URL).

---

## Установка и развёртывание

### Вариант 1: Docker (рекомендуемый)

```yaml
# docker-compose.yml
services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    volumes:
      - ./n8n-data:/home/node/.n8n
      # Сертификаты (опционально, см. раздел SSL)
      - ./certs:/certs:ro
    environment:
      - NODE_EXTRA_CA_CERTS=/certs/russian_bundle.crt
```

Установка ноды:

```bash
# Клонировать и собрать
git clone https://github.com/max-messenger/max-bot-api-client-ts.git
cd max-bot-api-client-ts/n8n-nodes-max-bot
npm install --ignore-scripts
npm run build
npm pack

# Установить в контейнер
docker cp n8n-nodes-max-bot-0.1.0.tgz n8n:/tmp/
docker exec -it n8n sh -c "mkdir -p /home/node/.n8n/custom && cd /home/node/.n8n/custom && npm install /tmp/n8n-nodes-max-bot-0.1.0.tgz"
docker restart n8n
```

### Вариант 2: Глобальная установка

```bash
cd ~/.n8n/custom
npm install n8n-nodes-max-bot
# Перезапустить n8n
```

---

## Настройка сертификатов (SSL)

API MAX (`platform-api2.max.ru`) использует сертификаты, подписанные **Минцифры России** (Russian Trusted Sub CA). Node.js в контейнерах n8n не доверяет им по умолчанию.

### Симптом проблемы

```
unable to get local issuer certificate
```

### Решение 1: Сертификаты Минцифры через volume (рекомендуется)

```bash
# 1. Создать папку для сертификатов
mkdir -p certs

# 2. Скопировать сертификаты
cp /usr/local/share/ca-certificates/russian_trusted_root_ca.crt certs/
cp /usr/local/share/ca-certificates/russian_trusted_sub_ca.crt certs/

# 3. Создать bundle (ВНИМАНИЕ: нужен перенос строки между сертификатами!)
cat certs/russian_trusted_root_ca.crt > certs/russian_bundle.crt
echo "" >> certs/russian_bundle.crt
cat certs/russian_trusted_sub_ca.crt >> certs/russian_bundle.crt

# 4. docker-compose.yml:
#    volumes:
#      - ./certs:/certs:ro
#    environment:
#      - NODE_EXTRA_CA_CERTS=/certs/russian_bundle.crt

docker compose down && docker compose up -d
```

**Важно:** ошибка `PEM routines::bad end line` означает, что между сертификатами в bundle-файле нет переноса строки. Используйте `echo "" >>` между `cat`.

### Решение 2: Использовать platform-api.max.ru (без «2»)

Старый endpoint НЕ требует сертификатов Минцифры. Просто смените **Base URL** в credential с `platform-api2.max.ru` на `platform-api.max.ru`.

### Решение 3: Отключить проверку сертификата (только для тестов)

Не рекомендуется для production.

```yaml
environment:
  - NODE_TLS_REJECT_UNAUTHORIZED=0
```

---

## Credential

| Поле | Значение | Описание |
|------|----------|----------|
| **Bot Token** | `ваш_токен` | Токен из раздела «Чат-боты» на платформе MAX |
| **Base URL** | `https://platform-api2.max.ru` | API endpoint (не менять без необходимости) |

---

## Нода MAX Bot — все операции

### Message

| Operation | Параметры | Примечание |
|-----------|-----------|-----------|
| Send to Chat | `chatId`, `text`, options (`format`, `linkMid`, `notify`, `inlineKeyboard`) | Отправка в чат |
| Send to User | `userId`, `text`, options | Отправка пользователю |
| Edit | `messageId`, `text`, options (`format`) | Редактирование сообщения |
| Delete | `messageId` | Удаление сообщения |
| Get | `messageId` | Получить сообщение по ID |
| Get Many | `chatId`, options (`from`, `to`, `count`, `messageIds`) | Список сообщений чата |

**Формат Inline Keyboard:**
```json
[[
  {"type": "callback", "text": "Да", "payload": "confirm_yes"},
  {"type": "callback", "text": "Нет", "payload": "confirm_no"}
],
[
  {"type": "link", "text": "Сайт", "url": "https://example.com"}
]]
```

### Chat

| Operation | Параметры |
|-----------|-----------|
| Get | `chatId` |
| Get by Link | `link` |
| List | `returnAll`, `limit`, `marker` |
| Edit | `chatId`, options (`title`) |
| Get Members | `chatId`, options (`userIds`, `count`, `marker`) |
| Add Members | `chatId`, `userIds` (comma-separated) |
| Remove Member | `chatId`, `userId` |
| Get Admins | `chatId` |
| Get Membership | `chatId` |

### File

| Operation | Параметры |
|-----------|-----------|
| Upload Image | `binaryPropertyName` |
| Upload Video | `binaryPropertyName` |
| Upload Audio | `binaryPropertyName` |
| Upload File | `binaryPropertyName` |

Файл передаётся через binary data (от HTTP Request, Read File и т.д.).

### Pin

| Operation | Параметры |
|-----------|-----------|
| Pin Message | `chatId`, `messageId`, options (`notify`) |
| Unpin Message | `chatId` |
| Get Pinned | `chatId` |

### Action

| Operation | Параметры |
|-----------|-----------|
| Send Typing | `chatId` |
| Leave Chat | `chatId` |

### Bot

| Operation | Параметры |
|-----------|-----------|
| Get Info | — |
| Set Commands | `commands` (JSON: `[{"name":"start","description":"..."}]`) |

---

## Нода MAX Bot Trigger (Webhook)

Для **production**-окружения. Требует, чтобы n8n был доступен из интернета на HTTPS.

### Webhook vs прямой IP

```
Пользователь → MAX → POST https://твой-сервер/webhook/... → n8n → workflow
```

- **Production**: MAX требует HTTPS на порту 443
- **Development**: разрешает HTTP (для туннелей)
- Если порт заблокирован ISP — используйте туннель

### Способы обеспечить внешний доступ

| Способ | Сложность | Надёжность |
|--------|-----------|------------|
| Белый IP + открытый порт | Низкая | Высокая |
| **serveo** (`ssh -R 80:localhost:7878 serveo.net`) | Низкая | Средняя |
| Cloudflare Tunnel | Средняя | Высокая |
| ngrok | Низкая | Средняя (может быть заблокирован) |
| localtunnel (`npx localtunnel --port 7878`) | Низкая | Средняя |

**Пример с serveo:**

```bash
# Терминал 1 (висит):
ssh -R 80:localhost:7878 serveo.net
# → https://xxxx.serveo.net

# docker-compose.yml:
#   - N8N_HOST=xxxx.serveo.net
#   - WEBHOOK_URL=https://xxxx.serveo.net
#   - N8N_PROTOCOL=https
```

### Параметры

| Параметр | Тип | Описание |
|----------|-----|----------|
| Events | multiSelect | События для подписки (13 типов) |
| Secret | string | Секрет для X-Max-Bot-Api-Secret |
| Environment | select | Production / Development |

### Поддерживаемые события

| Событие | Значение |
|---------|----------|
| Message Created | `message_created` |
| Message Callback | `message_callback` |
| Message Edited | `message_edited` |
| Message Removed | `message_removed` |
| Bot Started | `bot_started` |
| Bot Added | `bot_added` |
| Bot Removed | `bot_removed` |
| User Added | `user_added` |
| User Removed | `user_removed` |
| Chat Title Changed | `chat_title_changed` |
| Message Construction Request | `message_construction_request` |
| Message Constructed | `message_constructed` |
| Message Chat Created | `message_chat_created` |

### Жизненный цикл webhook

```
Активация workflow:
  1. n8n создаёт webhook URL
  2. Нода вызывает POST /subscriptions → регистрирует URL в MAX
  3. MAX начинает слать события на webhook

Деактивация workflow:
  1. Нода перестаёт отвечать 200
  2. MAX отписывает через ~8 часов недоступности
  3. При повторной активации — перерегистрирует
```

**Важно:** В логах при активации workflow должны быть сообщения о регистрации webhook. Если их нет — проверьте WEBHOOK_URL в docker-compose.

---

## Нода MAX Bot Trigger Polling

Для **тестирования** и ситуаций, когда сервер недоступен из интернета. Использует `GET /updates` (long polling).

**⚠️ Ограничения:** MAX не рекомендует polling для production. Медленнее webhook, события хранятся ограниченное время.

### Параметры

| Параметр | Тип | Описание |
|----------|-----|----------|
| Events | multiSelect | События (те же 13 типов) |
| Poll Interval | number | Интервал опроса в секундах (мин. 5) |
| Limit | number | Макс. событий за один опрос |

### Как работает

```
n8n (каждые N секунд) → GET /updates?types=...&marker=... → MAX
                                                              ↓
                                          { updates: [...], marker: 12345 }
```

Marker сохраняется в workflow static data — при перезапуске polling продолжается с того же места.

---

## Webhook vs Polling — что выбрать

| Критерий | Webhook | Polling |
|----------|---------|---------|
| Скорость | Мгновенно | До N секунд |
| Внешний доступ | **Требуется** | Не требуется |
| Рекомендация MAX | ✅ Да | ⚠️ Только для тестов |
| Надёжность | Высокая | Средняя |
| Настройка | Сложнее (туннель/порт) | Проще |

**Правило:** используйте **Webhook** для production, **Polling** для локального тестирования и разработки.

---

## Примеры Workflow

### 1. Простой автоответчик (Webhook + прямая связь)

```
[MAX Bot Trigger] → [MAX Bot: Send to User]
  Events: message_created   User ID: {{ $json.message.sender.user_id }}
  Environment: Production   Text: Спасибо за обращение!
```

### 2. ИИ-бот через llama.cpp (Polling + HTTP Request)

```
[MAX Bot Trigger Polling] → [HTTP Request: llama.cpp] → [MAX Bot: Send to User]
  Events: message_created     URL: http://192.168.1.127:8081/v1/chat/completions
  Interval: 5                 Body: {"messages":[...], "temperature":0.7}
                                                         ↓
                              User ID: {{ $('MAX Bot Trigger Polling').item.json.message.sender.user_id }}
                              Text: {{ $json.choices[0].message.content }}
```

### 3. Загрузка фото и отправка в чат

```
[HTTP Request: GET фото] → [MAX Bot: Upload Image] → [MAX Bot: Send to Chat]
  Response Format: File      Binary Property: data     Chat ID: 12345
                                                       Text: Фото отчёта
```

### 4. Уведомление о новом участнике

```
[MAX Bot Trigger] → [MAX Bot: Send to Chat]
  Events: user_added  Chat ID: {{ $json.chat_id }}
                      Text: {{ $json.user.name }} присоединился!
```

### 5. Обработка callback-кнопок

```
[MAX Bot Trigger] → [Switch: payload] → [MAX Bot: Send to User]
  Events: message_callback  ├─ confirm → Text: Подтверждено!
                            └─ cancel  → Text: Отменено
```

---

## Устранение неполадок

### Ошибка: unable to get local issuer certificate

Сертификат `platform-api2.max.ru` не доверяется. См. раздел [Настройка сертификатов](#настройка-сертификатов-ssl).

### Ошибка: PEM routines::bad end line

В bundle-файле нет переноса строки между сертификатами. Пересоздайте файл с `echo ""` между `cat`.

### Ошибка: 400 Bad Request (при отправке сообщения)

`Requires Node >= 18.18.0`. Серверная сборка (`npm install --ignore-scripts` + `npm run build`) обходит эту проблему.

### Ошибка: getaddrinfo EAI_AGAIN

DNS внутри контейнера не может разрешить домен. Проверьте:
```bash
docker exec n8n wget -qO- https://platform-api2.max.ru/me 2>&1 | head -5
```

### Нода не появляется в n8n

```bash
docker logs n8n 2>&1 | grep -i "max"
# Или проверьте:
docker exec n8n ls /home/node/.n8n/custom/node_modules/n8n-nodes-max-bot/dist/
```

### Trigger не срабатывает

```bash
# Проверить webhook URL
docker exec n8n wget -qO- http://localhost:5678/healthz

# Проверить внешний доступ
curl http://ТВОЙ_IP:7878/healthz

# Логи регистрации webhook
docker logs n8n 2>&1 | grep -i "subscript"
```

### Контейнер не видит llama.cpp

Если llama.cpp на хосте, а n8n в Docker:
- Вместо `localhost` используйте `host.docker.internal` или IP хоста (`192.168.1.127`)
- Проверьте: `docker exec n8n wget -qO- http://192.168.1.127:8081/v1/models`

---

## Публикация

### GitHub

Пакет готов к публикации на GitHub:

```bash
cd n8n-nodes-max-bot
git init
git add .
git commit -m "Initial release: n8n nodes for MAX Bot API"
git remote add origin https://github.com/ВАШ_АККАУНТ/n8n-nodes-max-bot.git
git push -u origin main
```

### npm

```bash
npm run build
npm publish --access public
```

**Требования для n8n community node:**
- [x] Имя пакета `n8n-nodes-max-bot`
- [x] `keywords` содержит `n8n-community-node-package`
- [x] Секция `n8n` в `package.json`
- [x] Нет runtime-зависимостей (кроме `n8n-workflow` peer)
- [x] README.md с документацией
- [x] LICENSE (MIT)
- [x] Сборка без ошибок

---

## Лицензия

MIT