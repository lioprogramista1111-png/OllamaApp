@echo off
REM CodeMentorAI Offline Setup Script (Batch wrapper)
REM This script runs the PowerShell offline setup

echo.
echo ================================================
echo   CodeMentorAI - Offline Setup Launcher
echo ================================================
echo.

powershell.exe -ExecutionPolicy Bypass -File "%~dp0offline-setup.ps1"

pause
