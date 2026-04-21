@echo off
setlocal enabledelayedexpansion
title Vibe Coded Task Manager - Launcher
color 0A

echo.
echo  =====================================================
echo   Vibe Coded Task Manager - Windows Launcher
echo  =====================================================
echo.

echo  [LOG] Script started. Initializing...
echo  [DEBUG] Current directory: %CD%
echo  [DEBUG] TEMP directory: %TEMP%
echo  [DEBUG] ProgramFiles: %ProgramFiles%
echo  [DEBUG] APPDATA: %APPDATA%
echo.

:: -------------------------------------------------------
:: STEP 1 — Check if Node.js is already installed
:: -------------------------------------------------------
echo  [STEP] STEP 1 - Checking if Node.js is already installed...
where node >nul 2>&1
echo  [DEBUG] ERRORLEVEL after 'where node': %ERRORLEVEL%
if %ERRORLEVEL% EQU 0 (
    echo  [OK] Node.js is already installed.
    node -v
    echo  [LOG] Node.js found. Skipping installation, jumping to INSTALL_DEPS.
    goto :INSTALL_DEPS
)

echo  [LOG] Node.js not found by 'where node'. Proceeding to install.
echo  [INFO] Node.js not found. Installing automatically...
echo.

:: -------------------------------------------------------
:: STEP 2 — Try to install Node.js via winget (Windows 10/11)
:: -------------------------------------------------------
echo  [STEP] STEP 2 - Trying to install Node.js via winget...
where winget >nul 2>&1
echo  [DEBUG] ERRORLEVEL after 'where winget': %ERRORLEVEL%
if %ERRORLEVEL% EQU 0 (
    echo  [LOG] winget found. Attempting winget install...
    echo  [INFO] Using winget to install Node.js LTS...
    winget install --id OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements
    echo  [DEBUG] ERRORLEVEL after winget install: %ERRORLEVEL%
    if %ERRORLEVEL% NEQ 0 (
        echo  [WARN] winget install failed. Trying manual download...
        goto :MANUAL_INSTALL
    )
    echo  [OK] Node.js installed via winget.
    echo  [LOG] winget install succeeded. Jumping to REFRESH_PATH.
    goto :REFRESH_PATH
)

echo  [LOG] winget not found. Falling through to manual install.

:: -------------------------------------------------------
:: STEP 3 — Fallback: download Node.js installer with PowerShell
:: -------------------------------------------------------
:MANUAL_INSTALL
echo  [STEP] STEP 3 - Manual download of Node.js installer...
echo  [INFO] Downloading Node.js LTS installer from nodejs.org...
echo         (This may take a minute depending on your connection)
echo.

set "NODE_INSTALLER=%TEMP%\node_installer.msi"
echo  [DEBUG] NODE_INSTALLER path: %NODE_INSTALLER%

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Invoke-WebRequest -Uri 'https://nodejs.org/dist/lts/node-v20.19.1-x64.msi' -OutFile '%NODE_INSTALLER%' -UseBasicParsing"
echo  [DEBUG] ERRORLEVEL after PowerShell download: %ERRORLEVEL%

echo  [LOG] Checking if installer file exists at: %NODE_INSTALLER%
if not exist "%NODE_INSTALLER%" (
    echo  [DEBUG] Installer file NOT found at %NODE_INSTALLER%
    echo.
    echo  [ERROR] Could not download Node.js installer.
    echo          Please install Node.js manually from: https://nodejs.org
    echo          Then double-click start.bat again.
    echo.
    pause
    exit /b 1
)
echo  [LOG] Installer file found. Proceeding with msiexec...

echo  [INFO] Running Node.js installer (you may see a UAC prompt)...
msiexec /i "%NODE_INSTALLER%" /quiet /norestart
echo  [DEBUG] ERRORLEVEL after msiexec: %ERRORLEVEL%

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
echo  [LOG] STEP 3 complete. Node.js installed via manual download.

