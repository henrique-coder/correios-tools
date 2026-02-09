$ErrorActionPreference = "SilentlyContinue"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$BaseUrl = "https://github.com/henrique-coder/correios-tools/releases/download/assets"
$InstallDir = "C:\Users\Public\correios-tools"
$LauncherPath = "$InstallDir\data\launcher.ps1"
$IconPath = "$InstallDir\resources\assets\icon.ico"

Stop-Process -Name "msedge" -Force
Stop-Process -Name "chrome" -Force
Start-Sleep -Seconds 1

if (Test-Path $InstallDir) {
    Remove-Item -Path $InstallDir -Recurse -Force
}

New-Item -ItemType Directory -Path "$InstallDir\data" -Force | Out-Null
New-Item -ItemType Directory -Path "$InstallDir\resources\assets" -Force | Out-Null

try {
    Invoke-WebRequest -Uri "$BaseUrl/script-launcher.ps1" -OutFile $LauncherPath -UseBasicParsing
    Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/gh/henrique-coder/correios-tools/resources/assets/app/icon.ico" -OutFile $IconPath -UseBasicParsing
} catch {
    exit
}

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$([Environment]::GetFolderPath('Desktop'))\Correios Tools.lnk")
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$LauncherPath`""
$Shortcut.IconLocation = $IconPath
$Shortcut.Description = "Correios Tools Launcher"
$Shortcut.Save()

Start-Process "explorer.exe" -ArgumentList $InstallDir
