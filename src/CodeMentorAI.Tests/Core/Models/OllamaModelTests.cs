using CodeMentorAI.Core.Models;
using FluentAssertions;
using Xunit;

namespace CodeMentorAI.Tests.Core.Models;

public class OllamaModelTests
{
    [Fact]
    public void OllamaModel_DefaultConstructor_ShouldInitializeWithDefaults()
    {
        // Act
        var model = new OllamaModel();

        // Assert
        model.Name.Should().BeEmpty();
        model.DisplayName.Should().BeEmpty();
        model.Description.Should().BeEmpty();
        model.Size.Should().Be(0);
        model.ModifiedAt.Should().Be(default);
        model.Digest.Should().BeEmpty();
        model.Capabilities.Should().NotBeNull();
        model.Status.Should().Be(ModelStatus.Available);
        model.Performance.Should().BeNull();
    }

    [Fact]
    public void OllamaModel_SetProperties_ShouldRetainValues()
    {
        // Arrange
        var model = new OllamaModel();
        var testDate = DateTime.UtcNow;
        var capabilities = new ModelCapabilities { CodeAnalysis = true };
        var performance = new ModelPerformanceMetrics { AverageResponseTime = 1.5 };

        // Act
        model.Name = "test-model";
        model.DisplayName = "Test Model";
        model.Description = "A test model";
        model.Size = 1024;
        model.ModifiedAt = testDate;
        model.Digest = "abc123";
        model.Capabilities = capabilities;
        model.Status = ModelStatus.Running;
        model.Performance = performance;

        // Assert
        model.Name.Should().Be("test-model");
        model.DisplayName.Should().Be("Test Model");
        model.Description.Should().Be("A test model");
        model.Size.Should().Be(1024);
        model.ModifiedAt.Should().Be(testDate);
        model.Digest.Should().Be("abc123");
        model.Capabilities.Should().Be(capabilities);
        model.Status.Should().Be(ModelStatus.Running);
        model.Performance.Should().Be(performance);
    }

    [Theory]
    [InlineData(ModelStatus.Available)]
    [InlineData(ModelStatus.Loading)]
    [InlineData(ModelStatus.Running)]
    [InlineData(ModelStatus.Error)]
    [InlineData(ModelStatus.NotInstalled)]
    public void OllamaModel_Status_ShouldAcceptAllValidStatuses(ModelStatus status)
    {
        // Arrange
        var model = new OllamaModel();

        // Act
        model.Status = status;

        // Assert
        model.Status.Should().Be(status);
    }
}

public class ModelCapabilitiesTests
{
    [Fact]
    public void ModelCapabilities_DefaultConstructor_ShouldInitializeWithDefaults()
    {
        // Act
        var capabilities = new ModelCapabilities();

        // Assert
        capabilities.CodeAnalysis.Should().BeFalse();
        capabilities.CodeGeneration.Should().BeFalse();
        capabilities.Documentation.Should().BeFalse();
        capabilities.Chat.Should().BeFalse();
        capabilities.Debugging.Should().BeFalse();
        capabilities.CodeReview.Should().BeFalse();
        capabilities.SupportedLanguages.Should().NotBeNull().And.BeEmpty();
        capabilities.MaxTokens.Should().Be(0);
        capabilities.OptimalUseCase.Should().BeEmpty();
    }

    [Fact]
    public void ModelCapabilities_SetProperties_ShouldRetainValues()
    {
        // Arrange
        var capabilities = new ModelCapabilities();
        var languages = new List<string> { "C#", "Python", "JavaScript" };

        // Act
        capabilities.CodeAnalysis = true;
        capabilities.CodeGeneration = true;
        capabilities.Documentation = true;
        capabilities.Chat = true;
        capabilities.Debugging = true;
        capabilities.CodeReview = true;
        capabilities.SupportedLanguages = languages;
        capabilities.MaxTokens = 4096;
        capabilities.OptimalUseCase = "Code analysis and generation";

        // Assert
        capabilities.CodeAnalysis.Should().BeTrue();
        capabilities.CodeGeneration.Should().BeTrue();
        capabilities.Documentation.Should().BeTrue();
        capabilities.Chat.Should().BeTrue();
        capabilities.Debugging.Should().BeTrue();
        capabilities.CodeReview.Should().BeTrue();
        capabilities.SupportedLanguages.Should().BeEquivalentTo(languages);
        capabilities.MaxTokens.Should().Be(4096);
        capabilities.OptimalUseCase.Should().Be("Code analysis and generation");
    }
}

public class ModelPerformanceMetricsTests
{
    [Fact]
    public void ModelPerformanceMetrics_DefaultConstructor_ShouldInitializeWithDefaults()
    {
        // Act
        var metrics = new ModelPerformanceMetrics();

        // Assert
        metrics.AverageResponseTime.Should().Be(0);
        metrics.TokensPerSecond.Should().Be(0);
        metrics.TotalRequests.Should().Be(0);
        metrics.LastUsed.Should().Be(default);
        metrics.MemoryUsage.Should().Be(0);
        metrics.CpuUsage.Should().Be(0);
    }

