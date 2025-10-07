using CodeMentorAI.API.Controllers;
using CodeMentorAI.API.Hubs;
using CodeMentorAI.Core.Interfaces;
using CodeMentorAI.Core.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CodeMentorAI.Tests.API.Controllers;

public class ModelsControllerTests
{
    private readonly Mock<IOllamaService> _mockOllamaService;
    private readonly Mock<IModelCapabilityService> _mockCapabilityService;
    private readonly Mock<IModelPerformanceTracker> _mockPerformanceTracker;
    private readonly Mock<IHubContext<ModelHub>> _mockHubContext;
    private readonly Mock<ILogger<ModelsController>> _mockLogger;
    private readonly ModelsController _controller;

    public ModelsControllerTests()
    {
        _mockOllamaService = new Mock<IOllamaService>();
        _mockCapabilityService = new Mock<IModelCapabilityService>();
        _mockPerformanceTracker = new Mock<IModelPerformanceTracker>();
        _mockHubContext = new Mock<IHubContext<ModelHub>>();
        _mockLogger = new Mock<ILogger<ModelsController>>();

        _controller = new ModelsController(
            _mockOllamaService.Object,
            _mockCapabilityService.Object,
            _mockPerformanceTracker.Object,
            _mockHubContext.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async Task GetModels_WhenSuccessful_ShouldReturnOkWithModels()
    {
        // Arrange
        var expectedModels = new List<OllamaModel>
        {
            new() { Name = "llama2:latest", DisplayName = "Llama 2" },
            new() { Name = "codellama:latest", DisplayName = "Code Llama" }
        };

        _mockOllamaService
            .Setup(s => s.GetAvailableModelsAsync())
            .ReturnsAsync(expectedModels);

        // Act
        var result = await _controller.GetModels();

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(expectedModels);
    }

    [Fact]
    public async Task GetModels_WhenServiceThrows_ShouldReturnInternalServerError()
    {
        // Arrange
        _mockOllamaService
            .Setup(s => s.GetAvailableModelsAsync())
            .ThrowsAsync(new Exception("Service error"));

        // Act
        var result = await _controller.GetModels();

        // Assert
        result.Result.Should().BeOfType<ObjectResult>();
        var objectResult = result.Result as ObjectResult;
        objectResult!.StatusCode.Should().Be(500);
    }

    [Fact]
    public async Task GetCurrentModel_WhenModelExists_ShouldReturnOkWithModel()
    {
        // Arrange
        var expectedModel = new OllamaModel { Name = "llama2:latest", DisplayName = "Llama 2" };

        _mockOllamaService
            .Setup(s => s.GetCurrentModelAsync())
            .ReturnsAsync(expectedModel);

        // Act
        var result = await _controller.GetCurrentModel();

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(expectedModel);
    }

    [Fact]
    public async Task GetCurrentModel_WhenNoModelActive_ShouldReturnNotFound()
    {
        // Arrange
        _mockOllamaService
            .Setup(s => s.GetCurrentModelAsync())
            .ReturnsAsync((OllamaModel?)null);

        // Act
        var result = await _controller.GetCurrentModel();

        // Assert
        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task SwitchModel_WhenSuccessful_ShouldReturnOkAndNotifyClients()
    {
        // Arrange
        var request = new ModelSwitchRequest
        {
            ModelName = "llama2:latest",
            UserId = "user123",
            SessionId = "session456"
        };

        var expectedResponse = new ModelSwitchResponse
        {
            Success = true,
            Message = "Successfully switched to llama2:latest",
            Model = new OllamaModel { Name = "llama2:latest" }
        };

        _mockOllamaService
            .Setup(s => s.SwitchModelAsync(request.ModelName, request.SessionId))
            .ReturnsAsync(expectedResponse);

        var mockClients = new Mock<IHubCallerClients>();
        var mockClientProxy = new Mock<IClientProxy>();
        
        _mockHubContext.Setup(h => h.Clients.All).Returns(mockClientProxy.Object);
        mockClientProxy
            .Setup(c => c.SendCoreAsync("ModelSwitched", It.IsAny<object[]>(), default))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.SwitchModel(request);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(expectedResponse);

        // Verify SignalR notification was sent
        mockClientProxy.Verify(
            c => c.SendCoreAsync("ModelSwitched", It.IsAny<object[]>(), default),
            Times.Once);
    }

    [Fact]
    public async Task SwitchModel_WhenFailed_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new ModelSwitchRequest
        {
            ModelName = "non-existent-model",
            UserId = "user123",
            SessionId = "session456"
        };

        var expectedResponse = new ModelSwitchResponse
        {
            Success = false,
            Message = "Model not found"
        };

        _mockOllamaService
            .Setup(s => s.SwitchModelAsync(request.ModelName, request.SessionId))
            .ReturnsAsync(expectedResponse);

        var mockClientProxy = new Mock<IClientProxy>();
        _mockHubContext.Setup(h => h.Clients.All).Returns(mockClientProxy.Object);
        mockClientProxy
            .Setup(c => c.SendCoreAsync("ModelSwitched", It.IsAny<object[]>(), default))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.SwitchModel(request);

        // Assert
        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task GetModelInfo_WhenModelExists_ShouldReturnOkWithModel()
    {
        // Arrange
        var modelName = "llama2:latest";
        var expectedModel = new OllamaModel { Name = modelName, DisplayName = "Llama 2" };

        _mockOllamaService
            .Setup(s => s.GetModelInfoAsync(modelName))
            .ReturnsAsync(expectedModel);

        // Act
        var result = await _controller.GetModelInfo(modelName);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(expectedModel);
    }

    [Fact]
    public async Task GetModelInfo_WhenModelNotFound_ShouldReturnNotFound()
    {
        // Arrange
        var modelName = "non-existent-model";

        _mockOllamaService
            .Setup(s => s.GetModelInfoAsync(modelName))
            .ReturnsAsync((OllamaModel?)null);

        // Act
        var result = await _controller.GetModelInfo(modelName);

        // Assert
        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetModelPerformance_WhenDataExists_ShouldReturnOkWithMetrics()
    {
        // Arrange
        var modelName = "llama2:latest";
        var expectedMetrics = new ModelPerformanceMetrics
        {
            AverageResponseTime = 2.5,
            TokensPerSecond = 50.0,
            TotalRequests = 100
        };

        _mockPerformanceTracker
            .Setup(p => p.GetPerformanceMetricsAsync(modelName))
            .ReturnsAsync(expectedMetrics);

        // Act
        var result = await _controller.GetModelPerformance(modelName);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(expectedMetrics);
    }

    [Fact]
    public async Task GetModelPerformance_WhenNoDataExists_ShouldReturnNotFound()
    {
        // Arrange
        var modelName = "llama2:latest";

        _mockPerformanceTracker
            .Setup(p => p.GetPerformanceMetricsAsync(modelName))
            .ReturnsAsync((ModelPerformanceMetrics?)null);

        // Act
        var result = await _controller.GetModelPerformance(modelName);

        // Assert
        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetPerformanceComparison_WhenSuccessful_ShouldReturnOkWithComparison()
    {
        // Arrange
        var expectedComparison = new Dictionary<string, ModelPerformanceMetrics>
        {
            ["llama2:latest"] = new() { AverageResponseTime = 2.5 },
            ["codellama:latest"] = new() { AverageResponseTime = 3.0 }
        };

        _mockPerformanceTracker
            .Setup(p => p.GetPerformanceComparisonAsync())
            .ReturnsAsync(expectedComparison);

        // Act
        var result = await _controller.GetPerformanceComparison();

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(expectedComparison);
    }

    [Fact]
    public async Task GetModelRecommendations_WhenSuccessful_ShouldReturnOkWithRecommendations()
    {
        // Arrange
        var expectedRecommendations = new Dictionary<string, List<string>>
        {
            ["code-analysis"] = new() { "codellama:latest", "llama2:latest" },
            ["chat"] = new() { "llama2:latest", "mistral:latest" }
        };

        _mockCapabilityService
            .Setup(c => c.GetModelRecommendationsAsync())
            .ReturnsAsync(expectedRecommendations);

        // Act
        var result = await _controller.GetModelRecommendations();

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeEquivalentTo(expectedRecommendations);
    }

    [Fact]
    public async Task GetBestModelForTask_WhenModelFound_ShouldReturnOkWithModelName()
    {
        // Arrange
        var taskType = "code-analysis";
        var expectedModel = "codellama:latest";
        var availableModels = new List<OllamaModel>
        {
            new() { Name = "llama2:latest" },
            new() { Name = "codellama:latest" }
        };

        _mockOllamaService
            .Setup(s => s.GetAvailableModelsAsync())
            .ReturnsAsync(availableModels);

        _mockCapabilityService
            .Setup(c => c.GetBestModelForTaskAsync(taskType, It.IsAny<List<string>>()))
            .ReturnsAsync(expectedModel);

        // Act
        var result = await _controller.GetBestModelForTask(taskType);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        var response = okResult!.Value as dynamic;
        response.Should().NotBeNull();
    }

    [Fact]
    public async Task GetBestModelForTask_WhenNoModelFound_ShouldReturnNotFound()
    {
        // Arrange
        var taskType = "unknown-task";
        var availableModels = new List<OllamaModel>
        {
            new() { Name = "llama2:latest" }
        };

        _mockOllamaService
            .Setup(s => s.GetAvailableModelsAsync())
            .ReturnsAsync(availableModels);

        _mockCapabilityService
            .Setup(c => c.GetBestModelForTaskAsync(taskType, It.IsAny<List<string>>()))
            .ReturnsAsync((string?)null);

        // Act
        var result = await _controller.GetBestModelForTask(taskType);

        // Assert
        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }
}
