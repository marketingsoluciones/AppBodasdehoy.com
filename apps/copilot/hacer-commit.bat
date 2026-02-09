@echo off
chcp 65001 >nul
echo ========================================
echo Inicializando Git y haciendo commit
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] Verificando si git está instalado...
git --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ❌ ERROR: Git no está instalado.
    pause
    exit /b 1
)
echo ✅ Git encontrado!
echo.

echo [2/5] Inicializando repositorio git (si no existe)...
if not exist ".git" (
    git init
    echo ✅ Repositorio inicializado!
) else (
    echo ✅ Repositorio ya existe.
)
echo.

echo [3/5] Verificando configuración de usuario...
git config user.name >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Configurando usuario por defecto...
    git config user.name "Usuario"
    git config user.email "usuario@ejemplo.com"
    echo ✅ Usuario configurado (puedes cambiarlo después con git config)
) else (
    echo ✅ Usuario ya configurado
)
echo.

echo [4/5] Agregando archivos al staging area...
echo (Esto puede tardar unos segundos, el proyecto es grande...)
git add .
if errorlevel 1 (
    echo.
    echo ❌ Error al agregar archivos
    pause
    exit /b 1
)
echo ✅ Archivos agregados!
echo.

echo [5/5] Haciendo commit...
git commit -m "Initial commit"
if errorlevel 1 (
    echo.
    echo ⚠️  El commit falló. Verificando estado...
    git status
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ ¡COMMIT REALIZADO EXITOSAMENTE!
echo ========================================
echo.
git log --oneline -1
echo.
echo ========================================
pause
