using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using CodeMentorAI.Core.Interfaces;
using CodeMentorAI.Core.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Memory;

namespace CodeMentorAI.Infrastructure.Services;

public class OllamaService : IOllamaService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<OllamaService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IModelPerformanceTracker _performanceTracker;
    private readonly IMemoryCache _cache;
    private string? _currentModel;
    private readonly string _ollamaBaseUrl;

    // Cache keys
    private const string MODELS_CACHE_KEY = "ollama_available_models";
    private static readonly TimeSpan ModelsCacheExpiration = TimeSpan.FromMinutes(5);

    public OllamaService(
        HttpClient httpClient,
        ILogger<OllamaService> logger,
        IConfiguration configuration,
        IModelPerformanceTracker performanceTracker,
        IMemoryCache cache)
    {
        _httpClient = httpClient;
        _logger = logger;
        _configuration = configuration;
        _performanceTracker = performanceTracker;
        _cache = cache;
        _ollamaBaseUrl = configuration.GetValue<string>("Ollama:BaseUrl") ?? "http://localhost:11434";

        _httpClient.BaseAddress = new Uri(_ollamaBaseUrl);
        _httpClient.Timeout = TimeSpan.FromMinutes(5);
    }

    public async Task<List<OllamaModel>> GetAvailableModelsAsync()
    {
        // Check cache first
        if (_cache.TryGetValue(MODELS_CACHE_KEY, out List<OllamaModel>? cachedModels) && cachedModels != null)
        {
            _logger.LogDebug("Returning cached models list");
            return cachedModels;
        }

        try
        {
            var response = await _httpClient.GetAsync("/api/tags");
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            var modelsResponse = JsonSerializer.Deserialize<ModelsResponse>(content, _jsonOptions);

            var models = new List<OllamaModel>();

            if (modelsResponse?.Models != null)
            {
                // Batch fetch performance metrics to reduce async overhead
                var performanceTasks = modelsResponse.Models
                    .Select(m => _performanceTracker.GetPerformanceMetricsAsync(m.Name))
                    .ToList();

                var performanceResults = await Task.WhenAll(performanceTasks);

                for (int i = 0; i < modelsResponse.Models.Count; i++)
                {
                    var model = modelsResponse.Models[i];
                    var ollamaModel = new OllamaModel
                    {
                        Name = model.Name,
                        DisplayName = GetDisplayName(model.Name),
                        Description = GetModelDescription(model.Name),
                        Size = model.Size,
                        ModifiedAt = model.ModifiedAt,
                        Digest = model.Digest,
                        Capabilities = GetModelCapabilities(model.Name),
                        Status = ModelStatus.Available,
                        Performance = performanceResults[i]
                    };

                    models.Add(ollamaModel);
                }
            }

            // Cache the results
            _cache.Set(MODELS_CACHE_KEY, models, ModelsCacheExpiration);

            return models;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get available models");
            return new List<OllamaModel>();
        }
    }

    public async Task<OllamaModel?> GetCurrentModelAsync()
    {
        if (string.IsNullOrEmpty(_currentModel))
            return null;

        // Try to get from cache first to avoid full model list fetch
        var cacheKey = $"model_info_{_currentModel}";
        if (_cache.TryGetValue(cacheKey, out OllamaModel? cachedModel) && cachedModel != null)
        {
            return cachedModel;
        }

        var models = await GetAvailableModelsAsync();
        var model = models.FirstOrDefault(m => m.Name == _currentModel);

        if (model != null)
        {
            _cache.Set(cacheKey, model, ModelsCacheExpiration);
        }

        return model;
    }

    public async Task<ModelSwitchResponse> SwitchModelAsync(string modelName, string? sessionId = null)
    {
        var startTime = DateTime.UtcNow;
        
        try
        {
            // Check if model is available
            var isAvailable = await IsModelAvailableAsync(modelName);
            if (!isAvailable)
            {
                return new ModelSwitchResponse
                {
                    Success = false,
                    Message = $"Model '{modelName}' is not available. Please ensure it's installed.",
                    SwitchDuration = DateTime.UtcNow - startTime
                };
            }

            // Preload the model to ensure it's ready
            var preloaded = await PreloadModelAsync(modelName);
            if (!preloaded)
            {
                return new ModelSwitchResponse
                {
                    Success = false,
                    Message = $"Failed to preload model '{modelName}'.",
                    SwitchDuration = DateTime.UtcNow - startTime
                };
            }

            _currentModel = modelName;
            var model = await GetModelInfoAsync(modelName);

            _logger.LogInformation("Successfully switched to model: {ModelName} for session: {SessionId}", 
                modelName, sessionId ?? "default");

            return new ModelSwitchResponse
            {
                Success = true,
                Message = $"Successfully switched to {modelName}",
                Model = model,
                SwitchDuration = DateTime.UtcNow - startTime
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to switch to model: {ModelName}", modelName);
            return new ModelSwitchResponse
            {
                Success = false,
                Message = $"Error switching to model: {ex.Message}",
                SwitchDuration = DateTime.UtcNow - startTime
            };
        }
    }

    // Reusable JsonSerializer options for better performance
    private static readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public async Task<OllamaResponse> GenerateAsync(OllamaRequest request)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            // Use current model if not specified
            if (string.IsNullOrEmpty(request.Model) && !string.IsNullOrEmpty(_currentModel))
            {
                request.Model = _currentModel;
            }

            // Optimize JSON serialization with pre-configured options
            var json = JsonSerializer.Serialize(request, _jsonOptions);

            using var content = new StringContent(json, Encoding.UTF8, "application/json");
            using var response = await _httpClient.PostAsync("/api/generate", content);

            response.EnsureSuccessStatusCode();

            // Use async streaming for large responses
            using var stream = await response.Content.ReadAsStreamAsync();
            var ollamaResponse = await JsonSerializer.DeserializeAsync<OllamaResponse>(stream, _jsonOptions);

            if (ollamaResponse != null)
            {
                // Record performance metrics asynchronously
                var responseTime = DateTime.UtcNow - startTime;
                _ = Task.Run(async () => await _performanceTracker.RecordPerformanceAsync(
                    request.Model,
                    responseTime,
                    ollamaResponse.Response?.Length ?? 0));
            }

            return ollamaResponse ?? new OllamaResponse();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate response with model: {ModelName}", request.Model);
            throw;
        }
    }

    public async IAsyncEnumerable<OllamaResponse> GenerateStreamAsync(OllamaRequest request)
    {
        request.Stream = true;
        
        // Use current model if not specified
        if (string.IsNullOrEmpty(request.Model) && !string.IsNullOrEmpty(_currentModel))
        {
            request.Model = _currentModel;
        }

        var json = JsonSerializer.Serialize(request, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
        });
        
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        using var response = await _httpClient.PostAsync("/api/generate", content);
        response.EnsureSuccessStatusCode();
        
        using var stream = await response.Content.ReadAsStreamAsync();
        using var reader = new StreamReader(stream);
        
        string? line;
        while ((line = await reader.ReadLineAsync()) != null)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;
            
            var streamResponse = JsonSerializer.Deserialize<OllamaResponse>(line, new JsonSerializerOptions 
            { 
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
            });
            
            if (streamResponse != null)
            {
                yield return streamResponse;
                
                if (streamResponse.Done)
                    break;
            }
        }
    }

    public async Task<bool> IsModelAvailableAsync(string modelName)
    {
        try
        {
            var models = await GetAvailableModelsAsync();
            return models.Any(m => m.Name.Equals(modelName, StringComparison.OrdinalIgnoreCase));
        }
        catch
        {
            return false;
        }
    }

    public async Task<ModelPerformanceMetrics?> GetModelPerformanceAsync(string modelName)
    {
        return await _performanceTracker.GetPerformanceMetricsAsync(modelName);
    }

    public async Task<bool> PullModelAsync(string modelName, IProgress<string>? progress = null)
    {
        try
        {
            var request = new { name = modelName };
            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            using var response = await _httpClient.PostAsync("/api/pull", content);

            if (progress != null)
            {
                using var stream = await response.Content.ReadAsStreamAsync();
                using var reader = new StreamReader(stream);

                string? line;
                while ((line = await reader.ReadLineAsync()) != null)
                {
                    if (!string.IsNullOrWhiteSpace(line))
                    {
                        progress.Report(line);
                    }
                }
            }

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Successfully pulled model: {ModelName}", modelName);

                // Clear cache after successful download
                _cache.Remove(MODELS_CACHE_KEY);
                _logger.LogDebug("Cache cleared after model download");

                return true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to pull model: {ModelName}", modelName);
            return false;
        }
    }

    public async Task<bool> RemoveModelAsync(string modelName)
    {
        try
        {
            var request = new { name = modelName };
            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Use DELETE method instead of POST for Ollama API
            var httpRequest = new HttpRequestMessage(HttpMethod.Delete, "/api/delete")
            {
                Content = content
            };

            var response = await _httpClient.SendAsync(httpRequest);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Successfully removed model: {ModelName}", modelName);

                // Clear cache after successful deletion
                _cache.Remove(MODELS_CACHE_KEY);  // Use the correct cache key constant
                _cache.Remove($"model_info_{modelName}");

                return true;
            }

            _logger.LogWarning("Failed to remove model {ModelName}: {StatusCode}", modelName, response.StatusCode);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to remove model: {ModelName}", modelName);
            return false;
        }
    }

    public async Task<OllamaModel?> GetModelInfoAsync(string modelName)
    {
        // Try cache first
        var cacheKey = $"model_info_{modelName}";
        if (_cache.TryGetValue(cacheKey, out OllamaModel? cachedModel) && cachedModel != null)
        {
            return cachedModel;
        }

        var models = await GetAvailableModelsAsync();
        var model = models.FirstOrDefault(m => m.Name.Equals(modelName, StringComparison.OrdinalIgnoreCase));

        if (model != null)
        {
            _cache.Set(cacheKey, model, ModelsCacheExpiration);
        }

        return model;
    }

    public async Task<bool> PreloadModelAsync(string modelName)
    {
        try
        {
            // Send a small request to preload the model
            var request = new OllamaRequest
            {
                Model = modelName,
                Prompt = "Hello",
                Options = new OllamaOptions { NumPredict = 1 }
            };
            
            await GenerateAsync(request);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> UnloadModelAsync(string modelName)
    {
        // Ollama doesn't have a direct unload API, but we can clear the current model
        if (_currentModel == modelName)
        {
            _currentModel = null;
        }
        return await Task.FromResult(true);
    }

    private static string GetDisplayName(string modelName)
    {
        return modelName switch
        {
            var name when name.StartsWith("codellama") => "Code Llama",
            var name when name.StartsWith("llama2") => "Llama 2",
            var name when name.StartsWith("mistral") => "Mistral",
            var name when name.StartsWith("phi") => "Phi",
            var name when name.StartsWith("gemma") => "Gemma",
            _ => modelName.Replace(":", " ").Replace("-", " ")
        };
    }

    private static string GetModelDescription(string modelName)
    {
        return modelName switch
        {
            var name when name.StartsWith("codellama") => "Specialized for code generation and analysis",
            var name when name.StartsWith("llama2") => "General-purpose language model",
            var name when name.StartsWith("mistral") => "Fast and efficient language model",
            var name when name.StartsWith("phi") => "Small but capable model for various tasks",
            var name when name.StartsWith("gemma") => "Google's open-source language model",
            _ => "Language model for various AI tasks"
        };
    }

    private static ModelCapabilities GetModelCapabilities(string modelName)
    {
        return modelName switch
        {
            var name when name.StartsWith("codellama") => new ModelCapabilities
            {
                CodeAnalysis = true,
                CodeGeneration = true,
                Documentation = true,
                Chat = true,
                Debugging = true,
                CodeReview = true,
                SupportedLanguages = new List<string> { "Python", "JavaScript", "TypeScript", "C#", "Java", "C++", "Go", "Rust" },
                MaxTokens = 4096,
                OptimalUseCase = "Code-related tasks"
            },
            var name when name.StartsWith("llama2") => new ModelCapabilities
            {
                CodeAnalysis = true,
                CodeGeneration = false,
                Documentation = true,
                Chat = true,
                Debugging = false,
                CodeReview = true,
                SupportedLanguages = new List<string> { "Python", "JavaScript", "C#", "Java" },
                MaxTokens = 4096,
                OptimalUseCase = "General conversation and analysis"
            },
            _ => new ModelCapabilities
            {
                CodeAnalysis = false,
                CodeGeneration = false,
                Documentation = true,
                Chat = true,
                Debugging = false,
                CodeReview = false,
                SupportedLanguages = new List<string>(),
                MaxTokens = 2048,
                OptimalUseCase = "General tasks"
            }
        };
    }
}

// Helper classes for JSON deserialization
public class ModelsResponse
{
    public List<ModelInfo> Models { get; set; } = new();
}

public class ModelInfo
{
    public string Name { get; set; } = string.Empty;
    public long Size { get; set; }
    public DateTime ModifiedAt { get; set; }
    public string Digest { get; set; } = string.Empty;
}
