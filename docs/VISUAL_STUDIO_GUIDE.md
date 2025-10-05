# Visual Studio Guide for CodeMentorAI

This guide will help you work with the CodeMentorAI project in Visual Studio.

## 📋 Prerequisites

- **Visual Studio 2022** (Community, Professional, or Enterprise)
- **.NET 8.0 SDK** or later
- **Node.js 18+** and **npm** (for Angular frontend)
- **Ollama** installed and running on `http://localhost:11434`

## 🚀 Opening the Solution

1. **Open Visual Studio 2022**
2. Click **File → Open → Project/Solution**
3. Navigate to the project folder and select `CodeMentorAI.sln`
4. The solution will open with the following structure:

```
CodeMentorAI Solution
├── 📁 Backend
│   ├── CodeMentorAI.API (ASP.NET Core Web API)
│   ├── CodeMentorAI.Core (Domain Models)
│   └── CodeMentorAI.Infrastructure (Services & Data Access)
├── 📁 Frontend
│   └── (Angular 17+ application in src/CodeMentorAI.Web)
└── 📁 Documentation
    ├── README.md
    ├── SETUP.md
    └── Other documentation files
```

## 🔧 Building the Backend

### Option 1: Using Visual Studio UI

1. **Set Startup Project:**
   - Right-click on `CodeMentorAI.API` in Solution Explorer
   - Select **Set as Startup Project**

2. **Build the Solution:**
   - Press `Ctrl+Shift+B` or
   - Click **Build → Build Solution**

3. **Run the Backend:**
   - Press `F5` (with debugging) or `Ctrl+F5` (without debugging)
   - The API will start on `http://localhost:5000`

### Option 2: Using Package Manager Console

1. Open **Tools → NuGet Package Manager → Package Manager Console**
2. Run:
   ```powershell
   cd src\CodeMentorAI.API
   dotnet run
   ```

## 🎨 Running the Frontend

The Angular frontend needs to be run separately from the command line or integrated terminal.

### Using Visual Studio Terminal

1. **Open Terminal:**
   - Click **View → Terminal** or press `Ctrl+` `
   
2. **Navigate to Frontend:**
   ```powershell
   cd src\CodeMentorAI.Web
   ```

3. **Install Dependencies (first time only):**
   ```powershell
   npm install
   ```

4. **Start Development Server:**
   ```powershell
   ng serve
   ```
   
5. **Access the App:**
   - Open browser to `http://localhost:4200`

## 🐛 Debugging

### Backend Debugging

1. **Set Breakpoints:**
   - Click in the left margin of any `.cs` file to set breakpoints

2. **Start Debugging:**
   - Press `F5` or click the green **Start** button
   - Visual Studio will attach the debugger to the API

3. **Debug Features:**
   - **Breakpoints:** Pause execution at specific lines
   - **Watch Window:** Monitor variable values
   - **Immediate Window:** Execute code during debugging
   - **Call Stack:** View the execution path

### Frontend Debugging

1. **Browser DevTools:**
   - Press `F12` in your browser
   - Use the **Sources** tab to debug TypeScript/JavaScript

2. **Visual Studio Code (Recommended for Angular):**
   - Install the **Angular Language Service** extension
   - Better TypeScript/Angular debugging support

## 📦 NuGet Packages

The solution uses the following key packages:

- **Microsoft.AspNetCore.SignalR** - Real-time communication
- **Microsoft.Extensions.Caching.Memory** - In-memory caching
- **Swashbuckle.AspNetCore** - API documentation (Swagger)

### Managing Packages

1. **NuGet Package Manager:**
   - Right-click on a project → **Manage NuGet Packages**
   
2. **Package Manager Console:**
   ```powershell
   Install-Package PackageName
   Update-Package PackageName
   ```

## 🔍 Solution Explorer Tips

### Useful Shortcuts

- `Ctrl+;` - Search Solution Explorer
- `Ctrl+Shift+A` - Add new item
- `Alt+Shift+C` - Add new class
- `F7` - View code
- `Shift+F7` - View designer (if applicable)

### Project Organization

