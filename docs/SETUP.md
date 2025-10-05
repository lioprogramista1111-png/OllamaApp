# CodeMentor AI - Complete Setup Guide

This guide will walk you through setting up the CodeMentor AI application with dynamic Ollama model switching capabilities.

## 🎯 Quick Start (5 Minutes)

### 1. Install Ollama
```bash
# Windows (PowerShell as Administrator)
winget install Ollama.Ollama

# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh
```

### 2. Pull Essential Models
```bash
# Essential models for CodeMentor AI
ollama pull codellama:7b      # Best for code analysis and generation
ollama pull llama2:7b         # Best for chat and documentation  
ollama pull mistral:7b        # Fast and efficient for general tasks

# Optional: Smaller models for testing
ollama pull phi:2.7b          # Lightweight model for quick responses
```

### 3. Verify Ollama Installation
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Should return JSON with your installed models
```

### 4. Clone and Run the Application
```bash
# Clone repository
git clone <your-repo-url>
cd OllamaApp

# Start backend (Terminal 1)
cd src/CodeMentorAI.API
dotnet run

# Start frontend (Terminal 2)  
cd src/CodeMentorAI.Web
npm install
ng serve

# Open browser to http://localhost:4200
```

## 🔧 Detailed Setup Instructions

### Prerequisites Verification

**Check .NET Installation:**
```bash
dotnet --version
# Should show 8.0.x or higher
```

**Check Node.js Installation:**
```bash
node --version  # Should be 18.x or higher
npm --version   # Should be 9.x or higher
```

**Check Angular CLI:**
```bash
ng version
# If not installed: npm install -g @angular/cli@17
```

### Backend Setup (.NET Core API)

1. **Navigate to API Project:**
```bash
cd src/CodeMentorAI.API
```

2. **Restore NuGet Packages:**
```bash
dotnet restore
```

3. **Build the Project:**
```bash
dotnet build
```

4. **Configure Settings (Optional):**
Edit `appsettings.json` to customize:
```json
{
  "Ollama": {
    "BaseUrl": "http://localhost:11434",
    "DefaultModel": "llama2:7b",
    "RequestTimeout": 300
  }
}
```

5. **Run the API:**
```bash
dotnet run
```

The API will be available at:
- HTTPS: `https://localhost:5001`
- HTTP: `http://localhost:5000`
- Swagger UI: `https://localhost:5001/swagger`

### Frontend Setup (Angular)

1. **Navigate to Web Project:**
```bash
cd src/CodeMentorAI.Web
```

2. **Install Dependencies:**
```bash
npm install
```

3. **Configure Environment (Optional):**
Edit `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  signalRUrl: 'http://localhost:5000/modelhub'
};
```

4. **Start Development Server:**
```bash
ng serve
```

The application will be available at `http://localhost:4200`

## 🧪 Testing the Setup

### 1. Verify API Connection
Open browser to `http://localhost:5000/api/models` - should return JSON with available models.

### 2. Test SignalR Connection
In browser console (F12), you should see:
```
SignalR connection established
Subscribed to model updates
```

### 3. Test Model Switching
1. Open the application at `http://localhost:4200`
2. Use the model selector in the sidebar
3. Switch between different models
4. Verify real-time status updates

## 🎛️ Model Configuration

### Recommended Model Setup

**For Code Development:**
```bash
ollama pull codellama:7b        # Primary code model
ollama pull codellama:13b       # More powerful code model (if you have RAM)
ollama pull starcoder:7b        # Alternative code model
```

**For Documentation & Chat:**
```bash
ollama pull llama2:7b           # General purpose
ollama pull llama2:13b          # More capable (requires more RAM)
ollama pull mistral:7b          # Fast and efficient
```

**For Specialized Tasks:**
```bash
ollama pull phi:2.7b            # Lightweight for quick tasks
ollama pull gemma:7b            # Google's model for various tasks
```

### Model Performance Guidelines

| Model | RAM Required | Best For | Speed |
|-------|-------------|----------|-------|
| phi:2.7b | 4GB | Quick responses, testing | Very Fast |
| codellama:7b | 8GB | Code analysis, generation | Fast |
| llama2:7b | 8GB | Chat, documentation | Fast |
| mistral:7b | 8GB | General tasks, documentation | Fast |
| codellama:13b | 16GB | Advanced code tasks | Medium |
| llama2:13b | 16GB | Complex reasoning | Medium |

## 🔍 Troubleshooting

### Common Issues

**1. Ollama Not Running**
```bash
# Check if Ollama service is running
curl http://localhost:11434/api/tags

# If not running, start Ollama
ollama serve
```

**2. CORS Issues**
Ensure the API is configured with proper CORS settings in `Program.cs`:
```csharp
app.UseCors("AllowAngularApp");
```

**3. SignalR Connection Failed**
- Check if the API is running on the correct port
- Verify firewall settings
- Check browser console for detailed error messages

**4. Model Not Found**
```bash
# List installed models
ollama list

# Pull missing model
ollama pull <model-name>
```

**5. Performance Issues**
- Ensure sufficient RAM for your models
- Close other applications to free memory
- Consider using smaller models for testing

### Debug Mode

**Enable Detailed Logging:**
In `appsettings.json`:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "CodeMentorAI": "Debug",
      "Microsoft.AspNetCore.SignalR": "Debug"
    }
  }
}
```

**Angular Debug Mode:**
```bash
ng serve --configuration development
```

## 🚀 Production Deployment

### Backend Deployment

1. **Publish the API:**
```bash
dotnet publish -c Release -o ./publish
```

2. **Configure Production Settings:**
Update `appsettings.Production.json`:
```json
{
  "Ollama": {
    "BaseUrl": "http://your-ollama-server:11434"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Warning"
    }
  }
}
```

### Frontend Deployment

1. **Build for Production:**
```bash
ng build --configuration production
```

2. **Deploy to Web Server:**
Copy contents of `dist/code-mentor-ai-web/` to your web server.

### Docker Deployment (Optional)

Create `Dockerfile` for the API:
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY publish/ .
EXPOSE 80
ENTRYPOINT ["dotnet", "CodeMentorAI.API.dll"]
```

## 📊 Performance Optimization

### Model Loading Optimization
```bash
# Preload frequently used models
curl -X POST http://localhost:5000/api/models/codellama:7b/preload
```

### Memory Management
- Monitor model memory usage in the dashboard
- Unload unused models to free memory
- Use model switching strategically

### Network Optimization
- Use local Ollama installation for best performance
- Configure appropriate timeout values
- Enable compression for API responses

## 🔐 Security Considerations

### API Security
- Configure HTTPS in production
- Implement authentication if needed
- Validate all user inputs
- Rate limit API endpoints

### Model Security
- Only install trusted models
- Monitor model resource usage
- Implement access controls for model management

## 📈 Monitoring & Analytics

### Performance Monitoring
The application includes built-in performance tracking:
- Response times per model
- Tokens per second metrics
- Memory and CPU usage
- Request success rates

### Health Checks
- API health endpoint: `/health`
- Model availability checks
- SignalR connection monitoring

## 🆘 Getting Help

### Documentation
- Check the main README.md for feature overview
- Review API documentation at `/swagger`
- Check component documentation in the code

### Community Support
- Create issues for bugs or feature requests
- Join discussions for community help
- Check existing issues for solutions

### Development Support
- Use browser developer tools for frontend debugging
- Check API logs for backend issues
- Monitor Ollama logs for model-related problems

---

**🎉 You're all set! Enjoy building with CodeMentor AI!**
