$ExtensionUrls = @(
    "https://github.com/henrique-coder/correios-tools/releases/download/browser-extensions/sroweb_inducao.zip"
)

$UrlSelfUpdate = "https://github.com/henrique-coder/correios-tools/releases/download/minified-scripts/launcher.min.ps1"

$DirBase = "C:\Users\Public\correios-tools"
$DirData = "$DirBase\data"
$DirExtensions = "$DirData\extensions"
$SelfPath = $MyInvocation.MyCommand.Path

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Draw-Header {
    Clear-Host
    Write-Host ""
    Write-Host "  ##################################################  " -ForegroundColor DarkBlue -BackgroundColor Cyan
    Write-Host "             CORREIOS TOOLS - CDD LAUNCHER            " -ForegroundColor White -BackgroundColor DarkBlue
    Write-Host "  ##################################################  " -ForegroundColor DarkBlue -BackgroundColor Cyan
    Write-Host ""
    Write-Host "  [ User: $env:USERNAME ]" -ForegroundColor Gray
    Write-Host ""
}

function Check-SelfUpdate {
    Write-Host "  [*] Checking for system updates..." -ForegroundColor Cyan
    $TempSelf = "$DirData\launcher_new.tmp"
    try {
        Invoke-WebRequest -Uri $UrlSelfUpdate -OutFile $TempSelf -UseBasicParsing
        $ContentNew = Get-Content $TempSelf -Raw
        $ContentOld = Get-Content $SelfPath -Raw
        
        if ($ContentNew.Length -ne $ContentOld.Length) {
            Write-Host "  [!] SYSTEM UPDATE FOUND! RESTARTING..." -ForegroundColor Magenta
            Copy-Item $TempSelf $SelfPath -Force
            Remove-Item $TempSelf -Force
            Start-Process powershell.exe -ArgumentList "-ExecutionPolicy Bypass -WindowStyle Maximized -File `"$SelfPath`""
            Exit
        }
        Remove-Item $TempSelf -Force
    } catch {
        Write-Warning "  [!] Update check failed. Using local version."
    }
}

function Update-Extensions {
    Write-Host "  [*] Synchronizing tools..." -ForegroundColor Cyan
    
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
            Write-Host "  [+] Tool $Count ready." -ForegroundColor Green
        } catch {
            Write-Warning "  [!] Failed to download Tool $Count."
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

function Configure-BrowserPrefs ($BrowserName) {
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
                Write-Host "  [*] Configuring $BrowserName preferences..." -ForegroundColor Yellow
                $NewContent = $Content -replace '"restore_on_startup":\d', '"restore_on_startup":1'
                if ($NewContent -ne $Content) {
                    Set-Content -Path $PrefPath -Value $NewContent -Encoding UTF8
                }
            }
        } catch {}
    }
}

Draw-Header
Check-SelfUpdate

Write-Host "  [*] Preparing environment (Closing Browsers)..." -ForegroundColor Cyan
Stop-Process -Name "msedge", "chrome" -ErrorAction SilentlyContinue -Force

Update-Extensions
$LoadExtArg = Get-ExtensionString

if ([string]::IsNullOrWhiteSpace($LoadExtArg)) {
    Write-Warning "  [!] No valid tools found."
}

$StartUrl = "https://sroweb.correios.com.br/app/entregaexternaautomatica/lancamento/index.php"

while ($true) {
    Draw-Header
    Write-Host "  SELECT BROWSER TO START:" -ForegroundColor Yellow
    Write-Host "  ------------------------" -ForegroundColor Gray
    Write-Host "  [1] Microsoft Edge" -ForegroundColor White
    Write-Host "  [2] Google Chrome" -ForegroundColor White
    Write-Host ""
    Write-Host "  [ENTER] Exit" -ForegroundColor Gray
    Write-Host ""
    
    $InputUser = Read-Host "  > Select Option"

    if ($InputUser -eq "") { Exit }

    $BrowserBin = ""
    $BrowserName = ""

    if ($InputUser -eq "1") { 
        $BrowserBin = "msedge"
        $BrowserName = "Edge"
    } elseif ($InputUser -eq "2") { 
        $BrowserBin = "chrome"
        $BrowserName = "Chrome"
    } else {
        continue
    }

    Write-Host ""
    Write-Host "  >>> Launching $BrowserName..." -ForegroundColor Green
    Configure-BrowserPrefs $BrowserName

    $ArgsList = @(
        "--restore-last-session",
        "--no-first-run",
        "--no-default-browser-check",
        $StartUrl
    )

    if (-not [string]::IsNullOrWhiteSpace($LoadExtArg)) {
        $ArgsList += "--load-extension=`"$LoadExtArg`""
    }

    Start-Process $BrowserBin -ArgumentList $ArgsList
    
    Write-Host ""
    Write-Host "  [V] Browser running. Starting new cycle..." -ForegroundColor DarkGray
    Start-Sleep -Seconds 2
}
