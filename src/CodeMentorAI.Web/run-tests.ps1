#!/usr/bin/env pwsh
<#
.SYNOPSIS
    CodeMentorAI Frontend Test Runner (PowerShell)

.DESCRIPTION
    This script runs the Angular unit tests with various options including
    watch mode, headless mode, coverage reporting, and CI mode.

.PARAMETER Mode
    The test mode to run: watch, headless, coverage, or ci
    Default: watch

.EXAMPLE
    .\run-tests.ps1
    Runs tests in watch mode (default)

.EXAMPLE
    .\run-tests.ps1 -Mode headless
    Runs tests once in headless Chrome

.EXAMPLE
    .\run-tests.ps1 -Mode coverage
    Runs tests with coverage report

.EXAMPLE
    .\run-tests.ps1 -Mode ci
    Runs tests in CI mode (headless with coverage)
#>

param(
    [Parameter(Position=0)]
    [ValidateSet('watch', 'headless', 'coverage', 'ci')]
    [string]$Mode = 'watch'
)

# Color output functions
function Write-Header {
    param([string]$Message)
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Main script
Write-Header "CodeMentorAI Frontend Test Runner"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Error-Custom "node_modules not found. Running npm install..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "npm install failed!"
        exit 1
    }
}

Write-Info "Test mode: $Mode"
Write-Host ""

# Run tests based on mode
switch ($Mode) {
    'watch' {
        Write-Info "Running tests in watch mode..."
        Write-Info "Press Ctrl+C to stop"
        Write-Host ""
        npm run test:watch
    }
    'headless' {
        Write-Info "Running tests in headless mode..."
        Write-Host ""
        npm run test:headless
    }
    'coverage' {
        Write-Info "Running tests with coverage..."
        Write-Host ""
        npm run test:coverage
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Success "Coverage report generated!"
            
            $coveragePath = "coverage\code-mentor-ai-web\index.html"
            if (Test-Path $coveragePath) {
                Write-Info "Opening coverage report..."
                Start-Process $coveragePath
            }
        }
    }
    'ci' {
        Write-Info "Running tests in CI mode..."
        Write-Host ""
        npm run test:ci
    }
}

# Check exit code
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Error-Custom "Tests failed!"
    exit 1
} else {
    Write-Host ""
    Write-Success "All tests passed!"
    exit 0
}

