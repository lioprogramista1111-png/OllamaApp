using CodeMentorAI.Core.Interfaces;
using CodeMentorAI.Core.Configuration;
using CodeMentorAI.Infrastructure.Services;
using CodeMentorAI.API.Hubs;
using CodeMentorAI.API.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.ResponseCompression;
using System.IO.Compression;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Use camelCase for JSON property names (JavaScript convention)
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add Memory Cache for performance optimization
builder.Services.AddMemoryCache();

// Add Response Caching for HTTP caching
builder.Services.AddResponseCaching();

// Add Response Compression for better performance
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<GzipCompressionProvider>();
    options.Providers.Add<BrotliCompressionProvider>();
});

builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});

builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});

// Add SignalR with optimized configuration
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.MaximumReceiveMessageSize = 102400; // 100KB
    options.StreamBufferCapacity = 10;
    options.MaximumParallelInvocationsPerClient = 1;
});

// Configure Ollama settings
builder.Services.Configure<OllamaConfiguration>(
    builder.Configuration.GetSection(OllamaConfiguration.SectionName));

// Add HTTP client for Ollama
builder.Services.AddHttpClient();

// Add HTTP client specifically for ModelDownloadService with longer timeout
builder.Services.AddHttpClient<ModelDownloadService>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration.GetValue<string>("Ollama:BaseUrl") ?? "http://localhost:11434");
    client.Timeout = TimeSpan.FromHours(2); // Long timeout for large model downloads
});

// Register application services
builder.Services.AddScoped<IOllamaService, OllamaService>();
builder.Services.AddSingleton<IModelPerformanceTracker, ModelPerformanceTracker>();
builder.Services.AddScoped<IModelRegistryService, ModelRegistryService>();
builder.Services.AddSingleton<IModelDownloadService, ModelDownloadService>();
builder.Services.AddScoped<IModelCapabilityService, ModelCapabilityService>();
builder.Services.AddSingleton<ModelDirectoryWatcher>();
builder.Services.AddSingleton<OllamaStartupService>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "http://localhost:59740")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add logging
builder.Services.AddLogging(logging =>
{
    logging.AddConsole();
    logging.AddDebug();
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Enable Response Compression (must be before other middleware)
app.UseResponseCompression();

// Enable Response Caching
app.UseResponseCaching();

// Add cache control headers for API endpoints
app.Use(async (context, next) =>
{
    // Cache model list for 5 minutes
    if (context.Request.Path.StartsWithSegments("/api/models") &&
        context.Request.Method == "GET" &&
        !context.Request.Path.Value.Contains("/performance"))
    {
        context.Response.GetTypedHeaders().CacheControl =
            new Microsoft.Net.Http.Headers.CacheControlHeaderValue
            {
                Public = true,
                MaxAge = TimeSpan.FromMinutes(5)
            };
    }

    await next();
});

// Enable CORS
app.UseCors("AllowAngularApp");

app.UseAuthorization();

app.MapControllers();

// Map SignalR hub
app.MapHub<ModelHub>("/modelhub");

// Add health check endpoint
app.MapGet("/health", () => "Healthy");

// Ensure Ollama is running before starting the application
var ollamaStartupService = app.Services.GetRequiredService<OllamaStartupService>();
var logger = app.Services.GetRequiredService<ILogger<Program>>();

logger.LogInformation("🚀 Starting CodeMentorAI - Checking Ollama status...");

try
{
    var ollamaReady = await ollamaStartupService.EnsureOllamaIsRunningAsync();
    if (ollamaReady)
    {
        logger.LogInformation("✅ Ollama is ready - CodeMentorAI can start normally");
    }
    else
    {
        logger.LogWarning("⚠️  Ollama is not running - Some features may not work");
        logger.LogWarning("   Please start Ollama manually: ollama serve");
    }
}
catch (Exception ex)
{
    logger.LogError(ex, "❌ Error checking Ollama status");
    logger.LogWarning("   CodeMentorAI will start anyway, but AI features may not work");
}

// Start the file system watcher
var watcher = app.Services.GetRequiredService<ModelDirectoryWatcher>();
watcher.StartWatching();

// Register cleanup on application shutdown
var lifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();
lifetime.ApplicationStopping.Register(() =>
{
    logger.LogInformation("🛑 Application shutting down...");
    try
    {
        ollamaStartupService.StopOllama();
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error during Ollama cleanup");
    }
});

app.Run();
