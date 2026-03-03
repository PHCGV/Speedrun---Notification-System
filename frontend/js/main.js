// ========================================
// APLICAÇÃO PRINCIPAL - INICIALIZAÇÃO
// ========================================

class Application {
  constructor() {
    this.initialized = false;
  }

  /**
   * Inicializar aplicação
   */
  async init() {
    console.log('🚀 Inicializando Sistema de Notificações...');

    // Verificar se o usuário já está autenticado
    if (authManager.isAuthenticated()) {
      await this.loginSuccess();
    } else {
      this.showLoginScreen();
    }

    console.log('✓ Aplicação inicializada');
    this.initialized = true;
  }

  /**
   * Limpar conexão anterior e conectar Socket.io
   */
  async connectSocket() {
    try {
      const token = authManager.getToken();
      await socketManager.connect(token);
      this.setupSocketListeners();
    } catch (error) {
      console.error('Erro ao conectar Socket.io:', error);
      // Continuar sem Socket.io se falhar
    }
  }

  /**
   * Configurar listeners do Socket.io
   */
  setupSocketListeners() {
    socketManager.on('notification:new', (data) => {
      console.log('📬 Nova notificação em tempo real:', data);
      
      // Tocar som
      audioManager.playNotificationSound();

      // Mostrar notificação nativa
      notificationManager.showBrowserNotification(
        `${data.sender_username}: ${data.title}`,
        { body: data.message }
      );

      // Mostrar toast
      uiManager.showToast(`📬 Mensagem de ${data.sender_username}`, 'info');

      // Recarregar notificações se estiver na view
      if (uiManager.currentView === 'notifications') {
        setTimeout(() => uiManager.loadNotifications(), 500);
      }
    });

    socketManager.on('notification:read', (data) => {
      console.log(`✓ Notificação lida por ${data.readBy}`);
      uiManager.showToast(
        `${data.readBy} leu sua mensagem`,
        'success'
      );
    });

    socketManager.on('user:online', (data) => {
      console.log(`👤 ${data.username} está online`);
      // Poderia atualizar lista de usuários online aqui
    });

    socketManager.on('user:offline', (data) => {
      console.log(`👤 ${data.username} saiu`);
    });

    socketManager.on('notification:sent', (data) => {
      console.log('✓ Notificação enviada com sucesso');
    });

    socketManager.on('error', (data) => {
      console.error('Erro do socket:', data);
      uiManager.showToast(`Erro: ${data.message}`, 'error');
    });
  }

  /**
   * Após login bem-sucedido
   */
  async loginSuccess() {
    const user = authManager.getUser();
    console.log(`✓ Usuário ${user.username} autenticado`);

    // Atualizar UI
    uiManager.updateUIAfterLogin(user);

    // Conectar ao Socket.io para atualizações em tempo real
    await this.connectSocket();

    console.log('✓ Conectado ao servidor em tempo real');
  }

  /**
   * Mostrar tela de login
   */
  showLoginScreen() {
    document.getElementById('loginScreen').classList.add('active');
    document.getElementById('appScreen').classList.remove('active');
  }
}

// Criar instância global da aplicação
window.app = new Application();

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

// Tratamento de erros global
window.addEventListener('error', (event) => {
  console.error('Erro global:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promise rejeitada não tratada:', event.reason);
});

// Manter Socket.io conectado com ping periódico
setInterval(() => {
  if (socketManager.getConnectionStatus()) {
    socketManager.socket.emit('ping');
  }
}, 30000);

// Limpar e desconectar ao sair
window.addEventListener('beforeunload', () => {
  socketManager.disconnect();
});

console.log('🎉 Sistema de Notificações carregado e pronto!');
