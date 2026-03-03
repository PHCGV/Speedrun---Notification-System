const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH || './database/notifications.db';
const dbDir = path.dirname(dbPath);

// Try multiple possible schema paths
const possibleSchemaPaths = [
  path.join(__dirname, '../database/schema.sql'),
  path.join(process.cwd(), '../database/schema.sql'),
  '/app/database/schema.sql',
];

let schemaPath = null;
for (const possiblePath of possibleSchemaPaths) {
  if (fs.existsSync(possiblePath)) {
    schemaPath = possiblePath;
    break;
  }
}

if (!schemaPath) {
  console.error('Schema file not found at:', possibleSchemaPaths);
  throw new Error('Cannot find database schema.sql file');
}

// Garantir que o diretório de banco de dados existe
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Try to set journal mode, but don't fail if it doesn't work
try {
  db.pragma('journal_mode = DELETE');
} catch (error) {
  console.warn('⚠️  Could not set journal_mode, using defaults');
}

function initializeDatabase() {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").all();
    if (tables.length === 0) {
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        db.exec(schema);
        console.log('✓ Database schema created.');
  }

  // Ensure demo users exist even if the database already existed
  try {
    seedDatabase();
  } catch (err) {
    console.error('Erro ao inserir usuários de demo:', err);
  }
    }


function seedDatabase() {
    const users = [
        { username: 'admin', email: 'admin@notificacao.com', password: 'admin123', role: 'admin' },
        { username: 'user1', email: 'user1@notificacao.com', password: 'user123', role: 'user' },
        { username: 'user2', email: 'user2@notificacao.com', password: 'user123', role: 'user' }
    ];

    const insert = db.prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)');

    for (const user of users) {
        const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(user.username);
        if (!existingUser) {
            const passwordHash = bcrypt.hashSync(user.password, 10);
            insert.run(user.username, user.email, passwordHash, user.role);
        }
    }
    console.log('✓ Demo users created: admin, user1, user2');
}

// Initialize on load
initializeDatabase();

module.exports = db;
