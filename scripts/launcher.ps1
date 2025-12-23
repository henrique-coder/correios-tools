$ErrorActionPreference = "SilentlyContinue"
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$Config = @{
    SelfUrl     = "https://gist.githubusercontent.com/henrique-coder/4d48fc80e4666d777898e6b0de7f1ecf/raw/sroweb_launcher.txt"
    ZipUrl      = "https://gist.github.com/henrique-coder/5d93b4328de36b0c29726b44a2011185/archive/dev.zip"
    IconIcoUrl  = "https://files.catbox.moe/vwlx26.ico"
    LauncherDir = "$env:LOCALAPPDATA\SROWEB_LAUNCHER"
    ExtDir      = "$env:TEMP\SRO_Web_Extension_v2"
    TargetUrl   = "https://sroweb.correios.com.br/app/entregaexternaautomatica/lancamento/index.php"
}

$Paths = @{
    Script       = Join-Path $Config.LauncherDir "Launcher.ps1"
    ShortcutIcon = Join-Path $Config.LauncherDir "icon.ico"
}

function Msg { param($T, $C="Cyan") Write-Host "[SRO] $T" -ForegroundColor $C }

Clear-Host
Msg "INICIANDO..." "Green"

if (-not (Test-Path $Config.LauncherDir)) { New-Item -Path $Config.LauncherDir -ItemType Directory -Force | Out-Null }

try {
    $OnlineScript = (Invoke-WebRequest -Uri $Config.SelfUrl -UseBasicParsing).Content
    if ($OnlineScript) {
        [IO.File]::WriteAllText($Paths.Script, $OnlineScript, [System.Text.Encoding]::UTF8)
    }
} catch {
    if (-not (Test-Path $Paths.Script) -and $MyInvocation.MyCommand.Path) {
        Copy-Item $MyInvocation.MyCommand.Path -Destination $Paths.Script -Force
    }
}

try {
    Msg "BAIXANDO EXTENSAO..." "Yellow"

    if (Test-Path $Config.ExtDir) { Remove-Item $Config.ExtDir -Recurse -Force }
    New-Item -Path $Config.ExtDir -ItemType Directory -Force | Out-Null

    $ZipPath = "$env:TEMP\sro_update.zip"
    $TempExtract = "$env:TEMP\sro_extract_temp"

    if (Test-Path $TempExtract) { Remove-Item $TempExtract -Recurse -Force }

    Invoke-WebRequest -Uri $Config.ZipUrl -OutFile $ZipPath -UseBasicParsing

    Expand-Archive -LiteralPath $ZipPath -DestinationPath $TempExtract -Force

    $InnerFolder = Get-ChildItem $TempExtract -Directory | Select-Object -First 1

    if ($InnerFolder) {
        Copy-Item -Path "$($InnerFolder.FullName)\*" -Destination $Config.ExtDir -Recurse -Force
    } else {
        Copy-Item -Path "$TempExtract\*" -Destination $Config.ExtDir -Recurse -Force
    }

    Remove-Item $ZipPath -Force
    Remove-Item $TempExtract -Recurse -Force

    Msg "ATUALIZACAO CONCLUIDA." "Green"
} catch {
    Msg "FALHA NO DOWNLOAD. TENTANDO VERSAO LOCAL..." "Red"
}

try { Invoke-WebRequest -Uri $Config.IconIcoUrl -OutFile $Paths.ShortcutIcon -UseBasicParsing } catch {}

Write-Host "`n--- SELECIONE O NAVEGADOR ---" -ForegroundColor Cyan
Write-Host "[1] Google Chrome"
Write-Host "[2] Microsoft Edge"
$Opt = Read-Host "Opcao"

$Browser = if ($Opt -eq "2") { "msedge" } else { "chrome" }
$Exe = if ($Browser -eq "chrome") { "$env:ProgramFiles\Google\Chrome\Application\chrome.exe" } else { "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe" }

if (-not (Test-Path $Exe)) {
     $Exe = if ($Browser -eq "chrome") { "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe" } else { "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe" }
}

Msg "CONFIGURANDO..." "Yellow"
Stop-Process -Name $Browser -ErrorAction SilentlyContinue -Force
Start-Sleep -Seconds 1

$Roots = @()
if ($Browser -eq "chrome") { $Roots += "$env:LOCALAPPDATA\Google\Chrome\User Data" }
if ($Browser -eq "msedge") { $Roots += "$env:LOCALAPPDATA\Microsoft\Edge\User Data" }

foreach ($R in $Roots) {
    if (Test-Path $R) {
        Get-ChildItem $R -Directory | ForEach-Object {
            $P = Join-Path $_.FullName "Preferences"
            if (Test-Path $P) {
                try {
                    $Txt = [IO.File]::ReadAllText($P)
                    $NeedsSave = $false
                    $J = $Txt | ConvertFrom-Json

                    if (-not $J.extensions.ui.developer_mode) {
                        if (!$J.extensions.ui) { $J.extensions | Add-Member "ui" @{developer_mode=$true} -MemberType NoteProperty -Force }
                        else { $J.extensions.ui.developer_mode = $true }
                        $NeedsSave = $true
                    }

                    if ($J.session.restore_on_startup -ne 1) {
                         if (!$J.session) { $J | Add-Member "session" @{restore_on_startup=1} -MemberType NoteProperty -Force }
                         else { $J.session.restore_on_startup = 1 }
                         $NeedsSave = $true
                    }

                    if ($NeedsSave) {
                        [IO.File]::WriteAllText($P, ($J | ConvertTo-Json -Depth 99 -Compress), (New-Object System.Text.UTF8Encoding($false)))
                    }
                } catch {}
            }
        }
    }
}

$IsLaunch = $args -contains "-Launch"
$LnkName = "SRO Web - Operacional (Indução).lnk"
$LnkPath = Join-Path ([Environment]::GetFolderPath("Desktop")) $LnkName

$Wsh = New-Object -ComObject WScript.Shell
$S = $Wsh.CreateShortcut($LnkPath)
$S.TargetPath = "powershell.exe"
$S.Arguments = "-ExecutionPolicy Bypass -File `"$($Paths.Script)`" -Launch"
if (Test-Path $Paths.ShortcutIcon) { $S.IconLocation = $Paths.ShortcutIcon }
elseif ($Browser -eq "chrome") { $S.IconLocation = "$Exe,0" }
$S.Save()

if (-not $IsLaunch) { Msg "ATALHO CRIADO." "Green" }

Msg "ABRINDO SRO WEB..." "Green"
Start-Process $Exe "--load-extension=`"$($Config.ExtDir)`" `"$($Config.TargetUrl)`""