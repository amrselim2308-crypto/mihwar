@echo off
title Mihwar Web Application Server (Localhost:8080)
echo ==========================================================
echo   MIHWAR EDUCATIONAL PLATFORM & WEB APPLICATION
echo   Starting local HTTP server on http://localhost:8080 ...
echo ==========================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\serve.ps1"
pause
