require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');

const logger = require('./utils/logger');
const User = require('./models/User');
const Notification = require('./models/Notification');

const authRoutes = require('./routes/auth');
const notificationRoutes = require('./routes/notifications');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Armazenar conexões ativas (username -> socket.id)
const userConnections = new Map();

// Rotas API
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

// Servir frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ============================================
// Socket.io - Comunicação em Tempo Real
// ============================================

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Token não fornecido'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.username = decoded.username;
    socket.userRole = decoded.role;
    next();
  } catch (error) {
    next(new Error('Token inválido'));
  }
});

io.on('connection', (socket) => {
  const username = socket.username;
  const userId = socket.userId;

  // Registrar conexão
  userConnections.set(username, socket.id);
  User.setOnlineStatus(userId, true);

  logger.info(`Usuário conectado: ${username}`);

  // Notificar que usuário está online
  io.emit('user:online', { username, userId });

  /**
   * Enviar notificação em tempo real
   */
  socket.on('notification:send', async (data) => {
    try {
      const { recipientUsername, title, message } = data;

      const recipient = User.findByUsername(recipientUsername);
      if (!recipient) {
        return socket.emit('error', { message: 'Usuário destinatário não encontrado' });
      }

      // Criar notificação no banco
      const notification = await Notification.create(userId, recipient.id, title, message);

      // Verificar se destinatário está online
      const recipientSocketId = userConnections.get(recipientUsername);
      
      if (recipientSocketId) {
        // Enviar em tempo real
        io.to(recipientSocketId).emit('notification:new', {
          id: notification.id,
          sender_username: username,
          title: notification.title,
          message: notification.message,
          created_at: notification.created_at,
          is_read: notification.is_read
        });
      }

      socket.emit('notification:sent', { 
        message: 'Notificação enviada',
        notification 
      });

      logger.info(`Notificação enviada de ${username} para ${recipientUsername}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
      logger.error(`Erro ao enviar notificação: ${error.message}`);
    }
  });

  /**
   * Receber comprovante de leitura
   */
  socket.on('notification:read', (data) => {
    try {
      const { notificationId } = data;
      Notification.markAsRead(notificationId, userId);

      // Notificar remetente que mensagem foi lida
      const notification = Notification.findById(notificationId);
      const senderSocketId = userConnections.get(notification.sender_username);
      
      if (senderSocketId) {
        io.to(senderSocketId).emit('notification:read', {
          notificationId,
          readBy: username,
          readAt: new Date().toISOString()
        });
      }

      logger.info(`Notificação ${notificationId} marcada como lida por ${username}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  /**
   * Requisitar histórico
   */
  socket.on('notification:history', (data) => {
    try {
      const { otherUsername, limit } = data;
      const otherUser = User.findByUsername(otherUsername);
      
      if (!otherUser) {
        return socket.emit('error', { message: 'Usuário não encontrado' });
      }

      const history = Notification.findHistory(userId, otherUser.id, limit || 50);
      socket.emit('notification:history', { history, count: history.length });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  /**
   * Desconexão
   */
  socket.on('disconnect', () => {
    userConnections.delete(username);
    User.setOnlineStatus(userId, false);
    
    io.emit('user:offline', { username, userId });
    logger.info(`Usuário desconectado: ${username}`);
  });

  // Ping para manter conexão viva
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  logger.error('Erro não tratado', { error: err.message });
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
  console.log(`🚀 Sistema de Notificações disponível em http://localhost:${PORT}`);
});

module.exports = { app, io };
