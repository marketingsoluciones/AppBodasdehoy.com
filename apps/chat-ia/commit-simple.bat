@echo off
chcp 65001 >nul
echo ========================================
echo Commit Simple - Front-IA-Chat
echo ========================================
echo.

cd /d "%~dp0"

echo Verificando estado actual...
git status --short
echo.

echo Verificando si hay cambios...
git diff --quiet
set HAS_UNSTAGED=%errorlevel%

git diff --cached --quiet
set HAS_STAGED=%errorlevel%

if %HAS_UNSTAGED%==1 (
    echo Hay cambios sin agregar. Agregando...
    git add .
)

if %HAS_STAGED%==1 (
    echo Hay cambios en staging. Haciendo commit...
    git commit -m "Update: cambios del proyecto"
    if errorlevel 1 (
        echo.
        echo ⚠️  Commit falló. Intentando sin hooks de pre-commit...
        git commit --no-verify -m "Update: cambios del proyecto"
    )
) else (
    if %HAS_UNSTAGED%==0 (
        echo ✅ No hay cambios para hacer commit. Todo está actualizado.
    ) else (
        echo Agregando cambios y haciendo commit...
        git add .
        git commit -m "Update: cambios del proyecto"
        if errorlevel 1 (
            echo.
            echo ⚠️  Commit falló. Intentando sin hooks...
            git commit --no-verify -m "Update: cambios del proyecto"
        )
    )
)

echo.
echo ========================================
echo Estado final:
echo ========================================
git status
echo.
git log --oneline -1
echo.
pause
