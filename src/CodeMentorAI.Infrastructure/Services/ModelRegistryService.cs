using System.Text.Json;
using CodeMentorAI.Core.Interfaces;
using CodeMentorAI.Core.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CodeMentorAI.Infrastructure.Services;

public class ModelRegistryService : IModelRegistryService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ModelRegistryService> _logger;
    private readonly IConfiguration _configuration;
    private readonly string _registryBaseUrl;

    // Predefined model registry data (since Ollama doesn't have a public API for this)
    private readonly List<OllamaRegistryModel> _predefinedModels;

    public ModelRegistryService(
        HttpClient httpClient,
        ILogger<ModelRegistryService> logger,
        IConfiguration configuration)
    {
        _httpClient = httpClient;
        _logger = logger;
        _configuration = configuration;
        _registryBaseUrl = configuration.GetValue<string>("Ollama:RegistryUrl") ?? "https://ollama.ai";
        
        _predefinedModels = InitializePredefinedModels();
    }

    public async Task<ModelRegistrySearchResponse> SearchModelsAsync(ModelRegistrySearchRequest request)
    {
        try
        {
            var models = _predefinedModels.AsQueryable();

            // Apply search filters
            if (!string.IsNullOrEmpty(request.Query))
            {
                var query = request.Query.ToLower();
                models = models.Where(m => 
                    m.Name.ToLower().Contains(query) ||
                    m.DisplayName.ToLower().Contains(query) ||
                    m.Description.ToLower().Contains(query) ||
                    m.Tags.Any(t => t.ToLower().Contains(query)));
            }

            if (!string.IsNullOrEmpty(request.Category))
            {
                models = models.Where(m => m.Category.Equals(request.Category, StringComparison.OrdinalIgnoreCase));
            }

            if (request.Languages?.Any() == true)
            {
                models = models.Where(m => request.Languages.Any(lang => 
                    m.Languages.Contains(lang, StringComparer.OrdinalIgnoreCase)));
            }

            if (request.Capabilities?.Any() == true)
            {
                models = models.Where(m => request.Capabilities.Any(cap => 
                    HasCapability(m.Capabilities, cap)));
            }

            if (request.MaxSize.HasValue)
            {
                models = models.Where(m => m.Size <= request.MaxSize.Value);
            }

            if (request.OfficialOnly == true)
            {
                models = models.Where(m => m.IsOfficial);
            }

            // Apply sorting
            models = request.SortBy?.ToLower() switch
            {
                "name" => request.SortOrder == "desc" 
                    ? models.OrderByDescending(m => m.Name)
                    : models.OrderBy(m => m.Name),
                "size" => request.SortOrder == "desc"
                    ? models.OrderByDescending(m => m.Size)
                    : models.OrderBy(m => m.Size),
                "updated" => request.SortOrder == "desc"
                    ? models.OrderByDescending(m => m.UpdatedAt)
                    : models.OrderBy(m => m.UpdatedAt),
                _ => request.SortOrder == "desc"
                    ? models.OrderByDescending(m => m.Downloads)
                    : models.OrderBy(m => m.Downloads)
            };

            var totalCount = models.Count();
            var pagedModels = models
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToList();

            return new ModelRegistrySearchResponse
            {
                Models = pagedModels,
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to search models in registry");
            return new ModelRegistrySearchResponse();
        }
    }

    public Task<OllamaRegistryModel?> GetModelDetailsAsync(string modelName)
    {
        try
        {
            var result = _predefinedModels.FirstOrDefault(m =>
                m.Name.Equals(modelName, StringComparison.OrdinalIgnoreCase));
            return Task.FromResult(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get model details for {ModelName}", modelName);
            return Task.FromResult<OllamaRegistryModel?>(null);
        }
    }

    public Task<List<OllamaRegistryModel>> GetFeaturedModelsAsync(int count = 10)
    {
        try
        {
            var result = _predefinedModels
                .Where(m => m.IsOfficial || m.Downloads > 10000)
                .OrderByDescending(m => m.Downloads)
                .Take(count)
                .ToList();
            return Task.FromResult(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get featured models");
            return Task.FromResult(new List<OllamaRegistryModel>());
        }
    }

    public Task<List<OllamaRegistryModel>> GetModelsByCategoryAsync(string category)
    {
        try
        {
            var result = _predefinedModels
                .Where(m => m.Category.Equals(category, StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(m => m.Downloads)
                .ToList();
            return Task.FromResult(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get models by category {Category}", category);
            return Task.FromResult(new List<OllamaRegistryModel>());
        }
    }

    public Task<List<string>> GetCategoriesAsync()
    {
        try
        {
            var result = _predefinedModels
                .Select(m => m.Category)
                .Distinct()
                .OrderBy(c => c)
                .ToList();
            return Task.FromResult(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get categories");
            return Task.FromResult(new List<string>());
        }
    }

    private static bool HasCapability(ModelCapabilities capabilities, string capability)
    {
        return capability.ToLower() switch
        {
            "codeanalysis" => capabilities.CodeAnalysis,
            "codegeneration" => capabilities.CodeGeneration,
            "documentation" => capabilities.Documentation,
            "chat" => capabilities.Chat,
            "debugging" => capabilities.Debugging,
            "codereview" => capabilities.CodeReview,
            _ => false
        };
    }

    private List<OllamaRegistryModel> InitializePredefinedModels()
    {
        return new List<OllamaRegistryModel>
        {
            new()
            {
                Name = "llama2:7b",
                DisplayName = "Llama 2 7B",
                Description = "Meta's Llama 2 model with 7 billion parameters. Great for general conversation, text generation, and basic coding tasks.",
                ShortDescription = "General-purpose language model from Meta",
                Tags = new List<string> { "7b", "latest", "chat", "general" },
                Size = 3800000000, // ~3.8GB
                Downloads = 2500000,
                UpdatedAt = DateTime.UtcNow.AddDays(-30),
                Category = "General",
                Languages = new List<string> { "English", "Spanish", "French", "German", "Italian" },
                Capabilities = new ModelCapabilities
                {
                    Chat = true,
                    Documentation = true,
                    CodeReview = true,
                    CodeAnalysis = false,
                    CodeGeneration = false,
                    Debugging = false,
                    SupportedLanguages = new List<string> { "Python", "JavaScript", "Java", "C#" },
                    MaxTokens = 4096,
                    OptimalUseCase = "General conversation and text generation"
                },
                License = "Custom",
                Publisher = "Meta",
                IsOfficial = true,
                Variants = new List<string> { "7b", "13b", "70b" }
            },
            new()
            {
                Name = "codellama:7b",
                DisplayName = "Code Llama 7B",
                Description = "A specialized version of Llama 2 fine-tuned for code generation, completion, and understanding. Excellent for programming tasks.",
                ShortDescription = "Code-specialized Llama model",
                Tags = new List<string> { "7b", "code", "programming", "latest" },
                Size = 3800000000,
                Downloads = 1800000,
                UpdatedAt = DateTime.UtcNow.AddDays(-20),
                Category = "Code",
                Languages = new List<string> { "English" },
                Capabilities = new ModelCapabilities
                {
                    Chat = true,
                    Documentation = true,
                    CodeReview = true,
                    CodeAnalysis = true,
                    CodeGeneration = true,
                    Debugging = true,
                    SupportedLanguages = new List<string> { "Python", "JavaScript", "TypeScript", "Java", "C#", "C++", "Go", "Rust", "PHP" },
                    MaxTokens = 4096,
                    OptimalUseCase = "Code generation and analysis"
                },
                License = "Custom",
                Publisher = "Meta",
                IsOfficial = true,
                Variants = new List<string> { "7b", "13b", "34b" }
            },
            new()
            {
                Name = "mistral:7b",
                DisplayName = "Mistral 7B",
                Description = "Mistral AI's efficient 7B parameter model. Fast inference with good performance on various tasks including coding and reasoning.",
                ShortDescription = "Efficient and fast language model",
                Tags = new List<string> { "7b", "fast", "efficient", "latest" },
                Size = 4100000000,
                Downloads = 1200000,
                UpdatedAt = DateTime.UtcNow.AddDays(-15),
                Category = "General",
                Languages = new List<string> { "English", "French", "German", "Spanish" },
                Capabilities = new ModelCapabilities
                {
                    Chat = true,
                    Documentation = true,
                    CodeReview = true,
                    CodeAnalysis = false,
                    CodeGeneration = false,
                    Debugging = false,
                    SupportedLanguages = new List<string> { "Python", "JavaScript", "Java" },
                    MaxTokens = 8192,
                    OptimalUseCase = "Fast general-purpose tasks"
                },
                License = "Apache 2.0",
                Publisher = "Mistral AI",
                IsOfficial = true,
                Variants = new List<string> { "7b" }
            },
            new()
            {
                Name = "phi:2.7b",
                DisplayName = "Phi 2.7B",
                Description = "Microsoft's small but capable language model. Optimized for efficiency while maintaining good performance on reasoning tasks.",
                ShortDescription = "Lightweight model from Microsoft",
                Tags = new List<string> { "2.7b", "small", "efficient", "reasoning" },
                Size = 1600000000,
                Downloads = 800000,
                UpdatedAt = DateTime.UtcNow.AddDays(-10),
                Category = "Lightweight",
                Languages = new List<string> { "English" },
                Capabilities = new ModelCapabilities
                {
                    Chat = true,
                    Documentation = true,
                    CodeReview = false,
                    CodeAnalysis = false,
                    CodeGeneration = false,
                    Debugging = false,
                    SupportedLanguages = new List<string> { "Python", "JavaScript" },
                    MaxTokens = 2048,
                    OptimalUseCase = "Quick responses and lightweight tasks"
                },
                License = "MIT",
                Publisher = "Microsoft",
                IsOfficial = true,
                Variants = new List<string> { "2.7b" }
            }
        };
    }
}
