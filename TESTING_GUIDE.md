# 🧪 CodeMentorAI - Complete Testing Guide

## 📋 Overview

This guide provides step-by-step instructions to thoroughly test the CodeMentorAI application. Follow these tests in order to ensure everything works correctly.

## 🎯 Prerequisites Check

Before starting any tests, verify these requirements:

### ✅ Step 1: Check Required Software
```powershell
# Check .NET 8.0 SDK
dotnet --version
# Should show 8.0.x

# Check Node.js (18+)
node --version
# Should show v18.x or higher

# Check npm
npm --version

# Check Angular CLI
ng version
# If not installed: npm install -g @angular/cli
```

### ✅ Step 2: Verify Ollama Installation
```powershell
# Check if Ollama is installed
ollama --version

# Check if Ollama is running
curl http://localhost:11434/api/tags
# Should return JSON with model list

# If Ollama not running, start it:
ollama serve
```

### ✅ Step 3: Check Available Models
```powershell
# List installed models
ollama list

# If no models, install at least one:
ollama pull tinyllama    # Small, fast model for testing
ollama pull llama3.2     # Recommended general model
```

### ✅ Step 4: Check Port Availability
```powershell
# Check if ports are free
netstat -ano | findstr :4200  # Frontend port
netstat -ano | findstr :5000  # Backend port
netstat -ano | findstr :11434 # Ollama port

# If ports are in use, kill the processes:
# taskkill /PID <process_id> /F
```

## 🚀 Test 1: Initial Setup and Dependencies

### Step 1.1: Install Frontend Dependencies
```powershell
cd src\CodeMentorAI.Web
npm install
```
**Expected Result**: No errors, `node_modules` folder created

### Step 1.2: Restore Backend Packages
```powershell
cd ..\CodeMentorAI.API
dotnet restore
```
**Expected Result**: All packages restored successfully

### Step 1.3: Build Solution
```powershell
# From project root
dotnet build
```
**Expected Result**: Build succeeded with no errors

## 🎯 Test 2: Backend API Testing

### Step 2.1: Start Backend Only
```powershell
cd src\CodeMentorAI.API
dotnet run
```

**Expected Output:**
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5000
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
🚀 Starting CodeMentorAI - Checking Ollama status...
✅ Ollama is ready - CodeMentorAI can start normally
```

### Step 2.2: Test API Endpoints
Open a new terminal and test these endpoints:

```powershell
# Test health endpoint
curl http://localhost:5000/health
# Expected: "Healthy"

# Test models endpoint
curl http://localhost:5000/api/models
# Expected: JSON array of available models

# Test specific model info (replace 'tinyllama' with your model)
curl http://localhost:5000/api/models/tinyllama
# Expected: JSON object with model details
```

### Step 2.3: Test Code Analysis Endpoint
```powershell
# Test code analysis
curl -X POST http://localhost:5000/api/codeanalysis `
  -H "Content-Type: application/json" `
  -d '{
    "code": "function test() { var x = 1; return x; }",
    "language": "javascript",
    "model": "tinyllama",
    "focus": "codeQuality"
  }'
```
**Expected**: JSON response with analysis feedback

**Keep backend running for next tests**

## 🎯 Test 3: Frontend Testing

### Step 3.1: Start Frontend (New Terminal)
```powershell
cd src\CodeMentorAI.Web
ng serve
```

**Expected Output:**
```
✔ Browser application bundle generation complete.
Initial Chunk Files | Names         |  Raw Size
vendor.js           | vendor        |   2.5 MB |
main.js             | main          | 500.0 kB |

Local:   http://localhost:4200/
```

### Step 3.2: Open Application in Browser
1. Open Chrome/Edge
2. Navigate to: `http://localhost:4200`
3. **Expected**: CodeMentorAI interface loads

### Step 3.3: Test UI Components
1. **Header**: Should show "CodeMentor AI" title
2. **Sidebar**: Should show navigation menu
3. **Model Selector**: Should show dropdown with available models
4. **Main Content**: Should show dashboard or default view

## 🎯 Test 4: Core Functionality Testing

### Step 4.1: Test Model Selection
1. Click on model dropdown in sidebar
2. **Expected**: List of available models appears
3. Select a different model
4. **Expected**: Model switches successfully, UI updates

### Step 4.2: Test Chat Functionality
1. Click "Ollama Chat" in sidebar
2. Type a simple message: "Hello, can you help me with coding?"
3. Press Enter or click Send
4. **Expected**: 
   - Loading indicator appears
   - AI response appears within 30 seconds
   - Message history is maintained

### Step 4.3: Test Code Analysis
1. Click "Code Analysis" in sidebar
2. Paste this test code:
   ```javascript
   function calculateTotal(items) {
     var total = 0;
     for (var i = 0; i < items.length; i++) {
       total += items[i].price;
     }
     return total;
   }
   ```
