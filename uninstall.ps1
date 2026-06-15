# DeskLock Windows Native Host Uninstaller
# Cleans up registry changes and configuration files

$ErrorActionPreference = "SilentlyContinue"

Clear-Host
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "       DESKLOCK NATIVE HOST UNINSTALLER      " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (!$scriptDir) {
    $scriptDir = Get-Location
}

# 1. Remove Registry Key
$registryKeyPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.desklock.host"

if (Test-Path $registryKeyPath) {
    try {
        Remove-Item -Path $registryKeyPath -Recurse -Force -ErrorAction Stop
        Write-Host "Successfully removed Windows Registry key." -ForegroundColor Green
    } catch {
        Write-Host "Failed to remove registry key: $_" -ForegroundColor Red
    }
} else {
    Write-Host "Registry key not found, skipping." -ForegroundColor Gray
}

# 2. Delete generated JSON manifest
$manifestPath = Join-Path $scriptDir "com.desklock.host.json"

if (Test-Path $manifestPath) {
    try {
        Remove-Item -Path $manifestPath -Force -ErrorAction Stop
        Write-Host "Successfully deleted Native Messaging manifest file." -ForegroundColor Green
    } catch {
        Write-Host "Failed to delete manifest file: $_" -ForegroundColor Red
    }
} else {
    Write-Host "Manifest file not found, skipping." -ForegroundColor Gray
}

# 3. Delete log file if present
$logPath = Join-Path $scriptDir "host_debug.log"
if (Test-Path $logPath) {
    try {
        Remove-Item -Path $logPath -Force
        Write-Host "Successfully deleted host debug logs." -ForegroundColor Green
    } catch {}
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "       UNINSTALL COMPLETED SUCCESSFULLY       " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit..."
