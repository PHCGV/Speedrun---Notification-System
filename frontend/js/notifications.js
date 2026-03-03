// ========================================
// GERENCIADOR DE NOTIFICAÇÕES
// ========================================

class NotificationManager {
  constructor() {
    this.apiUrl = 'http://localhost:3000/api';
    this.notifications = [];
    this.unreadCount = 0;
  }

  /**
   * Obter notificações do usuário
   */
  async fetchNotifications(limit = 50, offset = 0) {
    try {
      const response = await fetch(
        `${this.apiUrl}/notifications?limit=${limit}&offset=${offset}`,
        { headers: authManager.getAuthHeaders() }
      );

      if (!response.ok) throw new Error('Erro ao buscar notificações');
      const data = await response.json();
      this.notifications = data.notifications;
      this.unreadCount = data.unreadCount;
      return data;
    } catch (error) {
      console.error('Erro:', error);
      throw error;
    }
  }

  /**
   * Enviar notificação via HTTP
   */
  async sendNotification(recipientUsername, title, message) {
    try {
      const response = await fetch(`${this.apiUrl}/notifications`, {
        method: 'POST',
        headers: authManager.getAuthHeaders(),
        body: JSON.stringify({ recipientUsername, title, message })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar notificação');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao enviar:', error);
      throw error;
    }
  }

  /**
   * Marcar notificação como lida
   */
  async markAsRead(notificationId) {
    try {
      const response = await fetch(
        `${this.apiUrl}/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          headers: authManager.getAuthHeaders()
        }
      );

      if (!response.ok) throw new Error('Erro ao marcar como lida');
      
      // Atualizar localmente
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.is_read = 1;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro:', error);
      throw error;
    }
  }

  /**
   * Buscar histórico com usuário
   */
  async fetchHistory(username, limit = 50) {
    try {
      const response = await fetch(
        `${this.apiUrl}/notifications/history/${encodeURIComponent(username)}?limit=${limit}`,
        { headers: authManager.getAuthHeaders() }
      );

      if (!response.ok) throw new Error('Erro ao buscar histórico');
      return await response.json();
    } catch (error) {
      console.error('Erro:', error);
      throw error;
    }
  }

  /**
   * Deletar notificação
   */
  async deleteNotification(notificationId) {
    try {
      const response = await fetch(
        `${this.apiUrl}/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: authManager.getAuthHeaders()
        }
      );

      if (!response.ok) throw new Error('Erro ao deletar');
      return await response.json();
    } catch (error) {
      console.error('Erro:', error);
      throw error;
    }
  }

  /**
   * Contar notificações não lidas
   */
  getUnreadCount() {
    return this.unreadCount;
  }

  /**
   * Marcar todas como lidas
   */
  async markAllAsRead() {
    try {
      const promises = this.notifications
        .filter(n => !n.is_read)
        .map(n => this.markAsRead(n.id));
      
      await Promise.all(promises);
      this.unreadCount = 0;
    } catch (error) {
      console.error('Erro ao marcar todas:', error);
      throw error;
    }
  }

  /**
   * Mostrar notificação nativa do navegador
   */
  showBrowserNotification(title, options = {}) {
    // Verificar permissão
    if (!('Notification' in window)) {
      console.log('Navegador não suporta notificações');
      return false;
    }

    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" font-size="50" text-anchor="middle" dominant-baseline="central">🔔</text></svg>',
        ...options
      });
      return true;
    }

    return false;
  }

  /**
   * Requisitar permissão de notificações
   */
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      throw new Error('Navegador não suporta notificações');
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }
}

// Exportar gerenciador de notificações global
window.notificationManager = new NotificationManager();