3. Select "Code Quality" focus
4. Click "Analyze Code"
5. **Expected**:
   - Loading indicator appears
   - Analysis results appear with suggestions
   - Feedback includes improvement recommendations

### Step 4.4: Test Model Management
1. Click "Model Management" in sidebar
2. **Expected**: Dashboard showing installed models
3. Check model information displays correctly
4. Verify performance metrics (if available)

## 🎯 Test 5: Real-time Features Testing

### Step 5.1: Test SignalR Connection
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for SignalR connection messages
4. **Expected**: No connection errors, successful SignalR connection

### Step 5.2: Test Model Switching Events
1. Switch models using the dropdown
2. Check console for real-time events
3. **Expected**: Model switch events logged in console

### Step 5.3: Test Multiple Browser Windows
1. Open a second browser window to `http://localhost:4200`
2. Switch models in one window
3. **Expected**: Both windows should update simultaneously

## 🎯 Test 6: Error Handling Testing

### Step 6.1: Test Offline Ollama
1. Stop Ollama service (`Ctrl+C` in Ollama terminal)
2. Try to send a chat message
3. **Expected**: Error message about Ollama being unavailable
4. Restart Ollama: `ollama serve`
5. **Expected**: Application recovers automatically

### Step 6.2: Test Invalid Code Analysis
1. Go to Code Analysis
2. Submit empty code
3. **Expected**: Validation error or helpful message
4. Submit very long code (>50,000 characters)
5. **Expected**: Appropriate handling or size limit message

### Step 6.3: Test Network Issues
1. Stop backend (`Ctrl+C` in backend terminal)
2. Try to use any feature
3. **Expected**: Error messages indicating backend unavailable
4. Restart backend
5. **Expected**: Application recovers when backend is back

## 🎯 Test 7: Performance Testing

### Step 7.1: Test Response Times
1. Send multiple chat messages quickly
2. **Expected**: Responses within reasonable time (30-60 seconds)
3. No memory leaks or performance degradation

### Step 7.2: Test Large Code Analysis
1. Analyze a large code file (1000+ lines)
2. **Expected**: Analysis completes without timeout
3. Results are comprehensive and useful

### Step 7.3: Test Model Switching Performance
1. Switch between models multiple times
2. **Expected**: Switches happen quickly (under 5 seconds)
3. No errors or hanging

## 🎯 Test 8: Visual Studio Integration (Optional)

### Step 8.1: Open in Visual Studio
1. Open `CodeMentorAI.sln` in Visual Studio 2022
2. **Expected**: Solution loads without errors
3. All projects visible in Solution Explorer

### Step 8.2: Test F5 Debugging
1. Press F5 to start debugging
2. **Expected**: Backend starts, browser opens
3. Set breakpoint in `ModelsController.cs`
4. Trigger API call from frontend
5. **Expected**: Breakpoint hits, can inspect variables

### Step 8.3: Test Hot Reload
1. Make a small change to backend code
2. **Expected**: Hot reload applies automatically
3. Make a change to frontend code
4. **Expected**: Browser refreshes with changes

## 📋 Complete Test Checklist

Mark each test as complete:

### Prerequisites
- [ ] .NET 8.0 SDK installed and working
- [ ] Node.js 18+ installed and working
- [ ] Ollama installed and running
- [ ] At least one AI model downloaded
- [ ] Ports 4200, 5000, 11434 available

### Setup Tests
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Backend packages restored (`dotnet restore`)
- [ ] Solution builds successfully (`dotnet build`)

### Backend Tests
- [ ] Backend starts without errors
- [ ] Health endpoint responds
- [ ] Models API returns data
- [ ] Code analysis API works
- [ ] All API endpoints functional

### Frontend Tests
- [ ] Frontend builds and starts (`ng serve`)
- [ ] Application loads in browser
- [ ] UI components render correctly
- [ ] Navigation works

### Functionality Tests
- [ ] Model selection works
- [ ] Chat functionality works
- [ ] Code analysis works
- [ ] Model management works
- [ ] Real-time updates work

### Error Handling Tests
- [ ] Handles Ollama offline gracefully
- [ ] Validates user input properly
- [ ] Recovers from network issues
- [ ] Shows appropriate error messages

### Performance Tests
- [ ] Chat responses within acceptable time
- [ ] Large code analysis works
- [ ] Model switching is fast
- [ ] No memory leaks or performance issues

### Integration Tests (Optional)
- [ ] Visual Studio integration works
- [ ] Debugging works (breakpoints, inspection)
- [ ] Hot reload works for both backend and frontend

## 🎉 Success Criteria

Your CodeMentorAI installation is working correctly when:

