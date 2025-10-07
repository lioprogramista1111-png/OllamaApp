using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using CodeMentorAI.Core.Interfaces;
using CodeMentorAI.Core.Models;
using System.Text.Json;

namespace CodeMentorAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CodeAnalysisController : ControllerBase
{
    private readonly IOllamaService _ollamaService;
    private readonly IModelCapabilityService _capabilityService;
    private readonly ILogger<CodeAnalysisController> _logger;
    private readonly IMemoryCache _cache;

    public CodeAnalysisController(
        IOllamaService ollamaService,
        IModelCapabilityService capabilityService,
        ILogger<CodeAnalysisController> logger,
        IMemoryCache cache)
    {
        _ollamaService = ollamaService;
        _capabilityService = capabilityService;
        _logger = logger;
        _cache = cache;
    }

    /// <summary>
    /// Analyzes code using AI model and provides feedback
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<CodeAnalysisResult>> AnalyzeCode([FromBody] CodeAnalysisRequest request)
    {
        try
        {
            _logger.LogInformation("Starting code analysis for {Language} code ({Length} characters)",
                request.Language, request.Code.Length);

            // First, validate if the input is actually code
            var codeValidation = ValidateIsCode(request.Code);
            if (!codeValidation.IsCode)
            {
                _logger.LogWarning("Input does not appear to be code: {Reason}", codeValidation.Reason);
                return BadRequest(new
                {
                    message = "The provided text does not appear to be code",
                    reason = codeValidation.Reason,
                    suggestion = "Please provide actual source code for analysis. The text appears to be: " + codeValidation.DetectedType
                });
            }

            _logger.LogInformation("✅ Code validation passed: {Type}", codeValidation.DetectedType);

            _logger.LogInformation("🎯 Analysis Focus: {Focus}", request.Focus);

            // Use the model specified in the request, or get the best model for code analysis
            var bestModel = !string.IsNullOrEmpty(request.Model)
                ? request.Model
                : await GetBestModelCached();

            _logger.LogInformation("Using model {Model} for code analysis (User specified: {UserSpecified})",
                bestModel, !string.IsNullOrEmpty(request.Model));

            // First, detect the programming language
            var detectedLanguage = await DetectProgrammingLanguage(request.Code, bestModel);
            _logger.LogInformation("🔍 Language Detection: User selected '{UserLanguage}', AI detected '{DetectedLanguage}'",
                request.Language, detectedLanguage);

            // Build the analysis prompt
            var prompt = BuildAnalysisPrompt(request, detectedLanguage);

            // Log the exact prompt being sent to Ollama
            _logger.LogInformation("Sending prompt to Ollama model {Model}:\n{Prompt}", bestModel, prompt);

            // Generate analysis using Ollama
            var ollamaRequest = new OllamaRequest
            {
                Model = bestModel,
                Prompt = prompt,
                Stream = false,
                Options = new OllamaOptions
                {
                    Temperature = 0.3, // Lower temperature for more focused analysis
                    TopK = 40,
                    TopP = 0.9,
                    NumCtx = 8192, // Larger context for code analysis
                    NumPredict = 1000 // Allow longer responses
                }
            };

            var response = await _ollamaService.GenerateAsync(ollamaRequest);

            if (response == null || string.IsNullOrEmpty(response.Response))
            {
                return StatusCode(500, new { message = "Failed to get response from AI model" });
            }

            _logger.LogInformation("Received AI response: {Response}", response.Response);

            // Parse the AI response into structured feedback
            var analysisResult = ParseAnalysisResponse(response.Response, request.Language, bestModel, detectedLanguage);

            _logger.LogInformation("Code analysis completed successfully with model {Model}", bestModel);

            return Ok(analysisResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to analyze code");
            return StatusCode(500, new { message = "Failed to analyze code", error = ex.Message });
        }
    }



    private async Task<string> DetectProgrammingLanguage(string code, string model)
    {
        try
        {
            // Create cache key from code hash for faster lookups
            var codeHash = code.Length > 500 ? code.Substring(0, 500).GetHashCode() : code.GetHashCode();
            var cacheKey = $"lang_detect_{codeHash}";

            // Check cache first
            if (_cache.TryGetValue(cacheKey, out string? cachedLanguage) && cachedLanguage != null)
            {
                _logger.LogDebug("🚀 Language detection cache hit for hash {Hash}: {Language}", codeHash, cachedLanguage);
                return cachedLanguage;
            }

            // Fast pattern-based detection before AI call
            var fastDetected = FastLanguageDetection(code);
            if (fastDetected != "unknown")
            {
                _cache.Set(cacheKey, fastDetected, TimeSpan.FromMinutes(30));
                _logger.LogDebug("🚀 Fast language detection: {Language}", fastDetected);
                return fastDetected;
            }

            // Fallback to AI detection for complex cases
            var detectionPrompt = $@"Language only: {code.Substring(0, Math.Min(code.Length, 200))}";

            var detectionRequest = new OllamaRequest
            {
                Model = model,
                Prompt = detectionPrompt,
                Stream = false,
                Options = new OllamaOptions
                {
                    Temperature = 0.0, // Deterministic for caching
                    TopK = 5,
                    TopP = 0.3,
                    NumCtx = 1024, // Reduced context
                    NumPredict = 10 // Very short response
                }
            };

            var response = await _ollamaService.GenerateAsync(detectionRequest);
            var detectedLanguage = ExtractLanguageFromResponse(response.Response);

            // Cache the result
            _cache.Set(cacheKey, detectedLanguage, TimeSpan.FromMinutes(30));

            return detectedLanguage;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to detect programming language, defaulting to 'unknown'");
            return "unknown";
        }
    }

    private static CodeValidationResult ValidateIsCode(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return new CodeValidationResult
            {
                IsCode = false,
                Reason = "Input is empty or whitespace",
                DetectedType = "Empty"
            };
        }

        var trimmed = input.Trim();
        var lines = trimmed.Split('\n');
        var nonEmptyLines = lines.Where(l => !string.IsNullOrWhiteSpace(l)).ToArray();

        // Check minimum length
        if (trimmed.Length < 10)
        {
            return new CodeValidationResult
            {
                IsCode = false,
                Reason = "Input is too short to be meaningful code (less than 10 characters)",
                DetectedType = "Too short"
            };
        }

        // Code indicators (strong signals)
        var codeIndicators = new[]
        {
            // Common code patterns
            "function ", "const ", "let ", "var ", "def ", "class ", "public ", "private ", "protected ",
            "import ", "export ", "return ", "if(", "if ", "else ", "for(", "for ", "while(", "while ",
            "switch(", "switch ", "case ", "break;", "continue;", "throw ", "try ", "catch ",
            // Operators and syntax
            "=>", "->", "==", "!=", "<=", ">=", "&&", "||", "++", "--",
            // Common symbols
            "{", "}", "[", "]", "()", "[];", "();", "{}",
            // Language-specific
            "namespace ", "using ", "#include", "package ", "interface ", "struct ", "enum ",
            "async ", "await ", "yield ", "lambda ", "fn ", "func ", "proc ", "sub ",
            // Common methods
            ".length", ".size", ".push(", ".pop(", ".map(", ".filter(", ".reduce(",
            ".toString(", ".valueOf(", ".equals(", ".contains(",
            // Type annotations
            ": string", ": number", ": boolean", ": void", ": int", ": float", ": double",
            "<T>", "<string>", "<number>"
        };

        var codeIndicatorCount = codeIndicators.Count(indicator =>
            trimmed.Contains(indicator, StringComparison.OrdinalIgnoreCase));

        // Check for code-like structure
        var hasBraces = trimmed.Contains('{') && trimmed.Contains('}');
        var hasParentheses = trimmed.Contains('(') && trimmed.Contains(')');
        var hasSemicolons = trimmed.Contains(';');
        var hasAssignment = trimmed.Contains('=');
        var hasComments = trimmed.Contains("//") || trimmed.Contains("/*") || trimmed.Contains("#");

        // Calculate code score
        var codeScore = 0;
        if (codeIndicatorCount >= 3) codeScore += 40;
        else if (codeIndicatorCount >= 2) codeScore += 25;
        else if (codeIndicatorCount >= 1) codeScore += 10;

        if (hasBraces) codeScore += 15;
        if (hasParentheses) codeScore += 10;
        if (hasSemicolons) codeScore += 10;
        if (hasAssignment) codeScore += 10;
        if (hasComments) codeScore += 10;

        // Check for indentation (code is usually indented)
        var indentedLines = nonEmptyLines.Count(l => l.StartsWith(" ") || l.StartsWith("\t"));
        if (indentedLines > nonEmptyLines.Length / 3) codeScore += 15;

        // Check for natural language patterns (negative indicators)
        var naturalLanguagePatterns = new[]
        {
            "the ", "is ", "are ", "was ", "were ", "will be ", "has been ",
            "this is ", "that is ", "these are ", "those are ",
            "i think", "i believe", "in my opinion", "it seems",
            "hello", "hi ", "hey ", "dear ", "sincerely",
            "please ", "thank you", "thanks", "regards"
        };

        var naturalLanguageCount = naturalLanguagePatterns.Count(pattern =>
            trimmed.Contains(pattern, StringComparison.OrdinalIgnoreCase));

        // If too much natural language, reduce score
        if (naturalLanguageCount >= 3) codeScore -= 30;
        else if (naturalLanguageCount >= 2) codeScore -= 20;
        else if (naturalLanguageCount >= 1) codeScore -= 10;

        // Check if it's mostly prose (long sentences without code structure)
        var avgLineLength = nonEmptyLines.Any() ? nonEmptyLines.Average(l => l.Length) : 0;
        var hasLongSentences = avgLineLength > 80 && !hasBraces && !hasSemicolons;
        if (hasLongSentences) codeScore -= 20;

        // Determine if it's code
        var isCode = codeScore >= 30;

        return new CodeValidationResult
        {
            IsCode = isCode,
            Reason = isCode
                ? $"Input appears to be code (score: {codeScore})"
                : $"Input does not appear to be code (score: {codeScore}). Found {naturalLanguageCount} natural language patterns and only {codeIndicatorCount} code indicators.",
            DetectedType = isCode
                ? "Code"
                : (naturalLanguageCount > 0 ? "Natural language/prose" : "Unknown text"),
            ConfidenceScore = codeScore
        };
    }

