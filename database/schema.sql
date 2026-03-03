-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('user', 'admin')) DEFAULT 'user',
  is_online BOOLEAN DEFAULT 0,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Notificações
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  recipient_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  original_language TEXT DEFAULT 'pt-BR',
  is_read BOOLEAN DEFAULT 0,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(sender_id) REFERENCES users(id),
  FOREIGN KEY(recipient_id) REFERENCES users(id)
);

-- Tabela de Comprovantes de Leitura (Read Receipts)
CREATE TABLE IF NOT EXISTS read_receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_id INTEGER UNIQUE NOT NULL,
  recipient_id INTEGER NOT NULL,
  read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(notification_id) REFERENCES notifications(id),
  FOREIGN KEY(recipient_id) REFERENCES users(id)
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender ON notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_read_receipts_recipient ON read_receipts(recipient_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
