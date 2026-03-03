// ========================================
// GERENCIADOR DE AUTENTICAÇÃO
// ========================================

class AuthManager {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    this.apiUrl = 'http://localhost:3000/api';
  }

  /**
   * Login
   */
  async login(username, password) {
    try {
      const response = await fetch(`${this.apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao fazer login');
      }

      const data = await response.json();
      this.setAuth(data.token, data.user);
      return data;
    } catch (error) {
      console.error('Erro de login:', error);
      throw error;
    }
  }

  /**
   * Registrar novo usuário
   */
  async register(username, email, password) {
    try {
      const response = await fetch(`${this.apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.errors?.[0]?.msg || 'Erro ao registrar');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro de registro:', error);
      throw error;
    }
  }

  /**
   * Definir token e usuário após autenticação
   */
  setAuth(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Fazer logout
   */
  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  /**
   * Verificar se está autenticado
   */
  isAuthenticated() {
    return !!this.token;
  }

  /**
   * Obter usuário atual
   */
  getUser() {
    return this.user;
  }

  /**
   * Obter token
   */
  getToken() {
    return this.token;
  }

  /**
   * Obter headers com autenticação
   */
  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  /**
   * Obter perfil do usuário
   */
  async getProfile() {
    try {
      const response = await fetch(`${this.apiUrl}/users/profile`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) throw new Error('Erro ao buscar perfil');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      throw error;
    }
  }
}

// Exportar gerenciador de autenticação global
window.authManager = new AuthManager();
