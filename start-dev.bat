@echo off
cd /d "%~dp0"
echo Starting DollVerse dev server...
echo.
echo When Vite is ready, open:
echo   http://localhost:5173/
echo   http://127.0.0.1:5173/
echo.
echo Keep this window open while previewing the site.
echo Press Ctrl+C to stop the dev server.
echo.
"D:\program\Nodejs\node.exe" ".\node_modules\vite\bin\vite.js" --host 0.0.0.0 --port 5173
pause
