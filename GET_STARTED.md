# 🚀 Get Started with CodeMentorAI

Welcome to CodeMentorAI! This guide will help you get started quickly.

## ⚡ Quick Start (5 Minutes)

### Prerequisites

Make sure you have:
- ✅ Visual Studio 2022
- ✅ .NET 8.0 SDK
- ✅ Node.js 18+
- ✅ Ollama installed and running

### Option 1: One-Click Start (Easiest)

1. **Open the solution:**
   ```
   Double-click CodeMentorAI.sln
   ```

2. **Install frontend dependencies (first time only):**
   - Open Terminal in Visual Studio (`Ctrl+` `)
   - Run:
     ```powershell
     cd src\CodeMentorAI.Web
     npm install
     ```

3. **Start the application:**
   - Press **F5**
   - Backend starts automatically
   - Chrome opens to the frontend

4. **Start the frontend:**
   - Open another Terminal
   - Run:
     ```powershell
     cd src\CodeMentorAI.Web
     ng serve
     ```

**Done! 🎉**

### Option 2: Automated Script

1. **Run the startup script:**
   ```powershell
   .\scripts\start-app.ps1
   ```

2. **Wait for the success message:**
   ```
   🎉 CodeMentorAI Application Started Successfully!
   ```

**Done! 🎉**

## 📚 Documentation

All documentation is in the `docs/` folder:

### Essential Reading

1. **[Quick Start (Visual Studio)](docs/QUICKSTART_VISUAL_STUDIO.md)**
   - Detailed 5-minute quick start
   - Troubleshooting guide
   - Multiple startup methods

2. **[Visual Studio Guide](docs/VISUAL_STUDIO_GUIDE.md)**
   - Complete development guide
   - Debugging tips
   - Keyboard shortcuts
   - Productivity tips

3. **[Setup Guide](docs/SETUP.md)**
   - Detailed installation
   - Configuration
   - Environment setup

### Feature Documentation

- **[Model Management](docs/MODEL_MANAGEMENT.md)** - Managing AI models
- **[Chat Features](docs/CHAT_FOCUS_IMPROVEMENTS.md)** - Chat interface
- **[Code Validation](docs/CODE_VALIDATION_FEATURE.md)** - Code validation
- **[Optimizations](docs/OPTIMIZATION_SUMMARY.md)** - Performance improvements

## 🎯 What You Can Do

### 1. Chat with AI Models

- Select a model from the dropdown
- Click "Chat" in the sidebar
- Ask questions and get help

### 2. Manage Models

- Click "Model Management" in the sidebar
- Download new models
- Remove unused models
- View model information

### 3. Analyze Code

- Upload or paste code
- Get AI-powered analysis
- Receive suggestions and improvements

### 4. Validate Code

- Check code quality
- Get security insights
- Receive performance recommendations

## 🔧 Visual Studio Features

### Launch Profiles

Switch between profiles using the dropdown next to the Start button:

- **CodeMentorAI.API** - Default, opens browser
- **CodeMentorAI.API (Backend Only)** - No browser
- **CodeMentorAI.API (Production)** - Production mode
- **IIS Express** - Runs with IIS Express

### Visual Studio Tasks

Access via **View → Task Runner Explorer**:

- **Start Full Application** - Complete startup
- **Start Frontend (Angular)** - Frontend only
- **Start Backend (API)** - Backend only
- **Install Frontend Dependencies** - npm install
- **Build Frontend** - ng build
- **Check Ollama Status** - Verify Ollama

### Keyboard Shortcuts

- `F5` - Start with debugging
- `Ctrl+F5` - Start without debugging
- `Shift+F5` - Stop debugging
- `Ctrl+` ` - Open terminal
- `Ctrl+Shift+B` - Build solution

## 🌐 Application URLs

Once running:

- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:5000
- **Ollama:** http://localhost:11434

## 🐛 Troubleshooting

### "Ollama is not running"

```powershell
# Start Ollama
ollama serve

# Or check if it's running
curl http://localhost:11434/api/tags
```

### "Port 5000 is already in use"

Change the port in `src/CodeMentorAI.API/Properties/launchSettings.json`

### "ng: command not found"

```powershell
# Install Angular CLI globally
npm install -g @angular/cli

# Or use local version
cd src\CodeMentorAI.Web
npx ng serve
```

### "npm install fails"

```powershell
# Clear cache and reinstall
npm cache clean --force
cd src\CodeMentorAI.Web
Remove-Item -Recurse -Force node_modules
npm install
```

## 📁 Project Structure

```
CodeMentorAI/
├── src/
│   ├── CodeMentorAI.API/          # Backend API
│   ├── CodeMentorAI.Core/         # Domain models
│   ├── CodeMentorAI.Infrastructure/ # Services
│   └── CodeMentorAI.Web/          # Angular frontend
├── docs/                          # Documentation
├── scripts/                       # Utility scripts
├── CodeMentorAI.sln              # Visual Studio solution
└── README.md                      # Project overview
```

## ✅ Success Checklist

You know everything is working when:

- [ ] Backend shows: `Now listening on: http://localhost:5000`
- [ ] Frontend shows: `Application bundle generation complete`
- [ ] Chrome opens to `http://localhost:4200`
- [ ] You can see the CodeMentorAI interface
- [ ] Models appear in the dropdown
- [ ] Chat responds to messages

## 🎓 Next Steps

1. **Explore the Features:**
   - Try the chat interface
   - Download a new model
   - Analyze some code

2. **Read the Documentation:**
   - [Visual Studio Guide](docs/VISUAL_STUDIO_GUIDE.md)
   - [Model Management](docs/MODEL_MANAGEMENT.md)
   - [Optimization Summary](docs/OPTIMIZATION_SUMMARY.md)

3. **Start Developing:**
   - Set breakpoints in backend code
   - Make changes to the frontend
   - Hot reload is enabled!

## 🆘 Need More Help?

- **Quick Start:** [docs/QUICKSTART_VISUAL_STUDIO.md](docs/QUICKSTART_VISUAL_STUDIO.md)
- **Visual Studio Guide:** [docs/VISUAL_STUDIO_GUIDE.md](docs/VISUAL_STUDIO_GUIDE.md)
- **Setup Guide:** [docs/SETUP.md](docs/SETUP.md)
- **Main README:** [README.md](README.md)

---

**🎉 Happy Coding!**

For detailed information, see the [documentation folder](docs/).

