-- 1. 用户
CREATE TABLE users (
  id               UUID PRIMARY KEY,
  email            TEXT UNIQUE,
  display_name     TEXT,
  password_hash    TEXT,
  elo              INT  NOT NULL DEFAULT 1000,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 游戏房间
CREATE TYPE witness_side AS ENUM ('HUMAN', 'AI');
CREATE TYPE game_status  AS ENUM ('WAITING', 'CHAT', 'JUDGED', 'ENDED');

CREATE TABLE games (
  id                   UUID PRIMARY KEY,
  interrogator_id      UUID NOT NULL REFERENCES users(id),
  witness_human_id     UUID REFERENCES users(id),
  witness_ai           BOOLEAN NOT NULL DEFAULT FALSE,
  side                 witness_side NOT NULL DEFAULT 'AI',
  status               game_status  NOT NULL DEFAULT 'WAITING',
  started_at           TIMESTAMPTZ,
  ended_at             TIMESTAMPTZ,
  success              BOOLEAN,
  CONSTRAINT chk_witness CHECK (
        (witness_ai AND side = 'AI' AND witness_human_id IS NULL)
    OR  (NOT witness_ai AND side = 'HUMAN' AND witness_human_id IS NOT NULL)
  )
);

-- 3. 消息
CREATE TYPE sender_role AS ENUM ('I','A','H');
CREATE TABLE messages (
  id         BIGSERIAL PRIMARY KEY,
  game_id    UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  sender     sender_role NOT NULL,
  body       TEXT        NOT NULL,
  ts         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_messages_game_ts ON messages(game_id, ts);

-- 4. 审讯者猜测
CREATE TABLE guesses (
  game_id    UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  interrogator_id UUID NOT NULL REFERENCES users(id),
  suspect_ai BOOLEAN NOT NULL,           -- TRUE = 认为 A 是 AI
  guessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (game_id, interrogator_id)
);

-- 5. 玩家累积数据（可用物化视图代替）
CREATE TABLE player_stats (
  user_id        UUID PRIMARY KEY REFERENCES users(id),
  total_games    INT  DEFAULT 0,
  success_rate   NUMERIC(5,2) DEFAULT 0,  -- %
  elo            INT
);
