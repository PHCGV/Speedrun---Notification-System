const axios = require('axios');

const TRANSLATION_API = process.env.TRANSLATION_API || 'https://api.mymemory.translated.net/get';

/**
 * Detecta o idioma de um texto usando padrões simples
 */
function detectLanguage(text) {
  // Padrão básico para português
  const ptKeywords = /\b(o|a|de|da|em|que|para|é|um|uma|você|olá|oi|boa|dia|noite|tarde)\b/gi;
  
  const ptMatches = (text.match(ptKeywords) || []).length;
  const textWords = text.split(/\s+/).length;
  
  // Se mais de 30% das palavras são portuguesas, considera como PT
  if (ptMatches / textWords > 0.3) {
    return 'pt-BR';
  }
  
  return 'en'; // Padrão é inglês
}

/**
 * Traduz um texto para português se necessário
 */
async function translateIfNeeded(text, targetLanguage = 'pt-BR') {
  const sourceLanguage = detectLanguage(text);
  
  if (sourceLanguage === targetLanguage) {
    return {
      original: text,
      translated: text,
      language: sourceLanguage,
      wasTranslated: false
    };
  }

  try {
    const params = {
      q: text,
      langpair: `${sourceLanguage}|${targetLanguage.split('-')[0]}`
    };
    
    const response = await axios.get(TRANSLATION_API, { params, timeout: 5000 });
    
    if (response.data && response.data.responseData) {
      return {
        original: text,
        translated: response.data.responseData.translatedText,
        language: sourceLanguage,
        wasTranslated: true
      };
    }
  } catch (error) {
    console.error('Erro ao traduzir:', error.message);
  }
  
  return {
    original: text,
    translated: text,
    language: sourceLanguage,
    wasTranslated: false
  };
}

module.exports = {
  detectLanguage,
  translateIfNeeded
};
