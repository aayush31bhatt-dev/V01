param()

# Start-dev PowerShell helper
# - checks whether ports are in use
# - if the process on the port appears to belong to this workspace, it will skip starting
# - otherwise it opens new PowerShell windows and runs the dev commands

function Get-ListenerPid($port) {
    try {
        $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop
        return $conn.OwningProcess
    } catch {
        return $null
    }
}

function Get-ProcessCommandLine($procId) {
    try {
        $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$procId"
        return $proc.CommandLine
    } catch {
        return $null
    }
}

function IsProjectProcess($cmdLine, $repoRoot) {
    if (-not $cmdLine) { return $false }
    $normalized = $cmdLine -replace '/', '\\'
    if ($normalized -match [regex]::Escape($repoRoot)) { return $true }
    # common dev hints
    if ($normalized -match 'tsx' -or $normalized -match 'electron-vite' -or $normalized -match 'vite') { return $true }
    return $false
}

function Test-ApiHealthy {
    try {
        $response = Invoke-RestMethod -Uri "http://127.0.0.1:4310/health" -TimeoutSec 2
        return $response -and $response.ok -eq $true
    } catch {
        return $false
    }
}

function Wait-ForApiHealth {
    param(
        [int]$TimeoutSeconds = 45
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-ApiHealthy) {
            return $true
        }
        Start-Sleep -Milliseconds 500
    }

    return $false
}

try {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $repoRoot = Resolve-Path (Join-Path $scriptDir "..") | Select-Object -ExpandProperty Path
} catch {
    $repoRoot = Get-Location
}

Write-Host "Repository root: $repoRoot"

$apiPort = 4310
$frontendPort = 5173

# Check API
$apiPid = Get-ListenerPid $apiPort
$apiHealthy = Test-ApiHealthy
if ($apiPid) {
    $cmd = Get-ProcessCommandLine $apiPid
    if (IsProjectProcess $cmd $repoRoot) {
        Write-Host "API already running (PID $apiPid). Skipping start."
    } else {
        Write-Host "Port $apiPort is in use by PID $apiPid but not this project. Skipping start to avoid conflict."
    }
} else {
    Write-Host "Starting API dev server in a new terminal..."
    Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location -LiteralPath '$repoRoot'; npm run dev:api" -WorkingDirectory $repoRoot
    $apiHealthy = Wait-ForApiHealth
}

if (-not $apiHealthy) {
    Write-Host "API health check did not succeed yet. Frontend will not be started until the backend responds at http://127.0.0.1:4310/health."
    Write-Host "If another process is occupying port 4310, stop it or start this project manually in a clean terminal."
    exit 1
}

# Check Frontend
$fePid = Get-ListenerPid $frontendPort
if ($fePid) {
    $cmd = Get-ProcessCommandLine $fePid
    if (IsProjectProcess $cmd $repoRoot) {
        Write-Host "Frontend already running (PID $fePid). Skipping start."
    } else {
        Write-Host "Port $frontendPort is in use by PID $fePid but not this project. Skipping start to avoid conflict."
    }
} else {
    Write-Host "Starting Desktop (renderer + electron) dev server in a new terminal..."
    Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location -LiteralPath '$repoRoot'; npm run dev:desktop" -WorkingDirectory $repoRoot
}

Write-Host "Done. Use the opened terminals to view logs."
