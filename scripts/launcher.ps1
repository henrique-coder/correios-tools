$mutexName = "Global\CorreiosToolsLauncher"
$mutex = New-Object System.Threading.Mutex($false, $mutexName)
if (-not $mutex.WaitOne(0, $false)) {
    Exit
}

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding  = [System.Text.Encoding]::UTF8
try { chcp 65001 | Out-Null } catch {}

$ExtensionUrls = @(
    "https://github.com/henrique-coder/correios-tools/releases/download/browser-extensions/sroweb_inducao.zip"
)

$ScriptUrls = @()

$SelfUpdateUrl = "https://github.com/henrique-coder/correios-tools/releases/download/minified-scripts/launcher.min.ps1"

$BaseDir = "C:\Users\Public\correios-tools"
$DataDir = "$BaseDir\data"
$ExtensionsDir = "$DataDir\extensions"
$ScriptsDir = "$DataDir\scripts"
$IconPath = "$DataDir\icon.ico"
$SelfPath = $MyInvocation.MyCommand.Path

[Console]::BackgroundColor = "Black"
[Console]::ForegroundColor = "White"
Clear-Host

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Get-SystemInfo {
    try {
        $osName = (Get-WmiObject Win32_OperatingSystem).Caption
        $totalRam = [math]::Round((Get-WmiObject Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 1)
        $ipObj = Get-WmiObject Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled -eq $true } | Select-Object -First 1
        $ipAddress = if ($ipObj) { $ipObj.IPAddress[0] } else { "N/A" }
        return @{ OS = $osName; RAM = "$totalRam GB"; IP = $ipAddress }
    } catch {
        return @{ OS = "N/A"; RAM = "N/A"; IP = "N/A" }
    }
}

function Show-Header {
    $sysInfo = Get-SystemInfo
    Clear-Host
    Write-Host ""
    Write-Host "                                                  " -BackgroundColor DarkBlue
    Write-Host "             CORREIOS TOOLS - GERENCIADOR         " -ForegroundColor White -BackgroundColor DarkBlue
    Write-Host "                                                  " -BackgroundColor DarkBlue
    Write-Host ""
    Write-Host "  Usuario: $env:USERNAME" -ForegroundColor Gray
    Write-Host "  Maquina: $env:COMPUTERNAME" -ForegroundColor Gray
    Write-Host "  Sistema: $($sysInfo.OS)" -ForegroundColor DarkGray
    Write-Host "  RAM:     $($sysInfo.RAM) | IP: $($sysInfo.IP)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  ----------------------------------------------  " -ForegroundColor DarkGray
    Write-Host ""
}

