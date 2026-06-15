# DeskLock Windows Native Host Installer
# Runs without administrator privileges, modifying HKCU

$ErrorActionPreference = "Stop"

# Clear host and display a header
Clear-Host
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "       DESKLOCK NATIVE HOST INSTALLER        " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (!$scriptDir) {
    $scriptDir = Get-Location
}

# 1. Prompt and validate Chrome Extension ID
$extId = ""
while ($true) {
    Write-Host "Please enter your Chrome Extension ID." -ForegroundColor White
    Write-Host "You can find this on the chrome://extensions page after loading the extension." -ForegroundColor Gray
    $inputVal = (Read-Host "Extension ID").Trim().ToLower()
    
    if ($inputVal -match '^[a-p]{32}$') {
        $extId = $inputVal
        break
    } else {
        Write-Host "Invalid Chrome Extension ID. It must be exactly 32 letters (between 'a' and 'p')." -ForegroundColor Red
        Write-Host ""
    }
}

# 2. Write host JSON manifest file
$batPath = Join-Path $scriptDir "desklock_host.bat"
$escapedBatPath = $batPath.Replace('\', '\\')
$manifestPath = Join-Path $scriptDir "com.desklock.host.json"

$manifestContent = @"
{
  "name": "com.desklock.host",
  "description": "DeskLock PC Locker Native Host",
  "path": "$escapedBatPath",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://$extId/"
  ]
}
"@

try {
    Set-Content -Path $manifestPath -Value $manifestContent -Encoding Utf8
    Write-Host "Created Native Messaging manifest at: $manifestPath" -ForegroundColor Green
} catch {
    Write-Host "Failed to create manifest file: $_" -ForegroundColor Red
    Exit
}

# 3. Create Windows Registry Key
$registryKeyPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.desklock.host"

try {
    # New-Item -Force will create the registry path and set its default value
    $null = New-Item -Path $registryKeyPath -Value $manifestPath -Force
    Write-Host "Successfully registered native host in Windows Registry." -ForegroundColor Green
    Write-Host "Path: HKCU\Software\Google\Chrome\NativeMessagingHosts\com.desklock.host" -ForegroundColor Gray
} catch {
    Write-Host "Failed to register in Windows Registry: $_" -ForegroundColor Red
    Exit
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "       INSTALLATION COMPLETED SUCCESSFULLY    " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "You can now close and reopen your Chrome Extension popup." -ForegroundColor White
Write-Host "The host status should show as 'Connected'." -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit..."
