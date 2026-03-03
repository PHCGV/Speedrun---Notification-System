const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

const router = express.Router();

/**
 * GET /api/notifications - Obter notificações do usuário
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    const notifications = Notification.findByRecipient(req.userId, limit, offset);
    const unreadCount = Notification.countUnread(req.userId);

    res.json({
      notifications,
      unreadCount,
      count: notifications.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/notifications - Enviar notificação
 */
router.post('/', authenticateToken, [
  body('recipientUsername').notEmpty(),
  body('title').notEmpty().isLength({ max: 255 }),
  body('message').notEmpty().isLength({ max: 5000 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { recipientUsername, title, message } = req.body;

    // Buscar destinatário por username (otimizado)
    const recipient = User.findByUsername(recipientUsername);
    if (!recipient) {
      return res.status(404).json({ error: 'Usuário destinatário não encontrado' });
    }

    // Verificar se usuário não está enviando para si mesmo
    if (recipient.id === req.userId) {
      return res.status(400).json({ error: 'Não é possível enviar notificação para si mesmo' });
    }

    const notification = await Notification.create(req.userId, recipient.id, title, message);

    res.status(201).json({
      message: 'Notificação enviada com sucesso',
      notification
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/notifications/:id/read - Marcar como lida
 */
router.put('/:id/read', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const notification = Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    if (notification.recipient_id !== req.userId) {
      return res.status(403).json({ error: 'Não é possível marcar notificação de outro usuário' });
    }

    Notification.markAsRead(id, req.userId);

    res.json({ message: 'Notificação marcada como lida' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/notifications/history/:username - História entre dois usuários
 */
router.get('/history/:username', authenticateToken, (req, res) => {
  try {
    const { username } = req.params;
    const otherUser = User.findByUsername(username);

    if (!otherUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const history = Notification.findHistory(req.userId, otherUser.id, limit);

    res.json({ history, count: history.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/notifications/:id - Deletar notificação (admin ou proprietário)
 */
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const notification = Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    // Verificar permissões
    if (notification.recipient_id !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para deletar' });
    }

    Notification.delete(id);

    res.json({ message: 'Notificação deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
