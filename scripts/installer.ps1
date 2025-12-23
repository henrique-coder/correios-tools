$UrlLauncher = "https://github.com/henrique-coder/correios-tools/releases/download/minified-scripts/launcher.min.ps1"
$UrlIcon = "https://raw.githubusercontent.com/henrique-coder/correios-tools/refs/heads/dev/assets/icon.ico"

$DirPublic = "C:\Users\Public\correios-tools"
$LauncherLocal = "$DirPublic\launcher.ps1"
$IconLocal = "$DirPublic\icon.ico"

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

function Show-MsgBox ($Title, $Message, $Buttons) {
    return [System.Windows.Forms.MessageBox]::Show($Message, $Title, $Buttons, [System.Windows.Forms.MessageBoxIcon]::Question)
}

Clear-Host
Write-Host ">>> INSTALLING CORREIOS TOOLS <<<" -ForegroundColor Cyan

$Browsers = Get-Process -Name "msedge", "chrome" -ErrorAction SilentlyContinue
if ($Browsers) {
    $Resp = Show-MsgBox "Correios Tools Setup" "We need to close Chrome and Edge to configure the environment.`n`nCan we close them now?" "YesNo"

    if ($Resp -eq "Yes") {
        Stop-Process -Name "msedge", "chrome" -Force -ErrorAction SilentlyContinue
        Write-Host "[OK] Browsers closed." -ForegroundColor Green
    } else {
        Write-Warning "Installation cancelled by user."
        Exit
    }
}

if (!(Test-Path $DirPublic)) {
    New-Item -ItemType Directory -Path $DirPublic -Force | Out-Null
}

try {
    Write-Host "Downloading system files..." -ForegroundColor Yellow
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $UrlLauncher -OutFile $LauncherLocal -UseBasicParsing
    Invoke-WebRequest -Uri $UrlIcon -OutFile $IconLocal -UseBasicParsing
    Write-Host "[OK] System files downloaded." -ForegroundColor Green
} catch {
    [System.Windows.Forms.MessageBox]::Show("Failed to download system files. Check internet connection.", "Fatal Error", "OK", "Error")
    Exit
}

$PublicDesktop = "C:\Users\Public\Desktop"
$ShortcutPath = "$PublicDesktop\Correios Tools.lnk"

try {
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
    $Shortcut.TargetPath = "powershell.exe"
    $Shortcut.Arguments = "-ExecutionPolicy Bypass -WindowStyle Maximized -File `"$LauncherLocal`""
    $Shortcut.IconLocation = $IconLocal
    $Shortcut.Description = "Correios Tools Launcher"
    $Shortcut.Save()
    Write-Host "[OK] Public Shortcut created." -ForegroundColor Green
} catch {
    Write-Warning "Failed to create public shortcut. Creating for current user only..."
    $UserDesktop = [Environment]::GetFolderPath("Desktop")
    $ShortcutPath = "$UserDesktop\Correios Tools.lnk"
    $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
    $Shortcut.TargetPath = "powershell.exe"
    $Shortcut.Arguments = "-ExecutionPolicy Bypass -WindowStyle Maximized -File `"$LauncherLocal`""
    $Shortcut.IconLocation = $IconLocal
    $Shortcut.Save()
}

[System.Windows.Forms.MessageBox]::Show("Installation Successful!`n`nThe 'Correios Tools' icon is now on the Desktop.", "Success", "OK", "Information")
