@echo off
REM Script para iniciar o Sistema de Notificações no Windows

echo.
echo ========================================
echo  Sistema de Notificacoes
echo ========================================
echo.

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao esta instalado!
    echo Faça download em: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js detectado: %NODE_VERSION%

REM Navegar para o diretório backend
cd backend

REM Instalar dependências se não existirem
if not exist "node_modules" (
    echo.
    echo [INSTALANDO] Dependencias do npm...
    echo.
    call npm install
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar dependencias
        pause
        exit /b 1
    )
)

REM Verificar/criar diretório de banco de dados
if not exist "..\database" (
    mkdir ..\database
)

echo.
echo [OK] Ambiente configurado!
echo.
echo ========================================
echo  INICIANDO SERVIDOR
echo ========================================
echo.
echo Acesse: http://localhost:3000
echo.
echo Usuarios de demo:
echo   - admin / admin123 [Administrador]
echo   - user1 / user123  [Usuario]
echo   - user2 / user123  [Usuario]
echo.
echo Pressione Ctrl+C para parar o servidor
echo ========================================
echo.

call npm start
pause
