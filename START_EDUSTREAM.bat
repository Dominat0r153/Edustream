@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set "BACKEND=%~dp0backend\edustream-backend"
set "LOG=%BACKEND%\edustream-start.log"

echo ============================================
echo EduStream - Windows One-Click Launcher
echo ============================================
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or not on PATH.
  pause
  exit /b 1
)
if not exist "%BACKEND%\package.json" (
  echo ERROR: Backend folder not found: %BACKEND%
  pause
  exit /b 1
)

cd /d "%BACKEND%"
if not exist "node_modules" (
  echo Installing dependencies for the first run...
  call npm install
  if errorlevel 1 (
    echo.
    echo ERROR: npm install failed. See the messages above.
    pause
    exit /b 1
  )
)

if not exist "%BACKEND%\data" mkdir "%BACKEND%\data"

echo Starting backend...
start "EduStream Backend" cmd /k "cd /d "%BACKEND%" && node server.js"

echo Waiting for backend at http://127.0.0.1:5000 ...
set READY=
for /l %%i in (1,1,30) do (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r=Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5000/api/v1/health -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>nul
  if not errorlevel 1 set READY=1&goto READY
  timeout /t 1 /nobreak >nul
)

:READY
if not defined READY (
  echo.
  echo ERROR: Backend did not become ready in 30 seconds.
  echo Check the EduStream Backend window for the exact Node.js error.
  echo A log will also be written to: %LOG%
  pause
  exit /b 1
)

start "" "http://127.0.0.1:5000"
echo.
echo EduStream is ready: http://127.0.0.1:5000
 echo Close the 'EduStream Backend' window when you are finished.
endlocal
