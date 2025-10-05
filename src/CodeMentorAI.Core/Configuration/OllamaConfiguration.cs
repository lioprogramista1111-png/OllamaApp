namespace CodeMentorAI.Core.Configuration;

public class OllamaConfiguration
{
    public const string SectionName = "Ollama";
    
    public string BaseUrl { get; set; } = "http://localhost:11434";
    public string DefaultModel { get; set; } = "llama2:7b";
    public int RequestTimeout { get; set; } = 300;
    public int MaxConcurrentRequests { get; set; } = 5;
    public bool EnablePerformanceTracking { get; set; } = true;
    public string ModelsPath { get; set; } = string.Empty;
    public bool EnableModelDownloads { get; set; } = true;
    public int MaxDownloadConcurrency { get; set; } = 2;
    public string RegistryUrl { get; set; } = "https://ollama.ai";
    
    public Dictionary<string, ModelConfiguration> ModelConfigurations { get; set; } = new();
}

public class ModelConfiguration
{
    public double Temperature { get; set; } = 0.7;
    public int TopK { get; set; } = 40;
    public double TopP { get; set; } = 0.9;
    public int NumCtx { get; set; } = 4096;
    public List<string> OptimalFor { get; set; } = new();
}
