using CodeMentorAI.Core.Interfaces;
using CodeMentorAI.Core.Configuration;
using CodeMentorAI.Infrastructure.Services;
using CodeMentorAI.API.Hubs;
using CodeMentorAI.API.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add Memory Cache for performance optimization
builder.Services.AddMemoryCache();

// Add SignalR
builder.Services.AddSignalR();

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

// Enable CORS
app.UseCors("AllowAngularApp");

app.UseAuthorization();

app.MapControllers();

// Map SignalR hub
app.MapHub<ModelHub>("/modelhub");

// Add health check endpoint
app.MapGet("/health", () => "Healthy");

// Start the file system watcher
var watcher = app.Services.GetRequiredService<ModelDirectoryWatcher>();
watcher.StartWatching();

app.Run();
