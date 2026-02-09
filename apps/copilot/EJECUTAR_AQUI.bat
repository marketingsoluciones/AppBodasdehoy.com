@echo off
chcp 65001 >nul
echo ========================================
echo Inicializando Git en Front-IA-Chat
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Verificando si git está instalado...
git --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ❌ ERROR: Git no está instalado.
    echo Por favor instala Git desde: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)
git --version
echo ✅ Git encontrado!
echo.

echo [2/4] Verificando si ya existe un repositorio git...
if exist ".git" (
    echo.
    echo ⚠️  Ya existe un repositorio git en este directorio.
    echo.
    git status
    echo.
    pause
    exit /b 0
)

echo [3/4] Inicializando repositorio git...
git init
if errorlevel 1 (
    echo.
    echo ❌ Error al inicializar git
    pause
    exit /b 1
)
echo ✅ Repositorio inicializado!
echo.

echo [4/4] Verificando configuración de usuario...
git config user.name >nul 2>&1
if errorlevel 1 (
    echo.
    echo ⚠️  No hay configuración de usuario de git.
    echo Por favor ingresa tus datos:
    echo.
    set /p GIT_USER="Tu nombre: "
    set /p GIT_EMAIL="Tu email: "
    if not "%GIT_USER%"=="" (
        git config user.name "%GIT_USER%"
    )
    if not "%GIT_EMAIL%"=="" (
        git config user.email "%GIT_EMAIL%"
    )
    echo ✅ Configuración guardada!
) else (
    echo ✅ Usuario configurado: 
    git config user.name
    git config user.email
)
echo.

echo ========================================
echo 📊 Estado actual del repositorio:
echo ========================================
git status
echo.

echo ========================================
echo ✅ ¡Git inicializado correctamente!
echo ========================================
echo.
echo Para hacer tu primer commit, ejecuta:
echo   git add .
echo   git commit -m "Initial commit"
echo.
echo NOTA: Este proyecto es grande, git add puede tardar unos segundos
echo ========================================
echo.
pause
