// ========================================
// GERENCIADOR DE SOCKET.IO
// ========================================

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = [];
  }

  /**
   * Conectar ao servidor via Socket.io
   */
  connect(token) {
    return new Promise((resolve, reject) => {
      this.socket = io({
        auth: {
          token: token
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10
      });

      this.socket.on('connect', () => {
        console.log('✓ Conectado ao servidor em tempo real');
        this.isConnected = true;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('✗ Erro de conexão:', error);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('✗ Desconectado do servidor');
        this.isConnected = false;
      });

      // Listeners padrão
      this.socket.on('error', (data) => {
        console.error('Socket error:', data);
        this.emit('error', data);
      });

      this.socket.on('notification:new', (data) => {
        console.log('📬 Nova notificação recebida:', data);
        this.emit('notification:new', data);
      });

      this.socket.on('notification:read', (data) => {
        console.log('✓ Notificação marcada como lida:', data);
        this.emit('notification:read', data);
      });

      this.socket.on('user:online', (data) => {
        console.log(`👤 ${data.username} está online`);
        this.emit('user:online', data);
      });

      this.socket.on('user:offline', (data) => {
        console.log(`👤 ${data.username} está offline`);
        this.emit('user:offline', data);
      });

      this.socket.on('notification:history', (data) => {
        console.log('📋 Histórico recebido');
        this.emit('notification:history', data);
      });

      this.socket.on('notification:sent', (data) => {
        console.log('✓ Notificação enviada');
        this.emit('notification:sent', data);
      });
    });
  }

  /**
   * Desconectar do servidor
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }

  /**
   * Enviar notificação
   */
  sendNotification(recipientUsername, title, message) {
    this.socket.emit('notification:send', {
      recipientUsername,
      title,
      message
    });
  }

  /**
   * Marcar notificação como lida
   */
  markAsRead(notificationId) {
    this.socket.emit('notification:read', { notificationId });
  }

  /**
   * Requisitar histórico
   */
  requestHistory(otherUsername, limit = 50) {
    this.socket.emit('notification:history', {
      otherUsername,
      limit
    });
  }

  /**
   * Adicionar listener customizado
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Remover listener
   */
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Emitir evento customizado
   */
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  /**
   * Verificar se está conectado
   */
  getConnectionStatus() {
    return this.isConnected && this.socket && this.socket.connected;
  }
}

// Exportar gerenciador de socket global
window.socketManager = new SocketManager();
