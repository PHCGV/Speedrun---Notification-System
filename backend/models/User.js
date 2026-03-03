const db = require('../utils/database');
const bcrypt = require('bcryptjs');

class User {
  /**
   * Busca usuário por username
   */
  static findByUsername(username) {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  }

  /**
   * Busca usuário por ID
   */
  static findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }

  /**
   * Cria novo usuário
   */
  static create(username, email, password, role = 'user') {
    const passwordHash = bcrypt.hashSync(password, 10);
    
    try {
      const result = db.prepare(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)'
      ).run(username, email, passwordHash, role);
      
      return this.findById(result.lastInsertRowid);
    } catch (error) {
      throw new Error('Erro ao criar usuário: ' + error.message);
    }
  }

  /**
   * Valida senha
   */
  static verifyPassword(password, passwordHash) {
    return bcrypt.compareSync(password, passwordHash);
  }

  /**
   * Atualiza status online
   */
  static setOnlineStatus(userId, isOnline) {
    db.prepare('UPDATE users SET is_online = ?, last_activity = CURRENT_TIMESTAMP WHERE id = ?')
      .run(isOnline ? 1 : 0, userId);
  }

  /**
   * Lista todos os usuários (simples)
   */
  static listAll() {
    return db.prepare('SELECT id, username, role, is_online FROM users').all();
  }
}

module.exports = User;
