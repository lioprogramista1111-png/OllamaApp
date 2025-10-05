# 🧪 Visual Studio Testing Guide

This guide will help you test running CodeMentorAI from Visual Studio.

## ✅ Pre-Test Checklist

Before opening Visual Studio, verify:

- [ ] **Ollama is running**
  ```powershell
  # Test Ollama
  curl http://localhost:11434/api/tags
  ```

- [ ] **Node.js is installed**
  ```powershell
  node --version
  # Should show v18.x or higher
  ```

- [ ] **Angular CLI is available**
  ```powershell
  ng version
  # Or install globally: npm install -g @angular/cli
  ```

- [ ] **Frontend dependencies installed**
  ```powershell
  cd src\CodeMentorAI.Web
  npm install
  ```

- [ ] **No other processes using ports 5000 or 4200**
  ```powershell
  # Check port 5000
  netstat -ano | findstr :5000
  
  # Check port 4200
  netstat -ano | findstr :4200
  ```

## 🎯 Test 1: Open Solution in Visual Studio

### Steps:

1. **Open Visual Studio 2022**

2. **Open the Solution:**
   - Click **File → Open → Project/Solution**
   - Navigate to: `C:\Users\liopr\Desktop\Test111\OllamaApp`
   - Select: `CodeMentorAI.sln`
   - Click **Open**

3. **Verify Solution Structure:**
   - In Solution Explorer, you should see:
     ```
     Solution 'CodeMentorAI'
     ├── 📁 Backend
     │   ├── CodeMentorAI.API
     │   ├── CodeMentorAI.Core
     │   └── CodeMentorAI.Infrastructure
     ├── 📁 Frontend
     ├── 📁 Solution Items
     │   ├── .editorconfig
     │   ├── .gitignore
     │   └── README.md
     ├── 📁 docs
     │   └── (documentation files)
     └── 📁 scripts
         └── (startup scripts)
     ```

### ✅ Expected Result:
- Solution opens without errors
- All projects load successfully
- Solution folders are organized

## 🎯 Test 2: Build the Solution

### Steps:

1. **Build the Solution:**
   - Press `Ctrl+Shift+B`
   - Or: **Build → Build Solution**

2. **Check Output Window:**
   - View → Output
   - Should show: `Build succeeded`

### ✅ Expected Result:
- Build completes successfully
- No build errors
- May see 1 warning about System.IdentityModel.Tokens.Jwt (this is expected)

## 🎯 Test 3: Run Backend Only (F5)

### Steps:

1. **Select Launch Profile:**
   - Click the dropdown next to the green **Start** button
   - Select: **CodeMentorAI.API (Backend Only)**

2. **Start Debugging:**
   - Press **F5**
   - Or click the green **Start** button

3. **Verify Backend Started:**
   - Check the Output window
   - Should see: `Now listening on: http://localhost:5000`
   - Should see: `File system watcher started successfully`

4. **Test Backend API:**
   - Open browser manually
   - Go to: `http://localhost:5000/api/models`
   - Should see JSON list of models

5. **Stop Debugging:**
   - Press `Shift+F5`
   - Or click the red **Stop** button

### ✅ Expected Result:
- Backend starts without errors
- API responds at http://localhost:5000
- No browser opens (Backend Only profile)

## 🎯 Test 4: Run with Browser Launch (F5)

### Steps:

1. **Select Default Launch Profile:**
   - Click the dropdown next to the **Start** button
   - Select: **CodeMentorAI.API** (default)

2. **Start Debugging:**
   - Press **F5**

3. **Verify Backend Started:**
   - Check Output window
   - Should see: `Now listening on: http://localhost:5000`

4. **Verify Browser Opens:**
   - Chrome should open automatically
   - URL should be: `http://localhost:4200`
   - **Note:** Frontend won't load yet (we haven't started Angular)

5. **Keep Backend Running**
   - Don't stop the debugger yet

### ✅ Expected Result:
- Backend starts successfully
- Chrome opens to http://localhost:4200
- Backend is running and ready for frontend

