using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using CodeMentorAI.Core.Interfaces;
using CodeMentorAI.Core.Models;
using CodeMentorAI.API.Hubs;

namespace CodeMentorAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ModelsController : ControllerBase
{
    private readonly IOllamaService _ollamaService;
    private readonly IModelCapabilityService _capabilityService;
    private readonly IModelPerformanceTracker _performanceTracker;
    private readonly IHubContext<ModelHub> _hubContext;
    private readonly ILogger<ModelsController> _logger;

    public ModelsController(
        IOllamaService ollamaService,
        IModelCapabilityService capabilityService,
        IModelPerformanceTracker performanceTracker,
        IHubContext<ModelHub> hubContext,
        ILogger<ModelsController> logger)
    {
        _ollamaService = ollamaService;
        _capabilityService = capabilityService;
        _performanceTracker = performanceTracker;
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <summary>
    /// Gets all available Ollama models
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<OllamaModel>>> GetModels()
    {
        try
        {
            var models = await _ollamaService.GetAvailableModelsAsync();
            return Ok(models);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get models");
            return StatusCode(500, "Failed to retrieve models");
        }
    }

    /// <summary>
    /// Gets models directly from filesystem (bypasses cache)
    /// </summary>
    [HttpGet("from-disk")]
    public ActionResult<List<string>> GetModelsFromDisk()
    {
        try
        {
            var ollamaPath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                ".ollama", "models", "manifests", "registry.ollama.ai", "library"
            );

            _logger.LogInformation("Reading models from: {Path}", ollamaPath);

            if (!Directory.Exists(ollamaPath))
            {
                _logger.LogWarning("Ollama models directory not found: {Path}", ollamaPath);
                return Ok(new List<string>());
            }

            var modelDirs = Directory.GetDirectories(ollamaPath);
            var models = new List<string>();

            foreach (var modelDir in modelDirs)
            {
                var modelName = Path.GetFileName(modelDir);
                var tagFiles = Directory.GetFiles(modelDir);

                foreach (var tagFile in tagFiles)
                {
                    var tag = Path.GetFileName(tagFile);
                    models.Add($"{modelName}:{tag}");
                }
            }

            _logger.LogInformation("Found {Count} models on disk: {Models}", models.Count, string.Join(", ", models));
            return Ok(models);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to read models from disk");
            return StatusCode(500, "Failed to read models from disk");
        }
    }

    /// <summary>
    /// Gets the currently active model
    /// </summary>
    [HttpGet("current")]
    public async Task<ActionResult<OllamaModel>> GetCurrentModel()
    {
        try
        {
            var model = await _ollamaService.GetCurrentModelAsync();
            if (model == null)
            {
                return NotFound("No model is currently active");
            }
            return Ok(model);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get current model");
            return StatusCode(500, "Failed to retrieve current model");
        }
    }

