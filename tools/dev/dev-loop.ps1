[CmdletBinding()]
param(
  [int]$Port = 0,
  [switch]$WatchTests,
  [switch]$WatchBuild,
  [switch]$OpenSample,
  [switch]$DebugMcp,
  [switch]$Stop
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-RepoRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

function Get-StatePath {
  return (Join-Path $env:TEMP "kern-ux-mcp-dev-loop-state.json")
}

function Get-AvailablePort {
  param([int[]]$Candidates)

  foreach ($candidate in $Candidates) {
    $listener = $null
    try {
      $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $candidate)
      $listener.Start()
      return $candidate
    }
    catch {
      continue
    }
    finally {
      if ($null -ne $listener) {
        $listener.Stop()
      }
    }
  }

  throw "No free port found in candidate list: $($Candidates -join ', ')"
}

function Start-LoopProcess {
  param(
    [string]$Title,
    [string]$Command
  )

  $argList = @(
    "-NoLogo",
    "-NoExit",
    "-Command",
    $Command
  )

  Write-Host "Starting $Title..."
  return Start-Process -FilePath "pwsh" -ArgumentList $argList -PassThru
}

function Stop-LoopProcess {
  param(
    [int]$ProcessId,
    [string]$Name
  )

  if ($ProcessId -le 0) {
    return
  }

  $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
  if ($null -eq $process) {
    Write-Host "$Name already stopped."
    return
  }

  Stop-Process -Id $ProcessId -Force
  Write-Host "Stopped $Name (PID $ProcessId)."
}

$repoRoot = Get-RepoRoot
$statePath = Get-StatePath

if ($Stop) {
  if (Test-Path $statePath) {
    $state = Get-Content $statePath -Raw | ConvertFrom-Json
    Stop-LoopProcess -ProcessId ([int]$state.samplePid) -Name "sample server"
    Stop-LoopProcess -ProcessId ([int]$state.testPid) -Name "test watcher"
    Stop-LoopProcess -ProcessId ([int]$state.buildPid) -Name "build watcher"
    Remove-Item $statePath -Force
    Write-Host "Dev loop stopped."
  }
  else {
    Write-Host "No dev loop state file found at $statePath"
  }

  return
}

if (Test-Path $statePath) {
  $existing = Get-Content $statePath -Raw | ConvertFrom-Json
  $live = @()

  foreach ($processId in @([int]$existing.samplePid, [int]$existing.testPid, [int]$existing.buildPid)) {
    if ($processId -gt 0 -and (Get-Process -Id $processId -ErrorAction SilentlyContinue)) {
      $live += $processId
    }
  }

  if ($live.Count -gt 0) {
    throw "A dev loop appears to be running (PID(s): $($live -join ', ')). Run: npm run loop:stop"
  }

  Remove-Item $statePath -Force
}

if ($Port -le 0) {
  $Port = Get-AvailablePort -Candidates (3000..3010)
}

$sampleCommand = "Set-Location '$repoRoot'; `$env:PORT='$Port'; npm run sample:dev"
$sampleProc = Start-LoopProcess -Title "sample app on http://localhost:$Port" -Command $sampleCommand

$testProc = $null
if ($WatchTests) {
  $testProc = Start-LoopProcess -Title "vitest watcher" -Command "Set-Location '$repoRoot'; npm run test:watch"
}

$buildProc = $null
if ($WatchBuild) {
  $buildProc = Start-LoopProcess -Title "TypeScript build watcher" -Command "Set-Location '$repoRoot'; npm run build:watch"
}

if ($OpenSample) {
  Start-Process -FilePath "code" -ArgumentList (Join-Path $repoRoot "samples/basic-layout") | Out-Null
  Write-Host "Opened samples/basic-layout in VS Code."
}

$state = [ordered]@{
  startedAt = (Get-Date).ToString("o")
  samplePid = $sampleProc.Id
  testPid = if ($null -ne $testProc) { $testProc.Id } else { 0 }
  buildPid = if ($null -ne $buildProc) { $buildProc.Id } else { 0 }
  port = $Port
}

$state | ConvertTo-Json | Set-Content -Path $statePath -Encoding UTF8

Write-Host ""
Write-Host "Dev loop started."
Write-Host "Sample app: http://localhost:$Port"
Write-Host "Stop loop: npm run loop:stop"
Write-Host ""
Write-Host "MCP testing steps:"
Write-Host "1) Open samples/basic-layout in a second VS Code instance."
Write-Host "2) In that instance, restart the kern-ux MCP server after code changes."
if ($DebugMcp) {
  Write-Host "3) Set KERN_DEBUG=1 in samples/basic-layout/.vscode/mcp.json for verbose stderr logs."
}
Write-Host "4) Use Output > MCP (kern-ux) to inspect tool inputs and outputs."