    private static string FastLanguageDetection(string code)
    {
        var codeStart = code.TrimStart().Take(200).ToArray();
        var codeStr = new string(codeStart).ToLower();

        // Fast pattern matching for common languages
        if (codeStr.Contains("function ") || codeStr.Contains("const ") || codeStr.Contains("let ") || codeStr.Contains("var "))
            return "javascript";
        if (codeStr.Contains("def ") || codeStr.Contains("import ") && codeStr.Contains("from "))
            return "python";
        if (codeStr.Contains("public class") || codeStr.Contains("using ") || codeStr.Contains("namespace "))
            return "csharp";
        if (codeStr.Contains("public static void main") || codeStr.Contains("import java"))
            return "java";
        if (codeStr.Contains("interface ") || codeStr.Contains("type ") || codeStr.Contains(": string"))
            return "typescript";
        if (codeStr.Contains("#include") || codeStr.Contains("int main("))
            return "cpp";
        if (codeStr.Contains("package main") || codeStr.Contains("func "))
            return "go";
        if (codeStr.Contains("fn ") || codeStr.Contains("let mut"))
            return "rust";
        if (codeStr.Contains("<?php") || codeStr.Contains("$"))
            return "php";

        return "unknown";
    }

    private static string ExtractLanguageFromResponse(string response)
    {
        var cleaned = response.Trim().ToLower();
        var languageKeywords = new[] { "javascript", "typescript", "python", "csharp", "java", "cpp", "c++", "go", "rust", "php", "ruby", "swift", "kotlin", "html", "css", "sql", "bash", "powershell", "c#", "c" };

        foreach (var keyword in languageKeywords)
        {
            if (cleaned.Contains(keyword))
            {
                return keyword == "c#" ? "csharp" : keyword == "c++" ? "cpp" : keyword;
            }
        }

        return "unknown";
    }

