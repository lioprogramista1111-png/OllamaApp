using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using CodeMentorAI.Core.Interfaces;
using CodeMentorAI.Core.Models;
using CodeMentorAI.API.Hubs;

namespace CodeMentorAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ModelRegistryController : ControllerBase
{
    private readonly IModelRegistryService _registryService;
    private readonly IModelDownloadService _downloadService;
    private readonly IHubContext<ModelHub> _hubContext;
    private readonly ILogger<ModelRegistryController> _logger;

    public ModelRegistryController(
        IModelRegistryService registryService,
        IModelDownloadService downloadService,
        IHubContext<ModelHub> hubContext,
        ILogger<ModelRegistryController> logger)
    {
        _registryService = registryService;
        _downloadService = downloadService;
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <summary>
    /// Search for models in the Ollama registry
    /// </summary>
    [HttpPost("search")]
    public async Task<ActionResult<ModelRegistrySearchResponse>> SearchModels(
        [FromBody] ModelRegistrySearchRequest request)
    {
        try
        {
            var result = await _registryService.SearchModelsAsync(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to search models");
            return StatusCode(500, new { message = "Failed to search models", error = ex.Message });
        }
    }

    /// <summary>
    /// Get detailed information about a specific model
    /// </summary>
    [HttpGet("{modelName}")]
    public async Task<ActionResult<OllamaRegistryModel>> GetModelDetails(string modelName)
    {
        try
        {
            var model = await _registryService.GetModelDetailsAsync(modelName);
            if (model == null)
            {
                return NotFound(new { message = $"Model '{modelName}' not found in registry" });
            }

            return Ok(model);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get model details for {ModelName}", modelName);
            return StatusCode(500, new { message = "Failed to get model details", error = ex.Message });
        }
    }

    /// <summary>
    /// Get featured/popular models
    /// </summary>
    [HttpGet("featured")]
    public async Task<ActionResult<List<OllamaRegistryModel>>> GetFeaturedModels([FromQuery] int count = 10)
    {
        try
        {
            var models = await _registryService.GetFeaturedModelsAsync(count);
            return Ok(models);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get featured models");
            return StatusCode(500, new { message = "Failed to get featured models", error = ex.Message });
        }
    }

    /// <summary>
    /// Get models by category
    /// </summary>
    [HttpGet("category/{category}")]
    public async Task<ActionResult<List<OllamaRegistryModel>>> GetModelsByCategory(string category)
    {
        try
        {
            var models = await _registryService.GetModelsByCategoryAsync(category);
            return Ok(models);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get models by category {Category}", category);
            return StatusCode(500, new { message = "Failed to get models by category", error = ex.Message });
        }
    }

    /// <summary>
    /// Get all available categories
    /// </summary>
    [HttpGet("categories")]
    public async Task<ActionResult<List<string>>> GetCategories()
    {
        try
        {
            var categories = await _registryService.GetCategoriesAsync();
            return Ok(categories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get categories");
            return StatusCode(500, new { message = "Failed to get categories", error = ex.Message });
        }
    }

    /// <summary>
    /// Download a model from the registry
    /// </summary>
    [HttpPost("download")]
    public async Task<ActionResult<ModelDownloadResponse>> DownloadModel(
        [FromBody] ModelDownloadRequest request)
    {
        try
        {
            var progress = new Progress<ModelDownloadProgress>(async (p) =>
            {
                // Broadcast download progress to all connected clients
                await _hubContext.Clients.All.SendAsync("ModelDownloadProgress", p);
            });

            var result = await _downloadService.DownloadModelAsync(request, progress);
            
            if (result.Success)
            {
                _logger.LogInformation("Started download for model: {ModelName}", request.ModelName);
                
                // Notify clients that download started
                await _hubContext.Clients.All.SendAsync("ModelDownloadStarted", new
                {
                    ModelName = request.ModelName,
                    DownloadId = result.DownloadId,
                    Message = result.Message
                });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start download for model: {ModelName}", request.ModelName);
            return StatusCode(500, new { message = "Failed to start download", error = ex.Message });
        }
    }

    /// <summary>
    /// Get download progress for a specific download
    /// </summary>
    [HttpGet("download/{downloadId}/progress")]
    public async Task<ActionResult<ModelDownloadProgress>> GetDownloadProgress(string downloadId)
    {
        try
        {
            var progress = await _downloadService.GetDownloadProgressAsync(downloadId);
            if (progress == null)
            {
                return NotFound(new { message = $"Download '{downloadId}' not found" });
            }

            return Ok(progress);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get download progress for {DownloadId}", downloadId);
            return StatusCode(500, new { message = "Failed to get download progress", error = ex.Message });
        }
    }

    /// <summary>
    /// Get all active downloads
    /// </summary>
    [HttpGet("downloads/active")]
    public async Task<ActionResult<List<ModelDownloadProgress>>> GetActiveDownloads()
    {
        try
        {
            var downloads = await _downloadService.GetActiveDownloadsAsync();
            return Ok(downloads);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get active downloads");
            return StatusCode(500, new { message = "Failed to get active downloads", error = ex.Message });
        }
    }

    /// <summary>
    /// Cancel a model download
    /// </summary>
    [HttpPost("download/{downloadId}/cancel")]
    public async Task<ActionResult> CancelDownload(string downloadId)
    {
        try
        {
            var success = await _downloadService.CancelDownloadAsync(downloadId);
            if (!success)
            {
                return NotFound(new { message = $"Download '{downloadId}' not found or cannot be cancelled" });
            }

            // Notify clients that download was cancelled
            await _hubContext.Clients.All.SendAsync("ModelDownloadCancelled", new
            {
                DownloadId = downloadId,
                Message = "Download cancelled successfully"
            });

            return Ok(new { message = "Download cancelled successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to cancel download {DownloadId}", downloadId);
            return StatusCode(500, new { message = "Failed to cancel download", error = ex.Message });
        }
    }

    /// <summary>
    /// Get download history
    /// </summary>
    [HttpGet("downloads/history")]
    public async Task<ActionResult<List<ModelDownloadProgress>>> GetDownloadHistory([FromQuery] int count = 50)
    {
        try
        {
            var history = await _downloadService.GetDownloadHistoryAsync(count);
            return Ok(history);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get download history");
            return StatusCode(500, new { message = "Failed to get download history", error = ex.Message });
        }
    }

    /// <summary>
    /// Verify a downloaded model
    /// </summary>
    [HttpPost("verify/{modelName}")]
    public async Task<ActionResult> VerifyModel(string modelName)
    {
        try
        {
            var isValid = await _downloadService.VerifyModelAsync(modelName);
            
            return Ok(new 
            { 
                modelName = modelName,
                isValid = isValid,
                message = isValid ? "Model is valid and ready for use" : "Model verification failed"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to verify model {ModelName}", modelName);
            return StatusCode(500, new { message = "Failed to verify model", error = ex.Message });
        }
    }

    /// <summary>
    /// Gets the configured models path
    /// </summary>
    [HttpGet("models-path")]
    public ActionResult<string> GetModelsPath()
    {
        try
        {
            var modelsPath = _downloadService.GetModelsPath();
            return Ok(new { modelsPath });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get models path");
            return StatusCode(500, new { message = "Failed to get models path", error = ex.Message });
        }
    }

    /// <summary>
    /// Gets local model information
    /// </summary>
    [HttpGet("local/{modelName}")]
    public async Task<ActionResult> GetLocalModelInfo(string modelName)
    {
        try
        {
            var isDownloaded = _downloadService.IsModelDownloadedLocally(modelName);
            var filePath = _downloadService.GetModelFilePath(modelName);
            var size = await _downloadService.GetLocalModelSizeAsync(modelName);

            return Ok(new
            {
                modelName,
                isDownloaded,
                filePath,
                size,
                sizeFormatted = FormatBytes(size)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get local model info for {ModelName}", modelName);
            return StatusCode(500, new { message = "Failed to get local model info", error = ex.Message });
        }
    }

    /// <summary>
    /// Lists all locally downloaded models
    /// </summary>
    [HttpGet("local")]
    public ActionResult GetLocalModels()
    {
        try
        {
            var modelsPath = _downloadService.GetModelsPath();
            if (string.IsNullOrEmpty(modelsPath) || !Directory.Exists(modelsPath))
            {
                return Ok(new { models = new object[0], modelsPath });
            }

            var modelFiles = Directory.GetFiles(modelsPath, "*.model");
            var models = modelFiles.Select(file =>
            {
                var fileName = Path.GetFileNameWithoutExtension(file);
                var modelName = fileName.Replace("_", ":");
                var fileInfo = new FileInfo(file);

                return new
                {
                    modelName,
                    fileName,
                    filePath = file,
                    size = fileInfo.Length,
                    sizeFormatted = FormatBytes(fileInfo.Length),
                    lastModified = fileInfo.LastWriteTime
                };
            }).ToArray();

            return Ok(new { models, modelsPath });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get local models");
            return StatusCode(500, new { message = "Failed to get local models", error = ex.Message });
        }
    }

    private static string FormatBytes(long bytes)
    {
        if (bytes == 0) return "0 B";

        string[] sizes = { "B", "KB", "MB", "GB", "TB" };
        int order = 0;
        double size = bytes;

        while (size >= 1024 && order < sizes.Length - 1)
        {
            order++;
            size /= 1024;
        }

        return $"{size:0.##} {sizes[order]}";
    }
}
