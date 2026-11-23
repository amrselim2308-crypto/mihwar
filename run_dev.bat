@echo off
title Mihwar Learning Platform - Dev Server Runner
echo ========================================================
echo   MIHWAR LEARNING PLATFORM - SERVER RUNNER
echo   Starting Node.js development server on port 3000...
echo ========================================================
cd /d "%~dp0"
npm run dev
pause
