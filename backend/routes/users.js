const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

/**
 * GET /api/users - Listar usuários (admin only)
 */
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const users = User.listAll();
    res.json({ users, count: users.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/profile - Perfil do usuário autenticado
 */
router.get('/profile', authenticateToken, (req, res) => {
  try {
    const user = User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_online: user.is_online,
      created_at: user.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
