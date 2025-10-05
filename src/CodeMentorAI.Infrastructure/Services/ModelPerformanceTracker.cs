using CodeMentorAI.Core.Interfaces;
using CodeMentorAI.Core.Models;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;

namespace CodeMentorAI.Infrastructure.Services;

public class ModelPerformanceTracker : IModelPerformanceTracker
{
    private readonly ILogger<ModelPerformanceTracker> _logger;
    private readonly ConcurrentDictionary<string, ConcurrentQueue<PerformanceRecord>> _performanceData;
    private readonly ConcurrentDictionary<string, ModelPerformanceMetrics> _aggregatedMetrics;
    private const int MaxRecordsPerModel = 1000;

    public ModelPerformanceTracker(ILogger<ModelPerformanceTracker> logger)
    {
        _logger = logger;
        _performanceData = new ConcurrentDictionary<string, ConcurrentQueue<PerformanceRecord>>();
        _aggregatedMetrics = new ConcurrentDictionary<string, ModelPerformanceMetrics>();
    }

    public Task RecordPerformanceAsync(string modelName, TimeSpan responseTime, int tokenCount)
    {
        try
        {
            var record = new PerformanceRecord
            {
                Timestamp = DateTime.UtcNow,
                ResponseTime = responseTime,
                TokenCount = tokenCount,
                TokensPerSecond = tokenCount / responseTime.TotalSeconds
            };

            var queue = _performanceData.GetOrAdd(modelName, _ => new ConcurrentQueue<PerformanceRecord>());
            queue.Enqueue(record);

            // Keep only last N records per model (thread-safe)
            while (queue.Count > MaxRecordsPerModel)
            {
                queue.TryDequeue(out _);
            }

            // Update aggregated metrics asynchronously without blocking
            _ = Task.Run(() => UpdateAggregatedMetricsAsync(modelName));

            _logger.LogDebug("Recorded performance for model {ModelName}: {ResponseTime}ms, {TokenCount} tokens",
                modelName, responseTime.TotalMilliseconds, tokenCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to record performance for model {ModelName}", modelName);
        }

        return Task.CompletedTask;
    }

    public Task<ModelPerformanceMetrics?> GetPerformanceMetricsAsync(string modelName)
    {
        try
        {
            if (_aggregatedMetrics.TryGetValue(modelName, out var metrics))
            {
                return Task.FromResult<ModelPerformanceMetrics?>(metrics);
            }

            // If no aggregated metrics exist, calculate them
            if (_performanceData.TryGetValue(modelName, out var records) && !records.IsEmpty)
            {
                UpdateAggregatedMetricsAsync(modelName);
                return Task.FromResult(_aggregatedMetrics.GetValueOrDefault(modelName));
            }

            return Task.FromResult<ModelPerformanceMetrics?>(null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get performance metrics for model {ModelName}", modelName);
            return Task.FromResult<ModelPerformanceMetrics?>(null);
        }
    }

    public async Task<Dictionary<string, ModelPerformanceMetrics>> GetPerformanceComparisonAsync()
    {
        try
        {
            var comparison = new Dictionary<string, ModelPerformanceMetrics>();

            foreach (var modelName in _performanceData.Keys)
            {
                var metrics = await GetPerformanceMetricsAsync(modelName);
                if (metrics != null)
                {
                    comparison[modelName] = metrics;
                }
            }

            return comparison;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get performance comparison");
            return new Dictionary<string, ModelPerformanceMetrics>();
        }
    }

    private void UpdateAggregatedMetricsAsync(string modelName)
    {
        try
        {
            if (!_performanceData.TryGetValue(modelName, out var queue) || queue.IsEmpty)
                return;

            var recordsList = queue.ToList();
            var cutoffTime = DateTime.UtcNow.AddHours(-24);
            var recentRecords = recordsList.Where(r => r.Timestamp > cutoffTime).ToList();

            if (!recentRecords.Any())
                recentRecords = recordsList.TakeLast(100).ToList();

            if (!recentRecords.Any())
                return;

            var metrics = new ModelPerformanceMetrics
            {
                AverageResponseTime = recentRecords.Average(r => r.ResponseTime.TotalMilliseconds),
                TokensPerSecond = recentRecords.Average(r => r.TokensPerSecond),
                TotalRequests = recordsList.Count,
                LastUsed = recordsList.Max(r => r.Timestamp),
                MemoryUsage = 0, // Would need system monitoring to get actual values
                CpuUsage = 0     // Would need system monitoring to get actual values
            };

            _aggregatedMetrics.AddOrUpdate(modelName, metrics, (key, existing) => metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update aggregated metrics for model {ModelName}", modelName);
        }
    }

    private class PerformanceRecord
    {
        public DateTime Timestamp { get; set; }
        public TimeSpan ResponseTime { get; set; }
        public int TokenCount { get; set; }
        public double TokensPerSecond { get; set; }
    }
}

public class ModelCapabilityService : IModelCapabilityService
{
    private readonly ILogger<ModelCapabilityService> _logger;
    private readonly Dictionary<string, List<string>> _taskModelMapping;

    public ModelCapabilityService(ILogger<ModelCapabilityService> logger)
    {
        _logger = logger;
        _taskModelMapping = new Dictionary<string, List<string>>
        {
            ["code_analysis"] = new List<string> { "codellama", "llama2" },
            ["code_generation"] = new List<string> { "codellama" },
            ["documentation"] = new List<string> { "codellama", "llama2", "mistral" },
            ["chat"] = new List<string> { "llama2", "mistral", "phi" },
            ["debugging"] = new List<string> { "codellama" },
            ["code_review"] = new List<string> { "codellama", "llama2" }
        };
    }

    public async Task<string?> GetBestModelForTaskAsync(string taskType, List<string> availableModels)
    {
        try
        {
            if (!_taskModelMapping.TryGetValue(taskType.ToLower(), out var recommendedModels))
            {
                return availableModels.FirstOrDefault();
            }

            // Find the first recommended model that's available
            foreach (var recommended in recommendedModels)
            {
                var match = availableModels.FirstOrDefault(m => 
                    m.StartsWith(recommended, StringComparison.OrdinalIgnoreCase));
                if (match != null)
                {
                    return match;
                }
            }

            return availableModels.FirstOrDefault();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get best model for task {TaskType}", taskType);
            return availableModels.FirstOrDefault();
        }
    }

    public async Task<Dictionary<string, List<string>>> GetModelRecommendationsAsync()
    {
        return await Task.FromResult(_taskModelMapping);
    }

    public bool SupportsCapability(OllamaModel model, string capability)
    {
        return capability.ToLower() switch
        {
            "code_analysis" => model.Capabilities.CodeAnalysis,
            "code_generation" => model.Capabilities.CodeGeneration,
            "documentation" => model.Capabilities.Documentation,
            "chat" => model.Capabilities.Chat,
            "debugging" => model.Capabilities.Debugging,
            "code_review" => model.Capabilities.CodeReview,
            _ => false
        };
    }
}
