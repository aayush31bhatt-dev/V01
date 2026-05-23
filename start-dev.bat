@echo off
REM Wrapper to run the start-dev PowerShell script with an execution policy bypass
SET SCRIPT=%~dp0scripts\start-dev.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%"