function Restore-Shortcuts {
    $shell = New-Object -ComObject WScript.Shell

    $shortcutPaths = @(
        "$BaseDir\Correios Tools.lnk",
        "$([Environment]::GetFolderPath("Desktop"))\Correios Tools.lnk"
    )

    foreach ($linkPath in $shortcutPaths) {
        if (!(Test-Path $linkPath)) {
            try {
                $shortcut = $shell.CreateShortcut($linkPath)
                $shortcut.TargetPath = "powershell.exe"
                $shortcut.Arguments = "-NoLogo -ExecutionPolicy Bypass -WindowStyle Maximized -File `"$SelfPath`""
                $shortcut.IconLocation = $IconPath
                $shortcut.Description = "Correios Tools Launcher"
                $shortcut.Save()
                Write-Host "  [+] Atalho restaurado: $linkPath" -ForegroundColor DarkGray
            }
            catch { }
        }
    }
}

function Update-Self {
    Write-Host "  [*] Verificando integridade do sistema..." -ForegroundColor Cyan
    $tempPath = "$DataDir\launcher_new.tmp"

    try {
        Invoke-WebRequest -Uri $SelfUpdateUrl -OutFile $tempPath -UseBasicParsing
        $newContent = Get-Content $tempPath -Raw
        $oldContent = Get-Content $SelfPath -Raw

        if ($newContent.Length -ne $oldContent.Length) {
            Write-Host "  [!] ATUALIZACAO ENCONTRADA. REINICIANDO..." -ForegroundColor Magenta
            Copy-Item $tempPath $SelfPath -Force
            Remove-Item $tempPath -Force
            Start-Process powershell.exe -ArgumentList "-ExecutionPolicy Bypass -WindowStyle Maximized -NoLogo -File `"$SelfPath`""
            Exit
        }
        Remove-Item $tempPath -Force
    }
    catch {
        Write-Warning "  [!] Falha na verificacao. Modo offline ativo."
    }
}

function Sync-Extensions {
    Write-Host "  [*] Sincronizando ferramentas de navegador..." -ForegroundColor Cyan

    if (Test-Path $ExtensionsDir) { Remove-Item $ExtensionsDir -Recurse -Force }
    New-Item -ItemType Directory -Path $ExtensionsDir -Force | Out-Null

    $count = 0
    foreach ($url in $ExtensionUrls) {
        $count++
        try {
            $fileName = [System.IO.Path]::GetFileNameWithoutExtension($url)
            if ([string]::IsNullOrWhiteSpace($fileName)) { $fileName = "Ext_$count" }

            $zipPath = "$DataDir\$fileName.zip"
            $destFolder = "$ExtensionsDir\$fileName"

            New-Item -ItemType Directory -Path $destFolder -Force | Out-Null

            Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
            Expand-Archive -Path $zipPath -DestinationPath $destFolder -Force
            Remove-Item $zipPath -Force
            Write-Host "  [+] Extensao instalada: $fileName" -ForegroundColor Green
        }
        catch {
            Write-Warning "  [!] Erro ao instalar extensao: $url"
        }
    }
}

function Invoke-RemoteScripts {
    if ($ScriptUrls.Count -eq 0) {
        if (Test-Path $ScriptsDir) { Remove-Item $ScriptsDir -Recurse -Force }
        return
    }

    Write-Host "  [*] Executando scripts de automacao..." -ForegroundColor Cyan

    if (Test-Path $ScriptsDir) { Remove-Item $ScriptsDir -Recurse -Force }
    New-Item -ItemType Directory -Path $ScriptsDir -Force | Out-Null

    foreach ($url in $ScriptUrls) {
        try {
            $fileName = [System.IO.Path]::GetFileName($url)
            $localPath = "$ScriptsDir\$fileName"

            Invoke-WebRequest -Uri $url -OutFile $localPath -UseBasicParsing

            Write-Host ""
            Write-Host "  ::::::::::::::::::::::::::::::::::::::::::::::::::" -ForegroundColor DarkGray
            Write-Host "    EXEC: $fileName" -ForegroundColor Yellow
            Write-Host "  ::::::::::::::::::::::::::::::::::::::::::::::::::" -ForegroundColor DarkGray

            & $localPath
        }
        catch {
            Write-Warning "  [!] Falha ao executar script: $url"
            Write-Warning "      Erro: $_"
        }
    }
    Write-Host ""
    Write-Host "  ----------------------------------------------  " -ForegroundColor DarkGray
}

function Get-ExtensionPaths {
    $paths = @()
    $dirs = Get-ChildItem -Path $ExtensionsDir -Directory -Recurse

    foreach ($dir in $dirs) {
        if (Test-Path "$($dir.FullName)\manifest.json") {
            $paths += $dir.FullName
        }
    }

    return ($paths -join ",")
}

function Set-BrowserRestoreSession {
    param([string]$BrowserName)

    $prefPath = ""
    if ($BrowserName -eq "Edge") {
        $prefPath = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Preferences"
    }
    elseif ($BrowserName -eq "Chrome") {
        $prefPath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Preferences"
    }

    if (Test-Path $prefPath) {
        try {
            $content = Get-Content $prefPath -Raw
            if ($content -notmatch '"restore_on_startup":1') {
                $newContent = $content -replace '"restore_on_startup":\d', '"restore_on_startup":1'
                if ($newContent -ne $content) {
                    Set-Content -Path $prefPath -Value $newContent -Encoding UTF8
                }
            }
        }
        catch { }
    }
}

function Start-BrowserWithExtensions {
    param (
        [string]$BrowserName,
        [string]$ProcessName,
        [string]$StartUrl,
        [string]$ExtensionArg
    )

    if ([string]::IsNullOrWhiteSpace($BrowserName)) { return }

    Write-Host "  >>> Reiniciando $BrowserName..." -ForegroundColor Yellow

    Stop-Process -Name $ProcessName -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1

    Set-BrowserRestoreSession -BrowserName $BrowserName

    $launchArgs = @(
        "--restore-last-session",
        "--no-first-run",
        "--no-default-browser-check",
        $StartUrl
    )

    if (-not [string]::IsNullOrWhiteSpace($ExtensionArg)) {
        $launchArgs += "--load-extension=`"$ExtensionArg`""
    }

    try {
        Start-Process $ProcessName -ArgumentList $launchArgs
        Write-Host "  [V] $BrowserName iniciado." -ForegroundColor Green
    }
    catch {
        Write-Warning "  [!] Nao foi possivel iniciar $BrowserName."
    }
}

Show-Header
Restore-Shortcuts
Update-Self

Write-Host "  [*] Preparando ambiente..." -ForegroundColor Cyan

Invoke-RemoteScripts

Sync-Extensions
$extensionArg = Get-ExtensionPaths

if ([string]::IsNullOrWhiteSpace($extensionArg)) {
    Write-Warning "  [!] Nenhuma extensao carregada."
}

$startUrl = "https://sroweb.correios.com.br/app/entregaexternaautomatica/lancamento/index.php"

while ($true) {
    Show-Header
    Write-Host "  SELECIONE O NAVEGADOR:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  [0] ABRIR TODOS (Edge + Chrome)" -ForegroundColor White
    Write-Host "  [1] Microsoft Edge" -ForegroundColor White
    Write-Host "  [2] Google Chrome" -ForegroundColor White
    Write-Host ""
    Write-Host "  [ENTER] Sair" -ForegroundColor DarkGray
    Write-Host ""

    $userInput = Read-Host "  > Opcao"

    if ($userInput -eq "") { Exit }

    if ($userInput -eq "0") {
        Start-BrowserWithExtensions -BrowserName "Edge" -ProcessName "msedge" -StartUrl $startUrl -ExtensionArg $extensionArg
        Start-Sleep -Seconds 2
        Start-BrowserWithExtensions -BrowserName "Chrome" -ProcessName "chrome" -StartUrl $startUrl -ExtensionArg $extensionArg
    }
    elseif ($userInput -eq "1") {
        Start-BrowserWithExtensions -BrowserName "Edge" -ProcessName "msedge" -StartUrl $startUrl -ExtensionArg $extensionArg
    }
    elseif ($userInput -eq "2") {
        Start-BrowserWithExtensions -BrowserName "Chrome" -ProcessName "chrome" -StartUrl $startUrl -ExtensionArg $extensionArg
    }
    else {
        continue
    }

    Write-Host ""
    Write-Host "  [!] Concluido. Aguardando proximo comando..." -ForegroundColor DarkGray
    Start-Sleep -Seconds 2
}
