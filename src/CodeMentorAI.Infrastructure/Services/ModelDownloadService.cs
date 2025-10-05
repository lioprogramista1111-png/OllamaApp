using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;
using CodeMentorAI.Core.Interfaces;
using CodeMentorAI.Core.Models;
using CodeMentorAI.Core.Configuration;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CodeMentorAI.Infrastructure.Services;

public class ModelDownloadService : IModelDownloadService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ModelDownloadService> _logger;
    private readonly OllamaConfiguration _ollamaConfig;
    private readonly string _ollamaBaseUrl;
    private readonly string _modelsPath;

    // Track active downloads
    private readonly ConcurrentDictionary<string, ModelDownloadProgress> _activeDownloads;
    private readonly ConcurrentDictionary<string, CancellationTokenSource> _downloadCancellations;
    private readonly List<ModelDownloadProgress> _downloadHistory;

    public ModelDownloadService(
        HttpClient httpClient,
        ILogger<ModelDownloadService> logger,
        IOptions<OllamaConfiguration> ollamaOptions)
    {
        _httpClient = httpClient;
        _logger = logger;
        _ollamaConfig = ollamaOptions.Value;
        _ollamaBaseUrl = _ollamaConfig.BaseUrl;

        // Use Ollama's default models path
        _modelsPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
            ".ollama", "models"
        );

        // Ensure models directory exists
        if (!string.IsNullOrEmpty(_modelsPath))
        {
            Directory.CreateDirectory(_modelsPath);
        }

        _activeDownloads = new ConcurrentDictionary<string, ModelDownloadProgress>();
        _downloadCancellations = new ConcurrentDictionary<string, CancellationTokenSource>();
        _downloadHistory = new List<ModelDownloadProgress>();
    }

    public async Task<ModelDownloadResponse> DownloadModelAsync(
        ModelDownloadRequest request, 
        IProgress<ModelDownloadProgress>? progress = null)
    {
        var downloadId = Guid.NewGuid().ToString();
        var modelName = string.IsNullOrEmpty(request.Tag) || request.Tag == "latest" 
            ? request.ModelName 
            : $"{request.ModelName}:{request.Tag}";

        try
        {
            _logger.LogInformation("Starting download for model: {ModelName}", modelName);

            // Create progress tracker
            var downloadProgress = new ModelDownloadProgress
            {
                ModelName = modelName,
                Status = "Initializing download...",
                StartTime = DateTime.UtcNow,
                BytesDownloaded = 0,
                TotalBytes = 0
            };

            _activeDownloads[downloadId] = downloadProgress;

            // Create cancellation token
            var cancellationTokenSource = new CancellationTokenSource();
            _downloadCancellations[downloadId] = cancellationTokenSource;

            // Start download in background
            _ = Task.Run(async () => await PerformDownloadAsync(
                downloadId, 
                modelName, 
                progress, 
                cancellationTokenSource.Token), 
                cancellationTokenSource.Token);

            return new ModelDownloadResponse
            {
                Success = true,
                Message = $"Download started for {modelName}",
                DownloadId = downloadId,
                Progress = downloadProgress
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start download for model: {ModelName}", modelName);
            
            return new ModelDownloadResponse
            {
                Success = false,
                Message = $"Failed to start download: {ex.Message}",
                DownloadId = downloadId
            };
        }
    }

    public async Task<ModelDownloadProgress?> GetDownloadProgressAsync(string downloadId)
    {
        return await Task.FromResult(_activeDownloads.GetValueOrDefault(downloadId));
    }

    public async Task<List<ModelDownloadProgress>> GetActiveDownloadsAsync()
    {
        return await Task.FromResult(_activeDownloads.Values.Where(d => !d.IsCompleted).ToList());
    }

    public async Task<bool> CancelDownloadAsync(string downloadId)
    {
        try
        {
            if (_downloadCancellations.TryGetValue(downloadId, out var cancellationTokenSource))
            {
                cancellationTokenSource.Cancel();
                
                if (_activeDownloads.TryGetValue(downloadId, out var progress))
                {
                    progress.Status = "Cancelled";
                    progress.HasError = true;
                    progress.ErrorMessage = "Download cancelled by user";
                    progress.IsCompleted = true;
                    progress.CompletedTime = DateTime.UtcNow;
                }

                _logger.LogInformation("Download cancelled: {DownloadId}", downloadId);
                return true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to cancel download: {DownloadId}", downloadId);
            return false;
        }
    }

    public async Task<bool> VerifyModelAsync(string modelName)
    {
        try
        {
            // Use Ollama's API to check if model exists and is functional
            var response = await _httpClient.PostAsync($"{_ollamaBaseUrl}/api/generate", new StringContent(
                JsonSerializer.Serialize(new
                {
                    model = modelName,
                    prompt = "Hello",
                    options = new { num_predict = 1 }
                }), Encoding.UTF8, "application/json"));

            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to verify model: {ModelName}", modelName);
            return false;
        }
    }

    public async Task<List<ModelDownloadProgress>> GetDownloadHistoryAsync(int count = 50)
    {
        return await Task.FromResult(_downloadHistory
            .OrderByDescending(d => d.StartTime)
            .Take(count)
            .ToList());
    }

    private async Task PerformDownloadAsync(
        string downloadId, 
        string modelName, 
        IProgress<ModelDownloadProgress>? progress,
        CancellationToken cancellationToken)
    {
        var downloadProgress = _activeDownloads[downloadId];
        
        try
        {
            downloadProgress.Status = "Connecting to Ollama...";
            progress?.Report(downloadProgress);

            // Prepare the pull request
            var pullRequest = new
            {
                name = modelName,
                stream = true
            };

            var json = JsonSerializer.Serialize(pullRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            downloadProgress.Status = "Starting download...";
            progress?.Report(downloadProgress);

            // Set a longer timeout for the download
            using var timeoutCts = new CancellationTokenSource(TimeSpan.FromMinutes(30));
            using var combinedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

            using var request = new HttpRequestMessage(HttpMethod.Post, $"{_ollamaBaseUrl}/api/pull")
            {
                Content = content
            };

            using var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, combinedCts.Token);

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Failed to start download: {response.StatusCode}");
            }

            downloadProgress.Status = "Downloading...";
            progress?.Report(downloadProgress);

            using var stream = await response.Content.ReadAsStreamAsync(combinedCts.Token);
            using var reader = new StreamReader(stream);

            var buffer = new char[8192];
            var lineBuilder = new StringBuilder();

            while (!combinedCts.Token.IsCancellationRequested)
            {
                var bytesRead = await reader.ReadAsync(buffer, 0, buffer.Length);
                if (bytesRead == 0) break;

                for (int i = 0; i < bytesRead; i++)
                {
                    if (buffer[i] == '\n')
                    {
                        var line = lineBuilder.ToString().Trim();
                        lineBuilder.Clear();

                        if (!string.IsNullOrWhiteSpace(line))
                        {
                            try
                            {
                                var pullResponse = JsonSerializer.Deserialize<PullResponse>(line);
                                if (pullResponse != null)
                                {
                                    UpdateProgressFromPullResponse(downloadProgress, pullResponse);
                                    progress?.Report(downloadProgress);

                                    if (pullResponse.Status == "success")
                                    {
                                        downloadProgress.Status = "Download completed successfully";
                                        downloadProgress.IsCompleted = true;
                                        downloadProgress.CompletedTime = DateTime.UtcNow;
                                        // ProgressPercentage is calculated automatically from BytesDownloaded/TotalBytes
                                        if (downloadProgress.TotalBytes > 0)
                                        {
                                            downloadProgress.BytesDownloaded = downloadProgress.TotalBytes;
                                        }
                                        goto downloadComplete;
                                    }
                                }
                            }
                            catch (JsonException ex)
                            {
                                _logger.LogWarning("Failed to parse pull response: {Line}, Error: {Error}", line, ex.Message);
                            }
                        }
                    }
                    else
                    {
                        lineBuilder.Append(buffer[i]);
                    }
                }
            }

            downloadComplete:

            if (combinedCts.Token.IsCancellationRequested)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    downloadProgress.Status = "Download cancelled";
                    downloadProgress.HasError = true;
                    downloadProgress.ErrorMessage = "Download was cancelled";
                }
                else if (timeoutCts.Token.IsCancellationRequested)
                {
                    downloadProgress.Status = "Download timed out";
                    downloadProgress.HasError = true;
                    downloadProgress.ErrorMessage = "Download timed out after 30 minutes";
                }
            }
            else if (!downloadProgress.IsCompleted)
            {
                downloadProgress.Status = "Download completed";
                downloadProgress.IsCompleted = true;
                downloadProgress.CompletedTime = DateTime.UtcNow;
            }

            // Verify the downloaded model
            if (downloadProgress.IsCompleted && !downloadProgress.HasError)
            {
                downloadProgress.Status = "Verifying model...";
                progress?.Report(downloadProgress);

                var isValid = await VerifyModelAsync(modelName);
                if (isValid)
                {
                    downloadProgress.Status = "Model ready for use";
                }
                else
                {
                    downloadProgress.Status = "Model verification failed";
                    downloadProgress.HasError = true;
                    downloadProgress.ErrorMessage = "Downloaded model failed verification";
                }
            }

            progress?.Report(downloadProgress);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Download failed for model: {ModelName}", modelName);
            
            downloadProgress.Status = "Download failed";
            downloadProgress.HasError = true;
            downloadProgress.ErrorMessage = ex.Message;
            downloadProgress.IsCompleted = true;
            downloadProgress.CompletedTime = DateTime.UtcNow;
            
            progress?.Report(downloadProgress);
        }
        finally
        {
            // Move to history and cleanup
            _downloadHistory.Add(downloadProgress);
            _activeDownloads.TryRemove(downloadId, out _);
            _downloadCancellations.TryRemove(downloadId, out _);
        }
    }

    private void UpdateProgressFromPullResponse(ModelDownloadProgress progress, PullResponse response)
    {
        progress.Status = response.Status ?? "Downloading...";
        
        if (response.Completed.HasValue && response.Total.HasValue)
        {
            progress.BytesDownloaded = response.Completed.Value;
            progress.TotalBytes = response.Total.Value;
            
            // Calculate download speed and ETA
            var elapsed = DateTime.UtcNow - progress.StartTime;
            progress.ElapsedTime = elapsed;
            
            if (elapsed.TotalSeconds > 0)
            {
                progress.DownloadSpeed = progress.BytesDownloaded / elapsed.TotalSeconds;
                
                if (progress.DownloadSpeed > 0 && progress.TotalBytes > progress.BytesDownloaded)
                {
                    var remainingBytes = progress.TotalBytes - progress.BytesDownloaded;
                    var remainingSeconds = remainingBytes / progress.DownloadSpeed;
                    progress.EstimatedTimeRemaining = TimeSpan.FromSeconds(remainingSeconds);
                }
            }
        }
    }

    public string GetModelsPath()
    {
        return _modelsPath;
    }

    public string GetModelFilePath(string modelName)
    {
        if (string.IsNullOrEmpty(_modelsPath))
        {
            return string.Empty;
        }

        // Sanitize model name for file system
        var sanitizedName = modelName.Replace(":", "_").Replace("/", "_");
        return Path.Combine(_modelsPath, $"{sanitizedName}.model");
    }

    public bool IsModelDownloadedLocally(string modelName)
    {
        var modelPath = GetModelFilePath(modelName);
        return !string.IsNullOrEmpty(modelPath) && File.Exists(modelPath);
    }

    public async Task<long> GetLocalModelSizeAsync(string modelName)
    {
        var modelPath = GetModelFilePath(modelName);
        if (string.IsNullOrEmpty(modelPath) || !File.Exists(modelPath))
        {
            return 0;
        }

        var fileInfo = new FileInfo(modelPath);
        return fileInfo.Length;
    }

    // Helper class for parsing Ollama pull responses
    private class PullResponse
    {
        public string? Status { get; set; }
        public long? Total { get; set; }
        public long? Completed { get; set; }
        public string? Digest { get; set; }
    }
}
