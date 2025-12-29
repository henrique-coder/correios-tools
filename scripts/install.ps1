$UrlLauncher = "https://github.com/henrique-coder/correios-tools/releases/download/minified-scripts/launcher.min.ps1"
$UrlIcon = "https://raw.githubusercontent.com/henrique-coder/correios-tools/refs/heads/dev/assets/icon.ico"

$DirBase = "C:\Users\Public\correios-tools"
$DirData = "$DirBase\data"
$LauncherLocal = "$DirData\launcher.ps1"
$IconLocal = "$DirData\icon.ico"

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

Clear-Host
[Console]::BackgroundColor = "Black"
[Console]::ForegroundColor = "White"
Clear-Host
Write-Host ">>> INSTALANDO CORREIOS TOOLS <<<" -ForegroundColor Cyan

$Browsers = Get-Process -Name "msedge", "chrome" -ErrorAction SilentlyContinue
if ($Browsers) {
    $Result = [System.Windows.Forms.MessageBox]::Show(
        "Precisamos fechar o Chrome e o Edge para configurar o ambiente.`n`nPodemos fechar agora?",
        "Configuracao Correios Tools",
        [System.Windows.Forms.MessageBoxButtons]::YesNo,
        [System.Windows.Forms.MessageBoxIcon]::Question
    )

    if ($Result -eq "Yes") {
        Stop-Process -Name "msedge", "chrome" -Force -ErrorAction SilentlyContinue
        Write-Host "[OK] Navegadores fechados." -ForegroundColor Green
    } else {
        Write-Warning "Instalacao cancelada pelo usuario."
        Exit
    }
}

if (!(Test-Path $DirData)) {
    New-Item -ItemType Directory -Path $DirData -Force | Out-Null
}

try {
    Write-Host "Baixando arquivos do sistema..." -ForegroundColor Yellow
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $UrlLauncher -OutFile $LauncherLocal -UseBasicParsing
    Invoke-WebRequest -Uri $UrlIcon -OutFile $IconLocal -UseBasicParsing
    Write-Host "[OK] Arquivos do sistema baixados." -ForegroundColor Green
} catch {
    [System.Windows.Forms.MessageBox]::Show("Falha ao baixar arquivos. Verifique a conexao.", "Erro Fatal", "OK", "Error")
    Exit
}

function Create-Shortcut {
    param([string]$LinkPath)

    try {
        $WshShell = New-Object -comObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut($LinkPath)
        $Shortcut.TargetPath = "powershell.exe"
        $Shortcut.Arguments = "-NoLogo -ExecutionPolicy Bypass -WindowStyle Maximized -File `"$LauncherLocal`""
        $Shortcut.IconLocation = $IconLocal
        $Shortcut.Description = "Correios Tools Launcher"
        $Shortcut.Save()
        Write-Host "[OK] Atalho criado: $LinkPath" -ForegroundColor Green
    } catch {
        Write-Error "Falha ao criar atalho em: $LinkPath"
    }
}

Create-Shortcut "$DirBase\Correios Tools.lnk"

$UserDesktop = [Environment]::GetFolderPath("Desktop")
Create-Shortcut "$UserDesktop\Correios Tools.lnk"

Start-Process "explorer.exe" -ArgumentList $DirBase
[System.Windows.Forms.MessageBox]::Show("Instalacao Concluida!`n`nOs atalhos foram criados na Area de Trabalho e na pasta publica.", "Sucesso", "OK", "Information")