    /// <summary>
    /// Switches to a different model
    /// </summary>
    [HttpPost("switch")]
    public async Task<ActionResult<ModelSwitchResponse>> SwitchModel([FromBody] ModelSwitchRequest request)
    {
        try
        {
            var result = await _ollamaService.SwitchModelAsync(request.ModelName, request.SessionId);
            
            // Notify all connected clients about the model switch
            await _hubContext.Clients.All.SendAsync("ModelSwitched", new
            {
                ModelName = request.ModelName,
                Success = result.Success,
                Message = result.Message,
                UserId = request.UserId,
                SessionId = request.SessionId,
                Timestamp = DateTime.UtcNow
            });

            if (result.Success)
            {
                return Ok(result);
            }
            else
            {
                return BadRequest(result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to switch model to {ModelName}", request.ModelName);
            return StatusCode(500, "Failed to switch model");
        }
    }

    /// <summary>
    /// Gets model information including capabilities
    /// </summary>
    [HttpGet("{modelName}")]
    public async Task<ActionResult<OllamaModel>> GetModelInfo(string modelName)
    {
        try
        {
            var model = await _ollamaService.GetModelInfoAsync(modelName);
            if (model == null)
            {
                return NotFound($"Model '{modelName}' not found");
            }
            return Ok(model);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get model info for {ModelName}", modelName);
            return StatusCode(500, "Failed to retrieve model information");
        }
    }

    /// <summary>
    /// Gets performance metrics for a specific model
    /// </summary>
    [HttpGet("{modelName}/performance")]
    public async Task<ActionResult<ModelPerformanceMetrics>> GetModelPerformance(string modelName)
    {
        try
        {
            var performance = await _performanceTracker.GetPerformanceMetricsAsync(modelName);
            if (performance == null)
            {
                return NotFound($"No performance data available for model '{modelName}'");
            }
            return Ok(performance);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get performance metrics for {ModelName}", modelName);
            return StatusCode(500, "Failed to retrieve performance metrics");
        }
    }

    /// <summary>
    /// Gets performance comparison between all models
    /// </summary>
    [HttpGet("performance/comparison")]
    public async Task<ActionResult<Dictionary<string, ModelPerformanceMetrics>>> GetPerformanceComparison()
    {
        try
        {
            var comparison = await _performanceTracker.GetPerformanceComparisonAsync();
            return Ok(comparison);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get performance comparison");
            return StatusCode(500, "Failed to retrieve performance comparison");
        }
    }

    /// <summary>
    /// Gets model recommendations for different tasks
    /// </summary>
    [HttpGet("recommendations")]
    public async Task<ActionResult<Dictionary<string, List<string>>>> GetModelRecommendations()
    {
        try
        {
            var recommendations = await _capabilityService.GetModelRecommendationsAsync();
            return Ok(recommendations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get model recommendations");
            return StatusCode(500, "Failed to retrieve model recommendations");
        }
    }

    /// <summary>
    /// Gets the best model for a specific task
    /// </summary>
    [HttpGet("best-for-task/{taskType}")]
    public async Task<ActionResult<string>> GetBestModelForTask(string taskType)
    {
        try
        {
            var models = await _ollamaService.GetAvailableModelsAsync();
            var modelNames = models.Select(m => m.Name).ToList();
            
            var bestModel = await _capabilityService.GetBestModelForTaskAsync(taskType, modelNames);
            
            if (string.IsNullOrEmpty(bestModel))
            {
                return NotFound($"No suitable model found for task '{taskType}'");
            }
            
            return Ok(new { ModelName = bestModel, TaskType = taskType });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get best model for task {TaskType}", taskType);
            return StatusCode(500, "Failed to find best model for task");
        }
    }

    /// <summary>
    /// Pulls/downloads a model from Ollama registry
    /// </summary>
    [HttpPost("{modelName}/pull")]
    public async Task<ActionResult> PullModel(string modelName)
    {
        try
        {
            var progress = new Progress<string>(status =>
            {
                // Send progress updates to connected clients
                _hubContext.Clients.All.SendAsync("ModelPullProgress", new
                {
                    ModelName = modelName,
                    Status = status,
                    Timestamp = DateTime.UtcNow
                });
            });

            var success = await _ollamaService.PullModelAsync(modelName, progress);

            if (success)
            {
                _logger.LogInformation("✅ Model pull completed successfully: {ModelName}", modelName);

                // Wait a moment for Ollama to fully register the model
                _logger.LogInformation("⏳ Waiting 2 seconds for Ollama to register the model...");
                await Task.Delay(2000);

                // Refresh the models list from Ollama API
                _logger.LogInformation("🔄 Refreshing models list after download...");
                var updatedModels = await _ollamaService.GetAvailableModelsAsync();
                _logger.LogInformation("✅ Models list refreshed: {Count} models available", updatedModels.Count);
                _logger.LogInformation("📋 Models: {Models}", string.Join(", ", updatedModels.Select(m => m.Name)));

                await _hubContext.Clients.All.SendAsync("ModelPullCompleted", new
                {
                    ModelName = modelName,
                    Success = true,
                    Timestamp = DateTime.UtcNow,
                    UpdatedModels = updatedModels
                });

                return Ok($"Successfully pulled model '{modelName}'");
            }
            else
            {
                await _hubContext.Clients.All.SendAsync("ModelPullCompleted", new
                {
                    ModelName = modelName,
                    Success = false,
                    Timestamp = DateTime.UtcNow
                });

                return BadRequest($"Failed to pull model '{modelName}'");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to pull model {ModelName}", modelName);
            return StatusCode(500, "Failed to pull model");
        }
    }

    /// <summary>
    /// Removes a model from local storage
    /// </summary>
    [HttpDelete("{**modelName}")]
    public async Task<ActionResult> RemoveModel(string modelName)
    {
        try
        {
            // URL decode the model name (ASP.NET Core should do this automatically, but let's be explicit)
            var decodedModelName = Uri.UnescapeDataString(modelName);
            _logger.LogInformation("Removing model: {ModelName} (decoded from: {EncodedName})", decodedModelName, modelName);

            var success = await _ollamaService.RemoveModelAsync(decodedModelName);

            if (success)
            {
                _logger.LogInformation("✅ Model removal completed successfully: {ModelName}", decodedModelName);

                // Wait a moment for Ollama to fully unregister the model
                _logger.LogInformation("⏳ Waiting 2 seconds for Ollama to unregister the model...");
                await Task.Delay(2000);

                // Refresh the models list from Ollama API
                _logger.LogInformation("🔄 Refreshing models list after deletion...");
                var updatedModels = await _ollamaService.GetAvailableModelsAsync();
                _logger.LogInformation("✅ Models list refreshed: {Count} models available", updatedModels.Count);
                _logger.LogInformation("📋 Models: {Models}", string.Join(", ", updatedModels.Select(m => m.Name)));

                await _hubContext.Clients.All.SendAsync("ModelRemoved", new
                {
                    ModelName = decodedModelName,
                    Timestamp = DateTime.UtcNow,
                    UpdatedModels = updatedModels
                });

                return Ok($"Successfully removed model '{decodedModelName}'");
            }
            else
            {
                return BadRequest($"Failed to remove model '{decodedModelName}'");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to remove model {ModelName}", modelName);
            return StatusCode(500, "Failed to remove model");
        }
    }

    /// <summary>
    /// Preloads a model into memory for faster responses
    /// </summary>
    [HttpPost("{modelName}/preload")]
    public async Task<ActionResult> PreloadModel(string modelName)
    {
        try
        {
            var success = await _ollamaService.PreloadModelAsync(modelName);
            
            if (success)
            {
                await _hubContext.Clients.All.SendAsync("ModelPreloaded", new
                {
                    ModelName = modelName,
                    Timestamp = DateTime.UtcNow
                });
                
                return Ok($"Successfully preloaded model '{modelName}'");
            }
            else
            {
                return BadRequest($"Failed to preload model '{modelName}'");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to preload model {ModelName}", modelName);
            return StatusCode(500, "Failed to preload model");
        }
    }
}
