@echo off
echo ========================================
echo Inicializando Git en Front-IA-Chat
echo ========================================
echo.

cd /d "%~dp0"

echo Verificando si git esta instalado...
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git no esta instalado. Por favor instala Git primero.
    pause
    exit /b 1
)

echo Git encontrado!
echo.

echo Verificando si ya existe un repositorio git...
if exist ".git" (
    echo Ya existe un repositorio git en este directorio.
    echo.
    git status
    pause
    exit /b 0
)

echo Inicializando repositorio git...
git init
echo.

echo Configurando git (si es necesario)...
echo Verificando configuracion de usuario...
git config user.name >nul 2>&1
if errorlevel 1 (
    echo.
    echo No hay configuracion de usuario. Por favor ingresa:
    set /p GIT_USER="Tu nombre: "
    set /p GIT_EMAIL="Tu email: "
    git config user.name "%GIT_USER%"
    git config user.email "%GIT_EMAIL%"
    echo Configuracion guardada!
)

echo.
echo ========================================
echo Estado actual del repositorio:
echo ========================================
git status

echo.
echo ========================================
echo Para hacer tu primer commit, ejecuta:
echo   git add .
echo   git commit -m "Initial commit"
echo.
echo NOTA: Este proyecto es grande, git add puede tardar unos segundos
echo ========================================
echo.
pause
