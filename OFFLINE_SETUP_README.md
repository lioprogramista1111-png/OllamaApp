# 🔌 CodeMentorAI - Offline Setup Guide

Complete guide to run CodeMentorAI without internet connection after initial setup.

## 🎯 Overview

CodeMentorAI can run completely offline once properly configured. This guide covers:
- ✅ Initial setup with internet (one-time)
- ✅ Running completely offline
- ✅ Offline model management
- ✅ Troubleshooting offline issues

## 📋 Prerequisites (One-Time Internet Setup)

### Required Software (Download with Internet)

1. **Visual Studio 2022** - [Download](https://visualstudio.microsoft.com/downloads/)
2. **.NET 8.0 SDK** - [Download](https://dotnet.microsoft.com/download/dotnet/8.0)
3. **Node.js 18+** - [Download](https://nodejs.org/en/download/)
4. **Ollama** - [Download](https://ollama.ai/download) or use included `OllamaSetup.exe`

### Initial Setup Steps (Requires Internet)

#### 1. Install Prerequisites
```powershell
# Install .NET 8.0 SDK
# Install Node.js 18+
# Install Visual Studio 2022
# Install Ollama
```

#### 2. Install Frontend Dependencies
```powershell
cd src\CodeMentorAI.Web
npm install
```

#### 3. Restore .NET Packages
```powershell
cd src\CodeMentorAI.API
dotnet restore
```

#### 4. Download AI Models (Critical for Offline Use)
```powershell
# Essential models for offline use
ollama pull tinyllama:1.1b      # 637 MB - Fast responses
ollama pull phi:2.7b            # 1.6 GB - Lightweight tasks
ollama pull codellama:latest    # 3.8 GB - Code analysis
ollama pull mistral:latest      # 4.4 GB - General purpose
ollama pull qwen2.5-coder:7b    # 4.7 GB - Advanced coding

# Optional larger models (if you have sufficient RAM/storage)
ollama pull deepseek-r1:8b      # 5.2 GB - Reasoning
ollama pull deepseek-r1:14b     # 9.0 GB - Most powerful
```

## 🚀 Running Offline (No Internet Required)

Once initial setup is complete, follow these steps to run completely offline:

### Step 1: Start Ollama Service
```powershell
ollama serve
```
**Keep this terminal open** - Ollama must run continuously.

### Step 2: Verify Models Available Offline
```powershell
ollama list
```
You should see your downloaded models listed.

### Step 3: Start CodeMentorAI Application

#### Option A: Automated Script
```powershell
.\scripts\start-app.ps1
```

#### Option B: Manual Start
**Terminal 1 - Backend:**
```powershell
cd src\CodeMentorAI.API
dotnet run
```

**Terminal 2 - Frontend:**
```powershell
cd src\CodeMentorAI.Web
ng serve --open
```

### Step 4: Access Application
- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:5000
- **Ollama API:** http://localhost:11434

## 🔧 Offline Configuration

### Disable Internet-Dependent Features

Edit `src\CodeMentorAI.API\appsettings.json`:

```json
{
  "Features": {
    "EnableModelAutoSwitch": true,
    "EnableModelPreloading": true,
    "EnablePerformanceComparison": true,
    "EnableModelRecommendations": true,
    "EnableModelPulling": false,        // Disable online model downloads
    "EnableModelRemoval": true
  },
  "Ollama": {
    "EnableModelDownloads": false,      // Disable online downloads
    "BaseUrl": "http://localhost:11434"
  }
}
```

### Frontend Offline Configuration

Edit `src\CodeMentorAI.Web\src\environments\environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000',
  signalRUrl: 'http://localhost:5000/modelhub',
  offlineMode: true,                    // Enable offline mode
  enableModelDownloads: false           // Disable model downloads
};
```

## 📦 Offline Model Management

### Available Models (Pre-downloaded)
Your offline setup includes these models:

| Model | Size | RAM Required | Best For |
|-------|------|-------------|----------|
| tinyllama:1.1b | 637 MB | 2 GB | Quick responses, testing |
| phi:2.7b | 1.6 GB | 4 GB | Lightweight tasks |
| codellama:latest | 3.8 GB | 8 GB | Code analysis & generation |
| mistral:latest | 4.4 GB | 8 GB | General purpose, documentation |
| qwen2.5-coder:7b | 4.7 GB | 8 GB | Advanced coding tasks |
| deepseek-r1:8b | 5.2 GB | 10 GB | Reasoning & problem solving |
| deepseek-r1:14b | 9.0 GB | 16 GB | Most powerful reasoning |

### Switch Models Offline
```powershell
# List available models
ollama list

# Test a model
ollama run tinyllama "Hello, test message"

# Switch models in the web interface
# Use the model dropdown in the sidebar
```

## 🎯 Offline Features Available

### ✅ Fully Functional Offline:
- **Chat Interface** - All conversations with downloaded models
- **Code Analysis** - AI-powered code review and suggestions
- **Code Validation** - Quality checks and recommendations
- **Model Switching** - Switch between pre-downloaded models
- **Real-time Updates** - SignalR communication (local only)
- **Performance Monitoring** - Track model performance locally

### ❌ Requires Internet:
- **Model Downloads** - Cannot download new models
- **Model Updates** - Cannot update existing models
- **External API Calls** - No external service integration

## 🐛 Offline Troubleshooting

### "No models available"
```powershell
# Check if Ollama is running
curl http://localhost:11434/api/tags

# List models
ollama list

# If no models, you need to download them with internet
ollama pull tinyllama
```

### "Backend cannot connect to Ollama"
```powershell
# Ensure Ollama is running
ollama serve

# Check Ollama status
curl http://localhost:11434/api/tags

# Verify configuration in appsettings.json
# "BaseUrl": "http://localhost:11434"
```

### "Frontend build fails"
```powershell
# Ensure node_modules are installed (requires initial internet setup)
cd src\CodeMentorAI.Web
npm install  # This was done during initial setup

# If still failing, clear cache
npm cache clean --force
```

### "Port conflicts"
```powershell
# Check what's using the ports
netstat -ano | findstr :4200
netstat -ano | findstr :5000
netstat -ano | findstr :11434

# Kill processes if needed
taskkill /PID <process_id> /F
```

## 💾 Backup for Offline Use

### Backup Essential Files
Create a backup of these directories for offline deployment:

```
CodeMentorAI/
├── src/CodeMentorAI.Web/node_modules/     # Frontend dependencies
├── ~/.nuget/packages/                     # .NET packages
├── ~/.ollama/models/                      # AI models
└── OllamaSetup.exe                        # Ollama installer
```

### Portable Setup Script
Create `offline-setup.ps1`:

```powershell
# Offline setup script
Write-Host "🔌 Starting CodeMentorAI in Offline Mode..." -ForegroundColor Cyan

# Check if Ollama is installed
if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Ollama not found. Please install from OllamaSetup.exe" -ForegroundColor Red
    exit 1
}

# Start Ollama
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ollama serve" -WindowStyle Normal

# Wait for Ollama to start
Start-Sleep -Seconds 3

# Start the application
.\scripts\start-app.ps1
```

## ✅ Offline Verification Checklist

Before going offline, verify:

- [ ] Ollama installed and models downloaded
- [ ] Frontend dependencies installed (`node_modules` exists)
- [ ] .NET packages restored
- [ ] All services start without internet
- [ ] Can switch between models
- [ ] Chat functionality works
- [ ] Code analysis works

## 🎯 Performance Tips for Offline Use

### Optimize for Limited Resources
```json
// appsettings.json optimizations
{
  "Ollama": {
    "RequestTimeout": 120,              // Shorter timeout
    "MaxConcurrentRequests": 2,         // Fewer concurrent requests
    "DefaultModel": "tinyllama:1.1b"    // Start with fastest model
  }
}
```

### Model Selection Strategy
1. **Start with tinyllama** - Fastest responses
2. **Use phi:2.7b** - Good balance of speed/quality
3. **Switch to codellama** - For complex code tasks
4. **Use larger models** - Only when needed

## 🔄 Updating Offline Setup

To update your offline setup (requires temporary internet):

1. **Update Models:**
   ```powershell
   ollama pull tinyllama:latest
   ollama pull codellama:latest
   ```

2. **Update Dependencies:**
   ```powershell
   cd src\CodeMentorAI.Web
   npm update
   
   cd ..\CodeMentorAI.API
   dotnet restore --force
   ```

3. **Test Offline Again:**
   ```powershell
   # Disconnect internet and test
   .\offline-setup.ps1
   ```

---

**🎉 You're now ready to run CodeMentorAI completely offline!**

For troubleshooting, see the main [README.md](README.md) and [docs/SETUP.md](docs/SETUP.md).
