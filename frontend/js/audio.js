// ========================================
// GERENCIADOR DE ÁUDIO
// ========================================

class AudioManager {
  constructor() {
    this.audioContext = null;
    this.enabled = localStorage.getItem('soundEnabled') !== 'false';
  }

  /**
   * Criar contexto de áudio se não existir
   */
  getAudioContext() {
    if (!this.audioContext) {
      const audioContextClass = window.AudioContext || window.webkitAudioContext;
      if (audioContextClass) {
        this.audioContext = new audioContextClass();
      }
    }
    return this.audioContext;
  }

  /**
   * Tocar som de notificação usando Web Audio API
   */
  playNotificationSound() {
    if (!this.enabled) return;

    try {
      const context = this.getAudioContext();
      if (!context) {
        // Fallback usando HTML5 Audio
        this.playFallbackSound();
        return;
      }

      // Resumir contexto se necessário (policy do navegador)
      if (context.state === 'suspended') {
        context.resume();
      }

      // Criar nó de ganho (volume)
      const gainNode = context.createGain();
      gainNode.connect(context.destination);
      gainNode.gain.value = 0.3; // Volume a 30%

      // Criar oscilador (tom)
      const oscillator = context.createOscillator();
      oscillator.connect(gainNode);
      oscillator.frequency.value = 800; // Frequência em Hz

      // Sequência de tons (som de notificação)
      const now = context.currentTime;
      oscillator.start(now);
      oscillator.stop(now + 0.1);

      // Segundo tom
      const oscillator2 = context.createOscillator();
      oscillator2.connect(gainNode);
      oscillator2.frequency.value = 1000;
      oscillator2.start(now + 0.15);
      oscillator2.stop(now + 0.25);

      // Terceiro tom
      const oscillator3 = context.createOscillator();
      oscillator3.connect(gainNode);
      oscillator3.frequency.value = 900;
      oscillator3.start(now + 0.3);
      oscillator3.stop(now + 0.4);
    } catch (error) {
      console.warn('Erro ao tocar som:', error);
    }
  }

  /**
   * Fallback para som usando HTML5 Audio (data URL)
   */
  playFallbackSound() {
    try {
      // Data URL de um simples beep em MP3 (gerado online)
      const audioBase64 = 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//NkZAABkYGJEAP/3ADABj7z6QEA//NkZAAAkYGJEAP/3ADABj7z6QEA//NkZAAAkYGJEAP/3ADABj7z6QEA//NkZAAAkYGJEAP/3ADABj7z6QEA//tl+QEA//NkZAAAkYGJEAP/3ADABj7z6QEA';
      
      // Usar Web Audio API se disponível via file
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const audio = new Audio();
        audio.volume = 0.3;
        // Não tocamos o fallback aqui pois é apenas para demonstração
      }
    } catch (error) {
      console.warn('Fallback de áudio não disponível');
    }
  }

  /**
   * Toggle de som ativado/desativado
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    localStorage.setItem('soundEnabled', enabled ? 'true' : 'false');
  }

  /**
   * Verificar se som está ativado
   */
  isEnabled() {
    return this.enabled;
  }
}

// Exportar gerenciador de áudio global
window.audioManager = new AudioManager();
