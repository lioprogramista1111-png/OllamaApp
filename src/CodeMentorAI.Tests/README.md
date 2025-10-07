# CodeMentorAI Tests

This project contains comprehensive unit and integration tests for the CodeMentorAI backend services.

## Test Structure

### Unit Tests
- **Core/Models/**: Tests for domain models and data structures
- **Infrastructure/Services/**: Tests for service implementations
- **API/Controllers/**: Tests for API controllers

### Integration Tests
- **Integration/**: End-to-end tests that test the full API pipeline

### Test Helpers
- **TestHelpers/**: Utilities and builders for creating test data

## Test Technologies

- **xUnit**: Primary testing framework
- **Moq**: Mocking framework for dependencies
- **FluentAssertions**: Fluent assertion library for readable tests
- **AutoFixture**: Automatic test data generation
- **Microsoft.AspNetCore.Mvc.Testing**: Integration testing for ASP.NET Core

## Running Tests

### Prerequisites
- .NET 8.0 SDK
- Visual Studio 2022 or VS Code with C# extension

### Command Line
```bash
# Run all tests
dotnet test

# Run tests with coverage
dotnet test --collect:"XPlat Code Coverage"

# Run specific test category
dotnet test --filter "Category=Unit"

# Run tests with detailed output
dotnet test --logger "console;verbosity=detailed"
```

### Visual Studio
1. Open the solution in Visual Studio
2. Go to Test → Test Explorer
3. Click "Run All Tests" or run specific tests

### VS Code
1. Install the .NET Core Test Explorer extension
2. Open the Test Explorer panel
3. Run tests from the UI

## Test Categories

### Unit Tests
- **Models**: Test domain model behavior and validation
- **Services**: Test business logic and service implementations
- **Controllers**: Test API endpoints and request/response handling

### Integration Tests
- **API Integration**: Test full request/response cycles
- **Service Integration**: Test service interactions
- **Database Integration**: Test data persistence (if applicable)

## Test Data

The `TestDataBuilder` class provides factory methods for creating test data:

```csharp
// Create test models
var model = TestDataBuilder.CreateOllamaModel("llama2:latest");
var models = TestDataBuilder.CreateOllamaModels(3);

// Create test requests
var request = TestDataBuilder.CreateOllamaRequest("test-model", "test prompt");

// Create sample code for testing
var csharpCode = TestDataBuilder.CreateSampleCSharpCode();
var jsCode = TestDataBuilder.CreateSampleJavaScriptCode();
```

## Mocking Strategy

Tests use Moq for mocking dependencies:

```csharp
// Mock external services
var mockOllamaService = new Mock<IOllamaService>();
mockOllamaService
    .Setup(s => s.GetAvailableModelsAsync())
    .ReturnsAsync(expectedModels);

// Mock HTTP clients for external API calls
var mockHttpMessageHandler = new Mock<HttpMessageHandler>();
mockHttpMessageHandler
    .Protected()
    .Setup<Task<HttpResponseMessage>>("SendAsync", ...)
    .ReturnsAsync(new HttpResponseMessage { ... });
```

## Test Naming Conventions

Tests follow the pattern: `MethodName_Scenario_ExpectedResult`

Examples:
- `GetModels_WhenSuccessful_ShouldReturnModels`
- `SwitchModel_WithInvalidModel_ShouldReturnBadRequest`
- `AnalyzeCode_WhenOllamaServiceFails_ShouldReturnInternalServerError`

## Coverage Goals

- **Unit Tests**: Aim for 80%+ code coverage
- **Critical Paths**: 100% coverage for core business logic
- **Error Handling**: All exception paths should be tested

## CI/CD Integration

Tests are designed to run in CI/CD environments:

- **No External Dependencies**: Tests mock external services (Ollama, file system)
- **Deterministic**: Tests use fixed test data and don't rely on system state
- **Fast Execution**: Unit tests complete in seconds, integration tests in under a minute

## Troubleshooting

### Common Issues

1. **Ollama Service Unavailable**: Integration tests expect this and handle gracefully
2. **Port Conflicts**: Tests use random ports or mock HTTP clients
3. **File System Access**: Tests use in-memory implementations where possible

### Debug Tips

1. Use `ITestOutputHelper` to write debug information:
   ```csharp
   _output.WriteLine($"Test data: {JsonSerializer.Serialize(testData)}");
   ```

2. Run tests in debug mode to step through code
3. Check test logs for detailed error information

## Contributing

When adding new tests:

1. Follow existing naming conventions
2. Use TestDataBuilder for creating test data
3. Mock external dependencies
4. Include both positive and negative test cases
5. Test error handling and edge cases
6. Add integration tests for new API endpoints

## Performance Testing

For performance-critical code, consider adding benchmark tests:

```csharp
[Fact]
public async Task PerformanceTest_ShouldCompleteWithinTimeLimit()
{
    var stopwatch = Stopwatch.StartNew();
    
    // Execute operation
    await _service.ExpensiveOperationAsync();
    
    stopwatch.Stop();
    stopwatch.ElapsedMilliseconds.Should().BeLessThan(1000);
}
```