    private async Task<string> GetBestModelCached()
    {
        const string cacheKey = "best_model_code_analysis";

        if (_cache.TryGetValue(cacheKey, out string? cachedModel) && cachedModel != null)
        {
            _logger.LogDebug("🚀 Model selection cache hit: {Model}", cachedModel);
            return cachedModel;
        }

        try
        {
            var availableModels = await _ollamaService.GetAvailableModelsAsync();
            var modelNames = availableModels.Select(m => m.Name).ToList();
            var bestModel = await _capabilityService.GetBestModelForTaskAsync("code_analysis", modelNames);

            if (string.IsNullOrEmpty(bestModel))
            {
                // Fallback to current model or default
                var currentModel = await _ollamaService.GetCurrentModelAsync();
                bestModel = currentModel?.Name ?? "llama3.2:latest";
            }

            // Cache for 5 minutes
            _cache.Set(cacheKey, bestModel, TimeSpan.FromMinutes(5));
            _logger.LogDebug("🚀 Model selection cached: {Model}", bestModel);

            return bestModel;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get best model, using fallback");
            return "llama3.2:latest";
        }
    }

    private string BuildAnalysisPrompt(CodeAnalysisRequest request, string detectedLanguage = null)
    {
        var actualLanguage = !string.IsNullOrEmpty(detectedLanguage) && detectedLanguage != "unknown" ? detectedLanguage : request.Language;

        // Use the Focus field to determine which prompt to use
        switch (request.Focus?.ToLower())
        {
            case "explain":
                return $@"Explain what this {actualLanguage} code does. Do NOT suggest improvements.

1. What is the purpose?
2. How does it work step-by-step?
3. What programming concepts are used?

Code:
```{actualLanguage}
{request.Code}
```";

            case "codequality":
                return $@"Analyze code quality ONLY. Ignore performance, security, and bugs.

Check: naming, readability, structure, SOLID principles.

Code:
```{actualLanguage}
{request.Code}
```

Format (max 100 words):
**Issues**: 1-2 quality problems
**Fix**: How to improve";

            case "performance":
                return $@"Analyze performance ONLY. Ignore code quality, security, and bugs.

Check: algorithm efficiency, memory usage, bottlenecks.

Code:
```{actualLanguage}
{request.Code}
```

Format (max 100 words):
**Issues**: 1-2 performance problems
**Fix**: How to optimize";

            case "security":
                return $@"Analyze security ONLY. Ignore code quality, performance, and bugs.

Check: input validation, injection attacks, data exposure, authentication.

Code:
```{actualLanguage}
{request.Code}
```

Format (max 100 words):
**Issues**: 1-2 security vulnerabilities
**Fix**: How to secure";

            case "bugs":
                return $@"Find bugs ONLY. Ignore code quality, performance, and security.

Check: null errors, edge cases, logic errors, exception handling.

Code:
```{actualLanguage}
{request.Code}
```

Format (max 100 words):
**Issues**: 1-2 potential bugs
**Fix**: How to fix";

            case "refactoring":
                return $@"Suggest refactoring ONLY. Ignore performance, security, and bugs.

Check: code duplication, long methods, complex conditionals, design patterns.

Code:
```{actualLanguage}
{request.Code}
```

Format (max 150 words):
**Issues**: 1-2 refactoring needs
**Fix**: How to refactor
**Refactored Code**: Show improved version (max 10 lines)";

            default:
                return $@"Analyze this {actualLanguage} code and provide feedback.

Code:
```{actualLanguage}
{request.Code}
```";
        }
    }

