# Visual Studio Startup Script for CodeMentorAI
# This script is designed to be run when opening the project in Visual Studio

Write-Host "🎯 Visual Studio - CodeMentorAI Startup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Function to test if a port is in use
function Test-Port($port) {
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
        return $connection
    } catch {
        return $false
    }
}

# Check if Ollama is installed
Write-Host "🔍 Checking Ollama installation..." -ForegroundColor Yellow
if (-not (Test-Command "ollama")) {
    Write-Host "❌ Ollama not found in PATH" -ForegroundColor Red
    Write-Host "   Please install Ollama:" -ForegroundColor Yellow
    Write-Host "   1. Run OllamaSetup.exe in the project root" -ForegroundColor White
    Write-Host "   2. Or download from https://ollama.ai" -ForegroundColor White
    Write-Host ""
    return
}

Write-Host "✅ Ollama is installed" -ForegroundColor Green

# Check if Ollama is already running
Write-Host "🔍 Checking if Ollama is running..." -ForegroundColor Yellow
$ollamaRunning = Test-Port 11434

if ($ollamaRunning) {
    Write-Host "✅ Ollama is already running" -ForegroundColor Green
} else {
    Write-Host "🚀 Starting Ollama service..." -ForegroundColor Cyan
    
    try {
        # Start Ollama in a new window
        $ollamaProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '🤖 Ollama Service for CodeMentorAI' -ForegroundColor Green; Write-Host 'Keep this window open while using CodeMentorAI' -ForegroundColor Yellow; Write-Host ''; ollama serve" -PassThru -WindowStyle Normal
        
        Write-Host "✅ Ollama started in new window (PID: $($ollamaProcess.Id))" -ForegroundColor Green
        
        # Wait for Ollama to be ready
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
        
        if ($ollamaReady) {
            Write-Host "✅ Ollama is ready!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Ollama may still be starting..." -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "❌ Failed to start Ollama" -ForegroundColor Red
        Write-Host "   You can start it manually: ollama serve" -ForegroundColor Yellow
    }
}

Write-Host ""

# Check for available models
Write-Host "🤖 Checking available models..." -ForegroundColor Yellow
try {
    $models = ollama list 2>$null
    if ($models -match "NAME") {
        Write-Host "✅ Models available:" -ForegroundColor Green
        $modelLines = $models -split "`n" | Select-Object -Skip 1 | Where-Object { $_.Trim() -ne "" }
        $modelCount = 0
        foreach ($line in $modelLines) {
            if ($line.Trim() -ne "") {
                $modelName = ($line -split "\s+")[0]
                Write-Host "   📦 $modelName" -ForegroundColor White
                $modelCount++
            }
        }
        Write-Host "   Total: $modelCount models" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  No models found" -ForegroundColor Yellow
        Write-Host "   Download a model: ollama pull tinyllama" -ForegroundColor White
    }
} catch {
    Write-Host "⚠️  Cannot check models (Ollama may still be starting)" -ForegroundColor Yellow
}

Write-Host ""

# Check frontend dependencies
$frontendPath = Join-Path $PSScriptRoot "..\src\CodeMentorAI.Web"
$nodeModulesPath = Join-Path $frontendPath "node_modules"

Write-Host "📦 Checking frontend dependencies..." -ForegroundColor Yellow
if (Test-Path $nodeModulesPath) {
    Write-Host "✅ Frontend dependencies are installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend dependencies not found" -ForegroundColor Yellow
    Write-Host "   Run in Terminal: cd src\CodeMentorAI.Web && npm install" -ForegroundColor White
}

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎯 Ready for Development!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Press F5 to start the backend" -ForegroundColor White
Write-Host "   2. Open Terminal and run: cd src\CodeMentorAI.Web && ng serve" -ForegroundColor White
Write-Host "   3. Or use the automated script: .\scripts\start-app.ps1" -ForegroundColor White
Write-Host ""
Write-Host "🌐 URLs when running:" -ForegroundColor Yellow
Write-Host "   Frontend:  http://localhost:4200" -ForegroundColor White
Write-Host "   Backend:   http://localhost:5000" -ForegroundColor White
Write-Host "   Ollama:    http://localhost:11434" -ForegroundColor White
Write-Host ""
