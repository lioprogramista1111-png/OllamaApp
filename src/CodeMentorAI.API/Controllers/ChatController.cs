using Microsoft.AspNetCore.Mvc;
using CodeMentorAI.Core.Interfaces;
using CodeMentorAI.Core.Models;

namespace CodeMentorAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly IOllamaService _ollamaService;
    private readonly ILogger<ChatController> _logger;

    public ChatController(IOllamaService ollamaService, ILogger<ChatController> logger)
    {
        _ollamaService = ollamaService;
        _logger = logger;
    }

    /// <summary>
    /// Generate a chat response using the specified model
    /// </summary>
    [HttpPost("generate")]
    public async Task<ActionResult<OllamaResponse>> GenerateResponse([FromBody] ChatRequest request)
    {
        try
        {
            var ollamaRequest = new OllamaRequest
            {
                Model = request.Model,
                Prompt = request.Prompt,
                Stream = request.Stream ?? false,
                Options = request.Options
            };

            var response = await _ollamaService.GenerateAsync(ollamaRequest);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate chat response for model {Model}", request.Model);
            return StatusCode(500, new { message = "Failed to generate response", error = ex.Message });
        }
    }

    /// <summary>
    /// Generate a streaming chat response using the specified model
    /// </summary>
    [HttpPost("generate-stream")]
    public async Task<ActionResult> GenerateStreamResponse([FromBody] ChatRequest request)
    {
        try
        {
            var ollamaRequest = new OllamaRequest
            {
                Model = request.Model,
                Prompt = request.Prompt,
                Stream = true,
                Options = request.Options
            };

            Response.ContentType = "text/plain";
            
            await foreach (var chunk in _ollamaService.GenerateStreamAsync(ollamaRequest))
            {
                await Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(chunk) + "\n");
                await Response.Body.FlushAsync();
            }

            return new EmptyResult();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate streaming chat response for model {Model}", request.Model);
            return StatusCode(500, new { message = "Failed to generate streaming response", error = ex.Message });
        }
    }
}

public class ChatRequest
{
    public string Model { get; set; } = string.Empty;
    public string Prompt { get; set; } = string.Empty;
    public bool? Stream { get; set; }
    public OllamaOptions? Options { get; set; }
}
