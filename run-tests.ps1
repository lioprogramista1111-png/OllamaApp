#!/usr/bin/env pwsh

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CodeMentorAI Test Runner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set location to script directory
Set-Location $PSScriptRoot

# Check .NET SDK
Write-Host "Checking .NET SDK..." -ForegroundColor Yellow
try {
    $dotnetVersion = dotnet --version
    Write-Host "✅ .NET SDK version: $dotnetVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ ERROR: .NET SDK not found. Please install .NET 8.0 SDK." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Building solution..." -ForegroundColor Yellow
$buildResult = dotnet build CodeMentorAI.sln --configuration Release
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR: Build failed." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "✅ Build successful" -ForegroundColor Green

Write-Host ""
Write-Host "Running tests..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

# Create TestResults directory if it doesn't exist
if (!(Test-Path "TestResults")) {
    New-Item -ItemType Directory -Path "TestResults" | Out-Null
}

# Run tests with coverage
$testResult = dotnet test src\CodeMentorAI.Tests\CodeMentorAI.Tests.csproj `
    --configuration Release `
    --logger "console;verbosity=normal" `
    --collect:"XPlat Code Coverage" `
    --results-directory TestResults

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ Some tests failed. Check the output above." -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ All tests passed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
}

Write-Host ""
Write-Host "📁 Test results saved to: TestResults\" -ForegroundColor Cyan

# Check for coverage report
$coverageFiles = Get-ChildItem -Path "TestResults" -Filter "coverage.cobertura.xml" -Recurse
if ($coverageFiles.Count -gt 0) {
    Write-Host "📊 Code coverage report generated." -ForegroundColor Green
    Write-Host ""
    Write-Host "To view coverage report:" -ForegroundColor Yellow
    Write-Host "1. Install reportgenerator:" -ForegroundColor White
    Write-Host "   dotnet tool install -g dotnet-reportgenerator-globaltool" -ForegroundColor Gray
    Write-Host "2. Generate HTML report:" -ForegroundColor White
    Write-Host "   reportgenerator -reports:`"TestResults\*\coverage.cobertura.xml`" -targetdir:`"TestResults\CoverageReport`" -reporttypes:Html" -ForegroundColor Gray
    Write-Host "3. Open TestResults\CoverageReport\index.html in your browser" -ForegroundColor White
}

Write-Host ""

# Offer to run specific test categories
Write-Host "Additional test options:" -ForegroundColor Yellow
Write-Host "1. Run only unit tests: dotnet test --filter Category=Unit" -ForegroundColor Gray
Write-Host "2. Run only integration tests: dotnet test --filter Category=Integration" -ForegroundColor Gray
Write-Host "3. Run tests for specific class: dotnet test --filter ClassName=OllamaServiceTests" -ForegroundColor Gray

Write-Host ""
Read-Host "Press Enter to exit"
