@echo off
setlocal
cd /d "%~dp0backend\edustream-backend"
if not exist node_modules\jest\bin\jest.js (
  echo Installing test dependencies...
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed. Please check your Node.js/npm installation and internet connection.
    pause
    exit /b 1
  )
)
echo.
echo Running EduStream Week 5 test suite...
call npm test
set TEST_EXIT=%ERRORLEVEL%
echo.
echo Running performance benchmark...
cd /d "%~dp0"
node scripts\benchmark.js
pause
exit /b %TEST_EXIT%
