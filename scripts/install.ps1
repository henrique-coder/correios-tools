$UrlLauncher = "https://github.com/henrique-coder/correios-tools/releases/download/minified-scripts/launcher.min.ps1"
$UrlIcon = "https://raw.githubusercontent.com/henrique-coder/correios-tools/refs/heads/dev/assets/icon.ico"

$BaseDir = "C:\Users\Public\correios-tools"
$DataDir = "$BaseDir\data"
$LauncherPath = "$DataDir\launcher.ps1"
$IconPath = "$DataDir\icon.ico"

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
        "Configuração Correios Tools",
        [System.Windows.Forms.MessageBoxButtons]::YesNo,
        [System.Windows.Forms.MessageBoxIcon]::Question
    )

    if ($result -eq "Yes") {
        Stop-Process -Name "msedge", "chrome" -Force -ErrorAction SilentlyContinue
        Write-Host "[OK] Navegadores fechados." -ForegroundColor Green
    }
    else {
        Write-Warning "Instalação cancelada pelo usuário."
        Exit
    }
}

if (!(Test-Path $DataDir)) {
    New-Item -ItemType Directory -Path $DataDir -Force | Out-Null
}

try {
    Write-Host "Baixando arquivos do sistema..." -ForegroundColor Yellow
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $UrlLauncher -OutFile $LauncherPath -UseBasicParsing
    Invoke-WebRequest -Uri $UrlIcon -OutFile $IconPath -UseBasicParsing
    Write-Host "[OK] Arquivos do sistema baixados." -ForegroundColor Green
}
catch {
    [System.Windows.Forms.MessageBox]::Show(
        "Falha ao baixar arquivos. Verifique a conexão.",
        "Erro Fatal",
        "OK",
        "Error"
    )
    Exit
}

function New-Shortcut {
    param([string]$LinkPath)

    try {
        $shell = New-Object -ComObject WScript.Shell
        $shortcut = $shell.CreateShortcut($LinkPath)
        $shortcut.TargetPath = "powershell.exe"
        $shortcut.Arguments = "-NoLogo -ExecutionPolicy Bypass -WindowStyle Maximized -File `"$LauncherPath`""
        $shortcut.IconLocation = $IconPath
        $shortcut.Description = "Correios Tools Launcher"
        $shortcut.Save()
        Write-Host "[OK] Atalho criado: $LinkPath" -ForegroundColor Green
    }
    catch {
        Write-Error "Falha ao criar atalho em: $LinkPath"
    }
}

New-Shortcut "$BaseDir\Correios Tools.lnk"

$userDesktop = [Environment]::GetFolderPath("Desktop")
New-Shortcut "$userDesktop\Correios Tools.lnk"

Start-Process "explorer.exe" -ArgumentList $BaseDir
[System.Windows.Forms.MessageBox]::Show(
    "Instalação Concluída!`n`nOs atalhos foram criados na Área de Trabalho e na pasta pública.",
    "Sucesso",
    "OK",
    "Information"
)
