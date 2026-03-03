// ========================================
// GERENCIADOR DE INTERFACE DO USUÁRIO
// ========================================

class UIManager {
  constructor() {
    this.currentView = 'notifications';
    this.setupEventListeners();
  }

  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    // Navegação
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchView(e.currentTarget.dataset.view));
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

    // Autenticação
    document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('signupForm').addEventListener('submit', (e) => this.handleSignup(e));
    document.getElementById('toggleRegister').addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleAuthForms();
    });
    document.getElementById('toggleLogin').addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleAuthForms();
    });

    // Demo buttons
    document.querySelectorAll('.demo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const username = btn.dataset.user;
        const password = btn.dataset.pass;
        document.getElementById('loginUsername').value = username;
        document.getElementById('loginPassword').value = password;
        document.getElementById('loginForm').dispatchEvent(new Event('submit'));
      });
    });

    // Notificações
    document.getElementById('markAllReadBtn').addEventListener('click', () => this.markAllAsRead());

    // Enviar Notificação
    document.getElementById('sendNotificationForm').addEventListener('submit', (e) => this.handleSendNotification(e));

    // Histórico
    document.getElementById('loadHistoryBtn').addEventListener('click', () => this.loadHistory());

    // Configurações
    document.getElementById('soundEnabled').addEventListener('change', (e) => {
      audioManager.setEnabled(e.target.checked);
      this.showToast('Configuração salva', 'success');
    });

    document.getElementById('notificationEnabled').addEventListener('change', (e) => {
      if (e.target.checked) {
        document.getElementById('enableNotificationsBtn').click();
      }
    });

    document.getElementById('testSoundBtn').addEventListener('click', () => {
      audioManager.playNotificationSound();
      this.showToast('Som de teste tocado', 'info');
    });

    document.getElementById('enableNotificationsBtn').addEventListener('click', () => {
      this.requestNotificationPermission();
    });
  }

  /**
   * Trocar view
   */
  switchView(viewName) {
    // Remover active de todas as views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Ativar nova view
    const viewElement = document.getElementById(`${viewName}View`);
    if (viewElement) {
      viewElement.classList.add('active');
    }

    // Ativar botão de navegação
    const navBtn = document.querySelector(`[data-view="${viewName}"]`);
    if (navBtn) {
      navBtn.classList.add('active');
    }

    this.currentView = viewName;

    // Ações específicas da view
    if (viewName === 'notifications') {
      this.loadNotifications();
    } else if (viewName === 'settings') {
      this.loadSettings();
    }
  }

  /**
   * Atualizar interface após login
   */
  updateUIAfterLogin(user) {
    const greeting = document.getElementById('userGreeting');
    const role = document.getElementById('userRole');
    
    greeting.textContent = `Olá, ${user.username}`;
    role.textContent = user.role === 'admin' ? 'Administrador' : 'Usuário';

    // Mostrar app, esconder login
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('appScreen').classList.add('active');

    // Carregar notificações
    this.loadNotifications();
  }

  /**
   * Carregar e exibir notificações
   */
  async loadNotifications() {
    try {
      const container = document.getElementById('notificationsList');
      container.innerHTML = '<p class="loading">Carregando notificações...</p>';

      const data = await notificationManager.fetchNotifications();
      
      // Atualizar badge
      const badge = document.getElementById('notificationCount');
      if (data.unreadCount > 0) {
        badge.textContent = data.unreadCount;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }

      if (data.notifications.length === 0) {
        container.innerHTML = '<p class="empty-state">🔔 Nenhuma notificação</p>';
        return;
      }

      container.innerHTML = data.notifications.map(notif => `
        <div class="notification-item ${!notif.is_read ? 'unread' : ''}">
          <div class="notification-header">
            <span class="notification-sender">📨 ${notif.sender_username}</span>
            <span class="notification-time">${new Date(notif.created_at).toLocaleString('pt-BR')}</span>
          </div>
          <div class="notification-title">${this.escapeHtml(notif.title)}</div>
          <div class="notification-message">${this.escapeHtml(notif.message)}</div>
          <div class="notification-footer">
            <span class="notification-status ${notif.is_read ? 'read' : ''}">
              ${notif.is_read ? '✓ Lida' : '○ Não lida'}
            </span>
            ${notif.read_at ? `<span class="text-muted">às ${new Date(notif.read_at).toLocaleTimeString('pt-BR')}</span>` : ''}
          </div>
          <div class="notification-actions">
            ${!notif.is_read ? `<button class="btn btn-primary" onclick="uiManager.markNotificationAsRead(${notif.id})">Marcar como lida</button>` : ''}
            <button class="btn btn-danger" onclick="uiManager.deleteNotification(${notif.id})">Deletar</button>
          </div>
        </div>
      `).join('');
    } catch (error) {
      document.getElementById('notificationsList').innerHTML = 
        `<div class="alert alert-error">Erro ao carregar notificações: ${error.message}</div>`;
    }
  }

  /**
   * Marcar notificação como lida
   */
  async markNotificationAsRead(notificationId) {
    try {
      await notificationManager.markAsRead(notificationId);
      await this.loadNotifications();
      this.showToast('Notificação marcada como lida', 'success');
    } catch (error) {
      this.showToast(`Erro: ${error.message}`, 'error');
    }
  }

  /**
   * Marcar todas como lidas
   */
  async markAllAsRead() {
    try {
      await notificationManager.markAllAsRead();
      await this.loadNotifications();
      this.showToast('Todas as notificações marcadas como lidas', 'success');
    } catch (error) {
      this.showToast(`Erro: ${error.message}`, 'error');
    }
  }

  /**
   * Deletar notificação
   */
  async deleteNotification(notificationId) {
    if (!confirm('Tem certeza que deseja deletar?')) return;
    
    try {
      await notificationManager.deleteNotification(notificationId);
      await this.loadNotifications();
      this.showToast('Notificação deletada', 'success');
    } catch (error) {
      this.showToast(`Erro: ${error.message}`, 'error');
    }
  }

  /**
   * Enviar notificação
   */
  async handleSendNotification(e) {
    e.preventDefault();
    const errorDiv = document.getElementById('sendError');
    const successDiv = document.getElementById('sendSuccess');
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    const recipient = document.getElementById('recipientUsername').value;
    const title = document.getElementById('notificationTitle').value;
    const message = document.getElementById('notificationMessage').value;

    try {
      // Tentar via Socket.io se conectado
      if (socketManager.getConnectionStatus()) {
        socketManager.sendNotification(recipient, title, message);
      } else {
        // Fallback para HTTP
        await notificationManager.sendNotification(recipient, title, message);
      }

      successDiv.innerHTML = '✓ Notificação enviada com sucesso!';
      successDiv.style.display = 'block';
      document.getElementById('sendNotificationForm').reset();
      this.showToast('Notificação enviada', 'success');
    } catch (error) {
      errorDiv.innerHTML = `✗ ${error.message}`;
      errorDiv.style.display = 'block';
      this.showToast(`Erro: ${error.message}`, 'error');
    }
  }

  /**
   * Carregar histórico
   */
  async loadHistory() {
    const username = document.getElementById('historyUsername').value;
    if (!username) {
      this.showToast('Digite um nome de usuário', 'info');
      return;
    }

    try {
      const container = document.getElementById('historyList');
      container.innerHTML = '<p class="loading">Carregando histórico...</p>';

      const data = await notificationManager.fetchHistory(username);

      if (data.history.length === 0) {
        container.innerHTML = '<p class="empty-state">📋 Nenhuma conversa com este usuário</p>';
        return;
      }

      container.innerHTML = data.history.map(notif => `
        <div class="notification-item">
          <div class="notification-header">
            <span class="notification-sender">
              ${notif.sender_username === authManager.getUser().username ? '📤' : '📨'} 
              ${notif.sender_username}
            </span>
            <span class="notification-time">${new Date(notif.created_at).toLocaleString('pt-BR')}</span>
          </div>
          <div class="notification-title">${this.escapeHtml(notif.title)}</div>
          <div class="notification-message">${this.escapeHtml(notif.message)}</div>
        </div>
      `).join('');
    } catch (error) {
      document.getElementById('historyList').innerHTML = 
        `<div class="alert alert-error">Erro: ${error.message}</div>`;
    }
  }

  /**
   * Carregar configurações
   */
  async loadSettings() {
    try {
      const user = authManager.getUser();
      document.getElementById('settingsUsername').textContent = user.username;
      document.getElementById('settingsRole').textContent = 
        user.role === 'admin' ? 'Administrador' : 'Usuário Regular';
      document.getElementById('soundEnabled').checked = audioManager.isEnabled();
      
      // Tentar buscar dados adicionais
      const profile = await authManager.getProfile();
      document.getElementById('settingsEmail').textContent = profile.email;
      document.getElementById('settingsCreatedAt').textContent = 
        new Date(profile.created_at).toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }

  /**
   * Requisitar permissão de notificações
   */
  async requestNotificationPermission() {
    try {
      const granted = await notificationManager.requestNotificationPermission();
      if (granted) {
        document.getElementById('notificationEnabled').checked = true;
        this.showToast('Permissão concedida', 'success');
        notificationManager.showBrowserNotification('Notificações ativadas!', {
          body: 'Você receberá notificações do navegador'
        });
      } else {
        this.showToast('Permissão negada', 'info');
      }
    } catch (error) {
      this.showToast(`Erro: ${error.message}`, 'error');
    }
  }

  /**
   * Escaper HTML
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Mostrar toast notification
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = { success: '✓', error: '✗', info: 'ℹ' };
    toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-message">${message}</span>`;
    
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  /**
   * Toggle formulários de autenticação
   */
  toggleAuthForms() {
    const loginFormContainer = document.getElementById('loginForm').closest('.login-form');
    const registerForm = document.getElementById('registerForm');
    
    if (loginFormContainer.style.display === 'none') {
      loginFormContainer.style.display = 'block';
      registerForm.style.display = 'none';
    } else {
      loginFormContainer.style.display = 'none';
      registerForm.style.display = 'block';
    }
  }

  /**
   * Tratar login
   */
  async handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    errorDiv.style.display = 'none';

    try {
      const data = await authManager.login(username, password);
      this.updateUIAfterLogin(data.user);
    } catch (error) {
      errorDiv.innerHTML = `✗ ${error.message}`;
      errorDiv.style.display = 'block';
    }
  }

  /**
   * Tratar signup
   */
  async handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    try {
      await authManager.register(username, email, password);
      this.showToast('Conta criada! Faça login agora', 'success');
      this.toggleAuthForms();
      document.getElementById('loginForm').reset();
      document.getElementById('signupForm').reset();
    } catch (error) {
      this.showToast(`Erro: ${error.message}`, 'error');
    }
  }

  /**
   * Tratar logout
   */
  async handleLogout() {
    if (confirm('Deseja realmente sair?')) {
      socketManager.disconnect();
      authManager.logout();
      document.getElementById('appScreen').classList.remove('active');
      document.getElementById('loginScreen').classList.add('active');
      document.getElementById('loginForm').reset();
      document.getElementById('signupForm').reset();
    }
  }
}

// Exportar gerenciador de UI global
window.uiManager = new UIManager();
