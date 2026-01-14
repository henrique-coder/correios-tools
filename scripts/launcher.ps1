$mutexName = "Global\CorreiosToolsLauncherUI"
$mutex = New-Object System.Threading.Mutex($false, $mutexName)
if (-not $mutex.WaitOne(0, $false)) { Exit }

Add-Type -MemberDefinition @"
[DllImport("user32.dll")]
public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
"@ -Name Win32 -Namespace Native -PassThru | Out-Null

$windowHandle = (Get-Process -Id $PID).MainWindowHandle
if ($windowHandle -ne [IntPtr]::Zero) { [Native.Win32]::ShowWindowAsync($windowHandle, 0) | Out-Null }

Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$script:isProcessing = $false
$script:updateCheckTimer = $null

$baseDir = "C:\Users\Public\correios-tools"
$dataDir = "$baseDir\data"
$extensionsDir = "$dataDir\extensions"
$scriptsDir = "$dataDir\scripts"
$assetsDir = "$dataDir\assets"
$hashesFile = "$dataDir\hashes.json"
$selfPath = $MyInvocation.MyCommand.Path

$iconUrl = "https://raw.githubusercontent.com/henrique-coder/correios-tools/refs/heads/main/assets/icon.ico"
$iconPath = "$dataDir\icon.ico"
$edgeIconUrl = "https://raw.githubusercontent.com/henrique-coder/correios-tools/refs/heads/main/assets/logos/edge.png"
$chromeIconUrl = "https://raw.githubusercontent.com/henrique-coder/correios-tools/refs/heads/main/assets/logos/chrome.png"

$scriptsApiUrl = "https://api.github.com/repos/henrique-coder/correios-tools/releases/tags/minified-scripts"
$extensionsApiUrl = "https://api.github.com/repos/henrique-coder/correios-tools/releases/tags/browser-extensions"
$selfDownloadUrl = "https://github.com/henrique-coder/correios-tools/releases/download/minified-scripts/launcher.min.ps1"

$extensionNames = @("sroweb-induction", "sroweb-loecview-hud")
$startUrl = "https://sroweb.correios.com.br/app/index.php"

if (!(Test-Path $dataDir)) { New-Item -ItemType Directory -Path $dataDir -Force | Out-Null }
if (!(Test-Path $assetsDir)) { New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null }
$edgeIconPath = "$assetsDir\edge.png"
$chromeIconPath = "$assetsDir\chrome.png"

try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

function Get-StoredHashes {
    if (Test-Path $hashesFile) {
        try {
            return (Get-Content $hashesFile -Raw | ConvertFrom-Json)
        } catch {
            return @{ scripts = @{}; extensions = @{} }
        }
    }
    return @{ scripts = @{}; extensions = @{} }
}

function Save-StoredHashes {
    param($hashes)
    $hashes | ConvertTo-Json -Depth 10 | Set-Content $hashesFile -Encoding UTF8
}

function Get-ReleaseInfo {
    param([string]$apiUrl)
    try {
        $headers = @{ "User-Agent" = "PowerShell-CorreiosTools"; "Accept" = "application/vnd.github+json" }
        $response = Invoke-RestMethod -Uri $apiUrl -Headers $headers -Method Get -TimeoutSec 30
        return $response
    } catch {
        return $null
    }
}

function Get-AssetHash {
    param($releaseInfo, [string]$assetName)
    if ($releaseInfo -eq $null -or $releaseInfo.assets -eq $null) { return $null }
    foreach ($asset in $releaseInfo.assets) {
        if ($asset.name -eq $assetName -and $asset.digest) {
            return $asset.digest
        }
    }
    return $null
}

function Get-AssetDownloadUrl {
    param($releaseInfo, [string]$assetName)
    if ($releaseInfo -eq $null -or $releaseInfo.assets -eq $null) { return $null }
    foreach ($asset in $releaseInfo.assets) {
        if ($asset.name -eq $assetName) {
            return $asset.browser_download_url
        }
    }
    return $null
}

function Get-LocalFileHashSha256 {
    param([string]$filePath)
    try {
        if (Test-Path $filePath) {
            $hash = (Get-FileHash -Path $filePath -Algorithm SHA256).Hash.ToLower()
            return "sha256:$hash"
        }
        return $null
    } catch {
        return $null
    }
}

