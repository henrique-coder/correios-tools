$ExtensionUrls = @(
    "https://github.com/henrique-coder/correios-tools/releases/download/browser-extensions/sroweb_inducao.zip"
)

$UrlSelfUpdate = "https://github.com/henrique-coder/correios-tools/releases/download/minified-scripts/launcher.min.ps1"

$DirBase = "C:\Users\Public\correios-tools"
$DirData = "$DirBase\data"
$DirExtensions = "$DirData\extensions"
$SelfPath = $MyInvocation.MyCommand.Path

[Console]::BackgroundColor = "Black"
[Console]::ForegroundColor = "White"
Clear-Host

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Draw-Header {
    Clear-Host
    Write-Host ""
    Write-Host "                                                  " -BackgroundColor DarkBlue
    Write-Host "             CORREIOS TOOLS - GERENCIADOR         " -ForegroundColor White -BackgroundColor DarkBlue
    Write-Host "                                                  " -BackgroundColor DarkBlue
    Write-Host ""
    Write-Host "  Usuario: $env:USERNAME" -ForegroundColor Gray
    Write-Host "  Maquina: $env:COMPUTERNAME" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  ----------------------------------------------  " -ForegroundColor DarkGray
    Write-Host ""
}

function Check-SelfUpdate {
    Write-Host "  [*] Verificando integridade do sistema..." -ForegroundColor Cyan
    $TempSelf = "$DirData\launcher_new.tmp"
    try {
        Invoke-WebRequest -Uri $UrlSelfUpdate -OutFile $TempSelf -UseBasicParsing
        $ContentNew = Get-Content $TempSelf -Raw
        $ContentOld = Get-Content $SelfPath -Raw
        
        if ($ContentNew.Length -ne $ContentOld.Length) {
            Write-Host "  [!] ATUALIZACAO ENCONTRADA. REINICIANDO..." -ForegroundColor Magenta
            Copy-Item $TempSelf $SelfPath -Force
            Remove-Item $TempSelf -Force
            Start-Process powershell.exe -ArgumentList "-ExecutionPolicy Bypass -WindowStyle Maximized -NoLogo -File `"$SelfPath`""
            Exit
        }
        Remove-Item $TempSelf -Force
    } catch {
        Write-Warning "  [!] Falha na verificacao. Modo offline ativo."
    }
}

function Update-Extensions {
    Write-Host "  [*] Sincronizando ferramentas..." -ForegroundColor Cyan
    
    if (Test-Path $DirExtensions) { Remove-Item $DirExtensions -Recurse -Force }
    New-Item -ItemType Directory -Path $DirExtensions -Force | Out-Null
    
    $Count = 0
    foreach ($Url in $ExtensionUrls) {
        $Count++
        $ZipFile = "$DirData\temp_ext_$Count.zip"
        $DestFolder = "$DirExtensions\Ext_$Count"
        New-Item -ItemType Directory -Path $DestFolder -Force | Out-Null

        try {
            Invoke-WebRequest -Uri $Url -OutFile $ZipFile -UseBasicParsing
            Expand-Archive -Path $ZipFile -DestinationPath $DestFolder -Force
            Remove-Item $ZipFile -Force
            Write-Host "  [+] Pacote de ferramentas $Count instalado." -ForegroundColor Green
        } catch {
            Write-Warning "  [!] Erro ao instalar pacote $Count."
        }
    }
}

function Get-ExtensionString {
    $ExtPaths = @()
    $PotentialDirs = Get-ChildItem -Path $DirExtensions -Directory -Recurse
    
    foreach ($Dir in $PotentialDirs) {
        if (Test-Path "$($Dir.FullName)\manifest.json") {
            $ExtPaths += $Dir.FullName
        }
    }
    return ($ExtPaths -join ",")
}

function Configure-BrowserPrefs {
    param([string]$BrowserName)
    
    $PrefPath = ""
    if ($BrowserName -eq "Edge") {
        $PrefPath = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Preferences"
    } elseif ($BrowserName -eq "Chrome") {
        $PrefPath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Preferences"
    }

    if (Test-Path $PrefPath) {
        try {
            $Content = Get-Content $PrefPath -Raw
            if ($Content -notmatch '"restore_on_startup":1') {
                Write-Host "  [*] Configurando sessao do $BrowserName..." -ForegroundColor Yellow
                $NewContent = $Content -replace '"restore_on_startup":\d', '"restore_on_startup":1'
                if ($NewContent -ne $Content) {
                    Set-Content -Path $PrefPath -Value $NewContent -Encoding UTF8
                }
            }
        } catch {}
    }
}

function Restart-And-Launch {
    param (
        [string]$BrowserName,
        [string]$ProcessName,
        [string]$StartUrl,
        [string]$LoadExtArg
    )

    if ([string]::IsNullOrWhiteSpace($BrowserName) -or [string]::IsNullOrWhiteSpace($ProcessName)) {
        return
    }

    Write-Host "  >>> Reiniciando $BrowserName para aplicar ferramentas..." -ForegroundColor Yellow
    
    Stop-Process -Name $ProcessName -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    
    Configure-BrowserPrefs -BrowserName $BrowserName

    $ArgsList = @(
        "--restore-last-session",
        "--no-first-run",
        "--no-default-browser-check",
        $StartUrl
    )

    if (-not [string]::IsNullOrWhiteSpace($LoadExtArg)) {
        $ArgsList += "--load-extension=`"$LoadExtArg`""
    }

    try {
        Start-Process $ProcessName -ArgumentList $ArgsList
        Write-Host "  [V] $BrowserName iniciado." -ForegroundColor Green
    } catch {
        Write-Warning "  [!] Nao foi possivel iniciar $BrowserName."
    }
}

Draw-Header
Check-SelfUpdate

Write-Host "  [*] Preparando ambiente..." -ForegroundColor Cyan
Update-Extensions
$LoadExtArg = Get-ExtensionString

if ([string]::IsNullOrWhiteSpace($LoadExtArg)) {
    Write-Warning "  [!] Nenhuma ferramenta carregada."
}

$StartUrl = "https://sroweb.correios.com.br/app/entregaexternaautomatica/lancamento/index.php"

while ($true) {
    Draw-Header
    Write-Host "  SELECIONE O NAVEGADOR:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  [0] ABRIR TODOS (Edge + Chrome)" -ForegroundColor White
    Write-Host "  [1] Microsoft Edge" -ForegroundColor White
    Write-Host "  [2] Google Chrome" -ForegroundColor White
    Write-Host ""
    Write-Host "  [ENTER] Sair" -ForegroundColor DarkGray
    Write-Host ""
    
    $InputUser = Read-Host "  > Opcao"

    if ($InputUser -eq "") { Exit }

    if ($InputUser -eq "0") {
        Restart-And-Launch -BrowserName "Edge" -ProcessName "msedge" -StartUrl $StartUrl -LoadExtArg $LoadExtArg
        Start-Sleep -Seconds 2
        Restart-And-Launch -BrowserName "Chrome" -ProcessName "chrome" -StartUrl $StartUrl -LoadExtArg $LoadExtArg
    } elseif ($InputUser -eq "1") { 
        Restart-And-Launch -BrowserName "Edge" -ProcessName "msedge" -StartUrl $StartUrl -LoadExtArg $LoadExtArg
    } elseif ($InputUser -eq "2") { 
        Restart-And-Launch -BrowserName "Chrome" -ProcessName "chrome" -StartUrl $StartUrl -LoadExtArg $LoadExtArg
    } else {
        continue
    }
    
    Write-Host ""
    Write-Host "  [!] Concluido. Aguardando proximo comando..." -ForegroundColor DarkGray
    Start-Sleep -Seconds 2
}
