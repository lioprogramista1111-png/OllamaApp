using CodeMentorAI.Core.Models;
using CodeMentorAI.Infrastructure.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CodeMentorAI.Tests.Infrastructure.Services;

public class ModelPerformanceTrackerTests
{
    private readonly Mock<ILogger<ModelPerformanceTracker>> _mockLogger;
    private readonly ModelPerformanceTracker _tracker;

    public ModelPerformanceTrackerTests()
    {
        _mockLogger = new Mock<ILogger<ModelPerformanceTracker>>();
        _tracker = new ModelPerformanceTracker(_mockLogger.Object);
    }

    [Fact]
    public async Task RecordPerformanceAsync_WithValidData_ShouldUpdateMetrics()
    {
        // Arrange
        var modelName = "llama2:latest";
        var responseTime = TimeSpan.FromSeconds(2.5);
        var tokenCount = 100;

        // Act
        await _tracker.RecordPerformanceAsync(modelName, responseTime, tokenCount);

        // Assert
        var metrics = await _tracker.GetPerformanceMetricsAsync(modelName);
        metrics.Should().NotBeNull();
        metrics!.TotalRequests.Should().Be(1);
        metrics.AverageResponseTime.Should().Be(2.5);
        metrics.TokensPerSecond.Should().BeApproximately(40.0, 0.1); // 100 tokens / 2.5 seconds
    }

    [Fact]
    public async Task RecordPerformanceAsync_MultipleRecords_ShouldCalculateAverages()
    {
        // Arrange
        var modelName = "llama2:latest";

        // Act - Record multiple performance metrics
        await _tracker.RecordPerformanceAsync(modelName, TimeSpan.FromSeconds(2.0), 80);
        await _tracker.RecordPerformanceAsync(modelName, TimeSpan.FromSeconds(3.0), 120);
        await _tracker.RecordPerformanceAsync(modelName, TimeSpan.FromSeconds(2.5), 100);

        // Assert
        var metrics = await _tracker.GetPerformanceMetricsAsync(modelName);
        metrics.Should().NotBeNull();
        metrics!.TotalRequests.Should().Be(3);
        metrics.AverageResponseTime.Should().BeApproximately(2.5, 0.1); // (2.0 + 3.0 + 2.5) / 3
        
        // Average tokens per second: (40 + 40 + 40) / 3 = 40
        metrics.TokensPerSecond.Should().BeApproximately(40.0, 0.1);
    }

    [Fact]
    public async Task GetPerformanceMetricsAsync_ForNonExistentModel_ShouldReturnNull()
    {
        // Arrange
        var modelName = "non-existent-model";

        // Act
        var metrics = await _tracker.GetPerformanceMetricsAsync(modelName);

        // Assert
        metrics.Should().BeNull();
    }

    [Fact]
    public async Task GetPerformanceComparisonAsync_WithMultipleModels_ShouldReturnAllMetrics()
    {
        // Arrange
        var model1 = "llama2:latest";
        var model2 = "codellama:latest";

        // Record performance for both models
        await _tracker.RecordPerformanceAsync(model1, TimeSpan.FromSeconds(2.0), 80);
        await _tracker.RecordPerformanceAsync(model2, TimeSpan.FromSeconds(3.0), 120);

        // Act
        var comparison = await _tracker.GetPerformanceComparisonAsync();

        // Assert
        comparison.Should().HaveCount(2);
        comparison.Should().ContainKey(model1);
        comparison.Should().ContainKey(model2);
        
        comparison[model1].AverageResponseTime.Should().Be(2.0);
        comparison[model2].AverageResponseTime.Should().Be(3.0);
    }

    [Fact]
    public async Task RecordPerformanceAsync_WithZeroTokens_ShouldHandleGracefully()
    {
        // Arrange
        var modelName = "llama2:latest";
        var responseTime = TimeSpan.FromSeconds(2.0);
        var tokenCount = 0;

        // Act
        await _tracker.RecordPerformanceAsync(modelName, responseTime, tokenCount);

        // Assert
        var metrics = await _tracker.GetPerformanceMetricsAsync(modelName);
        metrics.Should().NotBeNull();
        metrics!.TokensPerSecond.Should().Be(0.0);
        metrics.TotalRequests.Should().Be(1);
    }

