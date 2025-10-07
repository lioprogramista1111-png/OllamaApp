using System.Net;
using System.Text;
using System.Text.Json;
using CodeMentorAI.Core.Interfaces;
using CodeMentorAI.Core.Models;
using CodeMentorAI.Infrastructure.Services;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using Xunit;

namespace CodeMentorAI.Tests.Infrastructure.Services;

public class OllamaServiceTests : IDisposable
{
    private readonly Mock<ILogger<OllamaService>> _mockLogger;
    private readonly Mock<IConfiguration> _mockConfiguration;
    private readonly Mock<IModelPerformanceTracker> _mockPerformanceTracker;
    private readonly IMemoryCache _memoryCache;
    private readonly Mock<HttpMessageHandler> _mockHttpMessageHandler;
    private readonly HttpClient _httpClient;
    private readonly OllamaService _ollamaService;

    public OllamaServiceTests()
    {
        _mockLogger = new Mock<ILogger<OllamaService>>();
        _mockConfiguration = new Mock<IConfiguration>();
        _mockPerformanceTracker = new Mock<IModelPerformanceTracker>();
        _memoryCache = new MemoryCache(new MemoryCacheOptions());
        _mockHttpMessageHandler = new Mock<HttpMessageHandler>();
        
        _httpClient = new HttpClient(_mockHttpMessageHandler.Object);
        
        // Setup configuration
        _mockConfiguration.Setup(c => c.GetValue<string>("Ollama:BaseUrl"))
            .Returns("http://localhost:11434");

        _ollamaService = new OllamaService(
            _httpClient,
            _mockLogger.Object,
            _mockConfiguration.Object,
            _mockPerformanceTracker.Object,
            _memoryCache);
    }

    [Fact]
    public async Task GetAvailableModelsAsync_WhenSuccessful_ShouldReturnModels()
    {
        // Arrange
        var modelsResponse = new
        {
            models = new[]
            {
                new { name = "llama2:latest", size = 1000L, modifiedAt = DateTime.UtcNow, digest = "abc123" },
                new { name = "codellama:latest", size = 2000L, modifiedAt = DateTime.UtcNow, digest = "def456" }
            }
        };

        var jsonResponse = JsonSerializer.Serialize(modelsResponse, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
        });

        _mockHttpMessageHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent(jsonResponse, Encoding.UTF8, "application/json")
            });

        _mockPerformanceTracker
            .Setup(p => p.GetPerformanceMetricsAsync(It.IsAny<string>()))
            .ReturnsAsync((ModelPerformanceMetrics?)null);

        // Act
        var result = await _ollamaService.GetAvailableModelsAsync();

        // Assert
        result.Should().HaveCount(2);
        result[0].Name.Should().Be("llama2:latest");
        result[1].Name.Should().Be("codellama:latest");
        result[0].DisplayName.Should().Be("Llama 2");
        result[1].DisplayName.Should().Be("Code Llama");
    }

    [Fact]
    public async Task GetAvailableModelsAsync_WhenHttpRequestFails_ShouldReturnEmptyList()
    {
        // Arrange
        _mockHttpMessageHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.InternalServerError
            });

        // Act
        var result = await _ollamaService.GetAvailableModelsAsync();

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetCurrentModelAsync_WhenNoCurrentModel_ShouldReturnNull()
    {
        // Act
        var result = await _ollamaService.GetCurrentModelAsync();

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task SwitchModelAsync_WhenModelNotAvailable_ShouldReturnFailure()
    {
        // Arrange
        var modelName = "non-existent-model";
        
        _mockHttpMessageHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent("{\"models\":[]}", Encoding.UTF8, "application/json")
            });

        // Act
        var result = await _ollamaService.SwitchModelAsync(modelName);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("not available");
    }

    [Fact]
    public async Task IsModelAvailableAsync_WhenModelExists_ShouldReturnTrue()
    {
        // Arrange
        var modelName = "llama2:latest";
        var modelsResponse = new
        {
            models = new[]
            {
                new { name = modelName, size = 1000L, modifiedAt = DateTime.UtcNow, digest = "abc123" }
            }
        };

        var jsonResponse = JsonSerializer.Serialize(modelsResponse, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
        });

        _mockHttpMessageHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent(jsonResponse, Encoding.UTF8, "application/json")
            });

        _mockPerformanceTracker
            .Setup(p => p.GetPerformanceMetricsAsync(It.IsAny<string>()))
            .ReturnsAsync((ModelPerformanceMetrics?)null);

        // Act
        var result = await _ollamaService.IsModelAvailableAsync(modelName);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task IsModelAvailableAsync_WhenModelDoesNotExist_ShouldReturnFalse()
    {
        // Arrange
        var modelName = "non-existent-model";
        
        _mockHttpMessageHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent("{\"models\":[]}", Encoding.UTF8, "application/json")
            });

        // Act
        var result = await _ollamaService.IsModelAvailableAsync(modelName);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task PullModelAsync_WhenSuccessful_ShouldReturnTrue()
    {
        // Arrange
        var modelName = "llama2:latest";
        
        _mockHttpMessageHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent("", Encoding.UTF8, "application/json")
            });

        // Act
        var result = await _ollamaService.PullModelAsync(modelName);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task RemoveModelAsync_WhenSuccessful_ShouldReturnTrue()
    {
        // Arrange
        var modelName = "llama2:latest";
        
        _mockHttpMessageHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK
            });

        // Act
        var result = await _ollamaService.RemoveModelAsync(modelName);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task GenerateAsync_WhenSuccessful_ShouldReturnResponse()
    {
        // Arrange
        var request = new OllamaRequest
        {
            Model = "llama2:latest",
            Prompt = "Hello, world!"
        };

        var ollamaResponse = new OllamaResponse
        {
            Model = "llama2:latest",
            Response = "Hello! How can I help you today?",
            Done = true,
            CreatedAt = DateTime.UtcNow
        };

        var jsonResponse = JsonSerializer.Serialize(ollamaResponse, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
        });

        _mockHttpMessageHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent(jsonResponse, Encoding.UTF8, "application/json")
            });

        _mockPerformanceTracker
            .Setup(p => p.RecordPerformanceAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<int>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _ollamaService.GenerateAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Model.Should().Be("llama2:latest");
        result.Response.Should().Be("Hello! How can I help you today?");
        result.Done.Should().BeTrue();
    }

    [Fact]
    public async Task GetModelPerformanceAsync_ShouldCallPerformanceTracker()
    {
        // Arrange
        var modelName = "llama2:latest";
        var expectedMetrics = new ModelPerformanceMetrics
        {
            AverageResponseTime = 2.5,
            TokensPerSecond = 50.0
        };

        _mockPerformanceTracker
            .Setup(p => p.GetPerformanceMetricsAsync(modelName))
            .ReturnsAsync(expectedMetrics);

        // Act
        var result = await _ollamaService.GetModelPerformanceAsync(modelName);

        // Assert
        result.Should().Be(expectedMetrics);
        _mockPerformanceTracker.Verify(p => p.GetPerformanceMetricsAsync(modelName), Times.Once);
    }

    public void Dispose()
    {
        _httpClient?.Dispose();
        _memoryCache?.Dispose();
    }
}
