@echo off
echo ========================================
echo   Agent Harbor Wizard - Starting...
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js detected
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
    echo.
)

echo [INFO] Starting development server...
echo.
echo The wizard will open at: http://localhost:5173
echo Server logs will appear below:
echo.
echo ========================================
echo.

REM Start the development server
call npm run dev

pause