1. ✅ All prerequisites are met
2. ✅ Backend and frontend start without errors
3. ✅ All core features work (chat, code analysis, model management)
4. ✅ Real-time features work (model switching, live updates)
5. ✅ Error handling is graceful
6. ✅ Performance is acceptable
7. ✅ Integration with development tools works (if applicable)

## 🐛 Common Issues and Solutions

### "No models available"
```powershell
# Download a model
ollama pull tinyllama
# Restart backend
```

### "Backend connection failed"
```powershell
# Check if backend is running on port 5000
netstat -ano | findstr :5000
# If not running, start it:
cd src\CodeMentorAI.API && dotnet run
```

### "Frontend build failed"
```powershell
# Clear cache and reinstall
cd src\CodeMentorAI.Web
npm cache clean --force
rm -rf node_modules
npm install
```

### "Ollama not responding"
```powershell
# Restart Ollama
ollama serve
# Check if models are available
ollama list
```

## 🎯 Test 9: Advanced Feature Testing

### Step 9.1: Test Multiple Programming Languages
Test code analysis with different languages:

```powershell
# Test Python code
curl -X POST http://localhost:5000/api/codeanalysis `
  -H "Content-Type: application/json" `
  -d '{
    "code": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)",
    "language": "python",
    "model": "codellama",
    "focus": "performance"
  }'

# Test C# code
curl -X POST http://localhost:5000/api/codeanalysis `
  -H "Content-Type: application/json" `
  -d '{
    "code": "public class Calculator { public int Add(int a, int b) { return a + b; } }",
    "language": "csharp",
    "model": "codellama",
    "focus": "codeQuality"
  }'
```

### Step 9.2: Test Different Analysis Focus Areas
1. **Code Quality Focus**: Test with messy, unoptimized code
2. **Security Focus**: Test with code containing potential vulnerabilities
3. **Performance Focus**: Test with inefficient algorithms
4. **Bug Detection**: Test with code containing obvious bugs
5. **Refactoring**: Test with code that needs restructuring

### Step 9.3: Test Chat Context Preservation
1. Start a conversation: "I'm working on a web application"
2. Follow up: "What database should I use?"
3. Continue: "How do I connect to it?"
4. **Expected**: AI maintains context throughout conversation

### Step 9.4: Test Model-Specific Capabilities
1. Switch to **CodeLlama**: Test code generation requests
2. Switch to **Llama 3.2**: Test general programming questions
3. Switch to **Mistral**: Test documentation generation
4. **Expected**: Each model responds according to its strengths

## 🎯 Test 10: Automated Testing Scripts

### Step 10.1: Create API Test Script
Create `test-api.ps1`:

```powershell
# API Testing Script
Write-Host "🧪 Testing CodeMentorAI API..." -ForegroundColor Cyan

# Test health endpoint
$health = Invoke-RestMethod -Uri "http://localhost:5000/health"
if ($health -eq "Healthy") {
    Write-Host "✅ Health check passed" -ForegroundColor Green
} else {
    Write-Host "❌ Health check failed" -ForegroundColor Red
}

# Test models endpoint
try {
    $models = Invoke-RestMethod -Uri "http://localhost:5000/api/models"
    Write-Host "✅ Models API: Found $($models.Count) models" -ForegroundColor Green
} catch {
    Write-Host "❌ Models API failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test code analysis
$codeAnalysisBody = @{
    code = "function test() { return 'hello'; }"
    language = "javascript"
    model = "tinyllama"
    focus = "codeQuality"
} | ConvertTo-Json

try {
    $analysis = Invoke-RestMethod -Uri "http://localhost:5000/api/codeanalysis" -Method POST -Body $codeAnalysisBody -ContentType "application/json"
    Write-Host "✅ Code analysis API working" -ForegroundColor Green
} catch {
    Write-Host "❌ Code analysis failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "🎉 API testing complete!" -ForegroundColor Cyan
```

### Step 10.2: Create Frontend Test Script
Create `test-frontend.ps1`:

```powershell
# Frontend Testing Script
Write-Host "🧪 Testing Frontend..." -ForegroundColor Cyan

# Check if frontend is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4200" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend is accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Check if Angular is built
if (Test-Path "src\CodeMentorAI.Web\dist") {
    Write-Host "✅ Frontend build exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend not built yet" -ForegroundColor Yellow
}

Write-Host "🎉 Frontend testing complete!" -ForegroundColor Cyan
```

### Step 10.3: Create Complete Test Suite
Create `run-all-tests.ps1`:

```powershell
# Complete Test Suite
Write-Host "🚀 Running Complete CodeMentorAI Test Suite..." -ForegroundColor Cyan

# Check prerequisites
Write-Host "`n📋 Checking Prerequisites..." -ForegroundColor Yellow
& .\test-prerequisites.ps1

# Test backend
Write-Host "`n🔧 Testing Backend..." -ForegroundColor Yellow
& .\test-api.ps1

