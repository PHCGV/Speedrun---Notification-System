const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticação via JWT
 */
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.username = decoded.username;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido ou expirado' });
  }
};

/**
 * Middleware para verificar se o usuário é admin
 */
const requireAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado: privilégios de administrador necessários' });
  }
  next();
};

/**
 * Middleware para verificar se o usuário está autenticado
 */
const requireAuth = authenticateToken;

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAuth
};
