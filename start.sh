#!/bin/bash
# Script para iniciar o Sistema de Notificações

echo "🚀 Iniciando Sistema de Notificações..."

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado!"
    exit 1
fi

echo "✓ Node.js detectado: $(node --version)"

# Navegar para o diretório backend
cd backend

# Instalar dependências se não existirem
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Inicializar banco de dados
if [ ! -d "../database" ]; then
    mkdir -p ../database
fi

echo "✓ Ambiente configurado"
echo ""
echo "🎯 Iniciando servidor..."
echo "📍 Servidor disponível em: http://localhost:3000"
echo ""
echo "👥 Usuários de demo:"
echo "   - admin / admin123 (Administrador)"
echo "   - user1 / user123 (Usuário)"
echo "   - user2 / user123 (Usuário)"
echo ""

npm start
