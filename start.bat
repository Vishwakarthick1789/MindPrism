@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "PORT=8765"
set "URL=http://127.0.0.1:%PORT%/"

where python >nul 2>nul
if errorlevel 1 (
  echo.
  echo [MindPrism] Python was not found on your PATH.
  echo Opening index.html in your default browser ^(file mode^).
  echo For the recommended experience, install Python 3 and re-run start.bat.
  echo.
  start "" "%~dp0index.html"
  exit /b 0
)

echo [MindPrism] Starting local server at %URL%
echo [MindPrism] Close the "MindPrism Server" window when you are finished.
echo.

start "MindPrism Server" /D "%~dp0" cmd /k "title MindPrism Server ^| port %PORT% & python -m http.server %PORT%"

ping 127.0.0.1 -n 3 >nul

start "" "%URL%"

exit /b 0
