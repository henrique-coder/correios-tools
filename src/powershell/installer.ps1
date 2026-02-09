$ErrorActionPreference = "SilentlyContinue"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$LogPath = "$([Environment]::GetFolderPath('Desktop'))\correiostools_install.log"
"$(Get-Date) - Iniciando instalacao..." | Out-File $LogPath

$BaseUrl = "https://github.com/henrique-coder/correios-tools/releases/download/assets"
$InstallDir = "C:\Users\Public\correios-tools"
$LauncherPath = "$InstallDir\data\launcher.ps1"
$IconPath = "$InstallDir\resources\assets\icon.ico"

"$(Get-Date) - Fechando navegadores..." | Out-File -Append $LogPath
Stop-Process -Name "msedge" -Force
Stop-Process -Name "chrome" -Force
Start-Sleep -Seconds 1

if (Test-Path $InstallDir) {
    "$(Get-Date) - Removendo versao antiga..." | Out-File -Append $LogPath
    Remove-Item -Path $InstallDir -Recurse -Force
}

"$(Get-Date) - Criando diretorios..." | Out-File -Append $LogPath
New-Item -ItemType Directory -Path "$InstallDir\data" -Force | Out-Null
New-Item -ItemType Directory -Path "$InstallDir\resources\assets" -Force | Out-Null

try {
    "$(Get-Date) - Baixando arquivos..." | Out-File -Append $LogPath
    Invoke-WebRequest -Uri "$BaseUrl/script-launcher.ps1" -OutFile $LauncherPath -UseBasicParsing
    Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/gh/henrique-coder/correios-tools/resources/assets/app/icon.ico" -OutFile $IconPath -UseBasicParsing
} catch {
    "$(Get-Date) - ERRO DE REDE: $($_.Exception.Message)" | Out-File -Append $LogPath
    exit
}

"$(Get-Date) - Criando atalhos..." | Out-File -Append $LogPath
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$([Environment]::GetFolderPath('Desktop'))\Correios Tools.lnk")
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$LauncherPath`""
$Shortcut.IconLocation = $IconPath
$Shortcut.Description = "Correios Tools Launcher"
$Shortcut.Save()

"$(Get-Date) - Abrindo pasta..." | Out-File -Append $LogPath
Start-Process "explorer.exe" -ArgumentList $InstallDir
