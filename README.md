# 🤖 CodeMentorAI - Intelligent Code Assistant

A comprehensive Angular + .NET Core application that provides intelligent code assistance using local Ollama models with advanced model switching capabilities.

![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)
![Angular](https://img.shields.io/badge/Angular-17+-DD0031?logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 🔄 Dynamic Model Switching
- **Real-time Model Selection** - Switch between different Ollama models instantly
- **Live Status Updates** - Real-time model status via SignalR
- **Model Performance Monitoring** - Track response times and resource usage

### 📊 Comprehensive Model Management
- **Visual Dashboard** - Manage all your Ollama models from a beautiful UI
- **Easy Installation** - Download new models directly from the interface
- **Quick Removal** - Remove unused models with confirmation dialog
- **Real-time Updates** - Automatic model list refresh via SignalR

### 💬 AI-Powered Features
- **Interactive Chat** - Ask questions and get help with coding problems
- **Code Analysis** - Deep code analysis with suggestions
- **Code Validation** - AI-powered code review with insights
- **Multiple Models** - Support for various Ollama models

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Angular 17+   │    │   .NET Core 8    │    │   Ollama API    │
│                 │    │                  │    │                 │
│ • Model Selector│◄──►│ • Model Service  │◄──►│ • Multiple      │
│ • Dashboard     │    │ • SignalR Hub    │    │   Models        │
│ • Real-time UI  │    │ • File Watcher   │    │ • Model Mgmt    │
│ • Chat Interface│    │ • Caching        │    │ • Local AI      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Ollama** - [Download](https://ollama.ai)
- **Node.js 18+** - [Download](https://nodejs.org)
- **.NET 8 SDK** - [Download](https://dotnet.microsoft.com/download)
- **Visual Studio 2022** (recommended) or VS Code

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/CodeMentorAI.git
   cd CodeMentorAI
   ```

2. **Install Ollama and download a model:**
   ```bash
   ollama pull tinyllama
   ```

3. **Install frontend dependencies:**
   ```bash
   cd src/CodeMentorAI.Web
   npm install
   ```

### Running the Application

#### Option 1: Visual Studio (Recommended) - Auto-Start Ollama

1. **Quick Start:** Double-click `START_OLLAMA.bat` to start Ollama first (optional)
2. Open `CodeMentorAI.sln` in Visual Studio 2022
3. Press **F5** to start the backend (Ollama will start automatically if not running)
4. Open a terminal and run:
   ```bash
   cd src/CodeMentorAI.Web
   ng serve
   ```
5. Open browser to `http://localhost:4200`

**✨ New: Ollama Auto-Start** - The backend now automatically starts Ollama if it's not running!

**See [Quick Start Guide](docs/QUICKSTART_VISUAL_STUDIO.md) for detailed instructions.**

#### Option 2: Automated Script

```powershell
.\scripts\start-app.ps1
```

This will:
- ✅ Check prerequisites
- ✅ Start backend API
- ✅ Start frontend
- ✅ Open browser automatically

#### Option 3: Manual

**Terminal 1 - Backend:**
```bash
cd src/CodeMentorAI.API
dotnet run
```

**Terminal 2 - Frontend:**
```bash
cd src/CodeMentorAI.Web
ng serve
```

Open browser to `http://localhost:4200`

## 📚 Documentation

- **[Get Started](GET_STARTED.md)** - Quick start guide
- **[Visual Studio Guide](docs/VISUAL_STUDIO_GUIDE.md)** - Complete VS development guide
- **[Setup Guide](docs/SETUP.md)** - Detailed installation instructions
- **[Model Management](docs/MODEL_MANAGEMENT.md)** - Managing AI models
- **[Testing Guide](VISUAL_STUDIO_TEST_GUIDE.md)** - Testing with Visual Studio

## 🎯 Usage

### Chat with AI Models

1. Select a model from the dropdown in the sidebar
2. Click **Chat** in the navigation
3. Type your question and press Enter
4. Get AI-powered responses

### Manage Models

1. Click **Model Management** in the sidebar
2. View all installed models
3. Download new models by entering the model name
4. Remove models with the delete button

### Code Analysis

1. Navigate to the code analysis section
2. Upload or paste your code
3. Get AI-powered suggestions and improvements

## 🛠️ Technology Stack

### Backend
- **ASP.NET Core 8.0** - Web API framework
- **SignalR** - Real-time communication
- **HttpClient** - Ollama API integration
- **IMemoryCache** - Performance optimization
- **File System Watcher** - Model change detection

### Frontend
- **Angular 17+** - Modern web framework
- **TypeScript 5.0+** - Type-safe development
- **RxJS** - Reactive programming
- **Standalone Components** - Modern Angular architecture
- **CSS3** - Beautiful, responsive UI

### AI/ML
- **Ollama** - Local AI model runtime
- **Multiple Models** - Support for various LLMs

## 📁 Project Structure

```
CodeMentorAI/
├── src/
│   ├── CodeMentorAI.API/          # ASP.NET Core Web API
│   ├── CodeMentorAI.Core/         # Domain models and interfaces
│   ├── CodeMentorAI.Infrastructure/ # Services and data access
│   └── CodeMentorAI.Web/          # Angular frontend
├── docs/                          # Documentation
├── scripts/                       # Utility scripts
├── .editorconfig                  # Code style rules
├── .gitignore                     # Git ignore rules
├── CodeMentorAI.sln              # Visual Studio solution
└── README.md                      # This file
```

## 🔧 Configuration

### Backend Configuration

Edit `src/CodeMentorAI.API/appsettings.json`:

```json
{
  "OllamaSettings": {
    "BaseUrl": "http://localhost:11434"
  }
}
```

### Frontend Configuration

Edit `src/CodeMentorAI.Web/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000'
};
```

## 🧪 Testing

### Run Backend Tests
```bash
cd src/CodeMentorAI.API
dotnet test
```

### Run Frontend Tests
```bash
cd src/CodeMentorAI.Web
ng test
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ollama** - For providing the local AI model runtime
- **Angular Team** - For the amazing frontend framework
- **Microsoft** - For .NET Core and SignalR
- **Community** - For all the open-source contributions

## 📧 Contact

- **GitHub Issues** - For bug reports and feature requests
- **Discussions** - For questions and community support

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

---

**Made with ❤️ by the CodeMentorAI Team**

