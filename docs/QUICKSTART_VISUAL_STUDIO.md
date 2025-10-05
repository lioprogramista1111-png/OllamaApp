# 🚀 Quick Start Guide for Visual Studio

Get CodeMentorAI running in Visual Studio in 5 minutes!

## ✅ Prerequisites Checklist

Before you start, make sure you have:

- [ ] **Visual Studio 2022** installed
- [ ] **.NET 8.0 SDK** installed
- [ ] **Node.js 18+** installed ([Download](https://nodejs.org))
- [ ] **Ollama** installed and running ([Download](https://ollama.ai))

### Quick Check

Open PowerShell and run:

```powershell
# Check .NET
dotnet --version

# Check Node.js
node --version

# Check Ollama
curl http://localhost:11434/api/tags
```

If all commands work, you're ready! 🎉

## 🎯 Method 1: One-Click Start (Easiest)

1. **Open the Solution:**
   - Double-click `CodeMentorAI.sln` in Windows Explorer
   - Or in Visual Studio: **File → Open → Project/Solution** → Select `CodeMentorAI.sln`

2. **First Time Setup:**
   - Open Terminal in Visual Studio (`Ctrl+` `)
   - Run:
     ```powershell
     cd src\CodeMentorAI.Web
     npm install
     ```
   - Wait for dependencies to install (~2 minutes)

3. **Start the Application:**
   - Press **F5** or click the green **Start** button
   - Visual Studio will:
     - ✅ Build and start the backend API
     - ✅ Open Chrome to `http://localhost:4200`
   
4. **Start the Frontend:**
   - Open a new Terminal in Visual Studio
   - Run:
     ```powershell
     cd src\CodeMentorAI.Web
     ng serve
     ```
   - Wait for "Compiled successfully" message
   - Chrome will automatically open to the app

**That's it! You're running! 🎉**

## 🎯 Method 2: Automated Script (Recommended)

Use the included startup script for a fully automated experience:

1. **Open the Solution** in Visual Studio

2. **Run the Startup Script:**
   - In Solution Explorer, find `start-app.bat`
   - Right-click → **Open**
   
   Or from PowerShell:
   ```powershell
   .\start-app.ps1
   ```

3. **The script will:**
   - ✅ Check if Ollama is running
   - ✅ Check Node.js installation
   - ✅ Install frontend dependencies (if needed)
   - ✅ Start the backend API
   - ✅ Start the frontend
   - ✅ Open Chrome automatically

4. **Wait for the success message:**
   ```
   🎉 CodeMentorAI Application Started Successfully!
   
   📍 Application URLs:
      Frontend:  http://localhost:4200
      Backend:   http://localhost:5000
      Ollama:    http://localhost:11434
   ```

5. **To stop:**
   - Press any key in the script window
   - Or close the backend/frontend terminal windows

## 🎯 Method 3: Manual Control

For more control over each component:

### Step 1: Start Backend

1. In Visual Studio, right-click `CodeMentorAI.API` project
2. Select **Debug → Start New Instance**
3. Wait for: `Now listening on: http://localhost:5000`

### Step 2: Start Frontend

1. Open Terminal in Visual Studio (`Ctrl+` `)
2. Run:
   ```powershell
   cd src\CodeMentorAI.Web
   ng serve --open
   ```
3. Wait for: `Application bundle generation complete`
4. Chrome opens to `http://localhost:4200`

## 🧪 Testing the Application

Once both services are running:

1. **Check the Frontend:**
   - Chrome should open to `http://localhost:4200`
   - You should see the CodeMentorAI interface

2. **Test Model Management:**
   - Click **Model Management** in the sidebar
   - You should see your installed Ollama models

3. **Test Chat:**
   - Select a model from the dropdown
   - Click **Chat** in the sidebar
   - Send a test message

## 🐛 Troubleshooting

### "Ollama is not running"

**Solution:**
```powershell
# Start Ollama (if installed)
ollama serve

# Or check if it's running
curl http://localhost:11434/api/tags
```

### "Port 5000 is already in use"

**Solution:**
1. Open `src\CodeMentorAI.API\Properties\launchSettings.json`
2. Change `applicationUrl` to a different port (e.g., `http://localhost:5001`)
3. Update frontend API calls in `src\CodeMentorAI.Web\src\app\services\*.service.ts`

### "ng: command not found"

**Solution:**
```powershell
# Install Angular CLI globally
npm install -g @angular/cli

# Or use local version
cd src\CodeMentorAI.Web
npx ng serve
```

### "npm install fails"

**Solution:**
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
cd src\CodeMentorAI.Web
Remove-Item -Recurse -Force node_modules
npm install
```

### Backend builds but doesn't start

**Solution:**
1. Check Output window in Visual Studio
2. Look for error messages
3. Ensure .NET 8.0 SDK is installed:
   ```powershell
   dotnet --list-sdks
   ```

## 📋 Visual Studio Launch Profiles

Visual Studio includes several launch profiles:

| Profile | Description | Opens Browser? |
|---------|-------------|----------------|
| **CodeMentorAI.API** | Default - starts backend, opens frontend URL | ✅ Yes |
| **CodeMentorAI.API (Backend Only)** | Backend only, no browser | ❌ No |
| **CodeMentorAI.API (Production)** | Production mode | ✅ Yes |
| **IIS Express** | Runs with IIS Express | ✅ Yes |

**To switch profiles:**
- Click the dropdown next to the **Start** button
- Select your preferred profile

## 🎨 Visual Studio Tasks

Access pre-configured tasks from **View → Task Runner Explorer**:

- **Start Full Application** - Complete startup
- **Start Frontend (Angular)** - Frontend only
- **Start Backend (API)** - Backend only
- **Install Frontend Dependencies** - Run npm install
- **Build Frontend** - Build Angular app
- **Check Ollama Status** - Verify Ollama

## 📚 Next Steps

Now that you're running:

1. **Explore the Features:**
   - Model Management - Download and manage AI models
   - Chat - Interact with AI models
   - Code Analysis - Analyze your code
   - Code Validation - Validate code quality

2. **Read the Documentation:**
   - `README.md` - Project overview
   - `VISUAL_STUDIO_GUIDE.md` - Detailed Visual Studio guide
   - `SETUP.md` - Complete setup instructions

3. **Start Developing:**
   - Set breakpoints in the backend code
   - Make changes to the frontend
   - Hot reload is enabled for both!

## 🎯 Quick Reference

### URLs
- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:5000
- **Ollama:** http://localhost:11434

### Keyboard Shortcuts
- `F5` - Start with debugging
- `Ctrl+F5` - Start without debugging
- `Shift+F5` - Stop debugging
- `Ctrl+` ` - Open terminal
- `Ctrl+Shift+B` - Build solution

### Common Commands
```powershell
# Backend
cd src\CodeMentorAI.API
dotnet run

# Frontend
cd src\CodeMentorAI.Web
ng serve --open

# Check Ollama
curl http://localhost:11434/api/tags
```

## ✅ Success Checklist

You know everything is working when:

- [ ] Backend shows: `Now listening on: http://localhost:5000`
- [ ] Frontend shows: `Application bundle generation complete`
- [ ] Chrome opens to `http://localhost:4200`
- [ ] You can see the CodeMentorAI interface
- [ ] Models appear in the dropdown
- [ ] Chat responds to messages

---

**🎉 Congratulations! You're ready to use CodeMentorAI!**

For more detailed information, see `VISUAL_STUDIO_GUIDE.md`.

