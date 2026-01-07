$mutexName = "Global\CorreiosToolsLauncher"
$mutex = New-Object System.Threading.Mutex($false, $mutexName)
if (-not $mutex.WaitOne(0, $false)) {
    Exit
}

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding  = [System.Text.Encoding]::UTF8
try { chcp 65001 | Out-Null } catch {}

$extensionUrls = @(
    "https://github.com/henrique-coder/correios-tools/releases/download/browser-extensions/sroweb_inducao.zip"
)

$scriptUrls = @()

$selfUpdateUrl = "https://github.com/henrique-coder/correios-tools/releases/download/minified-scripts/launcher.min.ps1"

$baseDir = "C:\Users\Public\correios-tools"
$dataDir = "$baseDir\data"
$extensionsDir = "$dataDir\extensions"
$scriptsDir = "$dataDir\scripts"
$iconPath = "$dataDir\icon.ico"
$selfPath = $MyInvocation.MyCommand.Path

$startUrl = "https://sroweb.correios.com.br/app/entregaexternaautomatica/lancamento/index.php"

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
        "$baseDir\Correios Tools.lnk",
        "$([Environment]::GetFolderPath("Desktop"))\Correios Tools.lnk"
    )

    foreach ($linkPath in $shortcutPaths) {
        if (!(Test-Path $linkPath)) {
            try {
                $shortcut = $shell.CreateShortcut($linkPath)
                $shortcut.TargetPath = "powershell.exe"
                $shortcut.Arguments = "-NoLogo -ExecutionPolicy Bypass -WindowStyle Maximized -File `"$selfPath`""
                $shortcut.IconLocation = $iconPath
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
    $tempPath = "$dataDir\launcher_new.tmp"

    try {
        Invoke-WebRequest -Uri $selfUpdateUrl -OutFile $tempPath -UseBasicParsing
        $newContent = Get-Content $tempPath -Raw
        $oldContent = Get-Content $selfPath -Raw

        if ($newContent.Length -ne $oldContent.Length) {
            Write-Host "  [!] ATUALIZACAO ENCONTRADA. REINICIANDO..." -ForegroundColor Magenta
            Copy-Item $tempPath $selfPath -Force
            Remove-Item $tempPath -Force
            Start-Process powershell.exe -ArgumentList "-ExecutionPolicy Bypass -WindowStyle Maximized -NoLogo -File `"$selfPath`""
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

    if (Test-Path $extensionsDir) { Remove-Item $extensionsDir -Recurse -Force }
    New-Item -ItemType Directory -Path $extensionsDir -Force | Out-Null

    $count = 0
    foreach ($url in $extensionUrls) {
        $count++
        try {
            $fileName = [System.IO.Path]::GetFileNameWithoutExtension($url)
            if ([string]::IsNullOrWhiteSpace($fileName)) { $fileName = "Ext_$count" }

            $zipPath = "$dataDir\$fileName.zip"
            $destFolder = "$extensionsDir\$fileName"

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
    if ($scriptUrls.Count -eq 0) {
        if (Test-Path $scriptsDir) { Remove-Item $scriptsDir -Recurse -Force }
        return
    }

    Write-Host "  [*] Executando scripts de automacao..." -ForegroundColor Cyan

    if (Test-Path $scriptsDir) { Remove-Item $scriptsDir -Recurse -Force }
    New-Item -ItemType Directory -Path $scriptsDir -Force | Out-Null

    foreach ($url in $scriptUrls) {
        try {
            $fileName = [System.IO.Path]::GetFileName($url)
            $localPath = "$scriptsDir\$fileName"

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
    $dirs = Get-ChildItem -Path $extensionsDir -Directory -Recurse

    foreach ($dir in $dirs) {
        if (Test-Path "$($dir.FullName)\manifest.json") {
            $paths += $dir.FullName
        }
    }

    return ($paths -join ",")
}

function Set-BrowserRestoreSession {
    param([string]$browserName)

    $prefPath = ""
    if ($browserName -eq "Edge") {
        $prefPath = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Preferences"
    }
    elseif ($browserName -eq "Chrome") {
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
        [string]$browserName,
        [string]$processName,
        [string]$targetUrl,
        [string]$extensionArg
    )

    if ([string]::IsNullOrWhiteSpace($browserName)) { return }

    Write-Host "  >>> Reiniciando $browserName..." -ForegroundColor Yellow

    Stop-Process -Name $processName -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1

    Set-BrowserRestoreSession -browserName $browserName

    $launchArgs = @(
        "--restore-last-session",
        "--no-first-run",
        "--no-default-browser-check",
        $targetUrl
    )

    if (-not [string]::IsNullOrWhiteSpace($extensionArg)) {
        $launchArgs += "--load-extension=`"$extensionArg`""
    }

    try {
        Start-Process $processName -ArgumentList $launchArgs
        Write-Host "  [V] $browserName iniciado." -ForegroundColor Green
    }
    catch {
        Write-Warning "  [!] Nao foi possivel iniciar $browserName."
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
        Start-BrowserWithExtensions -browserName "Edge" -processName "msedge" -targetUrl $startUrl -extensionArg $extensionArg
        Start-Sleep -Seconds 2
        Start-BrowserWithExtensions -browserName "Chrome" -processName "chrome" -targetUrl $startUrl -extensionArg $extensionArg
    }
    elseif ($userInput -eq "1") {
        Start-BrowserWithExtensions -browserName "Edge" -processName "msedge" -targetUrl $startUrl -extensionArg $extensionArg
    }
    elseif ($userInput -eq "2") {
        Start-BrowserWithExtensions -browserName "Chrome" -processName "chrome" -targetUrl $startUrl -extensionArg $extensionArg
    }
    else {
        continue
    }

    Write-Host ""
    Write-Host "  [!] Concluido. Aguardando proximo comando..." -ForegroundColor DarkGray
    Start-Sleep -Seconds 2
}