:: -------------------------------------------------------
:: STEP 4 — Refresh PATH so node/npm are available
:: -------------------------------------------------------
:REFRESH_PATH
echo.
echo  [STEP] STEP 4 - Refreshing PATH environment variables...
echo  [INFO] Refreshing environment variables...

:: Read MACHINE PATH from registry
echo  [LOG] Entering MACHINE_PATH registry query...
for /f "tokens=2*" %%A in (
    'reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul'
) do set "MACHINE_PATH=%%B"
echo  [LOG] Exiting MACHINE_PATH registry query.
echo  [DEBUG] MACHINE_PATH value: !MACHINE_PATH!

:: Read USER PATH from registry
echo  [LOG] Entering USER_PATH registry query...
for /f "tokens=2*" %%A in (
    'reg query "HKCU\Environment" /v Path 2^>nul'
) do set "USER_PATH=%%B"
echo  [LOG] Exiting USER_PATH registry query.
echo  [DEBUG] USER_PATH value: !USER_PATH!

echo  [LOG] Concatenating PATH from MACHINE_PATH and USER_PATH...
set "PATH=!MACHINE_PATH!;!USER_PATH!"
echo  [DEBUG] PATH after concatenation (first 200 chars): !PATH:~0,200!

:: Also add the default Node.js install location just in case
echo  [LOG] Prepending default Node.js and npm paths to PATH...
set "PATH=%ProgramFiles%\nodejs;!PATH!"
set "PATH=%APPDATA%\npm;!PATH!"
echo  [DEBUG] PATH after adding nodejs/npm dirs (first 200 chars): !PATH:~0,200!

echo  [LOG] Checking if node is now available in updated PATH...
where node >nul 2>&1
echo  [DEBUG] ERRORLEVEL after 'where node' (post-PATH-refresh): %ERRORLEVEL%
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [INFO] Node.js was installed but requires a restart of this script.
    echo         Please close this window and double-click start.bat again.
    echo.
    pause
    exit /b 0
)
echo  [LOG] STEP 4 complete. node is available in PATH.

:: -------------------------------------------------------
:: STEP 5 — Install npm dependencies (only when needed)
:: -------------------------------------------------------
:INSTALL_DEPS
echo.
echo  [STEP] STEP 5 - Checking/installing npm dependencies...
echo  [LOG] Checking for node_modules directory in: %CD%
if exist "node_modules" goto :DEPS_ALREADY_INSTALLED

echo  [DEBUG] node_modules NOT found. Running npm install...
echo  [INFO] Installing project dependencies (first run only)...
echo         This may take 1-2 minutes...
echo.
echo  [LOG] Running: npm install
call npm install
echo  [DEBUG] ERRORLEVEL after npm install: %ERRORLEVEL%
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] npm install failed. Check your internet connection and try again.
    echo.
    pause
    exit /b 1
)
echo  [OK] Dependencies installed.
echo  [LOG] npm install completed successfully.
goto :DEPS_DONE

:DEPS_ALREADY_INSTALLED
echo  [DEBUG] node_modules directory found. Skipping npm install.
echo  [OK] Dependencies already installed.

:DEPS_DONE
echo  [LOG] STEP 5 complete.

:: -------------------------------------------------------
:: STEP 6 — Start the dev server and open the browser
:: -------------------------------------------------------
echo.
echo  [STEP] STEP 6 - Starting the dev server...
echo  [INFO] Starting Vibe Coded Task Manager...
echo         The app will open in your browser automatically.
echo.
echo  [INFO] To stop the app, close this window or press Ctrl+C
echo  [INFO] The exchange-rate backend proxy starts automatically with npm run dev.
echo.

:: Open the browser after a short delay (Vite default port is 5173)
echo  [LOG] Launching browser opener (delayed 3s)...
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5173"

:: Start Vite dev server
echo  [LOG] Running: npm run dev
call npm run dev
echo  [DEBUG] ERRORLEVEL after npm run dev: %ERRORLEVEL%

echo.
echo  [INFO] Server stopped.
echo  [LOG] Script finished.
pause
