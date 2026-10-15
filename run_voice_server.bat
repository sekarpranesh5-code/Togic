@echo off
title Togic Voice Website Server
echo ========================================================
echo   Starting Togic Voice Website Server
echo   Model: Cactus Whistle (16.9 MB Preloaded)
echo   Website URL: http://localhost:8765/
echo ========================================================
start http://localhost:8765/
python server.py
pause
