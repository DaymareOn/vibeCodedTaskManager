@echo off
setlocal enabledelayedexpansion
title Vibe Coded Task Manager - Launcher
color 0A

echo.
echo  =====================================================
echo   Vibe Coded Task Manager - Windows Launcher
echo  =====================================================
echo.

:: -------------------------------------------------------
:: STEP 1 — Check if Node.js is already installed
:: -------------------------------------------------------
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo  [OK] Node.js is already installed.
    node -v
    goto :INSTALL_DEPS
)

echo  [INFO] Node.js not found. Installing automatically...
echo.

:: -------------------------------------------------------
:: STEP 2 — Try to install Node.js via winget (Windows 10/11)
:: -------------------------------------------------------
where winget >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo  [INFO] Using winget to install Node.js LTS...
    winget install --id OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements
    if %ERRORLEVEL% NEQ 0 (
        echo  [WARN] winget install failed. Trying manual download...
        goto :MANUAL_INSTALL
    )
    echo  [OK] Node.js installed via winget.
    goto :REFRESH_PATH
)

:: -------------------------------------------------------
:: STEP 3 — Fallback: download Node.js installer with PowerShell
:: -------------------------------------------------------
:MANUAL_INSTALL
echo  [INFO] Downloading Node.js LTS installer from nodejs.org...
echo         (This may take a minute depending on your connection)
echo.

set "NODE_INSTALLER=%TEMP%\node_installer.msi"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Invoke-WebRequest -Uri 'https://nodejs.org/dist/lts/node-v20.19.1-x64.msi' -OutFile '%NODE_INSTALLER%' -UseBasicParsing"

if not exist "%NODE_INSTALLER%" (
    echo.
    echo  [ERROR] Could not download Node.js installer.
    echo          Please install Node.js manually from: https://nodejs.org
    echo          Then double-click start.bat again.
    echo.
    pause
    exit /b 1
)

echo  [INFO] Running Node.js installer (you may see a UAC prompt)...
msiexec /i "%NODE_INSTALLER%" /quiet /norestart

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Node.js installation failed.
    echo          Please install Node.js manually from: https://nodejs.org
    echo          Then double-click start.bat again.
    echo.
    pause
    exit /b 1
)

echo  [OK] Node.js installed successfully.

:: -------------------------------------------------------
:: STEP 4 — Refresh PATH so node/npm are available
:: -------------------------------------------------------
:REFRESH_PATH
echo  [INFO] Refreshing environment variables...

:: Read the updated PATH from registry
for /f "tokens=2*" %%A in (
    'reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul'
) do set "MACHINE_PATH=%%B"

for /f "tokens=2*" %%A in (
    'reg query "HKCU\Environment" /v Path 2^>nul'
) do set "USER_PATH=%%B"

set "PATH=!MACHINE_PATH!;!USER_PATH!"

:: Also add the default Node.js install location just in case
set "PATH=%ProgramFiles%\nodejs;!PATH!"
set "PATH=%APPDATA%\npm;!PATH!"

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [INFO] Node.js was installed but requires a restart of this script.
    echo         Please close this window and double-click start.bat again.
    echo.
    pause
    exit /b 0
)

:: -------------------------------------------------------
:: STEP 5 — Install npm dependencies (only when needed)
:: -------------------------------------------------------
:INSTALL_DEPS
echo.
if not exist "node_modules" (
    echo  [INFO] Installing project dependencies (first run only)...
    echo         This may take 1-2 minutes...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo  [ERROR] npm install failed. Check your internet connection and try again.
        echo.
        pause
        exit /b 1
    )
    echo  [OK] Dependencies installed.
) else (
    echo  [OK] Dependencies already installed.
)

:: -------------------------------------------------------
:: STEP 6 — Start the dev server and open the browser
:: -------------------------------------------------------
echo.
echo  [INFO] Starting Vibe Coded Task Manager...
echo         The app will open in your browser automatically.
echo.
echo  [INFO] To stop the app, close this window or press Ctrl+C
echo.

:: Open the browser after a short delay (Vite default port is 5173)
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5173"

:: Start Vite dev server
call npm run dev

echo.
echo  [INFO] Server stopped.
pause