function New-DesktopShortcut {
    try {
        $desktopPath = [Environment]::GetFolderPath("Desktop")
        $shortcutPath = "$desktopPath\Correios Tools.lnk"
        if (Test-Path $shortcutPath) { return }
        $shell = New-Object -ComObject WScript.Shell
        $shortcut = $shell.CreateShortcut($shortcutPath)
        $shortcut.TargetPath = "powershell.exe"
        $shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$selfPath`""
        $shortcut.IconLocation = $iconPath
        $shortcut.Description = "Correios Tools Launcher"
        $shortcut.Save()
    } catch {}
}

[xml]$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Correios Tools Launcher" Height="500" Width="420"
        WindowStartupLocation="CenterScreen" ResizeMode="CanMinimize"
        Background="#1E1E1E" WindowStyle="None" AllowsTransparency="True">
    <Window.Resources>
        <Style TargetType="Button">
            <Setter Property="Background" Value="#2D2D30"/>
            <Setter Property="Foreground" Value="White"/>
            <Setter Property="BorderThickness" Value="0"/>
            <Setter Property="FontSize" Value="12"/>
            <Setter Property="Padding" Value="10,5"/>
            <Setter Property="Cursor" Value="Hand"/>
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="Button">
                        <Border Name="border" Background="{TemplateBinding Background}" CornerRadius="5">
                            <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                        </Border>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter TargetName="border" Property="Background" Value="#3E3E42"/>
                            </Trigger>
                            <Trigger Property="IsPressed" Value="True">
                                <Setter TargetName="border" Property="Background" Value="#007ACC"/>
                            </Trigger>
                            <Trigger Property="IsEnabled" Value="False">
                                <Setter TargetName="border" Property="Background" Value="#1A1A1A"/>
                                <Setter Property="Foreground" Value="#555555"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>
    </Window.Resources>
    <Border BorderBrush="#333337" BorderThickness="1" CornerRadius="0">
        <Grid Margin="15">
            <Grid.RowDefinitions>
                <RowDefinition Height="Auto"/>
                <RowDefinition Height="Auto"/>
                <RowDefinition Height="*"/>
                <RowDefinition Height="Auto"/>
                <RowDefinition Height="Auto"/>
            </Grid.RowDefinitions>
            <Grid Grid.Row="0">
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="Auto"/>
                </Grid.ColumnDefinitions>
                <TextBlock Text="CORREIOS TOOLS" Foreground="White" FontSize="18" FontWeight="Bold" VerticalAlignment="Center"/>
                <Button Name="BtnClose" Content="X" Grid.Column="1" Background="Transparent" Foreground="#FF5555" FontWeight="Bold" Width="30"/>
            </Grid>
            <TextBlock Name="TxtStatus" Grid.Row="1" Text="Iniciando..." Foreground="#AAAAAA" Margin="0,20,0,10" HorizontalAlignment="Center" TextWrapping="Wrap" TextAlignment="Center"/>
            <StackPanel Grid.Row="2" VerticalAlignment="Center" HorizontalAlignment="Center">
                <Grid>
                    <Grid.ColumnDefinitions>
                        <ColumnDefinition Width="Auto"/>
                        <ColumnDefinition Width="30"/>
                        <ColumnDefinition Width="Auto"/>
                    </Grid.ColumnDefinitions>
                    <Button Name="BtnEdge" Width="130" Height="130" Background="Transparent">
                        <StackPanel>
                            <Image Name="ImgEdge" Width="90" Height="90" RenderOptions.BitmapScalingMode="HighQuality"/>
                            <TextBlock Text="Edge" Foreground="White" HorizontalAlignment="Center" Margin="0,10,0,0"/>
                        </StackPanel>
                    </Button>
                    <Button Name="BtnChrome" Grid.Column="2" Width="130" Height="130" Background="Transparent">
                        <StackPanel>
                            <Image Name="ImgChrome" Width="90" Height="90" RenderOptions.BitmapScalingMode="HighQuality"/>
                            <TextBlock Text="Chrome" Foreground="White" HorizontalAlignment="Center" Margin="0,10,0,0"/>
                        </StackPanel>
                    </Button>
                </Grid>
            </StackPanel>
            <StackPanel Grid.Row="3" Margin="0,15">
                <ProgressBar Name="PbMain" Height="3" Background="#2D2D30" Foreground="#007ACC" IsIndeterminate="False" Opacity="0"/>
            </StackPanel>
            <Grid Grid.Row="4" Margin="0,5,0,0">
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="10"/>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="10"/>
                    <ColumnDefinition Width="*"/>
                </Grid.ColumnDefinitions>
                <Button Name="BtnUpdate" Grid.Column="0" Content="Reinstalar App" Height="35" FontSize="11"/>
                <Button Name="BtnReset" Grid.Column="2" Content="Recriar Cache" Height="35" FontSize="11"/>
                <Button Name="BtnScripts" Grid.Column="4" Content="Executar Extras" Height="35" FontSize="11"/>
            </Grid>
        </Grid>
    </Border>
</Window>
"@

$window = [Windows.Markup.XamlReader]::Load((New-Object System.Xml.XmlNodeReader $xaml))

$BtnClose = $window.FindName("BtnClose")
$BtnEdge = $window.FindName("BtnEdge")
$BtnChrome = $window.FindName("BtnChrome")
$BtnUpdate = $window.FindName("BtnUpdate")
$BtnReset = $window.FindName("BtnReset")
$BtnScripts = $window.FindName("BtnScripts")
$TxtStatus = $window.FindName("TxtStatus")
$ImgEdge = $window.FindName("ImgEdge")
$ImgChrome = $window.FindName("ImgChrome")
$PbMain = $window.FindName("PbMain")

$allButtons = @($BtnEdge, $BtnChrome, $BtnUpdate, $BtnReset, $BtnScripts)

function Set-ButtonsEnabled {
    param([bool]$enabled)
    foreach ($btn in $allButtons) { $btn.IsEnabled = $enabled }
}

function Update-Status {
    param([string]$message, [bool]$loading = $false)
    $TxtStatus.Text = $message
    $PbMain.IsIndeterminate = $loading
    $PbMain.Opacity = if ($loading) { 1 } else { 0 }
    [System.Windows.Threading.Dispatcher]::CurrentDispatcher.Invoke([Action]{}, [System.Windows.Threading.DispatcherPriority]::Background)
}

function Invoke-SafeAction {
    param([scriptblock]$action)
    if ($script:isProcessing) { return }
    $script:isProcessing = $true
    Set-ButtonsEnabled $false
    try { & $action }
    finally {
        $script:isProcessing = $false
        Set-ButtonsEnabled $true
    }
}

function Initialize-WindowIcon {
    try {
        if (!(Test-Path $iconPath)) {
            Invoke-WebRequest -Uri $iconUrl -OutFile $iconPath -UseBasicParsing
        }
        if (Test-Path $iconPath) {
            $uri = New-Object System.Uri($iconPath)
            $iconBitmap = New-Object System.Windows.Media.Imaging.BitmapImage
            $iconBitmap.BeginInit()
            $iconBitmap.UriSource = $uri
            $iconBitmap.CacheOption = [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
            $iconBitmap.CreateOptions = [System.Windows.Media.Imaging.BitmapCreateOptions]::IgnoreImageCache
            $iconBitmap.EndInit()
            $iconBitmap.Freeze()
            $window.Icon = $iconBitmap
        }
    } catch {}
}

function Initialize-BrowserIcons {
    try {
        if (!(Test-Path $edgeIconPath)) { Invoke-WebRequest -Uri $edgeIconUrl -OutFile $edgeIconPath -UseBasicParsing }
        if (!(Test-Path $chromeIconPath)) { Invoke-WebRequest -Uri $chromeIconUrl -OutFile $chromeIconPath -UseBasicParsing }
        if (Test-Path $edgeIconPath) {
            $edgeBitmap = New-Object System.Windows.Media.Imaging.BitmapImage
            $edgeBitmap.BeginInit()
            $edgeBitmap.UriSource = New-Object Uri($edgeIconPath)
            $edgeBitmap.CacheOption = [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
            $edgeBitmap.EndInit()
            $edgeBitmap.Freeze()
            $ImgEdge.Source = $edgeBitmap
        }
        if (Test-Path $chromeIconPath) {
            $chromeBitmap = New-Object System.Windows.Media.Imaging.BitmapImage
            $chromeBitmap.BeginInit()
            $chromeBitmap.UriSource = New-Object Uri($chromeIconPath)
            $chromeBitmap.CacheOption = [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
            $chromeBitmap.EndInit()
            $chromeBitmap.Freeze()
            $ImgChrome.Source = $chromeBitmap
        }
    } catch {}
}

function Invoke-CheckLauncherUpdate {
    param([bool]$showCountdown = $true)
    Update-Status "Verificando atualizacoes..." $true
    try {
        $releaseInfo = Get-ReleaseInfo $scriptsApiUrl
        if ($releaseInfo -eq $null) {
            Update-Status "Sem conexao. Modo offline ativado." $false
            return $false
        }

        $remoteHash = Get-AssetHash $releaseInfo "launcher.min.ps1"
        if ($remoteHash -eq $null) {
            Update-Status "Erro ao obter hash remoto." $false
            return $false
        }

        $storedHashes = Get-StoredHashes
        $localHash = $null
        if ($storedHashes.scripts -and $storedHashes.scripts."launcher.min.ps1") {
            $localHash = $storedHashes.scripts."launcher.min.ps1"
        }

        if ($localHash -eq $null -or $remoteHash -ne $localHash) {
            if ($showCountdown) {
                Update-Status "Atualizacao encontrada! Reiniciando em 5 segundos..." $false
                for ($i = 5; $i -gt 0; $i--) {
                    Update-Status "Atualizacao encontrada! Reiniciando em $i segundos..." $false
                    Start-Sleep -Seconds 1
                }
            }
            Update-Status "Baixando atualizacao..." $true

            $tempPath = "$dataDir\launcher_new.tmp"
            Invoke-WebRequest -Uri $selfDownloadUrl -OutFile $tempPath -UseBasicParsing

            $newFileHash = Get-LocalFileHashSha256 $tempPath
            if ($storedHashes.scripts -eq $null) { $storedHashes | Add-Member -NotePropertyName "scripts" -NotePropertyValue @{} -Force }
            $storedHashes.scripts."launcher.min.ps1" = $newFileHash
            Save-StoredHashes $storedHashes

            Copy-Item $tempPath $selfPath -Force
            Remove-Item $tempPath -Force -ErrorAction SilentlyContinue

            Update-Status "Reiniciando aplicativo..." $true
            $restartArgs = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$selfPath`""
            Start-Process -FilePath "powershell.exe" -ArgumentList $restartArgs
            Start-Sleep -Milliseconds 500
            $window.Close()
            Exit
        }

        return $true
    } catch {
        Update-Status "Erro ao verificar atualizacoes." $false
        return $false
    }
}

