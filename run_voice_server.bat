@echo off
title Cactus Whistle Voice Website Server
echo ========================================================
echo   Starting Cactus Whistle Voice Website Server
echo   Model: Cactus-Compute/whistle (16.9 MB)
echo   Website URL: http://localhost:8765/
echo ========================================================
start http://localhost:8765/
python server.py
pause
