const jwt = require('jsonwebtoken');
const User = require('../models/User');
const express = require('express');
const { body, validationResult } = require('express-validator');

const router = express.Router();

/**
 * Registro de novo usuário
 */
router.post('/register', [
  body('username').isLength({ min: 3 }).trim(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, email, password } = req.body;
    
    // Verificar se usuário já existe
    if (User.findByUsername(username)) {
      return res.status(409).json({ error: 'Usuário já existe' });
    }

    const user = User.create(username, email, password, 'user');
    
    res.status(201).json({ 
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Login
 */
router.post('/login', [
  body('username').notEmpty(),
  body('password').notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, password } = req.body;
    const user = User.findByUsername(username);

    if (!user || !User.verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
