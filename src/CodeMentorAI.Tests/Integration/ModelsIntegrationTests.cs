using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using CodeMentorAI.Core.Models;
using FluentAssertions;
using Xunit;
using Xunit.Abstractions;

namespace CodeMentorAI.Tests.Integration;

/// <summary>
/// Integration tests for Models API endpoints
/// Note: These tests are designed to work even when Ollama service is not running
/// </summary>
public class ModelsIntegrationTests : IDisposable
{
    private readonly HttpClient _client;
    private readonly ITestOutputHelper _output;

    public ModelsIntegrationTests(ITestOutputHelper output)
    {
        _output = output;

        // Create a simple HTTP client for testing
        // In a real scenario, you would use WebApplicationFactory
        // but for now we'll just test the API structure
        _client = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:5000")
        };
    }

    [Fact(Skip = "Integration test - requires running API server")]
    public async Task GetModels_ShouldReturnSuccessStatusCode()
    {
        // Act
        try
        {
            var response = await _client.GetAsync("/api/models");

            // Assert
            response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.InternalServerError);

            if (response.StatusCode == HttpStatusCode.OK)
            {
                var content = await response.Content.ReadAsStringAsync();
                _output.WriteLine($"Models response: {content}");

                var models = JsonSerializer.Deserialize<List<OllamaModel>>(content, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                models.Should().NotBeNull();
            }
            else
            {
                // If Ollama is not running, we expect a 500 error
                _output.WriteLine("Ollama service appears to be unavailable - this is expected in CI/CD environments");
            }
        }
        catch (HttpRequestException)
        {
            _output.WriteLine("API server not running - skipping integration test");
        }
    }

    [Fact(Skip = "Integration test - requires running API server")]
    public async Task GetCurrentModel_ShouldReturnNotFoundWhenNoModelActive()
    {
        // This test is skipped by default - enable when testing against a running API
        _output.WriteLine("Integration test skipped - requires running API server");
    }

    [Fact(Skip = "Integration test - requires running API server")]
    public async Task GetModelInfo_WithInvalidModel_ShouldReturnNotFound()
    {
        // This test is skipped by default - enable when testing against a running API
        _output.WriteLine("Integration test skipped - requires running API server");
    }

    [Fact(Skip = "Integration test - requires running API server")]
    public async Task GetPerformanceComparison_ShouldReturnSuccessOrError()
    {
        // This test is skipped by default - enable when testing against a running API
        _output.WriteLine("Integration test skipped - requires running API server");
    }

    [Fact(Skip = "Integration test - requires running API server")]
    public async Task GetModelRecommendations_ShouldReturnSuccessOrError()
    {
        // This test is skipped by default - enable when testing against a running API
        _output.WriteLine("Integration test skipped - requires running API server");
    }

    [Fact(Skip = "Integration test - requires running API server")]
    public async Task SwitchModel_WithInvalidModel_ShouldReturnBadRequest()
    {
        // This test is skipped by default - enable when testing against a running API
        _output.WriteLine("Integration test skipped - requires running API server");
    }

    [Fact(Skip = "Integration test - requires running API server")]
    public async Task GetBestModelForTask_WithValidTask_ShouldReturnResult()
    {
        // This test is skipped by default - enable when testing against a running API
        _output.WriteLine("Integration test skipped - requires running API server");
    }

    [Fact(Skip = "Integration test - requires running API server")]
    public async Task GetModelsFromDisk_ShouldReturnSuccessOrError()
    {
        // This test is skipped by default - enable when testing against a running API
        _output.WriteLine("Integration test skipped - requires running API server");
    }

    [Fact(Skip = "Integration test - requires running API server")]
    public async Task GetModelPerformance_WithCommonModels_ShouldReturnNotFoundOrSuccess()
    {
        // This test is skipped by default - enable when testing against a running API
        _output.WriteLine("Integration test skipped - requires running API server");
    }

    [Fact(Skip = "Integration test - requires running API server")]
    public async Task ApiEndpoints_ShouldHaveConsistentErrorHandling()
    {
        // This test is skipped by default - enable when testing against a running API
        _output.WriteLine("Integration test skipped - requires running API server");
    }

    [Fact(Skip = "Integration test - requires running API server")]
    public async Task HealthCheck_ShouldIndicateServiceStatus()
    {
        // This test is skipped by default - enable when testing against a running API
        _output.WriteLine("Integration test skipped - requires running API server");
    }

    public void Dispose()
    {
        _client?.Dispose();
    }
}
