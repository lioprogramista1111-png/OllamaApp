using System.Diagnostics;
using System.Net.NetworkInformation;

namespace CodeMentorAI.API.Services;

/// <summary>
/// Service to automatically start and manage Ollama service
/// </summary>
public class OllamaStartupService
{
    private readonly ILogger<OllamaStartupService> _logger;
    private readonly IConfiguration _configuration;
    private Process? _ollamaProcess;
    private readonly string _ollamaBaseUrl;

    public OllamaStartupService(ILogger<OllamaStartupService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
        _ollamaBaseUrl = _configuration.GetValue<string>("Ollama:BaseUrl") ?? "http://localhost:11434";
    }

    /// <summary>
    /// Checks if Ollama is running and starts it if not
    /// </summary>
    public async Task<bool> EnsureOllamaIsRunningAsync()
    {
        try
        {
            _logger.LogInformation("Checking if Ollama is running...");

            // First check if Ollama is already running
            if (await IsOllamaRunningAsync())
            {
                _logger.LogInformation("✅ Ollama is already running");
                return true;
            }

            _logger.LogInformation("🚀 Ollama not detected, attempting to start...");

            // Try to start Ollama
            if (await StartOllamaAsync())
            {
                _logger.LogInformation("✅ Ollama started successfully");
                return true;
            }

            _logger.LogWarning("❌ Failed to start Ollama automatically");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while ensuring Ollama is running");
            return false;
        }
    }

    /// <summary>
    /// Checks if Ollama is running by testing the API endpoint
    /// </summary>
    private async Task<bool> IsOllamaRunningAsync()
    {
        try
        {
            using var httpClient = new HttpClient();
            httpClient.Timeout = TimeSpan.FromSeconds(5);

            var response = await httpClient.GetAsync($"{_ollamaBaseUrl}/api/tags");
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Checks if port 11434 is in use
    /// </summary>
    private bool IsPortInUse(int port)
    {
        try
        {
            var ipGlobalProperties = IPGlobalProperties.GetIPGlobalProperties();
            var tcpConnInfoArray = ipGlobalProperties.GetActiveTcpListeners();

            return tcpConnInfoArray.Any(endpoint => endpoint.Port == port);
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Attempts to start Ollama service
    /// </summary>
    private async Task<bool> StartOllamaAsync()
    {
        try
        {
            // Check if port is already in use by another process
            if (IsPortInUse(11434))
            {
                _logger.LogWarning("Port 11434 is in use by another process");
                return false;
            }

            // Try to find Ollama executable
            string? ollamaPath = FindOllamaExecutable();
            if (string.IsNullOrEmpty(ollamaPath))
            {
                _logger.LogWarning("Ollama executable not found in PATH");
                return false;
            }

            _logger.LogInformation($"Found Ollama at: {ollamaPath}");

            // Start Ollama serve process
            var startInfo = new ProcessStartInfo
            {
                FileName = ollamaPath,
                Arguments = "serve",
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true,
                WindowStyle = ProcessWindowStyle.Hidden
            };

            _ollamaProcess = Process.Start(startInfo);
            if (_ollamaProcess == null)
            {
                _logger.LogError("Failed to start Ollama process");
                return false;
            }

            _logger.LogInformation($"Ollama process started with PID: {_ollamaProcess.Id}");

            // Wait for Ollama to be ready (up to 30 seconds)
            var maxWaitTime = TimeSpan.FromSeconds(30);
            var startTime = DateTime.UtcNow;

            while (DateTime.UtcNow - startTime < maxWaitTime)
            {
                if (await IsOllamaRunningAsync())
                {
                    _logger.LogInformation("✅ Ollama is ready and responding");
                    return true;
                }

                await Task.Delay(1000); // Wait 1 second before checking again
            }

            _logger.LogWarning("Ollama started but not responding within timeout");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting Ollama process");
            return false;
        }
    }

    /// <summary>
    /// Finds Ollama executable in PATH or common installation locations
    /// </summary>
    private string? FindOllamaExecutable()
    {
        try
        {
            // First try to find in PATH
            var pathVariable = Environment.GetEnvironmentVariable("PATH");
            if (!string.IsNullOrEmpty(pathVariable))
            {
                var paths = pathVariable.Split(Path.PathSeparator);
                foreach (var path in paths)
                {
                    var ollamaPath = Path.Combine(path, "ollama.exe");
                    if (File.Exists(ollamaPath))
                    {
                        return ollamaPath;
                    }
                }
            }

            // Try common installation locations on Windows
            var commonPaths = new[]
            {
                @"C:\Users\{0}\AppData\Local\Programs\Ollama\ollama.exe",
                @"C:\Program Files\Ollama\ollama.exe",
                @"C:\Program Files (x86)\Ollama\ollama.exe",
                @"C:\Tools\Ollama\ollama.exe"
            };

            var username = Environment.UserName;
            foreach (var pathTemplate in commonPaths)
            {
                var path = string.Format(pathTemplate, username);
                if (File.Exists(path))
                {
                    return path;
                }
            }

            // Try using 'where' command to find ollama
            var whereProcess = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "where",
                    Arguments = "ollama",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true
                }
            };

            whereProcess.Start();
            var output = whereProcess.StandardOutput.ReadToEnd();
            whereProcess.WaitForExit();

            if (whereProcess.ExitCode == 0 && !string.IsNullOrWhiteSpace(output))
            {
                var firstPath = output.Split('\n')[0].Trim();
                if (File.Exists(firstPath))
                {
                    return firstPath;
                }
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding Ollama executable");
            return null;
        }
    }

    /// <summary>
    /// Stops the Ollama process if it was started by this service
    /// </summary>
    public void StopOllama()
    {
        try
        {
            if (_ollamaProcess != null && !_ollamaProcess.HasExited)
            {
                _logger.LogInformation("Stopping Ollama process...");
                _ollamaProcess.Kill();
                _ollamaProcess.Dispose();
                _ollamaProcess = null;
                _logger.LogInformation("✅ Ollama process stopped");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error stopping Ollama process");
        }
    }

    /// <summary>
    /// Cleanup when service is disposed
    /// </summary>
    public void Dispose()
    {
        StopOllama();
    }
}
