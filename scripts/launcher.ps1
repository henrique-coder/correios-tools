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
$assetsDir = "$dataDir\assets"
$hashesFile = "$dataDir\hashes.json"
$selfPath = $MyInvocation.MyCommand.Path

$iconUrl = "https://cdn.jsdelivr.net/gh/henrique-coder/correios-tools/assets/icon.ico"
$iconPath = "$dataDir\icon.ico"
$edgeIconUrl = "https://cdn.jsdelivr.net/gh/henrique-coder/correios-tools/assets/logos/edge.png"
$chromeIconUrl = "https://cdn.jsdelivr.net/gh/henrique-coder/correios-tools/assets/logos/chrome.png"

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
    try {
        if (Test-Path $hashesFile) {
            $content = Get-Content $hashesFile -Raw -ErrorAction Stop
            if ($content -and $content.Trim().Length -gt 0) {
                $parsed = $content | ConvertFrom-Json -ErrorAction Stop
                if ($parsed -ne $null) { return $parsed }
            }
        }
    } catch {}
    return [PSCustomObject]@{ launcher = $null; extensions = [PSCustomObject]@{} }
}

function Save-StoredHashes {
    param($hashes)
    try {
        $json = $hashes | ConvertTo-Json -Depth 5
        [System.IO.File]::WriteAllText($hashesFile, $json, [System.Text.UTF8Encoding]::new($false))
    } catch {}
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

function Get-AssetDigest {
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
                </Grid.ColumnDefinitions>
                <Button Name="BtnCheckUpdate" Grid.Column="0" Content="Verificar Atualizacoes" Height="35" FontSize="11"/>
                <Button Name="BtnScripts" Grid.Column="2" Content="Scripts Extras" Height="35" FontSize="11"/>
            </Grid>
        </Grid>
    </Border>
</Window>
"@

$window = [Windows.Markup.XamlReader]::Load((New-Object System.Xml.XmlNodeReader $xaml))

$BtnClose = $window.FindName("BtnClose")
$BtnEdge = $window.FindName("BtnEdge")
$BtnChrome = $window.FindName("BtnChrome")
$BtnCheckUpdate = $window.FindName("BtnCheckUpdate")
$BtnScripts = $window.FindName("BtnScripts")
$TxtStatus = $window.FindName("TxtStatus")
$ImgEdge = $window.FindName("ImgEdge")
$ImgChrome = $window.FindName("ImgChrome")
$PbMain = $window.FindName("PbMain")

$allButtons = @($BtnEdge, $BtnChrome, $BtnCheckUpdate, $BtnScripts)

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

function Invoke-CheckAndUpdateLauncher {
    param([bool]$showCountdown = $true, [bool]$silent = $false)

    if (-not $silent) { Update-Status "Verificando atualizacoes do launcher..." $true }

    try {
        $releaseInfo = Get-ReleaseInfo $scriptsApiUrl
        if ($releaseInfo -eq $null) {
            if (-not $silent) { Update-Status "Sem conexao. Modo offline." $false }
            return $false
        }

        $remoteDigest = Get-AssetDigest $releaseInfo "launcher.min.ps1"
        if ($remoteDigest -eq $null) {
            if (-not $silent) { Update-Status "Hash remoto indisponivel." $false }
            return $false
        }

        $storedHashes = Get-StoredHashes
        $localDigest = $storedHashes.launcher

        if ($localDigest -eq $null -or $remoteDigest -ne $localDigest) {
            if ($showCountdown) {
                for ($i = 5; $i -gt 0; $i--) {
                    Update-Status "Atualizacao encontrada! Reiniciando em $i..." $false
                    Start-Sleep -Seconds 1
                }
            }
            Update-Status "Baixando atualizacao..." $true

            $tempPath = "$dataDir\launcher_update.tmp"
            Invoke-WebRequest -Uri $selfDownloadUrl -OutFile $tempPath -UseBasicParsing

            $storedHashes.launcher = $remoteDigest
            Save-StoredHashes $storedHashes

            Copy-Item $tempPath $selfPath -Force
            Remove-Item $tempPath -Force -ErrorAction SilentlyContinue

            Update-Status "Reiniciando..." $true
            Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$selfPath`""
            Start-Sleep -Milliseconds 300
            $window.Close()
            Exit
        }

        if (-not $silent) { Update-Status "Launcher atualizado!" $false }
        return $true
    } catch {
        if (-not $silent) { Update-Status "Erro ao verificar launcher." $false }
        return $false
    }
}

function Invoke-CheckAndUpdateExtensions {
    param([bool]$silent = $false)

    if (-not $silent) { Update-Status "Verificando extensoes..." $true }

    try {
        $releaseInfo = Get-ReleaseInfo $extensionsApiUrl
        if ($releaseInfo -eq $null) {
            if (-not $silent) { Update-Status "Sem conexao para extensoes." $false }
            return
        }

        $storedHashes = Get-StoredHashes
        if ($storedHashes.extensions -eq $null) {
            $storedHashes | Add-Member -NotePropertyName "extensions" -NotePropertyValue ([PSCustomObject]@{}) -Force
        }

        if (!(Test-Path $extensionsDir)) {
            New-Item -ItemType Directory -Path $extensionsDir -Force | Out-Null
        }

        $updated = $false
        $count = 0
        $total = $extensionNames.Count

        foreach ($extName in $extensionNames) {
            $count++
            $zipName = "$extName.zip"
            $remoteDigest = Get-AssetDigest $releaseInfo $zipName

            $localDigest = $null
            if ($storedHashes.extensions.PSObject.Properties[$zipName]) {
                $localDigest = $storedHashes.extensions.$zipName
            }

            $extFolder = "$extensionsDir\$extName"
            $needsDownload = ($localDigest -eq $null) -or ($remoteDigest -ne $localDigest) -or (!(Test-Path "$extFolder\manifest.json"))

            if ($needsDownload -and $remoteDigest) {
                if (-not $silent) { Update-Status "Atualizando $extName ($count/$total)..." $true }
                $updated = $true

                $downloadUrl = Get-AssetDownloadUrl $releaseInfo $zipName
                if ($downloadUrl) {
                    $tempZip = "$dataDir\temp_$zipName"
                    if (Test-Path $extFolder) { Remove-Item $extFolder -Recurse -Force -ErrorAction SilentlyContinue }
                    New-Item -ItemType Directory -Path $extFolder -Force | Out-Null

                    Invoke-WebRequest -Uri $downloadUrl -OutFile $tempZip -UseBasicParsing -TimeoutSec 60
                    Expand-Archive -Path $tempZip -DestinationPath $extFolder -Force
                    Remove-Item $tempZip -Force -ErrorAction SilentlyContinue

                    if ($storedHashes.extensions.PSObject.Properties[$zipName]) {
                        $storedHashes.extensions.$zipName = $remoteDigest
                    } else {
                        $storedHashes.extensions | Add-Member -NotePropertyName $zipName -NotePropertyValue $remoteDigest -Force
                    }
                }
            }
        }

        Save-StoredHashes $storedHashes

        if ($updated -and -not $silent) {
            Update-Status "Extensoes atualizadas!" $false
        } elseif (-not $silent) {
            Update-Status "Extensoes ok!" $false
        }
    } catch {
        if (-not $silent) { Update-Status "Erro ao verificar extensoes." $false }
    }
}

function Invoke-FullUpdateCheck {
    Update-Status "Verificando atualizacoes..." $true

    $launcherOk = Invoke-CheckAndUpdateLauncher -showCountdown $true -silent $false
    Invoke-CheckAndUpdateExtensions -silent $false

    Update-Status "Verificacao concluida!" $false
}

function Invoke-RunExtraScripts {
    Update-Status "Nenhum script extra configurado." $false
}

function Get-ExtensionPaths {
    $paths = @()
    if (Test-Path $extensionsDir) {
        $dirs = Get-ChildItem -Path $extensionsDir -Directory
        foreach ($dir in $dirs) {
            if (Test-Path "$($dir.FullName)\manifest.json") { $paths += $dir.FullName }
        }
    }
    return ($paths -join ",")
}

function Wait-ProcessExit {
    param([string]$processName)
    $timeout = 15
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
    param([string]$browserName, [string]$processName)

    Invoke-CheckAndUpdateExtensions -silent $false

    $extensionPaths = Get-ExtensionPaths

    $existingProcess = Get-Process -Name $processName -ErrorAction SilentlyContinue
    if ($existingProcess) {
        Update-Status "Fechando $browserName..." $true
        Stop-Process -Name $processName -Force -ErrorAction SilentlyContinue
        Wait-ProcessExit $processName
    }

    Update-Status "Configurando $browserName..." $true
    Set-BrowserPreferences $browserName

    Update-Status "Iniciando $browserName..." $true
    $browserArgs = @("--restore-last-session", "--no-first-run", "--no-default-browser-check", $startUrl)
    if (-not [string]::IsNullOrWhiteSpace($extensionPaths)) { $browserArgs += "--load-extension=`"$extensionPaths`"" }

    try {
        Start-Process $processName -ArgumentList $browserArgs
        Update-Status "$browserName iniciado!" $false
    } catch {
        Update-Status "Erro ao iniciar $browserName." $false
    }
}

function Invoke-ScheduledUpdateCheck {
    if ($script:isProcessing) { return }
    $script:isProcessing = $true
    Set-ButtonsEnabled $false

    Update-Status "Verificacao automatica..." $true

    try {
        $releaseInfo = Get-ReleaseInfo $scriptsApiUrl
        if ($releaseInfo -eq $null) {
            Update-Status "Pronto! Selecione o navegador." $false
            return
        }

        $remoteDigest = Get-AssetDigest $releaseInfo "launcher.min.ps1"
        $storedHashes = Get-StoredHashes
        $localDigest = $storedHashes.launcher

        if ($localDigest -eq $null -or $remoteDigest -ne $localDigest) {
            for ($i = 5; $i -gt 0; $i--) {
                Update-Status "Atualizacao encontrada! Reiniciando em $i..." $false
                Start-Sleep -Seconds 1
            }

            Update-Status "Baixando atualizacao..." $true
            $tempPath = "$dataDir\launcher_update.tmp"
            Invoke-WebRequest -Uri $selfDownloadUrl -OutFile $tempPath -UseBasicParsing

            $storedHashes.launcher = $remoteDigest
            Save-StoredHashes $storedHashes

            Copy-Item $tempPath $selfPath -Force
            Remove-Item $tempPath -Force -ErrorAction SilentlyContinue

            Update-Status "Reiniciando..." $true
            Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$selfPath`""
            Start-Sleep -Milliseconds 300
            $window.Close()
            Exit
        } else {
            Update-Status "Pronto! Selecione o navegador." $false
        }
    } catch {
        Update-Status "Pronto! Selecione o navegador." $false
    } finally {
        $script:isProcessing = $false
        Set-ButtonsEnabled $true
    }
}

function Initialize-UpdateTimer {
    $script:updateCheckTimer = New-Object System.Windows.Threading.DispatcherTimer
    $script:updateCheckTimer.Interval = [TimeSpan]::FromHours(4)
    $script:updateCheckTimer.Add_Tick({ Invoke-ScheduledUpdateCheck })
    $script:updateCheckTimer.Start()
}

function Invoke-StartupSequence {
    Set-ButtonsEnabled $false
    $script:isProcessing = $true

    Update-Status "Carregando..." $true
    Initialize-WindowIcon
    Initialize-BrowserIcons
    New-DesktopShortcut

    Update-Status "Verificando launcher..." $true
    Invoke-CheckAndUpdateLauncher -showCountdown $true -silent $false

    $ext = Get-ExtensionPaths
    $installedCount = if ([string]::IsNullOrWhiteSpace($ext)) { 0 } else { ($ext -split ",").Count }
    if ($installedCount -lt $extensionNames.Count) {
        Invoke-CheckAndUpdateExtensions -silent $false
    }

    Initialize-UpdateTimer

    Update-Status "Pronto! Selecione o navegador." $false
    $script:isProcessing = $false
    Set-ButtonsEnabled $true
}

$BtnClose.Add_Click({ $window.Close() })

$BtnCheckUpdate.Add_Click({
    Invoke-SafeAction { Invoke-FullUpdateCheck }
})

$BtnScripts.Add_Click({
    Invoke-SafeAction { Invoke-RunExtraScripts }
})

$BtnEdge.Add_Click({
    Invoke-SafeAction { Start-Browser "Edge" "msedge" }
})

$BtnChrome.Add_Click({
    Invoke-SafeAction { Start-Browser "Chrome" "chrome" }
})

$window.Add_Loaded({ Invoke-StartupSequence })
$window.Add_MouseLeftButtonDown({ $window.DragMove() })
[void]$window.ShowDialog()
