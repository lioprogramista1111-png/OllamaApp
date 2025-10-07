@echo off
echo ========================================
echo CodeMentorAI Test Runner
echo ========================================
echo.

cd /d "%~dp0"

echo Checking .NET SDK...
dotnet --version
if %ERRORLEVEL% neq 0 (
    echo ERROR: .NET SDK not found. Please install .NET 8.0 SDK.
    pause
    exit /b 1
)

echo.
echo Building solution...
dotnet build CodeMentorAI.sln --configuration Release
if %ERRORLEVEL% neq 0 (
    echo ERROR: Build failed.
    pause
    exit /b 1
)

echo.
echo Running tests...
echo ========================================

REM Run all tests with detailed output
dotnet test src\CodeMentorAI.Tests\CodeMentorAI.Tests.csproj ^
    --configuration Release ^
    --logger "console;verbosity=normal" ^
    --collect:"XPlat Code Coverage" ^
    --results-directory TestResults

if %ERRORLEVEL% neq 0 (
    echo.
    echo ========================================
    echo Some tests failed. Check the output above.
    echo ========================================
) else (
    echo.
    echo ========================================
    echo All tests passed successfully!
    echo ========================================
)

echo.
echo Test results saved to: TestResults\
echo.

REM Check if coverage report exists
if exist "TestResults\*\coverage.cobertura.xml" (
    echo Code coverage report generated.
    echo To view coverage, install reportgenerator:
    echo   dotnet tool install -g dotnet-reportgenerator-globaltool
    echo Then run:
    echo   reportgenerator -reports:"TestResults\*\coverage.cobertura.xml" -targetdir:"TestResults\CoverageReport" -reporttypes:Html
)

pause
