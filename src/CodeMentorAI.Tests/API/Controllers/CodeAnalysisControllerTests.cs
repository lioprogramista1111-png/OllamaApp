using CodeMentorAI.API.Controllers;
using CodeMentorAI.Core.Interfaces;
using CodeMentorAI.Core.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CodeMentorAI.Tests.API.Controllers;

// Note: Using CodeAnalysisRequest and CodeAnalysisResult from CodeMentorAI.API.Controllers namespace

public class CodeAnalysisControllerTests : IDisposable
{
    private readonly Mock<IOllamaService> _mockOllamaService;
    private readonly Mock<IModelCapabilityService> _mockCapabilityService;
    private readonly Mock<ILogger<CodeAnalysisController>> _mockLogger;
    private readonly IMemoryCache _memoryCache;
    private readonly CodeAnalysisController _controller;

    public CodeAnalysisControllerTests()
    {
        _mockOllamaService = new Mock<IOllamaService>();
        _mockCapabilityService = new Mock<IModelCapabilityService>();
        _mockLogger = new Mock<ILogger<CodeAnalysisController>>();
        _memoryCache = new MemoryCache(new MemoryCacheOptions());

        _controller = new CodeAnalysisController(
            _mockOllamaService.Object,
            _mockCapabilityService.Object,
            _mockLogger.Object,
            _memoryCache);
    }

