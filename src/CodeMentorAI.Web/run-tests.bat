@echo off
REM CodeMentorAI Frontend Test Runner (Windows Batch)
REM This script runs the Angular unit tests with various options

echo ========================================
echo CodeMentorAI Frontend Test Runner
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [ERROR] node_modules not found. Running npm install...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed!
        exit /b 1
    )
)

REM Parse command line arguments
set TEST_MODE=watch
if "%1"=="headless" set TEST_MODE=headless
if "%1"=="coverage" set TEST_MODE=coverage
if "%1"=="ci" set TEST_MODE=ci

echo [INFO] Test mode: %TEST_MODE%
echo.

REM Run tests based on mode
if "%TEST_MODE%"=="watch" (
    echo [INFO] Running tests in watch mode...
    echo [INFO] Press Ctrl+C to stop
    echo.
    call npm run test:watch
) else if "%TEST_MODE%"=="headless" (
    echo [INFO] Running tests in headless mode...
    echo.
    call npm run test:headless
) else if "%TEST_MODE%"=="coverage" (
    echo [INFO] Running tests with coverage...
    echo.
    call npm run test:coverage
    if errorlevel 0 (
        echo.
        echo [SUCCESS] Coverage report generated!
        echo [INFO] Opening coverage report...
        start coverage\code-mentor-ai-web\index.html
    )
) else if "%TEST_MODE%"=="ci" (
    echo [INFO] Running tests in CI mode...
    echo.
    call npm run test:ci
)

if errorlevel 1 (
    echo.
    echo [ERROR] Tests failed!
    exit /b 1
) else (
    echo.
    echo [SUCCESS] All tests passed!
    exit /b 0
)