function Invoke-SyncExtensions {
    param([bool]$forceAll = $false)
    Update-Status "Sincronizando extensoes..." $true

    $releaseInfo = Get-ReleaseInfo $extensionsApiUrl
    if ($releaseInfo -eq $null) {
        Update-Status "Sem conexao para baixar extensoes." $false
        return
    }

    $storedHashes = Get-StoredHashes
    if ($storedHashes.extensions -eq $null) {
        $storedHashes | Add-Member -NotePropertyName "extensions" -NotePropertyValue @{} -Force
    }

    if (!(Test-Path $extensionsDir)) {
        New-Item -ItemType Directory -Path $extensionsDir -Force | Out-Null
    }

    $count = 0
    $total = $extensionNames.Count

    foreach ($extName in $extensionNames) {
        $count++
        $zipName = "$extName.zip"
        $remoteHash = Get-AssetHash $releaseInfo $zipName
        $localHash = $null
        if ($storedHashes.extensions.$zipName) {
            $localHash = $storedHashes.extensions.$zipName
        }

        $needsDownload = $forceAll -or ($localHash -eq $null) -or ($remoteHash -ne $localHash)

        if ($needsDownload) {
            Update-Status "Baixando extensao $count de $total ($extName)..." $true
            try {
                $downloadUrl = Get-AssetDownloadUrl $releaseInfo $zipName
                if ($downloadUrl) {
                    $zipPath = "$dataDir\$zipName"
                    $destFolder = "$extensionsDir\$extName"

                    if (Test-Path $destFolder) { Remove-Item $destFolder -Recurse -Force }
                    New-Item -ItemType Directory -Path $destFolder -Force | Out-Null

                    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing -TimeoutSec 60

                    $newHash = Get-LocalFileHashSha256 $zipPath
                    $storedHashes.extensions.$zipName = $newHash

                    Expand-Archive -Path $zipPath -DestinationPath $destFolder -Force
                    Remove-Item $zipPath -Force
                }
            } catch {
                Update-Status "Falha ao baixar $extName." $false
                Start-Sleep -Seconds 2
            }
        }
    }

    Save-StoredHashes $storedHashes
}

