# CodeMentorAI Startup Script
# This script starts both the backend API and frontend Angular app

Write-Host "🚀 Starting CodeMentorAI Application..." -ForegroundColor Cyan
Write-Host ""

# Check if Ollama is running
Write-Host "🔍 Checking Ollama service..." -ForegroundColor Yellow
try {
    $ollamaResponse = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method GET -ErrorAction Stop
    Write-Host "✅ Ollama is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Ollama is not running on http://localhost:11434" -ForegroundColor Red
    Write-Host "   Please start Ollama before running the application" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Check if Node.js is installed
Write-Host "🔍 Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed" -ForegroundColor Red
    Write-Host "   Please install Node.js from https://nodejs.org" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Check if Angular CLI is installed
Write-Host "🔍 Checking Angular CLI..." -ForegroundColor Yellow
try {
    $ngVersion = ng version --help 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Angular CLI is installed" -ForegroundColor Green
    } else {
        throw "Angular CLI not found"
    }
} catch {
    Write-Host "⚠️  Angular CLI not found globally, will use local version" -ForegroundColor Yellow
}

Write-Host ""

# Navigate to frontend directory and check if node_modules exists
$frontendPath = Join-Path $PSScriptRoot "src\CodeMentorAI.Web"
if (-not (Test-Path (Join-Path $frontendPath "node_modules"))) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location $frontendPath
    npm install
    Pop-Location
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Start the backend API
Write-Host "🔧 Starting Backend API..." -ForegroundColor Cyan
$backendPath = Join-Path $PSScriptRoot "src\CodeMentorAI.API"
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '🔧 Backend API Starting...' -ForegroundColor Cyan; dotnet run" -PassThru -WindowStyle Normal

Write-Host "✅ Backend API process started (PID: $($backendProcess.Id))" -ForegroundColor Green
Write-Host ""

# Wait a bit for the backend to start
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if backend is responding
$backendReady = $false
$maxAttempts = 10
$attempt = 0

while (-not $backendReady -and $attempt -lt $maxAttempts) {
    $attempt++
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/models" -Method GET -TimeoutSec 2 -ErrorAction Stop
        $backendReady = $true
        Write-Host "✅ Backend API is ready!" -ForegroundColor Green
    } catch {
        Write-Host "   Attempt $attempt/$maxAttempts - Backend not ready yet..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if (-not $backendReady) {
    Write-Host "❌ Backend API failed to start" -ForegroundColor Red
    Write-Host "   Please check the backend console for errors" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Start the frontend
Write-Host "🎨 Starting Frontend Angular App..." -ForegroundColor Cyan
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host '🎨 Frontend Starting...' -ForegroundColor Cyan; ng serve --open" -PassThru -WindowStyle Normal

Write-Host "✅ Frontend process started (PID: $($frontendProcess.Id))" -ForegroundColor Green
Write-Host ""

# Wait for frontend to build
Write-Host "⏳ Waiting for frontend to build..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if frontend is responding
$frontendReady = $false
$maxAttempts = 20
$attempt = 0

while (-not $frontendReady -and $attempt -lt $maxAttempts) {
    $attempt++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4200" -Method GET -TimeoutSec 2 -ErrorAction Stop
        $frontendReady = $true
        Write-Host "✅ Frontend is ready!" -ForegroundColor Green
    } catch {
        Write-Host "   Attempt $attempt/$maxAttempts - Frontend building..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 CodeMentorAI Application Started Successfully!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Application URLs:" -ForegroundColor Yellow
Write-Host "   Frontend:  http://localhost:4200" -ForegroundColor White
Write-Host "   Backend:   http://localhost:5000" -ForegroundColor White
Write-Host "   Ollama:    http://localhost:11434" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Process IDs:" -ForegroundColor Yellow
Write-Host "   Backend:   $($backendProcess.Id)" -ForegroundColor White
Write-Host "   Frontend:  $($frontendProcess.Id)" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "   - Chrome should open automatically to http://localhost:4200" -ForegroundColor White
Write-Host "   - Backend and Frontend are running in separate windows" -ForegroundColor White
Write-Host "   - Close those windows or press Ctrl+C to stop the services" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to stop all services and exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Cleanup
Write-Host ""
Write-Host "🛑 Stopping services..." -ForegroundColor Yellow

try {
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Backend stopped" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend process already stopped" -ForegroundColor Yellow
}

try {
    Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Frontend stopped" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Frontend process already stopped" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "👋 Goodbye!" -ForegroundColor Cyan

