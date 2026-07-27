-- Таблица сессий: хранит историю диалога пользователя в чате
CREATE TABLE IF NOT EXISTS bot_sessions (
    id SERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    context_tokens INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(chat_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_chat_user ON bot_sessions(chat_id, user_id);

-- Таблица доверенных пользователей
CREATE TABLE IF NOT EXISTS trusted_users (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    phone TEXT UNIQUE,
    first_name TEXT,
    username TEXT,
    access_level TEXT DEFAULT 'user',   -- 'user' | 'admin'
    is_verified BOOLEAN DEFAULT FALSE,
    verification_code TEXT,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trusted_user_id ON trusted_users(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_phone ON trusted_users(phone);
