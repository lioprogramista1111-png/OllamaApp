using Microsoft.AspNetCore.SignalR;
using CodeMentorAI.Core.Interfaces;
using CodeMentorAI.Core.Models;

namespace CodeMentorAI.API.Hubs;

public class ModelHub : Hub
{
    private readonly IOllamaService _ollamaService;
    private readonly ILogger<ModelHub> _logger;

    public ModelHub(IOllamaService ollamaService, ILogger<ModelHub> logger)
    {
        _ollamaService = ollamaService;
        _logger = logger;
    }

    public async Task JoinModelGroup(string modelName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"model_{modelName}");
        _logger.LogInformation("Client {ConnectionId} joined model group {ModelName}", 
            Context.ConnectionId, modelName);
    }

    public async Task LeaveModelGroup(string modelName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"model_{modelName}");
        _logger.LogInformation("Client {ConnectionId} left model group {ModelName}", 
            Context.ConnectionId, modelName);
    }

    public async Task RequestModelSwitch(string modelName, string userId, string sessionId)
    {
        try
        {
            _logger.LogInformation("Model switch requested by user {UserId} to {ModelName}", 
                userId, modelName);

            // Notify other clients that a model switch is in progress
            await Clients.Others.SendAsync("ModelSwitchRequested", new
            {
                ModelName = modelName,
                UserId = userId,
                SessionId = sessionId,
                Timestamp = DateTime.UtcNow
            });

            // Perform the actual model switch
            var result = await _ollamaService.SwitchModelAsync(modelName, sessionId);

            // Notify all clients about the result
            await Clients.All.SendAsync("ModelSwitchCompleted", new
            {
                ModelName = modelName,
                Success = result.Success,
                Message = result.Message,
                UserId = userId,
                SessionId = sessionId,
                SwitchDuration = result.SwitchDuration.TotalMilliseconds,
                Timestamp = DateTime.UtcNow
            });

            // Send response back to the requesting client
            await Clients.Caller.SendAsync("ModelSwitchResponse", result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process model switch request for {ModelName}", modelName);
            
            await Clients.Caller.SendAsync("ModelSwitchError", new
            {
                ModelName = modelName,
                Error = ex.Message,
                Timestamp = DateTime.UtcNow
            });
        }
    }

    public async Task GetCurrentModel()
    {
        try
        {
            var currentModel = await _ollamaService.GetCurrentModelAsync();
            await Clients.Caller.SendAsync("CurrentModelResponse", currentModel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get current model");
            await Clients.Caller.SendAsync("CurrentModelError", ex.Message);
        }
    }

    public async Task GetAvailableModels()
    {
        try
        {
            var models = await _ollamaService.GetAvailableModelsAsync();
            await Clients.Caller.SendAsync("AvailableModelsResponse", models);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get available models");
            await Clients.Caller.SendAsync("AvailableModelsError", ex.Message);
        }
    }

    public async Task SubscribeToModelUpdates()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "ModelUpdates");
        _logger.LogInformation("Client {ConnectionId} subscribed to model updates", Context.ConnectionId);
    }

    public async Task UnsubscribeFromModelUpdates()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "ModelUpdates");
        _logger.LogInformation("Client {ConnectionId} unsubscribed from model updates", Context.ConnectionId);
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client {ConnectionId} connected to ModelHub", Context.ConnectionId);
        
        // Send current model status to the newly connected client
        try
        {
            var currentModel = await _ollamaService.GetCurrentModelAsync();
            await Clients.Caller.SendAsync("ModelHubConnected", new
            {
                ConnectionId = Context.ConnectionId,
                CurrentModel = currentModel,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send initial model status to client {ConnectionId}", Context.ConnectionId);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client {ConnectionId} disconnected from ModelHub. Exception: {Exception}", 
            Context.ConnectionId, exception?.Message);
        
        await base.OnDisconnectedAsync(exception);
    }
}

// Extension methods for strongly-typed SignalR client calls
public static class ModelHubExtensions
{
    public static async Task NotifyModelSwitched(this IHubContext<ModelHub> hubContext, 
        string modelName, bool success, string message, string? userId = null, string? sessionId = null)
    {
        await hubContext.Clients.Group("ModelUpdates").SendAsync("ModelSwitched", new
        {
            ModelName = modelName,
            Success = success,
            Message = message,
            UserId = userId,
            SessionId = sessionId,
            Timestamp = DateTime.UtcNow
        });
    }

    public static async Task NotifyModelPerformanceUpdate(this IHubContext<ModelHub> hubContext,
        string modelName, ModelPerformanceMetrics metrics)
    {
        await hubContext.Clients.Group("ModelUpdates").SendAsync("ModelPerformanceUpdate", new
        {
            ModelName = modelName,
            Metrics = metrics,
            Timestamp = DateTime.UtcNow
        });
    }

    public static async Task NotifyModelStatusChange(this IHubContext<ModelHub> hubContext,
        string modelName, ModelStatus status)
    {
        await hubContext.Clients.Group("ModelUpdates").SendAsync("ModelStatusChanged", new
        {
            ModelName = modelName,
            Status = status.ToString(),
            Timestamp = DateTime.UtcNow
        });
    }

    public static async Task NotifyModelDownloadProgress(this IHubContext<ModelHub> hubContext,
        ModelDownloadProgress progress)
    {
        await hubContext.Clients.All.SendAsync("ModelDownloadProgress", progress);
    }

    public static async Task NotifyModelDownloadStarted(this IHubContext<ModelHub> hubContext,
        string modelName, string downloadId, string message)
    {
        await hubContext.Clients.All.SendAsync("ModelDownloadStarted", new
        {
            ModelName = modelName,
            DownloadId = downloadId,
            Message = message,
            Timestamp = DateTime.UtcNow
        });
    }

    public static async Task NotifyModelDownloadCompleted(this IHubContext<ModelHub> hubContext,
        string modelName, string downloadId, bool success, string message)
    {
        await hubContext.Clients.All.SendAsync("ModelDownloadCompleted", new
        {
            ModelName = modelName,
            DownloadId = downloadId,
            Success = success,
            Message = message,
            Timestamp = DateTime.UtcNow
        });
    }

    public static async Task NotifyModelDownloadCancelled(this IHubContext<ModelHub> hubContext,
        string downloadId, string message)
    {
        await hubContext.Clients.All.SendAsync("ModelDownloadCancelled", new
        {
            DownloadId = downloadId,
            Message = message,
            Timestamp = DateTime.UtcNow
        });
    }
}
