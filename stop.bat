@echo off
chcp 65001 >nul
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
  echo [stop] PID %%p
  taskkill /PID %%p /T /F >nul 2>&1
)
echo [stop] done
