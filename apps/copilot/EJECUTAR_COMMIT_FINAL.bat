@echo off
chcp 65001 >nul
cd /d "%~dp0"
call commit-final.bat
