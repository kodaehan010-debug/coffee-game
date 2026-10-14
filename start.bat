@echo off
chcp 65001 >nul
cd /d "%~dp0project\frontend"
if not exist node_modules (
  echo [setup] npm install...
  call npm install
)
echo [start] http://localhost:5173
start "coffee-game-fe" cmd /c "npm run dev"
timeout /t 3 >nul
start http://localhost:5173
