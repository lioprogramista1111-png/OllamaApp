@echo off
REM Quick Ollama Startup for CodeMentorAI
REM Double-click this file to start Ollama before opening Visual Studio

echo.
echo ================================================
echo   CodeMentorAI - Quick Ollama Startup
echo ================================================
echo.

echo Checking if Ollama is already running...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Ollama is already running!
    echo.
    echo You can now open Visual Studio and start developing.
    echo.
    pause
    exit /b 0
)

echo 🚀 Starting Ollama service...
echo.
echo Keep this window open while using CodeMentorAI
echo Close this window to stop Ollama
echo.

ollama serve

echo.
echo Ollama has stopped.
pause
