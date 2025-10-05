using CodeMentorAI.Core.Models;

namespace CodeMentorAI.Core.Interfaces;

public interface IOllamaService
{
    /// <summary>
    /// Gets all available Ollama models
    /// </summary>
    Task<List<OllamaModel>> GetAvailableModelsAsync();
    
    /// <summary>
    /// Gets the currently active model
    /// </summary>
    Task<OllamaModel?> GetCurrentModelAsync();
    
    /// <summary>
    /// Switches to a different model
    /// </summary>
    Task<ModelSwitchResponse> SwitchModelAsync(string modelName, string? sessionId = null);
    
    /// <summary>
    /// Sends a prompt to the current model
    /// </summary>
    Task<OllamaResponse> GenerateAsync(OllamaRequest request);
    
    /// <summary>
    /// Sends a prompt with streaming response
    /// </summary>
    IAsyncEnumerable<OllamaResponse> GenerateStreamAsync(OllamaRequest request);
    
    /// <summary>
    /// Checks if a model is available and ready
    /// </summary>
    Task<bool> IsModelAvailableAsync(string modelName);
    
    /// <summary>
    /// Gets performance metrics for a specific model
    /// </summary>
    Task<ModelPerformanceMetrics?> GetModelPerformanceAsync(string modelName);
    
    /// <summary>
    /// Pulls/downloads a model from Ollama registry
    /// </summary>
    Task<bool> PullModelAsync(string modelName, IProgress<string>? progress = null);
    
    /// <summary>
    /// Removes a model from local storage
    /// </summary>
    Task<bool> RemoveModelAsync(string modelName);
    
    /// <summary>
    /// Gets model information including capabilities
    /// </summary>
    Task<OllamaModel?> GetModelInfoAsync(string modelName);
    
    /// <summary>
    /// Preloads a model into memory for faster responses
    /// </summary>
    Task<bool> PreloadModelAsync(string modelName);
    
    /// <summary>
    /// Unloads a model from memory
    /// </summary>
    Task<bool> UnloadModelAsync(string modelName);
}

public interface IModelRegistryService
{
    /// <summary>
    /// Searches for models in the Ollama registry
    /// </summary>
    Task<ModelRegistrySearchResponse> SearchModelsAsync(ModelRegistrySearchRequest request);

    /// <summary>
    /// Gets detailed information about a specific model from the registry
    /// </summary>
    Task<OllamaRegistryModel?> GetModelDetailsAsync(string modelName);

    /// <summary>
    /// Gets popular/featured models from the registry
    /// </summary>
    Task<List<OllamaRegistryModel>> GetFeaturedModelsAsync(int count = 10);

    /// <summary>
    /// Gets models by category
    /// </summary>
    Task<List<OllamaRegistryModel>> GetModelsByCategoryAsync(string category);

    /// <summary>
    /// Gets all available categories
    /// </summary>
    Task<List<string>> GetCategoriesAsync();
}

public interface IModelDownloadService
{
    /// <summary>
    /// Downloads a model from the Ollama registry
    /// </summary>
    Task<ModelDownloadResponse> DownloadModelAsync(ModelDownloadRequest request, IProgress<ModelDownloadProgress>? progress = null);

    /// <summary>
    /// Gets the current download progress for a model
    /// </summary>
    Task<ModelDownloadProgress?> GetDownloadProgressAsync(string downloadId);

    /// <summary>
    /// Gets all active downloads
    /// </summary>
    Task<List<ModelDownloadProgress>> GetActiveDownloadsAsync();

    /// <summary>
    /// Cancels a model download
    /// </summary>
    Task<bool> CancelDownloadAsync(string downloadId);

    /// <summary>
    /// Verifies a downloaded model
    /// </summary>
    Task<bool> VerifyModelAsync(string modelName);

    /// <summary>
    /// Gets download history
    /// </summary>
    Task<List<ModelDownloadProgress>> GetDownloadHistoryAsync(int count = 50);

    /// <summary>
    /// Gets the configured models path
    /// </summary>
    string GetModelsPath();

    /// <summary>
    /// Gets the local file path for a model
    /// </summary>
    string GetModelFilePath(string modelName);

    /// <summary>
    /// Checks if a model is downloaded locally
    /// </summary>
    bool IsModelDownloadedLocally(string modelName);

    /// <summary>
    /// Gets the size of a locally downloaded model
    /// </summary>
    Task<long> GetLocalModelSizeAsync(string modelName);
}

public interface IModelCapabilityService
{
    /// <summary>
    /// Determines the best model for a specific task
    /// </summary>
    Task<string?> GetBestModelForTaskAsync(string taskType, List<string> availableModels);
    
    /// <summary>
    /// Gets recommended models for different use cases
    /// </summary>
    Task<Dictionary<string, List<string>>> GetModelRecommendationsAsync();
    
    /// <summary>
    /// Validates if a model supports a specific capability
    /// </summary>
    bool SupportsCapability(OllamaModel model, string capability);
}

public interface IModelPerformanceTracker
{
    /// <summary>
    /// Records performance metrics for a model request
    /// </summary>
    Task RecordPerformanceAsync(string modelName, TimeSpan responseTime, int tokenCount);
    
    /// <summary>
    /// Gets aggregated performance data
    /// </summary>
    Task<ModelPerformanceMetrics?> GetPerformanceMetricsAsync(string modelName);
    
    /// <summary>
    /// Gets performance comparison between models
    /// </summary>
    Task<Dictionary<string, ModelPerformanceMetrics>> GetPerformanceComparisonAsync();
}