    private CodeAnalysisResult ParseAnalysisResponse(string aiResponse, string language, string modelUsed, string detectedLanguage = null)
    {
        try
        {
            _logger.LogInformation("Parsing AI response of length {Length}", aiResponse.Length);

            // Extract quality score from the response
            var qualityScore = ExtractQualityScore(aiResponse);
            _logger.LogInformation("Extracted quality score: {Score}", qualityScore);

            // Extract suggestions (look for bullet points or numbered lists)
            var suggestions = ExtractSuggestions(aiResponse);
            _logger.LogInformation("Extracted {Count} suggestions", suggestions.Count);

            // Check for language mismatch
            var languageMismatch = !string.IsNullOrEmpty(detectedLanguage) &&
                                   detectedLanguage != "unknown" &&
                                   !string.Equals(detectedLanguage, language, StringComparison.OrdinalIgnoreCase);

            return new CodeAnalysisResult
            {
                Feedback = aiResponse.Trim(),
                Suggestions = suggestions,
                CodeQuality = qualityScore,
                Timestamp = DateTime.UtcNow,
                Language = language,
                ModelUsed = modelUsed,
                DetectedLanguage = detectedLanguage,
                LanguageMismatch = languageMismatch
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse AI response, returning raw response");

            // Fallback: return raw response with default values
            var languageMismatch = !string.IsNullOrEmpty(detectedLanguage) &&
                                   detectedLanguage != "unknown" &&
                                   !string.Equals(detectedLanguage, language, StringComparison.OrdinalIgnoreCase);

            return new CodeAnalysisResult
            {
                Feedback = aiResponse.Trim(),
                Suggestions = new List<string>(),
                CodeQuality = 75, // Default score
                Timestamp = DateTime.UtcNow,
                Language = language,
                ModelUsed = modelUsed,
                DetectedLanguage = detectedLanguage,
                LanguageMismatch = languageMismatch
            };
        }
    }

    private int ExtractQualityScore(string response)
    {
        // Look for patterns like "Score: 85", "85/100", "Quality: 85", "8/10", "4 out of 5"
        var patterns = new[]
        {
            @"(?:score|quality|rating):\s*(\d+)",
            @"(\d+)\s*/\s*100",
            @"(\d+)\s*/\s*10", // Convert /10 to /100
            @"(\d+)\s*out\s*of\s*10",
            @"(\d+)\s*out\s*of\s*5", // Convert /5 to /100
            @"(\d+)\s*%",
            @"rate.*?(\d+)",
            @"(\d+)\s*/\s*5"
        };

        for (int i = 0; i < patterns.Length; i++)
        {
            var pattern = patterns[i];
            var match = System.Text.RegularExpressions.Regex.Match(response, pattern,
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);

            if (match.Success && int.TryParse(match.Groups[1].Value, out var score))
            {
                // Convert different scales to 100-point scale
                if (i == 2 || i == 3) // /10 scale
                {
                    score = score * 10;
                }
                else if (i == 4 || i == 7) // /5 scale
                {
                    score = score * 20;
                }

                return Math.Max(1, Math.Min(100, score)); // Clamp between 1-100
            }
        }

        // If no explicit score found, try to infer from sentiment (be more critical)
        var lowerResponse = response.ToLower();
        if (lowerResponse.Contains("excellent") || lowerResponse.Contains("perfect") || lowerResponse.Contains("outstanding"))
            return 85; // Reduced from 90
        if (lowerResponse.Contains("good") || lowerResponse.Contains("well-written") || lowerResponse.Contains("solid"))
            return 75; // Reduced from 80
        if (lowerResponse.Contains("decent") || lowerResponse.Contains("acceptable") || lowerResponse.Contains("okay"))
            return 65; // Reduced from 70
        if (lowerResponse.Contains("poor") || lowerResponse.Contains("needs improvement") || lowerResponse.Contains("problematic"))
            return 50; // Reduced from 60
        if (lowerResponse.Contains("bad") || lowerResponse.Contains("terrible") || lowerResponse.Contains("awful"))
            return 30; // Reduced from 40

        // Count critical issues to adjust score downward
        var criticalKeywords = new[] { "missing", "lack", "no", "should", "must", "error", "issue", "problem", "vulnerability", "security" };
        var criticalCount = criticalKeywords.Count(keyword => lowerResponse.Contains(keyword));

        // Default score based on critical issues found (be more critical)
        if (criticalCount >= 5) return 45;
        if (criticalCount >= 3) return 55;
        if (criticalCount >= 1) return 65;

        return 70; // Reduced default from 75
    }

    private List<string> ExtractSuggestions(string response)
    {
        var suggestions = new List<string>();

        // Look for bullet points or numbered lists
        var lines = response.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        foreach (var line in lines)
        {
            var trimmed = line.Trim();

            // Check for bullet points or numbered items
            if (trimmed.StartsWith("- ") ||
                trimmed.StartsWith("* ") ||
                trimmed.StartsWith("• ") ||
                System.Text.RegularExpressions.Regex.IsMatch(trimmed, @"^\d+\.\s"))
            {
                // Clean up the suggestion text
                var suggestion = System.Text.RegularExpressions.Regex.Replace(trimmed, @"^[-*•]\s*|\d+\.\s*", "").Trim();
                if (!string.IsNullOrEmpty(suggestion) && suggestion.Length > 10)
                {
                    suggestions.Add(suggestion);
                }
            }
        }

        // If no structured suggestions found, try to extract from specific sections
        if (!suggestions.Any())
        {
            var sectionsToCheck = new[] { "suggestions", "recommendations", "improvements", "issues", "problems" };

            foreach (var sectionName in sectionsToCheck)
            {
                var section = ExtractSection(response, sectionName);
                if (!string.IsNullOrEmpty(section))
                {
                    var sectionLines = section.Split('\n', StringSplitOptions.RemoveEmptyEntries);
                    foreach (var line in sectionLines)
                    {
                        var trimmed = line.Trim();
                        if (!string.IsNullOrEmpty(trimmed) && trimmed.Length > 15 &&
                            !trimmed.ToLower().Contains(sectionName.ToLower()))
                        {
                            suggestions.Add(trimmed);
                        }
                    }
                    if (suggestions.Any()) break;
                }
            }
        }

        // If still no suggestions, extract sentences that contain improvement keywords
        if (!suggestions.Any())
        {
            var improvementKeywords = new[] { "should", "could", "consider", "recommend", "suggest", "improve", "better", "avoid", "use", "add" };
            var sentences = response.Split('.', StringSplitOptions.RemoveEmptyEntries);

            foreach (var sentence in sentences)
            {
                var trimmed = sentence.Trim();
                if (trimmed.Length > 20 && improvementKeywords.Any(keyword => trimmed.ToLower().Contains(keyword)))
                {
                    suggestions.Add(trimmed + ".");
                    if (suggestions.Count >= 5) break;
                }
            }
        }

        return suggestions.Take(10).ToList(); // Limit to 10 suggestions
    }

    private string ExtractSection(string response, string sectionName)
    {
        var pattern = $@"(?:^|\n)\s*\*?\*?{sectionName}[:\s]*\*?\*?\s*\n(.*?)(?=\n\s*\*?\*?\w+[:\s]*\*?\*?|\n\s*$|$)";
        var match = System.Text.RegularExpressions.Regex.Match(response, pattern, 
            System.Text.RegularExpressions.RegexOptions.IgnoreCase | 
            System.Text.RegularExpressions.RegexOptions.Singleline);
        
        return match.Success ? match.Groups[1].Value.Trim() : string.Empty;
    }
}

// Request/Response models
public class CodeAnalysisRequest
{
    public string Code { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
    public string? Model { get; set; } // Optional: specific model to use for analysis
    public string Focus { get; set; } = "codeQuality"; // Single focus: codeQuality, performance, security, bugs, refactoring, explain
    public AnalysisOptions Options { get; set; } = new();
}

public class AnalysisOptions
{
    public bool CodeQuality { get; set; }
    public bool Performance { get; set; }
    public bool Security { get; set; }
    public bool Bugs { get; set; }
    public bool Refactoring { get; set; }
    public bool Explain { get; set; }
}

public class CodeAnalysisResult
{
    public string Feedback { get; set; } = string.Empty;
    public List<string> Suggestions { get; set; } = new();
    public int CodeQuality { get; set; }
    public DateTime Timestamp { get; set; }
    public string Language { get; set; } = string.Empty;
    public string ModelUsed { get; set; } = string.Empty;
    public string? DetectedLanguage { get; set; }
    public bool LanguageMismatch { get; set; }
}

public class CodeValidationResult
{
    public bool IsCode { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string DetectedType { get; set; } = string.Empty;
    public int ConfidenceScore { get; set; }
}
