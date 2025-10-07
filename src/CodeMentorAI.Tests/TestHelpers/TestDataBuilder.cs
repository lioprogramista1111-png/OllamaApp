using AutoFixture;
using CodeMentorAI.Core.Models;

namespace CodeMentorAI.Tests.TestHelpers;

/// <summary>
/// Helper class for building test data using AutoFixture
/// </summary>
public static class TestDataBuilder
{
    private static readonly Fixture _fixture = new();

    static TestDataBuilder()
    {
        // Configure AutoFixture customizations
        _fixture.Customize<OllamaModel>(composer =>
            composer
                .With(x => x.Name, () => _fixture.Create<string>() + ":latest")
                .With(x => x.Size, () => _fixture.Create<long>() % 10000000000) // Reasonable file size
                .With(x => x.Status, ModelStatus.Available)
                .With(x => x.ModifiedAt, () => DateTime.UtcNow.AddDays(-_fixture.Create<int>() % 30)));

        _fixture.Customize<ModelCapabilities>(composer =>
            composer
                .With(x => x.MaxTokens, () => _fixture.Create<int>() % 8192 + 1024)
                .With(x => x.SupportedLanguages, () => new List<string> { "C#", "Python", "JavaScript" }));

        _fixture.Customize<ModelPerformanceMetrics>(composer =>
            composer
                .With(x => x.AverageResponseTime, () => _fixture.Create<double>() % 10 + 0.1)
                .With(x => x.TokensPerSecond, () => _fixture.Create<double>() % 100 + 1)
                .With(x => x.TotalRequests, () => _fixture.Create<int>() % 1000)
                .With(x => x.MemoryUsage, () => _fixture.Create<double>() % 1024)
                .With(x => x.CpuUsage, () => _fixture.Create<double>() % 100)
                .With(x => x.LastUsed, () => DateTime.UtcNow.AddHours(-_fixture.Create<int>() % 24)));

        _fixture.Customize<OllamaRequest>(composer =>
            composer
                .With(x => x.Model, () => "test-model:latest")
                .With(x => x.Stream, false)
                .With(x => x.Options, () => _fixture.Create<OllamaOptions>()));

        _fixture.Customize<OllamaOptions>(composer =>
            composer
                .With(x => x.Temperature, () => Math.Round(_fixture.Create<double>() % 1, 2))
                .With(x => x.TopK, () => _fixture.Create<int>() % 100 + 1)
                .With(x => x.TopP, () => Math.Round(_fixture.Create<double>() % 1, 2))
                .With(x => x.NumCtx, () => _fixture.Create<int>() % 4096 + 512)
                .With(x => x.NumPredict, () => _fixture.Create<int>() % 1000));

        _fixture.Customize<OllamaResponse>(composer =>
            composer
                .With(x => x.Model, () => "test-model:latest")
                .With(x => x.Done, true)
                .With(x => x.CreatedAt, () => DateTime.UtcNow)
                .With(x => x.TotalDuration, () => _fixture.Create<long>() % 10000000)
                .With(x => x.LoadDuration, () => _fixture.Create<long>() % 1000000)
                .With(x => x.PromptEvalCount, () => _fixture.Create<long>() % 100)
                .With(x => x.PromptEvalDuration, () => _fixture.Create<long>() % 1000000)
                .With(x => x.EvalCount, () => _fixture.Create<long>() % 500)
                .With(x => x.EvalDuration, () => _fixture.Create<long>() % 5000000));
    }

    /// <summary>
    /// Creates a valid OllamaModel for testing
    /// </summary>
    public static OllamaModel CreateOllamaModel(string? name = null)
    {
        var model = _fixture.Create<OllamaModel>();
        if (!string.IsNullOrEmpty(name))
        {
            model.Name = name;
            model.DisplayName = GetDisplayName(name);
        }
        return model;
    }

    /// <summary>
    /// Creates a list of OllamaModels for testing
    /// </summary>
    public static List<OllamaModel> CreateOllamaModels(int count = 3)
    {
        var models = new List<OllamaModel>();
        var modelNames = new[] { "llama2:latest", "codellama:latest", "mistral:latest", "phi3:latest" };
        
        for (int i = 0; i < count && i < modelNames.Length; i++)
        {
            models.Add(CreateOllamaModel(modelNames[i]));
        }
        
        return models;
    }

    /// <summary>
    /// Creates ModelCapabilities for code-focused models
    /// </summary>
    public static ModelCapabilities CreateCodeCapabilities()
    {
        return new ModelCapabilities
        {
            CodeAnalysis = true,
            CodeGeneration = true,
            Documentation = true,
            Chat = true,
            Debugging = true,
            CodeReview = true,
            SupportedLanguages = new List<string> { "C#", "Python", "JavaScript", "TypeScript", "Java", "Go" },
            MaxTokens = 4096,
            OptimalUseCase = "Code analysis and generation"
        };
    }