function Invoke-ForceReinstall {
    Update-Status "Reinstalando aplicativo... Aguarde." $true
    try {
        if (Test-Path $hashesFile) { Remove-Item $hashesFile -Force }

        $tempPath = "$dataDir\launcher_new.tmp"
        Invoke-WebRequest -Uri $selfDownloadUrl -OutFile $tempPath -UseBasicParsing

        $newHash = Get-LocalFileHashSha256 $tempPath
        $storedHashes = @{ scripts = @{ "launcher.min.ps1" = $newHash }; extensions = @{} }
        Save-StoredHashes $storedHashes

        Copy-Item $tempPath $selfPath -Force
        Remove-Item $tempPath -Force -ErrorAction SilentlyContinue

        Update-Status "Reinstalacao concluida! Reiniciando..." $true
        $restartArgs = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$selfPath`""
        Start-Process -FilePath "powershell.exe" -ArgumentList $restartArgs
        Start-Sleep -Milliseconds 500
        $window.Close()
        Exit
    } catch {
        Update-Status "Erro ao reinstalar. Verifique sua conexao." $false
    }
}

function Invoke-RecreateCache {
    Update-Status "Recriando cache... Aguarde." $true
    try {
        if (Test-Path $extensionsDir) { Remove-Item $extensionsDir -Recurse -Force }
        if (Test-Path $scriptsDir) { Remove-Item $scriptsDir -Recurse -Force }
        if (Test-Path $assetsDir) { Remove-Item $assetsDir -Recurse -Force }
        if (Test-Path $iconPath) { Remove-Item $iconPath -Force }
        if (Test-Path $hashesFile) { Remove-Item $hashesFile -Force }

        New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null

        Update-Status "Baixando icone do aplicativo..." $true
        Initialize-WindowIcon

        Update-Status "Baixando icones dos navegadores..." $true
        Initialize-BrowserIcons

        Update-Status "Sincronizando extensoes..." $true
        Invoke-SyncExtensions -forceAll $true

        Update-Status "Cache recriado com sucesso!" $false
    } catch {
        Update-Status "Erro ao recriar cache." $false
    }
}

function Invoke-RunExtraScripts {
    Update-Status "Nenhuma ferramenta extra configurada." $false
}

function Get-ExtensionPaths {
    $paths = @()
    if (Test-Path $extensionsDir) {
        $dirs = Get-ChildItem -Path $extensionsDir -Directory -Recurse
        foreach ($dir in $dirs) {
            if (Test-Path "$($dir.FullName)\manifest.json") { $paths += $dir.FullName }
        }
    }
    return ($paths -join ",")
}

function Wait-ProcessExit {
    param([string]$processName)
    $timeout = 30
    $elapsed = 0
    while ($elapsed -lt $timeout) {
        $proc = Get-Process -Name $processName -ErrorAction SilentlyContinue
        if ($proc -eq $null) { return $true }
        Start-Sleep -Milliseconds 200
        $elapsed += 0.2
        [System.Windows.Threading.Dispatcher]::CurrentDispatcher.Invoke([Action]{}, [System.Windows.Threading.DispatcherPriority]::Background)
    }
    return $false
}

function Set-PreferencesFile {
    param([string]$prefPath)
    if (!(Test-Path $prefPath)) { return }
    try {
        $prefs = Get-Content $prefPath -Raw -Encoding UTF8 | ConvertFrom-Json
        $modified = $false
        if ($prefs.session -eq $null) {
            $prefs | Add-Member -NotePropertyName "session" -NotePropertyValue @{} -Force
        }
        if ($prefs.session.restore_on_startup -ne 1) {
            $prefs.session.restore_on_startup = 1
            $modified = $true
        }
        if ($prefs.extensions -eq $null) {
            $prefs | Add-Member -NotePropertyName "extensions" -NotePropertyValue @{} -Force
        }
        if ($prefs.extensions.ui -eq $null) {
            $prefs.extensions | Add-Member -NotePropertyName "ui" -NotePropertyValue @{} -Force
        }
        if ($prefs.extensions.ui.developer_mode -ne $true) {
            $prefs.extensions.ui.developer_mode = $true
            $modified = $true
        }
        if ($modified) {
            $prefs | ConvertTo-Json -Depth 100 -Compress | Set-Content $prefPath -Encoding UTF8
        }
    } catch {}
}

function Set-BrowserPreferences {
    param([string]$browserName)
    $userDataPath = ""
    if ($browserName -eq "Edge") {
        $userDataPath = "$env:LOCALAPPDATA\Microsoft\Edge\User Data"
    } elseif ($browserName -eq "Chrome") {
        $userDataPath = "$env:LOCALAPPDATA\Google\Chrome\User Data"
    }
    if (!(Test-Path $userDataPath)) { return }
    $defaultPref = "$userDataPath\Default\Preferences"
    if (Test-Path $defaultPref) { Set-PreferencesFile $defaultPref }
    $profiles = Get-ChildItem -Path $userDataPath -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match "^Profile \d+$" }
    foreach ($profile in $profiles) {
        $profilePref = "$($profile.FullName)\Preferences"
        if (Test-Path $profilePref) { Set-PreferencesFile $profilePref }
    }
}

function Start-Browser {
    param([string]$browserName, [string]$processName, [string]$extensionPaths)

    Update-Status "Verificando atualizacoes das extensoes..." $true

    $releaseInfo = Get-ReleaseInfo $extensionsApiUrl
    if ($releaseInfo -ne $null) {
        $storedHashes = Get-StoredHashes
        if ($storedHashes.extensions -eq $null) {
            $storedHashes | Add-Member -NotePropertyName "extensions" -NotePropertyValue @{} -Force
        }

        $needsSync = $false
        foreach ($extName in $extensionNames) {
            $zipName = "$extName.zip"
            $remoteHash = Get-AssetHash $releaseInfo $zipName
            $localHash = $null
            if ($storedHashes.extensions.$zipName) {
                $localHash = $storedHashes.extensions.$zipName
            }
            if ($localHash -eq $null -or $remoteHash -ne $localHash) {
                $needsSync = $true
                break
            }
        }

        if ($needsSync) {
            Invoke-SyncExtensions -forceAll $false
            $extensionPaths = Get-ExtensionPaths
        }
    }

    $existingProcess = Get-Process -Name $processName -ErrorAction SilentlyContinue
    if ($existingProcess) {
        Update-Status "Fechando $browserName... Aguarde." $true
        Stop-Process -Name $processName -Force -ErrorAction SilentlyContinue
        Wait-ProcessExit $processName
    }

    Update-Status "Aplicando configuracoes do $browserName..." $true
    Set-BrowserPreferences $browserName

    Update-Status "Iniciando $browserName..." $true
    $browserArgs = @("--restore-last-session", "--no-first-run", "--no-default-browser-check", $startUrl)
    if (-not [string]::IsNullOrWhiteSpace($extensionPaths)) { $browserArgs += "--load-extension=`"$extensionPaths`"" }
    try {
        Start-Process $processName -ArgumentList $browserArgs
        Update-Status "$browserName iniciado com sucesso!" $false
    } catch {
        Update-Status "Erro ao iniciar $browserName." $false
    }
}

function Invoke-ScheduledUpdateCheck {
    if ($script:isProcessing) { return }
    $script:isProcessing = $true
    Set-ButtonsEnabled $false

    Update-Status "Verificacao automatica em andamento..." $true

    try {
        $releaseInfo = Get-ReleaseInfo $scriptsApiUrl
        if ($releaseInfo -eq $null) {
            Update-Status "Verificacao concluida. Sem conexao." $false
            return
        }

        $remoteHash = Get-AssetHash $releaseInfo "launcher.min.ps1"
        $storedHashes = Get-StoredHashes
        $localHash = $null
        if ($storedHashes.scripts -and $storedHashes.scripts."launcher.min.ps1") {
            $localHash = $storedHashes.scripts."launcher.min.ps1"
        }

        if ($localHash -eq $null -or $remoteHash -ne $localHash) {
            Update-Status "Atualizacao encontrada! Reiniciando em 5 segundos..." $false
            for ($i = 5; $i -gt 0; $i--) {
                Update-Status "Atualizacao encontrada! Reiniciando em $i segundos..." $false
                Start-Sleep -Seconds 1
            }

            Update-Status "Baixando atualizacao..." $true
            $tempPath = "$dataDir\launcher_new.tmp"
            Invoke-WebRequest -Uri $selfDownloadUrl -OutFile $tempPath -UseBasicParsing

            $newFileHash = Get-LocalFileHashSha256 $tempPath
            if ($storedHashes.scripts -eq $null) { $storedHashes | Add-Member -NotePropertyName "scripts" -NotePropertyValue @{} -Force }
            $storedHashes.scripts."launcher.min.ps1" = $newFileHash
            Save-StoredHashes $storedHashes

            Copy-Item $tempPath $selfPath -Force
            Remove-Item $tempPath -Force -ErrorAction SilentlyContinue

            Update-Status "Reiniciando aplicativo..." $true
            $restartArgs = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$selfPath`""
            Start-Process -FilePath "powershell.exe" -ArgumentList $restartArgs
            Start-Sleep -Milliseconds 500
            $window.Close()
            Exit
        } else {
            Update-Status "Verificacao concluida. Nenhuma atualizacao." $false
        }
    } catch {
        Update-Status "Erro na verificacao automatica." $false
    } finally {
        $script:isProcessing = $false
        Set-ButtonsEnabled $true
    }
}

function Initialize-UpdateTimer {
    $script:updateCheckTimer = New-Object System.Windows.Threading.DispatcherTimer
    $script:updateCheckTimer.Interval = [TimeSpan]::FromHours(8)
    $script:updateCheckTimer.Add_Tick({ Invoke-ScheduledUpdateCheck })
    $script:updateCheckTimer.Start()
}

function Invoke-StartupSequence {
    Set-ButtonsEnabled $false
    $script:isProcessing = $true

    Update-Status "Carregando interface..." $true
    Initialize-WindowIcon
    Initialize-BrowserIcons

    Update-Status "Criando atalho na area de trabalho..." $true
    New-DesktopShortcut

    Update-Status "Verificando atualizacoes do aplicativo..." $true
    $updateResult = Invoke-CheckLauncherUpdate -showCountdown $true
    if ($updateResult -eq $false) {
        $storedHashes = Get-StoredHashes
        $hasLocalHash = $storedHashes.scripts -and $storedHashes.scripts."launcher.min.ps1"
        if (-not $hasLocalHash) {
            Update-Status "Primeira execucao detectada. Configurando..." $true
        }
    }

    $ext = Get-ExtensionPaths
    $installedCount = if ([string]::IsNullOrWhiteSpace($ext)) { 0 } else { ($ext -split ",").Count }
    if ($installedCount -lt $extensionNames.Count) {
        Update-Status "Sincronizando extensoes..." $true
        Invoke-SyncExtensions -forceAll $false
    }

    Initialize-UpdateTimer

    Update-Status "Pronto! Selecione o navegador." $false
    $script:isProcessing = $false
    Set-ButtonsEnabled $true
}

$BtnClose.Add_Click({ $window.Close() })

$BtnUpdate.Add_Click({
    Invoke-SafeAction {
        Invoke-ForceReinstall
    }
})

$BtnReset.Add_Click({
    Invoke-SafeAction {
        Invoke-RecreateCache
    }
})

$BtnScripts.Add_Click({
    Invoke-SafeAction {
        Invoke-RunExtraScripts
    }
})

$BtnEdge.Add_Click({
    Invoke-SafeAction {
        $ext = Get-ExtensionPaths
        Start-Browser "Edge" "msedge" $ext
    }
})

$BtnChrome.Add_Click({
    Invoke-SafeAction {
        $ext = Get-ExtensionPaths
        Start-Browser "Chrome" "chrome" $ext
    }
})

$window.Add_Loaded({ Invoke-StartupSequence })
$window.Add_MouseLeftButtonDown({ $window.DragMove() })
[void]$window.ShowDialog()