## 🎯 Test 5: Start Frontend Manually

### Steps:

1. **With Backend Still Running from Test 4:**

2. **Open Terminal in Visual Studio:**
   - Press `Ctrl+` ` (Ctrl + backtick)
   - Or: **View → Terminal**

3. **Navigate to Frontend:**
   ```powershell
   cd src\CodeMentorAI.Web
   ```

4. **Start Angular Dev Server:**
   ```powershell
   ng serve
   ```

5. **Wait for Build:**
   - Should see: `Application bundle generation complete`
   - Should see: `Local: http://localhost:4200/`

6. **Refresh Browser:**
   - Go back to Chrome (should still be open at http://localhost:4200)
   - Press `F5` to refresh
   - **CodeMentorAI app should now load!**

7. **Test the Application:**
   - Check if models appear in dropdown
   - Try navigating to different pages
   - Test chat functionality

### ✅ Expected Result:
- Frontend builds successfully
- App loads in Chrome
- Models appear in dropdown
- All features work

## 🎯 Test 6: Use Visual Studio Tasks

### Steps:

1. **Stop All Running Processes:**
   - Stop the debugger (`Shift+F5`)
   - Stop the Angular dev server (`Ctrl+C` in terminal)

2. **Open Task Runner Explorer:**
   - **View → Other Windows → Task Runner Explorer**
   - Or search for "Task Runner" in Quick Launch (`Ctrl+Q`)

3. **You Should See These Tasks:**
   - Start Full Application
   - Start Frontend (Angular)
   - Start Backend (API)
   - Install Frontend Dependencies
   - Build Frontend
   - Check Ollama Status

4. **Test "Check Ollama Status" Task:**
   - Double-click: **Check Ollama Status**
   - Should show Ollama is running and list models

5. **Test "Start Backend (API)" Task:**
   - Double-click: **Start Backend (API)**
   - Should start backend in a new terminal window

### ✅ Expected Result:
- Task Runner Explorer shows all tasks
- Tasks execute successfully
- Backend starts from task

## 🎯 Test 7: Use Startup Script

### Steps:

1. **Stop All Running Processes**

2. **Find Startup Script in Solution Explorer:**
   - Expand: **scripts** folder
   - Find: `start-app.bat`

3. **Run the Script:**
   - Right-click `start-app.bat`
   - Select: **Open**
   - Or: **Open With → Command Prompt**

4. **Watch the Script:**
   - Should check Ollama
   - Should check Node.js
   - Should start backend
   - Should start frontend
   - Should open Chrome

5. **Verify Everything Started:**
   - Backend running on http://localhost:5000
   - Frontend running on http://localhost:4200
   - Chrome opens automatically
   - App loads successfully

### ✅ Expected Result:
- Script runs without errors
- Both backend and frontend start
- Chrome opens automatically
- App is fully functional

## 🎯 Test 8: Debugging

### Steps:

1. **Set a Breakpoint:**
   - Open: `src\CodeMentorAI.API\Controllers\ModelsController.cs`
   - Find the `GetModels()` method
   - Click in the left margin to set a breakpoint (red dot)

2. **Start Debugging:**
   - Press **F5**

3. **Trigger the Breakpoint:**
   - In Chrome, refresh the page or navigate to Model Management
   - Visual Studio should hit the breakpoint
   - Execution should pause

4. **Inspect Variables:**
   - Hover over variables to see values
   - Check the Locals window
   - Check the Call Stack

5. **Continue Execution:**
   - Press **F5** to continue
   - Or **F10** to step over
   - Or **F11** to step into

### ✅ Expected Result:
- Breakpoint hits successfully
- Can inspect variables
- Can step through code
- Debugging works perfectly

## 🎯 Test 9: Hot Reload

### Steps:

1. **With Both Backend and Frontend Running:**

2. **Test Backend Hot Reload:**
   - Open: `src\CodeMentorAI.API\Controllers\ModelsController.cs`
   - Find the `GetModels()` method
   - Add a log statement:
     ```csharp
     _logger.LogInformation("🔥 Hot reload test!");
     ```
   - Save the file
   - Check Output window - should see hot reload message

3. **Test Frontend Hot Reload:**
   - Open: `src\CodeMentorAI.Web\src\app\full-app.component.ts`
   - Change the title or any text
   - Save the file
   - Chrome should automatically refresh
   - Changes should appear immediately

### ✅ Expected Result:
- Backend hot reload works
- Frontend hot reload works
- No manual restart needed

## 🎯 Test 10: EditorConfig

### Steps:

1. **Open a C# File:**
   - Open any `.cs` file

2. **Test Auto-Formatting:**
   - Add some poorly formatted code:
     ```csharp
     public void Test(){var x=1;var y=2;}
     ```
   - Press `Ctrl+K, Ctrl+D` (Format Document)
   - Should auto-format to:
     ```csharp
     public void Test()
     {
         var x = 1;
         var y = 2;
     }
     ```

3. **Verify EditorConfig is Active:**
   - Bottom right of Visual Studio should show: "EditorConfig"
   - Code style should match .editorconfig rules

### ✅ Expected Result:
- Auto-formatting works
- EditorConfig is active
- Code style is consistent

## 📋 Complete Test Checklist

- [ ] Solution opens in Visual Studio
- [ ] Solution structure is organized with folders
- [ ] Solution builds successfully
- [ ] Backend starts with F5
- [ ] Browser opens to http://localhost:4200
- [ ] Frontend starts with `ng serve`
- [ ] App loads and works in Chrome
- [ ] Task Runner Explorer shows tasks
- [ ] Tasks execute successfully
- [ ] Startup script works
- [ ] Debugging works (breakpoints hit)
- [ ] Hot reload works (backend and frontend)
- [ ] EditorConfig is active
- [ ] All documentation accessible in Solution Explorer

## 🐛 Troubleshooting

### "Solution failed to load"
- Make sure you're using Visual Studio 2022
- Install .NET 8.0 SDK
- Restart Visual Studio

### "Build failed"
- Clean solution: **Build → Clean Solution**
- Rebuild: **Build → Rebuild Solution**
- Check Output window for errors

### "Backend won't start"
- Check if port 5000 is in use
- Check if Ollama is running
- Check Output window for errors

### "Frontend won't build"
- Run `npm install` in `src\CodeMentorAI.Web`
- Check Node.js version (need 18+)
- Clear npm cache: `npm cache clean --force`

### "Browser doesn't open"
- Check launchSettings.json
- Verify `launchBrowser: true`
- Verify `launchUrl: "http://localhost:4200"`

### "Task Runner Explorer is empty"
- Check if `.vs\tasks.vs.json` exists
- Close and reopen Visual Studio
- Rebuild solution

## ✅ Success Criteria

You've successfully tested Visual Studio integration when:

1. ✅ Solution opens and builds without errors
2. ✅ F5 starts the backend and opens Chrome
3. ✅ Frontend starts with `ng serve` and app loads
4. ✅ Debugging works (breakpoints, stepping, inspection)
5. ✅ Hot reload works for both backend and frontend
6. ✅ Tasks are available in Task Runner Explorer
7. ✅ Startup script works end-to-end
8. ✅ EditorConfig enforces code style
9. ✅ All documentation is accessible from Solution Explorer
10. ✅ You can develop comfortably in Visual Studio

## 🎉 Next Steps

Once all tests pass:

1. **Start Developing:**
   - Make changes to the code
   - Use debugging features
   - Leverage hot reload

2. **Explore Documentation:**
   - All docs in Solution Explorer under `docs` folder
   - Quick reference guides available

3. **Use Productivity Features:**
   - Keyboard shortcuts
   - Code snippets
   - IntelliSense
   - Refactoring tools

---

**Happy Testing! 🚀**

If you encounter any issues, check the troubleshooting section or refer to the documentation in the `docs/` folder.

