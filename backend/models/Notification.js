const db = require('../utils/database');
const { translateIfNeeded } = require('../utils/translator');

class Notification {
  /**
   * Cria nova notificação
   */
  static async create(senderId, recipientId, title, message) {
    const translation = await translateIfNeeded(message, 'pt-BR');
    
    try {
      const result = db.prepare(
        'INSERT INTO notifications (sender_id, recipient_id, title, message, original_language) VALUES (?, ?, ?, ?, ?)'
      ).run(senderId, recipientId, title, message, translation.language);
      
      return this.findById(result.lastInsertRowid);
    } catch (error) {
      throw new Error('Erro ao criar notificação: ' + error.message);
    }
  }

  /**
   * Busca notificação por ID
   */
  static findById(id) {
    return db.prepare(`
      SELECT n.*, 
             u1.username as sender_username,
             u2.username as recipient_username
      FROM notifications n
      JOIN users u1 ON n.sender_id = u1.id
      JOIN users u2 ON n.recipient_id = u2.id
      WHERE n.id = ?
    `).get(id);
  }

  /**
   * Busca notificações por usuário destinatário (com paginação)
   */
  static findByRecipient(recipientId, limit = 50, offset = 0) {
    return db.prepare(`
      SELECT n.*, 
             u1.username as sender_username,
             u2.username as recipient_username
      FROM notifications n
      JOIN users u1 ON n.sender_id = u1.id
      JOIN users u2 ON n.recipient_id = u2.id
      WHERE n.recipient_id = ?
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `).all(recipientId, limit, offset);
  }

  /**
   * Conta notificações não lidas
   */
  static countUnread(recipientId) {
    const result = db.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND is_read = 0'
    ).get(recipientId);
    
    return result.count;
  }

  /**
   * Marca notificação como lida e registra recebimento
   */
  static markAsRead(notificationId, recipientId) {
    const stmt = db.transaction(() => {
      // Atualizar notificação
      db.prepare(
        'UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(notificationId);
      
      // Registrar recebimento
      db.prepare(
        'INSERT OR IGNORE INTO read_receipts (notification_id, recipient_id) VALUES (?, ?)'
      ).run(notificationId, recipientId);
    });

    stmt();
  }

  /**
   * Busca histórico de notificações entre dois usuários
   */
  static findHistory(userId1, userId2, limit = 50) {
    return db.prepare(`
      SELECT n.*, 
             u1.username as sender_username,
             u2.username as recipient_username
      FROM notifications n
      JOIN users u1 ON n.sender_id = u1.id
      JOIN users u2 ON n.recipient_id = u2.id
      WHERE (n.sender_id = ? AND n.recipient_id = ?) 
         OR (n.sender_id = ? AND n.recipient_id = ?)
      ORDER BY n.created_at DESC
      LIMIT ?
    `).all(userId1, userId2, userId2, userId1, limit);
  }

  /**
   * Deleta notificação (apenas admin ou proprietário)
   */
  static delete(notificationId) {
    try {
      db.prepare('DELETE FROM read_receipts WHERE notification_id = ?').run(notificationId);
      db.prepare('DELETE FROM notifications WHERE id = ?').run(notificationId);
      return true;
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      return false;
    }
  }
}

module.exports = Notification;