    [Fact]
    public void ModelPerformanceMetrics_SetProperties_ShouldRetainValues()
    {
        // Arrange
        var metrics = new ModelPerformanceMetrics();
        var lastUsed = DateTime.UtcNow;

        // Act
        metrics.AverageResponseTime = 2.5;
        metrics.TokensPerSecond = 50.0;
        metrics.TotalRequests = 100;
        metrics.LastUsed = lastUsed;
        metrics.MemoryUsage = 1024.5;
        metrics.CpuUsage = 75.2;

        // Assert
        metrics.AverageResponseTime.Should().Be(2.5);
        metrics.TokensPerSecond.Should().Be(50.0);
        metrics.TotalRequests.Should().Be(100);
        metrics.LastUsed.Should().Be(lastUsed);
        metrics.MemoryUsage.Should().Be(1024.5);
        metrics.CpuUsage.Should().Be(75.2);
    }
}

public class OllamaRequestTests
{
    [Fact]
    public void OllamaRequest_DefaultConstructor_ShouldInitializeWithDefaults()
    {
        // Act
        var request = new OllamaRequest();

        // Assert
        request.Model.Should().BeEmpty();
        request.Prompt.Should().BeEmpty();
        request.Stream.Should().BeFalse();
        request.Options.Should().BeNull();
    }

    [Fact]
    public void OllamaRequest_SetProperties_ShouldRetainValues()
    {
        // Arrange
        var request = new OllamaRequest();
        var options = new OllamaOptions { Temperature = 0.8 };

        // Act
        request.Model = "test-model";
        request.Prompt = "Test prompt";
        request.Stream = true;
        request.Options = options;

        // Assert
        request.Model.Should().Be("test-model");
        request.Prompt.Should().Be("Test prompt");
        request.Stream.Should().BeTrue();
        request.Options.Should().Be(options);
    }
}

public class OllamaOptionsTests
{
    [Fact]
    public void OllamaOptions_DefaultConstructor_ShouldInitializeWithDefaults()
    {
        // Act
        var options = new OllamaOptions();

        // Assert
        options.Temperature.Should().Be(0.7);
        options.TopK.Should().Be(40);
        options.TopP.Should().Be(0.9);
        options.NumCtx.Should().Be(2048);
        options.NumPredict.Should().Be(-1);
    }

    [Fact]
    public void OllamaOptions_SetProperties_ShouldRetainValues()
    {
        // Arrange
        var options = new OllamaOptions();

        // Act
        options.Temperature = 0.8;
        options.TopK = 50;
        options.TopP = 0.95;
        options.NumCtx = 4096;
        options.NumPredict = 100;

        // Assert
        options.Temperature.Should().Be(0.8);
        options.TopK.Should().Be(50);
        options.TopP.Should().Be(0.95);
        options.NumCtx.Should().Be(4096);
        options.NumPredict.Should().Be(100);
    }
}

public class ModelDownloadProgressTests
{
    [Fact]
    public void ModelDownloadProgress_ProgressPercentage_ShouldCalculateCorrectly()
    {
        // Arrange
        var progress = new ModelDownloadProgress
        {
            BytesDownloaded = 500,
            TotalBytes = 1000
        };

        // Act & Assert
        progress.ProgressPercentage.Should().Be(50.0);
    }

    [Fact]
    public void ModelDownloadProgress_ProgressPercentage_WithZeroTotal_ShouldReturnZero()
    {
        // Arrange
        var progress = new ModelDownloadProgress
        {
            BytesDownloaded = 500,
            TotalBytes = 0
        };

        // Act & Assert
        progress.ProgressPercentage.Should().Be(0.0);
    }

    [Fact]
    public void ModelDownloadProgress_ProgressPercentage_WithCompleteDownload_ShouldReturn100()
    {
        // Arrange
        var progress = new ModelDownloadProgress
        {
            BytesDownloaded = 1000,
            TotalBytes = 1000
        };

        // Act & Assert
        progress.ProgressPercentage.Should().Be(100.0);
    }
}

public class ModelRegistrySearchResponseTests
{
    [Fact]
    public void ModelRegistrySearchResponse_TotalPages_ShouldCalculateCorrectly()
    {
        // Arrange
        var response = new ModelRegistrySearchResponse
        {
            TotalCount = 25,
            PageSize = 10
        };

        // Act & Assert
        response.TotalPages.Should().Be(3);
    }

    [Fact]
    public void ModelRegistrySearchResponse_HasNextPage_ShouldReturnCorrectValue()
    {
        // Arrange
        var response = new ModelRegistrySearchResponse
        {
            TotalCount = 25,
            PageSize = 10,
            Page = 2
        };

        // Act & Assert
        response.HasNextPage.Should().BeTrue();
        
        // Test last page
        response.Page = 3;
        response.HasNextPage.Should().BeFalse();
    }

    [Fact]
    public void ModelRegistrySearchResponse_HasPreviousPage_ShouldReturnCorrectValue()
    {
        // Arrange
        var response = new ModelRegistrySearchResponse
        {
            Page = 2
        };

        // Act & Assert
        response.HasPreviousPage.Should().BeTrue();
        
        // Test first page
        response.Page = 1;
        response.HasPreviousPage.Should().BeFalse();
    }
}
