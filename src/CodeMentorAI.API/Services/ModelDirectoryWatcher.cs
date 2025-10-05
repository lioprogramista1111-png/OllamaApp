using Microsoft.AspNetCore.SignalR;
using CodeMentorAI.API.Hubs;

namespace CodeMentorAI.API.Services;

public class ModelDirectoryWatcher : IDisposable
{
    private readonly ILogger<ModelDirectoryWatcher> _logger;
    private readonly IHubContext<ModelHub> _hubContext;
    private FileSystemWatcher? _watcher;
    private readonly string _modelsPath;

    public ModelDirectoryWatcher(
        ILogger<ModelDirectoryWatcher> logger,
        IHubContext<ModelHub> hubContext)
    {
        _logger = logger;
        _hubContext = hubContext;
        
        // Path to Ollama models directory
        _modelsPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
            ".ollama", "models", "manifests", "registry.ollama.ai", "library"
        );
    }

    public void StartWatching()
    {
        try
        {
            if (!Directory.Exists(_modelsPath))
            {
                _logger.LogWarning("Models directory does not exist: {Path}", _modelsPath);
                return;
            }

            _logger.LogInformation("🔍 Starting file system watcher on: {Path}", _modelsPath);

            _watcher = new FileSystemWatcher(_modelsPath)
            {
                NotifyFilter = NotifyFilters.DirectoryName | NotifyFilters.FileName,
                IncludeSubdirectories = true,
                EnableRaisingEvents = true
            };

            _watcher.Created += OnModelAdded;
            _watcher.Deleted += OnModelDeleted;
            _watcher.Renamed += OnModelRenamed;

            _logger.LogInformation("✅ File system watcher started successfully - monitoring for model changes");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start file system watcher");
        }
    }

    private async void OnModelAdded(object sender, FileSystemEventArgs e)
    {
        try
        {
            _logger.LogInformation("📂 File/folder added detected: {Path}", e.FullPath);

            // Wait a bit for file operations to complete
            await Task.Delay(500);

            // Check if it's a directory (model folder) or a file (tag file)
            if (Directory.Exists(e.FullPath))
            {
                // New model folder created
                var modelName = Path.GetFileName(e.FullPath);
                _logger.LogInformation("📁 New model folder detected: {ModelName}", modelName);

                // Wait a bit more for the tag file to be created
                await Task.Delay(1000);

                // Check for tag files
                if (Directory.Exists(e.FullPath))
                {
                    var tagFiles = Directory.GetFiles(e.FullPath);
                    if (tagFiles.Length > 0)
                    {
                        foreach (var tagFile in tagFiles)
                        {
                            var tag = Path.GetFileName(tagFile);
                            var fullModelName = $"{modelName}:{tag}";
                            
                            _logger.LogInformation("🎉 New model detected: {ModelName}", fullModelName);
                            
                            await _hubContext.Clients.All.SendAsync("ModelAdded", new
                            {
                                ModelName = fullModelName,
                                Timestamp = DateTime.UtcNow
                            });
                        }
                    }
                }
            }
            else if (File.Exists(e.FullPath))
            {
                // New tag file created in existing model folder
                var parentDir = Path.GetDirectoryName(e.FullPath);
                if (parentDir != null)
                {
                    var modelFolder = Path.GetFileName(parentDir);
                    var tag = Path.GetFileName(e.FullPath);
                    var fullModelName = $"{modelFolder}:{tag}";
                    
                    _logger.LogInformation("🎉 New model tag detected: {ModelName}", fullModelName);
                    
                    await _hubContext.Clients.All.SendAsync("ModelAdded", new
                    {
                        ModelName = fullModelName,
                        Timestamp = DateTime.UtcNow
                    });
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling model added event");
        }
    }

    private async void OnModelDeleted(object sender, FileSystemEventArgs e)
    {
        try
        {
            _logger.LogInformation("🗑️ File/folder deleted detected: {Path}", e.FullPath);

            // Extract model name from path
            var pathParts = e.FullPath.Split(Path.DirectorySeparatorChar);
            var libraryIndex = Array.IndexOf(pathParts, "library");
            
            if (libraryIndex >= 0 && libraryIndex < pathParts.Length - 1)
            {
                var modelName = pathParts[libraryIndex + 1];
                
                // Check if it's a tag file deletion
                if (libraryIndex < pathParts.Length - 2)
                {
                    var tag = pathParts[libraryIndex + 2];
                    var fullModelName = $"{modelName}:{tag}";
                    
                    _logger.LogInformation("🗑️ Model deleted: {ModelName}", fullModelName);
                    
                    await _hubContext.Clients.All.SendAsync("ModelDeleted", new
                    {
                        ModelName = fullModelName,
                        Timestamp = DateTime.UtcNow
                    });
                }
                else
                {
                    // Entire model folder deleted
                    _logger.LogInformation("🗑️ Model folder deleted: {ModelName}", modelName);
                    
                    await _hubContext.Clients.All.SendAsync("ModelDeleted", new
                    {
                        ModelName = $"{modelName}:*",
                        Timestamp = DateTime.UtcNow
                    });
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling model deleted event");
        }
    }

    private void OnModelRenamed(object sender, RenamedEventArgs e)
    {
        _logger.LogInformation("📝 Model renamed: {OldPath} -> {NewPath}", e.OldFullPath, e.FullPath);
    }

    public void Dispose()
    {
        if (_watcher != null)
        {
            _watcher.Created -= OnModelAdded;
            _watcher.Deleted -= OnModelDeleted;
            _watcher.Renamed -= OnModelRenamed;
            _watcher.Dispose();
            _logger.LogInformation("File system watcher disposed");
        }
    }
}