    [Fact]
    public async Task AnalyzeCode_WithValidCSharpCode_ShouldReturnAnalysisResult()
    {
        // Arrange
        var request = new CodeAnalysisRequest
        {
            Code = @"
                public class Calculator
                {
                    public int Add(int a, int b)
                    {
                        return a + b;
                    }
                }",
            Language = "csharp",
            Focus = "codeQuality",
            Model = "codellama:latest"
        };

        var expectedResponse = new OllamaResponse
        {
            Model = "codellama:latest",
            Response = @"
                ## Code Analysis Results

                **Overall Assessment:** Good
                
                **Code Quality Score:** 8/10
                
                **Strengths:**
                - Clean and simple implementation
                - Good naming conventions
                - Proper access modifiers
                
                **Suggestions:**
                - Consider adding input validation
                - Add XML documentation comments
                
                **Security Issues:** None detected
                
                **Performance Notes:** Efficient implementation
            ",
            Done = true,
            CreatedAt = DateTime.UtcNow
        };

        _mockOllamaService
            .Setup(s => s.GenerateAsync(It.IsAny<OllamaRequest>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.AnalyzeCode(request);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().NotBeNull();
        
        // Verify the service was called with correct parameters
        _mockOllamaService.Verify(
            s => s.GenerateAsync(It.Is<OllamaRequest>(r => 
                r.Model == "codellama:latest" && 
                r.Stream == false)),
            Times.Once);
    }

    [Fact]
    public async Task AnalyzeCode_WithInvalidInput_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new CodeAnalysisRequest
        {
            Code = "This is just plain text, not code at all. Hello world!",
            Language = "csharp",
            Focus = "codeQuality"
        };

        // Act
        var result = await _controller.AnalyzeCode(request);

        // Assert
        result.Result.Should().BeOfType<BadRequestObjectResult>();
        var badRequestResult = result.Result as BadRequestObjectResult;
        badRequestResult!.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task AnalyzeCode_WithJavaScriptCode_ShouldDetectLanguageCorrectly()
    {
        // Arrange
        var request = new CodeAnalysisRequest
        {
            Code = @"
                function calculateSum(a, b) {
                    return a + b;
                }
                
                const result = calculateSum(5, 3);
                console.log(result);",
            Language = "auto",
            Focus = "codeQuality"
        };

        var expectedResponse = new OllamaResponse
        {
            Model = "codellama:latest",
            Response = "## Code Analysis Results\n**Language:** JavaScript\n**Quality:** Good",
            Done = true,
            CreatedAt = DateTime.UtcNow
        };

        _mockOllamaService
            .Setup(s => s.GenerateAsync(It.IsAny<OllamaRequest>()))
            .ReturnsAsync(expectedResponse);

        _mockCapabilityService
            .Setup(c => c.GetBestModelForTaskAsync("code-analysis", It.IsAny<List<string>>()))
            .ReturnsAsync("codellama:latest");

        _mockOllamaService
            .Setup(s => s.GetAvailableModelsAsync())
            .ReturnsAsync(new List<OllamaModel>
            {
                new() { Name = "codellama:latest", Capabilities = new ModelCapabilities { CodeAnalysis = true } }
            });

        // Act
        var result = await _controller.AnalyzeCode(request);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task AnalyzeCode_WithPythonCode_ShouldHandleCorrectly()
    {
        // Arrange
        var request = new CodeAnalysisRequest
        {
            Code = @"
                def fibonacci(n):
                    if n <= 1:
                        return n
                    return fibonacci(n-1) + fibonacci(n-2)
                
                print(fibonacci(10))",
            Language = "python",
            Focus = "performance"
        };

        var expectedResponse = new OllamaResponse
        {
            Model = "codellama:latest",
            Response = @"
                ## Performance Analysis
                
                **Issues Found:**
                - Recursive implementation has exponential time complexity
                - No memoization used
                
                **Suggestions:**
                - Use dynamic programming approach
                - Consider iterative solution
            ",
            Done = true,
            CreatedAt = DateTime.UtcNow
        };

        _mockOllamaService
            .Setup(s => s.GenerateAsync(It.IsAny<OllamaRequest>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.AnalyzeCode(request);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task AnalyzeCode_WhenOllamaServiceFails_ShouldReturnInternalServerError()
    {
        // Arrange
        var request = new CodeAnalysisRequest
        {
            Code = "public class Test { }",
            Language = "csharp",
            Focus = "codeQuality"
        };

        _mockOllamaService
            .Setup(s => s.GenerateAsync(It.IsAny<OllamaRequest>()))
            .ThrowsAsync(new Exception("Ollama service unavailable"));

        // Act
        var result = await _controller.AnalyzeCode(request);

        // Assert
        result.Result.Should().BeOfType<ObjectResult>();
        var objectResult = result.Result as ObjectResult;
        objectResult!.StatusCode.Should().Be(500);
    }

    [Fact]
    public async Task AnalyzeCode_WithEmptyResponse_ShouldReturnInternalServerError()
    {
        // Arrange
        var request = new CodeAnalysisRequest
        {
            Code = "public class Test { }",
            Language = "csharp",
            Focus = "codeQuality"
        };

        var emptyResponse = new OllamaResponse
        {
            Model = "codellama:latest",
            Response = "",
            Done = true,
            CreatedAt = DateTime.UtcNow
        };

        _mockOllamaService
            .Setup(s => s.GenerateAsync(It.IsAny<OllamaRequest>()))
            .ReturnsAsync(emptyResponse);

        // Act
        var result = await _controller.AnalyzeCode(request);

        // Assert
        result.Result.Should().BeOfType<ObjectResult>();
        var objectResult = result.Result as ObjectResult;
        objectResult!.StatusCode.Should().Be(500);
    }

    [Theory]
    [InlineData("codeQuality")]
    [InlineData("performance")]
    [InlineData("security")]
    [InlineData("bugs")]
    [InlineData("refactoring")]
    [InlineData("explain")]
    public async Task AnalyzeCode_WithDifferentFocusTypes_ShouldHandleCorrectly(string focus)
    {
        // Arrange
        var request = new CodeAnalysisRequest
        {
            Code = "public int Add(int a, int b) { return a + b; }",
            Language = "csharp",
            Focus = focus
        };

        var expectedResponse = new OllamaResponse
        {
            Model = "codellama:latest",
            Response = $"## {focus} Analysis\nAnalysis complete for {focus} focus.",
            Done = true,
            CreatedAt = DateTime.UtcNow
        };

        _mockOllamaService
            .Setup(s => s.GenerateAsync(It.IsAny<OllamaRequest>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.AnalyzeCode(request);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task AnalyzeCode_WithLargeCodeInput_ShouldHandleCorrectly()
    {
        // Arrange
        var largeCode = string.Join("\n", Enumerable.Repeat("public void Method() { }", 1000));
        var request = new CodeAnalysisRequest
        {
            Code = largeCode,
            Language = "csharp",
            Focus = "codeQuality"
        };

        var expectedResponse = new OllamaResponse
        {
            Model = "codellama:latest",
            Response = "## Code Analysis\nLarge codebase analyzed successfully.",
            Done = true,
            CreatedAt = DateTime.UtcNow
        };

        _mockOllamaService
            .Setup(s => s.GenerateAsync(It.IsAny<OllamaRequest>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.AnalyzeCode(request);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
    }

    public void Dispose()
    {
        _memoryCache?.Dispose();
    }
}
