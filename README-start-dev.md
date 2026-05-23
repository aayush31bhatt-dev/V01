Usage: Start both frontend and backend dev servers

Files added:
- scripts/start-dev.ps1  -> PowerShell script that checks ports and starts servers in new PowerShell windows
- start-dev.bat         -> Double-clickable Windows batch wrapper that runs the PowerShell script

How to run:
- Double-click `start-dev.bat` (Windows). This will invoke PowerShell and run the safety checks, then open new terminals for any servers that need starting.

Notes:
- The script checks ports 4310 (API) and 5173 (frontend). If a process is already listening and appears to belong to this repository (based on command line hints), the script will skip starting that server to avoid duplicate instances.
- If a port is in use by some other process, the script will not attempt to kill it and will skip starting that server. This avoids accidental termination of unrelated processes.
- The script opens new PowerShell terminals with `-NoExit` so you can see logs and stop servers manually when done.
- The frontend only starts after the API responds to `http://127.0.0.1:4310/health`, which avoids the startup race that can break workspace-to-backend communication.

If you want me to also add a macOS/Linux-friendly script, or make the script force-restart servers, tell me and I will implement it.