- **Controllers/** - API endpoints
- **Services/** - Business logic
- **Models/** - Data models
- **Hubs/** - SignalR hubs for real-time communication

## ⚙️ Configuration

### appsettings.json

Located in `src/CodeMentorAI.API/appsettings.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information"
    }
  },
  "AllowedHosts": "*",
  "Ollama": {
    "BaseUrl": "http://localhost:11434"
  }
}
```

### launchSettings.json

Located in `src/CodeMentorAI.API/Properties/launchSettings.json`:

- Configures how the application runs in Visual Studio
- Sets environment variables
- Defines application URLs

## 🧪 Testing

### Running Tests (if available)

1. **Test Explorer:**
   - Click **Test → Test Explorer** or press `Ctrl+E, T`
   
2. **Run All Tests:**
   - Click **Run All** in Test Explorer
   
3. **Debug Tests:**
   - Right-click a test → **Debug**

## 🔄 Git Integration

Visual Studio has built-in Git support:

1. **Team Explorer:**
   - Click **View → Team Explorer** or press `Ctrl+0, Ctrl+M`

2. **Common Operations:**
   - **Commit:** `Ctrl+0, Ctrl+G` → Enter message → Commit All
   - **Push:** Team Explorer → Sync → Push
   - **Pull:** Team Explorer → Sync → Pull
   - **Branches:** Team Explorer → Branches

## 🚀 Running Both Backend and Frontend

### ⭐ Option 1: One-Click Startup (RECOMMENDED)

The easiest way to run the entire application:

1. **Press F5** or click the **Start** button in Visual Studio
2. Visual Studio will:
   - Start the backend API on `http://localhost:5000`
   - Automatically open Chrome to `http://localhost:4200` (frontend)
3. The frontend will start automatically in a separate process

**Note:** The first time you run, you may need to wait for `npm install` to complete in the frontend directory.

### Option 2: Use the Startup Script

Run the complete application with one command:

1. **Right-click** on `start-app.bat` in Solution Explorer
2. Select **Open With → Command Prompt**

Or from PowerShell:
```powershell
.\start-app.ps1
```

This script will:
- ✅ Check if Ollama is running
- ✅ Check Node.js installation
- ✅ Install frontend dependencies if needed
- ✅ Start the backend API
- ✅ Start the frontend and open Chrome
- ✅ Show status of both services

### Option 3: Use Visual Studio Tasks

1. **View → Task Runner Explorer** (or **View → Other Windows → Task Runner Explorer**)
2. You'll see these tasks:
   - **Start Full Application** - Starts both backend and frontend
   - **Start Frontend (Angular)** - Frontend only
   - **Start Backend (API)** - Backend only
   - **Install Frontend Dependencies** - Run npm install
   - **Build Frontend** - Build Angular app
   - **Check Ollama Status** - Verify Ollama is running

3. **Double-click** any task to run it

### Option 4: Manual Startup

1. **Terminal 1 (Backend):**
   - Press `F5` in Visual Studio to start the API
   - Or right-click `CodeMentorAI.API` → **Debug → Start New Instance**

2. **Terminal 2 (Frontend):**
   - Open Visual Studio Terminal (`Ctrl+` `)
   - Run:
     ```powershell
     cd src\CodeMentorAI.Web
     ng serve --open
     ```

### 🌐 Launch Profiles

Visual Studio includes multiple launch profiles:

- **CodeMentorAI.API** (Default) - Starts backend and opens Chrome to frontend
- **CodeMentorAI.API (Backend Only)** - Starts backend without opening browser
- **CodeMentorAI.API (Production)** - Runs in Production mode
- **IIS Express** - Runs using IIS Express

To switch profiles:
1. Click the dropdown next to the **Start** button
2. Select your preferred profile

## 📝 Code Snippets

Visual Studio includes useful code snippets:

- `ctor` + Tab - Create constructor
- `prop` + Tab - Create property
- `cw` + Tab - Console.WriteLine
- `for` + Tab - For loop
- `if` + Tab - If statement

## 🎯 Productivity Tips

1. **IntelliSense:**
   - Press `Ctrl+Space` to trigger IntelliSense
   - Press `Ctrl+.` for Quick Actions and Refactorings

2. **Code Navigation:**
   - `F12` - Go to Definition
   - `Ctrl+F12` - Go to Implementation
   - `Shift+F12` - Find All References
   - `Ctrl+T` - Go to All (files, types, members)

3. **Refactoring:**
   - `Ctrl+R, Ctrl+R` - Rename
   - `Ctrl+R, Ctrl+M` - Extract Method
   - `Ctrl+.` - Quick Actions menu

4. **Code Formatting:**
   - `Ctrl+K, Ctrl+D` - Format Document
   - `Ctrl+K, Ctrl+F` - Format Selection

## 🔧 Troubleshooting

### Build Errors

1. **Clean Solution:**
   - **Build → Clean Solution**
   - **Build → Rebuild Solution**

2. **Restore NuGet Packages:**
   - Right-click solution → **Restore NuGet Packages**

3. **Clear NuGet Cache:**
   ```powershell
   dotnet nuget locals all --clear
   ```

### Port Already in Use

If port 5000 is already in use:

1. Edit `launchSettings.json`
2. Change `applicationUrl` to a different port
3. Update frontend API calls to match

### Ollama Not Running

Ensure Ollama is running:
```powershell
# Check if Ollama is running
curl http://localhost:11434/api/tags
```

## 📚 Additional Resources

- [ASP.NET Core Documentation](https://docs.microsoft.com/aspnet/core)
- [Angular Documentation](https://angular.io/docs)
- [Visual Studio Documentation](https://docs.microsoft.com/visualstudio)
- [Ollama Documentation](https://ollama.ai/docs)

## 🆘 Getting Help

- Check the main `README.md` for project overview
- See `SETUP.md` for detailed setup instructions
- Review `MODEL_MANAGEMENT_SIMPLIFIED.md` for model management features

---

**Happy Coding! 🎉**