# Test frontend
Write-Host "`n🎨 Testing Frontend..." -ForegroundColor Yellow
& .\test-frontend.ps1

# Test integration
Write-Host "`n🔗 Testing Integration..." -ForegroundColor Yellow
& .\test-integration.ps1

Write-Host "`n🎉 All tests complete!" -ForegroundColor Green
```

## 🎯 Test 11: Load and Stress Testing

### Step 11.1: Test Concurrent Requests
```powershell
# Test multiple simultaneous chat requests
$jobs = @()
for ($i = 1; $i -le 5; $i++) {
    $jobs += Start-Job -ScriptBlock {
        $body = @{
            message = "Test message $using:i"
            model = "tinyllama"
        } | ConvertTo-Json

        Invoke-RestMethod -Uri "http://localhost:5000/api/chat" -Method POST -Body $body -ContentType "application/json"
    }
}

# Wait for all jobs to complete
$jobs | Wait-Job | Receive-Job
```

### Step 11.2: Test Large Code Analysis
```powershell
# Test with large code file
$largeCode = Get-Content "path\to\large\file.js" -Raw
$body = @{
    code = $largeCode
    language = "javascript"
    model = "codellama"
    focus = "codeQuality"
} | ConvertTo-Json

Measure-Command {
    Invoke-RestMethod -Uri "http://localhost:5000/api/codeanalysis" -Method POST -Body $body -ContentType "application/json"
}
```

### Step 11.3: Test Memory Usage
1. Open Task Manager
2. Monitor memory usage of:
   - `dotnet.exe` (Backend)
   - `node.exe` (Frontend)
   - `ollama.exe` (AI Runtime)
3. Perform intensive operations
4. **Expected**: Memory usage remains stable, no leaks

## 🎯 Test 12: Security Testing

### Step 12.1: Test Input Validation
```powershell
# Test malicious code input
$maliciousCode = @{
    code = "<script>alert('xss')</script>"
    language = "javascript"
    model = "tinyllama"
    focus = "security"
} | ConvertTo-Json

# Should be handled safely
Invoke-RestMethod -Uri "http://localhost:5000/api/codeanalysis" -Method POST -Body $maliciousCode -ContentType "application/json"
```

### Step 12.2: Test CORS Policy
```powershell
# Test from unauthorized origin (should fail)
$headers = @{
    "Origin" = "http://malicious-site.com"
}

try {
    Invoke-RestMethod -Uri "http://localhost:5000/api/models" -Headers $headers
    Write-Host "❌ CORS policy not working" -ForegroundColor Red
} catch {
    Write-Host "✅ CORS policy working correctly" -ForegroundColor Green
}
```

### Step 12.3: Test Rate Limiting
```powershell
# Send many requests quickly
for ($i = 1; $i -le 100; $i++) {
    try {
        Invoke-RestMethod -Uri "http://localhost:5000/api/models"
        Write-Host "Request $i succeeded"
    } catch {
        Write-Host "Request $i failed (rate limited?): $($_.Exception.Message)"
    }
}
```

## 🎯 Test 13: Backup and Recovery Testing

### Step 13.1: Test Configuration Backup
```powershell
# Backup configuration files
$backupDir = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $backupDir

Copy-Item "src\CodeMentorAI.API\appsettings.json" "$backupDir\"
Copy-Item "src\CodeMentorAI.Web\src\environments\*" "$backupDir\" -Recurse

Write-Host "✅ Configuration backed up to $backupDir"
```

### Step 13.2: Test Model Backup
```powershell
# List and backup model information
ollama list > "$backupDir\models-list.txt"
Write-Host "✅ Model list backed up"
```

### Step 13.3: Test Recovery Process
1. Stop all services
2. Restore configuration from backup
3. Restart services
4. **Expected**: Application works exactly as before

## 📊 Test Results Documentation

### Create Test Report Template
Create `test-report-template.md`:

```markdown
# CodeMentorAI Test Report

**Date**: $(Get-Date)
**Tester**: [Your Name]
**Version**: [App Version]

## Test Environment
- OS: Windows [Version]
- .NET: [Version]
- Node.js: [Version]
- Ollama: [Version]
- Models: [List installed models]

## Test Results Summary
- Total Tests: [Number]
- Passed: [Number]
- Failed: [Number]
- Skipped: [Number]

## Detailed Results
[Fill in test results for each category]

## Performance Metrics
- Backend startup time: [Time]
- Frontend build time: [Time]
- Average chat response time: [Time]
- Average code analysis time: [Time]

## Issues Found
[List any issues discovered during testing]

## Recommendations
[Any recommendations for improvements]
```

---

**🎉 Congratulations!** If all tests pass, your CodeMentorAI installation is working perfectly and ready for production use. You now have a comprehensive testing framework to ensure quality and reliability.
