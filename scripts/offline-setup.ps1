# CodeMentorAI Offline Setup Script
# This script prepares and runs CodeMentorAI in offline mode

Write-Host "🔌 CodeMentorAI Offline Setup & Launcher" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Function to check if a port is in use
function Test-Port($port) {
    $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
    return $connection
}

# Check prerequisites
Write-Host "🔍 Checking Prerequisites..." -ForegroundColor Yellow

# Check .NET
if (Test-Command "dotnet") {
    $dotnetVersion = dotnet --version
    Write-Host "✅ .NET SDK: $dotnetVersion" -ForegroundColor Green
} else {
    Write-Host "❌ .NET SDK not found" -ForegroundColor Red
    Write-Host "   Please install .NET 8.0 SDK from https://dotnet.microsoft.com/download" -ForegroundColor Red
    exit 1
}

# Check Node.js
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    Write-Host "   Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check Ollama
if (Test-Command "ollama") {
    Write-Host "✅ Ollama installed" -ForegroundColor Green
} else {
    Write-Host "❌ Ollama not found" -ForegroundColor Red
    Write-Host "   Please install Ollama from OllamaSetup.exe or https://ollama.ai" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if we're in offline mode
Write-Host "🌐 Checking Internet Connection..." -ForegroundColor Yellow
try {
    $internetTest = Test-NetConnection -ComputerName "8.8.8.8" -Port 53 -InformationLevel Quiet -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if ($internetTest) {
        Write-Host "✅ Internet available - Full setup mode" -ForegroundColor Green
        $offlineMode = $false
    } else {
        Write-Host "🔌 No internet - Offline mode" -ForegroundColor Yellow
        $offlineMode = $true
    }
} catch {
    Write-Host "🔌 No internet - Offline mode" -ForegroundColor Yellow
    $offlineMode = $true
}

Write-Host ""

# Check if Ollama is already running
Write-Host "🔍 Checking Ollama Service..." -ForegroundColor Yellow
$ollamaRunning = Test-Port 11434

if (-not $ollamaRunning) {
    Write-Host "🚀 Starting Ollama service..." -ForegroundColor Cyan
    $ollamaProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '🤖 Ollama Service' -ForegroundColor Green; ollama serve" -PassThru -WindowStyle Normal
    Write-Host "✅ Ollama started (PID: $($ollamaProcess.Id))" -ForegroundColor Green
    
    # Wait for Ollama to start
    Write-Host "⏳ Waiting for Ollama to initialize..." -ForegroundColor Yellow
    $attempts = 0
    $maxAttempts = 15
    
    do {
        Start-Sleep -Seconds 2
        $attempts++
        $ollamaReady = Test-Port 11434
        if (-not $ollamaReady) {
            Write-Host "   Attempt $attempts/$maxAttempts..." -ForegroundColor Yellow
        }
    } while (-not $ollamaReady -and $attempts -lt $maxAttempts)
    
    if (-not $ollamaReady) {
        Write-Host "❌ Ollama failed to start" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Ollama already running" -ForegroundColor Green
}

Write-Host ""

# Check available models
Write-Host "🤖 Checking Available Models..." -ForegroundColor Yellow
try {
    $models = ollama list 2>$null
    if ($models -match "NAME") {
        Write-Host "✅ Models available:" -ForegroundColor Green
        $modelLines = $models -split "`n" | Select-Object -Skip 1 | Where-Object { $_.Trim() -ne "" }
        foreach ($line in $modelLines) {
            if ($line.Trim() -ne "") {
                $modelName = ($line -split "\s+")[0]
                Write-Host "   📦 $modelName" -ForegroundColor White
            }
        }
    } else {
        Write-Host "⚠️  No models found" -ForegroundColor Yellow
        if (-not $offlineMode) {
            Write-Host "💾 Downloading essential model for offline use..." -ForegroundColor Cyan
            ollama pull tinyllama
            Write-Host "✅ Essential model downloaded" -ForegroundColor Green
        } else {
            Write-Host "❌ No models available and no internet to download" -ForegroundColor Red
            Write-Host "   Please connect to internet and run: ollama pull tinyllama" -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host "❌ Cannot check models" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check frontend dependencies
$frontendPath = Join-Path $PSScriptRoot "..\src\CodeMentorAI.Web"
$nodeModulesPath = Join-Path $frontendPath "node_modules"

Write-Host "📦 Checking Frontend Dependencies..." -ForegroundColor Yellow
if (Test-Path $nodeModulesPath) {
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    if (-not $offlineMode) {
        Write-Host "📥 Installing frontend dependencies..." -ForegroundColor Cyan
        Push-Location $frontendPath
        npm install
        Pop-Location
        Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend dependencies missing and no internet" -ForegroundColor Red
        Write-Host "   Please connect to internet and run: npm install in src\CodeMentorAI.Web" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Configure for offline mode if needed
if ($offlineMode) {
    Write-Host "🔧 Configuring for Offline Mode..." -ForegroundColor Yellow
    
    # Update appsettings.json for offline mode
    $appsettingsPath = Join-Path $PSScriptRoot "..\src\CodeMentorAI.API\appsettings.json"
    if (Test-Path $appsettingsPath) {
        $appsettings = Get-Content $appsettingsPath | ConvertFrom-Json
        $appsettings.Features.EnableModelPulling = $false
        $appsettings.Ollama.EnableModelDownloads = $false
        $appsettings | ConvertTo-Json -Depth 10 | Set-Content $appsettingsPath
        Write-Host "✅ Backend configured for offline mode" -ForegroundColor Green
    }
}

Write-Host ""

# Start the application
Write-Host "🚀 Starting CodeMentorAI Application..." -ForegroundColor Cyan

# Start backend
$backendPath = Join-Path $PSScriptRoot "..\src\CodeMentorAI.API"
Write-Host "🔧 Starting Backend API..." -ForegroundColor Cyan
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '🔧 Backend API (Offline Mode: $offlineMode)' -ForegroundColor Green; dotnet run" -PassThru -WindowStyle Normal

Write-Host "✅ Backend started (PID: $($backendProcess.Id))" -ForegroundColor Green

# Wait for backend
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Check if backend is ready
$backendReady = $false
$attempts = 0
$maxAttempts = 10

while (-not $backendReady -and $attempts -lt $maxAttempts) {
    $attempts++
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/models" -Method GET -TimeoutSec 3 -ErrorAction Stop
        $backendReady = $true
        Write-Host "✅ Backend API ready!" -ForegroundColor Green
    } catch {
        Write-Host "   Attempt $attempts/$maxAttempts - Backend starting..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
    }
}

if (-not $backendReady) {
    Write-Host "❌ Backend failed to start" -ForegroundColor Red
    exit 1
}

# Start frontend
Write-Host "🎨 Starting Frontend..." -ForegroundColor Cyan
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host '🎨 Frontend (Offline Mode: $offlineMode)' -ForegroundColor Green; ng serve --open" -PassThru -WindowStyle Normal

Write-Host "✅ Frontend started (PID: $($frontendProcess.Id))" -ForegroundColor Green

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
if ($offlineMode) {
    Write-Host "🔌 CodeMentorAI Running in OFFLINE MODE!" -ForegroundColor Yellow
} else {
    Write-Host "🌐 CodeMentorAI Running in ONLINE MODE!" -ForegroundColor Green
}
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Application URLs:" -ForegroundColor Yellow
Write-Host "   Frontend:  http://localhost:4200" -ForegroundColor White
Write-Host "   Backend:   http://localhost:5000" -ForegroundColor White
Write-Host "   Ollama:    http://localhost:11434" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Process IDs:" -ForegroundColor Yellow
Write-Host "   Ollama:    $($ollamaProcess.Id)" -ForegroundColor White
Write-Host "   Backend:   $($backendProcess.Id)" -ForegroundColor White
Write-Host "   Frontend:  $($frontendProcess.Id)" -ForegroundColor White
Write-Host ""

if ($offlineMode) {
    Write-Host "🔌 OFFLINE MODE FEATURES:" -ForegroundColor Yellow
    Write-Host "   ✅ Chat with downloaded models" -ForegroundColor Green
    Write-Host "   ✅ Code analysis and validation" -ForegroundColor Green
    Write-Host "   ✅ Model switching" -ForegroundColor Green
    Write-Host "   ✅ Performance monitoring" -ForegroundColor Green
    Write-Host "   ❌ Model downloads disabled" -ForegroundColor Red
    Write-Host ""
}

Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "   - Browser should open automatically" -ForegroundColor White
Write-Host "   - All services are running in separate windows" -ForegroundColor White
Write-Host "   - Close service windows or press Ctrl+C to stop" -ForegroundColor White
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
    Write-Host "⚠️  Backend already stopped" -ForegroundColor Yellow
}

try {
    Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Frontend stopped" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Frontend already stopped" -ForegroundColor Yellow
}

if ($ollamaProcess) {
    try {
        Stop-Process -Id $ollamaProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Ollama stopped" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Ollama already stopped" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "👋 Goodbye!" -ForegroundColor Cyan