    /// <summary>
    /// Creates ModelCapabilities for general chat models
    /// </summary>
    public static ModelCapabilities CreateChatCapabilities()
    {
        return new ModelCapabilities
        {
            CodeAnalysis = false,
            CodeGeneration = false,
            Documentation = true,
            Chat = true,
            Debugging = false,
            CodeReview = false,
            SupportedLanguages = new List<string>(),
            MaxTokens = 2048,
            OptimalUseCase = "General conversation"
        };
    }

    /// <summary>
    /// Creates a ModelSwitchRequest for testing
    /// </summary>
    public static ModelSwitchRequest CreateModelSwitchRequest(string? modelName = null)
    {
        return new ModelSwitchRequest
        {
            ModelName = modelName ?? "test-model:latest",
            UserId = _fixture.Create<string>(),
            SessionId = _fixture.Create<string>()
        };
    }

    /// <summary>
    /// Creates a successful ModelSwitchResponse
    /// </summary>
    public static ModelSwitchResponse CreateSuccessfulSwitchResponse(string modelName)
    {
        return new ModelSwitchResponse
        {
            Success = true,
            Message = $"Successfully switched to {modelName}",
            Model = CreateOllamaModel(modelName),
            SwitchDuration = TimeSpan.FromMilliseconds(_fixture.Create<int>() % 5000)
        };
    }

    /// <summary>
    /// Creates a failed ModelSwitchResponse
    /// </summary>
    public static ModelSwitchResponse CreateFailedSwitchResponse(string modelName, string reason)
    {
        return new ModelSwitchResponse
        {
            Success = false,
            Message = reason,
            Model = null,
            SwitchDuration = TimeSpan.FromMilliseconds(_fixture.Create<int>() % 1000)
        };
    }

    /// <summary>
    /// Creates ModelPerformanceMetrics with realistic values
    /// </summary>
    public static ModelPerformanceMetrics CreatePerformanceMetrics(string? modelName = null)
    {
        var metrics = _fixture.Create<ModelPerformanceMetrics>();
        
        // Ensure realistic values
        metrics.AverageResponseTime = Math.Round(metrics.AverageResponseTime, 2);
        metrics.TokensPerSecond = Math.Round(metrics.TokensPerSecond, 1);
        metrics.MemoryUsage = Math.Round(metrics.MemoryUsage, 1);
        metrics.CpuUsage = Math.Round(metrics.CpuUsage, 1);
        
        return metrics;
    }

    /// <summary>
    /// Creates an OllamaRequest for testing
    /// </summary>
    public static OllamaRequest CreateOllamaRequest(string? model = null, string? prompt = null)
    {
        var request = _fixture.Create<OllamaRequest>();
        if (!string.IsNullOrEmpty(model))
            request.Model = model;
        if (!string.IsNullOrEmpty(prompt))
            request.Prompt = prompt;
        return request;
    }

    /// <summary>
    /// Creates an OllamaResponse for testing
    /// </summary>
    public static OllamaResponse CreateOllamaResponse(string? model = null, string? response = null)
    {
        var ollamaResponse = _fixture.Create<OllamaResponse>();
        if (!string.IsNullOrEmpty(model))
            ollamaResponse.Model = model;
        if (!string.IsNullOrEmpty(response))
            ollamaResponse.Response = response;
        return ollamaResponse;
    }

    /// <summary>
    /// Creates sample C# code for testing
    /// </summary>
    public static string CreateSampleCSharpCode()
    {
        return @"
using System;

namespace TestNamespace
{
    public class Calculator
    {
        public int Add(int a, int b)
        {
            return a + b;
        }

        public double Divide(double a, double b)
        {
            if (b == 0)
                throw new ArgumentException(""Division by zero"");
            return a / b;
        }
    }
}";
    }

    /// <summary>
    /// Creates sample JavaScript code for testing
    /// </summary>
    public static string CreateSampleJavaScriptCode()
    {
        return @"
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(10);
console.log('Fibonacci result:', result);
";
    }

    /// <summary>
    /// Creates sample Python code for testing
    /// </summary>
    public static string CreateSamplePythonCode()
    {
        return @"
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    return quicksort(left) + middle + quicksort(right)

numbers = [3, 6, 8, 10, 1, 2, 1]
sorted_numbers = quicksort(numbers)
print(sorted_numbers)
";
    }

    private static string GetDisplayName(string modelName)
    {
        return modelName switch
        {
            var name when name.StartsWith("codellama") => "Code Llama",
            var name when name.StartsWith("llama2") => "Llama 2",
            var name when name.StartsWith("mistral") => "Mistral",
            var name when name.StartsWith("phi") => "Phi",
            _ => modelName.Replace(":", " ").Replace("-", " ")
        };
    }
}
