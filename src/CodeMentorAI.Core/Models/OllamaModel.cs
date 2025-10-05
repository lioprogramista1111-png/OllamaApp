namespace CodeMentorAI.Core.Models;

public class OllamaModel
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public long Size { get; set; }
    public DateTime ModifiedAt { get; set; }
    public string Digest { get; set; } = string.Empty;
    public ModelCapabilities Capabilities { get; set; } = new();
    public ModelStatus Status { get; set; } = ModelStatus.Available;
    public ModelPerformanceMetrics? Performance { get; set; }
}

public class ModelCapabilities
{
    public bool CodeAnalysis { get; set; }
    public bool CodeGeneration { get; set; }
    public bool Documentation { get; set; }
    public bool Chat { get; set; }
    public bool Debugging { get; set; }
    public bool CodeReview { get; set; }
    public List<string> SupportedLanguages { get; set; } = new();
    public int MaxTokens { get; set; }
    public string OptimalUseCase { get; set; } = string.Empty;
}

public class ModelPerformanceMetrics
{
    public double AverageResponseTime { get; set; }
    public double TokensPerSecond { get; set; }
    public int TotalRequests { get; set; }
    public DateTime LastUsed { get; set; }
    public double MemoryUsage { get; set; }
    public double CpuUsage { get; set; }
}

public enum ModelStatus
{
    Available,
    Loading,
    Running,
    Error,
    NotInstalled
}

public class OllamaRequest
{
    public string Model { get; set; } = string.Empty;
    public string Prompt { get; set; } = string.Empty;
    public bool Stream { get; set; } = false;
    public OllamaOptions? Options { get; set; }
}

public class OllamaOptions
{
    public double Temperature { get; set; } = 0.7;
    public int TopK { get; set; } = 40;
    public double TopP { get; set; } = 0.9;
    public int NumCtx { get; set; } = 2048;
    public int NumPredict { get; set; } = -1;
}

public class OllamaResponse
{
    public string Model { get; set; } = string.Empty;
    public string Response { get; set; } = string.Empty;
    public bool Done { get; set; }
    public DateTime CreatedAt { get; set; }
    public long TotalDuration { get; set; }
    public long LoadDuration { get; set; }
    public long PromptEvalCount { get; set; }
    public long PromptEvalDuration { get; set; }
    public long EvalCount { get; set; }
    public long EvalDuration { get; set; }
}

public class ModelSwitchRequest
{
    public string ModelName { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string SessionId { get; set; } = string.Empty;
}

public class ModelSwitchResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public OllamaModel? Model { get; set; }
    public TimeSpan SwitchDuration { get; set; }
}

// Models for Ollama Registry and Downloads
public class OllamaRegistryModel
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public long Size { get; set; }
    public int Downloads { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string Category { get; set; } = string.Empty;
    public List<string> Languages { get; set; } = new();
    public ModelCapabilities Capabilities { get; set; } = new();
    public string License { get; set; } = string.Empty;
    public string Publisher { get; set; } = string.Empty;
    public bool IsOfficial { get; set; }
    public List<string> Variants { get; set; } = new();
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class ModelDownloadProgress
{
    public string ModelName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public long BytesDownloaded { get; set; }
    public long TotalBytes { get; set; }
    public double ProgressPercentage => TotalBytes > 0 ? (double)BytesDownloaded / TotalBytes * 100 : 0;
    public TimeSpan ElapsedTime { get; set; }
    public TimeSpan EstimatedTimeRemaining { get; set; }
    public double DownloadSpeed { get; set; } // bytes per second
    public DateTime StartTime { get; set; }
    public DateTime? CompletedTime { get; set; }
    public string? ErrorMessage { get; set; }
    public bool IsCompleted { get; set; }
    public bool HasError { get; set; }
}

public class ModelDownloadRequest
{
    public string ModelName { get; set; } = string.Empty;
    public string? Tag { get; set; } = "latest";
    public string UserId { get; set; } = string.Empty;
    public string SessionId { get; set; } = string.Empty;
    public bool AutoStart { get; set; } = false;
}

public class ModelDownloadResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? DownloadId { get; set; }
    public ModelDownloadProgress? Progress { get; set; }
}

public class ModelRegistrySearchRequest
{
    public string? Query { get; set; }
    public string? Category { get; set; }
    public List<string>? Languages { get; set; }
    public List<string>? Capabilities { get; set; }
    public string? SortBy { get; set; } = "downloads"; // downloads, updated, name, size
    public string? SortOrder { get; set; } = "desc"; // asc, desc
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public long? MaxSize { get; set; }
    public bool? OfficialOnly { get; set; }
}

public class ModelRegistrySearchResponse
{
    public List<OllamaRegistryModel> Models { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;
}
