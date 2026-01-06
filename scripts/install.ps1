[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding  = [System.Text.Encoding]::UTF8
try { chcp 65001 | Out-Null } catch {}

$launcherUrl = "https://github.com/henrique-coder/correios-tools/releases/download/minified-scripts/launcher.min.ps1"
$iconUrl = "https://raw.githubusercontent.com/henrique-coder/correios-tools/refs/heads/dev/assets/icon.ico"

$baseDir = "C:\Users\Public\correios-tools"
$dataDir = "$baseDir\data"
$launcherPath = "$dataDir\launcher.ps1"
$iconPath = "$dataDir\icon.ico"

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

Clear-Host
[Console]::BackgroundColor = "Black"
[Console]::ForegroundColor = "White"
Clear-Host
Write-Host ">>> INSTALANDO CORREIOS TOOLS <<<" -ForegroundColor Cyan

$browsers = Get-Process -Name "msedge", "chrome" -ErrorAction SilentlyContinue
if ($browsers) {
    $result = [System.Windows.Forms.MessageBox]::Show(
        "Precisamos fechar o Chrome e o Edge para configurar o ambiente.`n`nPodemos fechar agora?",
        "Configuracao Correios Tools",
        [System.Windows.Forms.MessageBoxButtons]::YesNo,
        [System.Windows.Forms.MessageBoxIcon]::Question
    )

    if ($result -eq "Yes") {
        Stop-Process -Name "msedge", "chrome" -Force -ErrorAction SilentlyContinue
        Write-Host "[OK] Navegadores fechados." -ForegroundColor Green
    }
    else {
        Write-Warning "Instalacao cancelada pelo usuario."
        Exit
    }
}

if (!(Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
}

try {
    Write-Host "Baixando arquivos do sistema..." -ForegroundColor Yellow
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $launcherUrl -OutFile $launcherPath -UseBasicParsing
    Invoke-WebRequest -Uri $iconUrl -OutFile $iconPath -UseBasicParsing
    Write-Host "[OK] Arquivos do sistema baixados." -ForegroundColor Green
}
catch {
    [System.Windows.Forms.MessageBox]::Show(
        "Falha ao baixar arquivos. Verifique a conexao.",
        "Erro Fatal",
        "OK",
        "Error"
    )
    Exit
}

function New-Shortcut {
    param([string]$linkPath)

    try {
        $shell = New-Object -ComObject WScript.Shell
        $shortcut = $shell.CreateShortcut($linkPath)
        $shortcut.TargetPath = "powershell.exe"
        $shortcut.Arguments = "-NoLogo -ExecutionPolicy Bypass -WindowStyle Maximized -File `"$launcherPath`""
        $shortcut.IconLocation = $iconPath
        $shortcut.Description = "Correios Tools Launcher"
        $shortcut.Save()
        Write-Host "[OK] Atalho criado: $linkPath" -ForegroundColor Green
    }
    catch {
        Write-Error "Falha ao criar atalho em: $linkPath"
    }
}

New-Shortcut "$baseDir\Correios Tools.lnk"

$desktopPath = [Environment]::GetFolderPath("Desktop")
New-Shortcut "$desktopPath\Correios Tools.lnk"

Start-Process "explorer.exe" -ArgumentList $baseDir
[System.Windows.Forms.MessageBox]::Show(
    "Instalacao Concluida!`n`nOs atalhos foram criados na Area de Trabalho e na pasta publica.",
    "Sucesso",
    "OK",
    "Information"
)