    [Fact]
    public async Task RecordPerformanceAsync_WithZeroResponseTime_ShouldHandleGracefully()
    {
        // Arrange
        var modelName = "llama2:latest";
        var responseTime = TimeSpan.Zero;
        var tokenCount = 100;

        // Act
        await _tracker.RecordPerformanceAsync(modelName, responseTime, tokenCount);

        // Assert
        var metrics = await _tracker.GetPerformanceMetricsAsync(modelName);
        metrics.Should().NotBeNull();
        metrics!.AverageResponseTime.Should().Be(0.0);
        metrics.TokensPerSecond.Should().Be(double.PositiveInfinity);
        metrics.TotalRequests.Should().Be(1);
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public async Task RecordPerformanceAsync_WithInvalidModelName_ShouldNotThrow(string? modelName)
    {
        // Arrange
        var responseTime = TimeSpan.FromSeconds(2.0);
        var tokenCount = 100;

        // Act & Assert
        var act = async () => await _tracker.RecordPerformanceAsync(modelName!, responseTime, tokenCount);
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task RecordPerformanceAsync_WithNegativeTokenCount_ShouldHandleGracefully()
    {
        // Arrange
        var modelName = "llama2:latest";
        var responseTime = TimeSpan.FromSeconds(2.0);
        var tokenCount = -10;

        // Act
        await _tracker.RecordPerformanceAsync(modelName, responseTime, tokenCount);

        // Assert
        var metrics = await _tracker.GetPerformanceMetricsAsync(modelName);
        metrics.Should().NotBeNull();
        metrics!.TokensPerSecond.Should().Be(-5.0); // -10 / 2.0
        metrics.TotalRequests.Should().Be(1);
    }

    [Fact]
    public async Task GetPerformanceMetricsAsync_ShouldUpdateLastUsedTime()
    {
        // Arrange
        var modelName = "llama2:latest";
        var beforeTime = DateTime.UtcNow;

        // Act
        await _tracker.RecordPerformanceAsync(modelName, TimeSpan.FromSeconds(2.0), 100);
        var metrics = await _tracker.GetPerformanceMetricsAsync(modelName);

        // Assert
        metrics.Should().NotBeNull();
        metrics!.LastUsed.Should().BeOnOrAfter(beforeTime);
        metrics.LastUsed.Should().BeOnOrBefore(DateTime.UtcNow);
    }

    [Fact]
    public async Task RecordPerformanceAsync_ConcurrentAccess_ShouldHandleSafely()
    {
        // Arrange
        var modelName = "llama2:latest";
        var tasks = new List<Task>();

        // Act - Simulate concurrent access
        for (int i = 0; i < 10; i++)
        {
            var task = _tracker.RecordPerformanceAsync(modelName, TimeSpan.FromSeconds(1.0), 50);
            tasks.Add(task);
        }

        await Task.WhenAll(tasks);

        // Assert
        var metrics = await _tracker.GetPerformanceMetricsAsync(modelName);
        metrics.Should().NotBeNull();
        metrics!.TotalRequests.Should().Be(10);
        metrics.AverageResponseTime.Should().Be(1.0);
        metrics.TokensPerSecond.Should().Be(50.0);
    }

    [Fact]
    public async Task GetPerformanceComparisonAsync_WithNoData_ShouldReturnEmptyDictionary()
    {
        // Act
        var comparison = await _tracker.GetPerformanceComparisonAsync();

        // Assert
        comparison.Should().NotBeNull();
        comparison.Should().BeEmpty();
    }

    [Fact]
    public async Task RecordPerformanceAsync_WithVeryLargeNumbers_ShouldHandleCorrectly()
    {
        // Arrange
        var modelName = "llama2:latest";
        var responseTime = TimeSpan.FromMilliseconds(1); // Very fast response
        var tokenCount = 1000000; // Very large token count

        // Act
        await _tracker.RecordPerformanceAsync(modelName, responseTime, tokenCount);

        // Assert
        var metrics = await _tracker.GetPerformanceMetricsAsync(modelName);
        metrics.Should().NotBeNull();
        metrics!.TokensPerSecond.Should().Be(1000000000.0); // 1M tokens per 0.001 seconds
        metrics.TotalRequests.Should().Be(1);
    }
}
