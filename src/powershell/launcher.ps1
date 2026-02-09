$MUTEX_NAME = "Global\CorreiosToolsLauncherUI"
$mutex = New-Object System.Threading.Mutex($false, $MUTEX_NAME)
if (-not $mutex.WaitOne(0, $false)) { exit }

$windowHelperCode = @"
using System;
using System.Runtime.InteropServices;
public class WindowHelper {
    [DllImport("kernel32.dll")]
    public static extern IntPtr GetConsoleWindow();
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    private const int SW_HIDE = 0;
    public static void HideConsole() {
        IntPtr handle = GetConsoleWindow();
        if (handle != IntPtr.Zero) { ShowWindow(handle, SW_HIDE); }
    }
    public static void FocusWindow(IntPtr hWnd) {
        if (hWnd != IntPtr.Zero) { SetForegroundWindow(hWnd); }
    }
}
"@
try { Add-Type -TypeDefinition $windowHelperCode -Language CSharp -ErrorAction SilentlyContinue } catch {}
try { [WindowHelper]::HideConsole() } catch {}

Add-Type -AssemblyName PresentationFramework, System.Windows.Forms, System.Drawing

$script:IsProcessing = $false
$script:UpdateTimer = $null
$script:CountdownTimer = $null
$script:NeedsRestart = $false
$script:AppVersion = "{{VERSION}}"
$script:LastUpdateCheck = $null
$script:NextCheckTime = $null

$INSTALL_DIR = "C:\Users\Public\correios-tools"
$DATA_DIR = "$INSTALL_DIR\data"
$EXTENSIONS_DIR = "$DATA_DIR\extensions"
$RESOURCES_DIR = "$INSTALL_DIR\resources"
$ASSETS_DIR = "$RESOURCES_DIR\assets"
$SELF_PATH = $MyInvocation.MyCommand.Path

$ICON_URL = "https://cdn.jsdelivr.net/gh/henrique-coder/correios-tools/resources/assets/app/icon.ico"
$ICON_PNG_URL = "https://cdn.jsdelivr.net/gh/henrique-coder/correios-tools/resources/assets/app/icon.png"
$FOLDER_ICON_URL = "https://cdn.jsdelivr.net/gh/henrique-coder/correios-tools/resources/assets/app/open_folder_icon.png"
$ICON_PATH = "$ASSETS_DIR\icon.ico"
$ICON_PNG_PATH = "$ASSETS_DIR\icon.png"
$FOLDER_ICON_PATH = "$ASSETS_DIR\folder.png"
$EDGE_ICON_URL = "https://cdn.jsdelivr.net/gh/henrique-coder/correios-tools/resources/assets/browsers/edge_logo.png"
$CHROME_ICON_URL = "https://cdn.jsdelivr.net/gh/henrique-coder/correios-tools/resources/assets/browsers/chrome_logo.png"
$EDGE_ICON_PATH = "$ASSETS_DIR\edge.png"
$CHROME_ICON_PATH = "$ASSETS_DIR\chrome.png"

$UPDATE_INTERVAL_HOURS = 4
$START_URL = "https://sroweb.correios.com.br/app/index.php"

$METADATA_URL = "https://github.com/henrique-coder/correios-tools/releases/download/assets/metadata.json"
$LAUNCHER_DOWNLOAD_URL = "https://github.com/henrique-coder/correios-tools/releases/download/assets/script-launcher.ps1"

$script:CachedMetadata = $null

function Get-Metadata {
    if ($script:CachedMetadata -ne $null) { return $script:CachedMetadata }
    try {
        $response = Invoke-RestMethod -Uri $METADATA_URL -Method Get -TimeoutSec 30
        $script:CachedMetadata = $response
        return $response
    }
    catch { return $null }
}

function Calculate-FileHash {
    param([string]$FilePath)
    if (-not (Test-Path $FilePath)) { return "" }
    return (Get-FileHash -Path $FilePath -Algorithm SHA256).Hash.ToLower()
}

function Create-DesktopShortcuts {
    try {
        $desktopDir = [Environment]::GetFolderPath("Desktop")
        $shortcutPath = "$desktopDir\Correios Tools.lnk"
        $wshShell = New-Object -ComObject WScript.Shell

        if (-not (Test-Path $shortcutPath)) {
            $shortcut = $wshShell.CreateShortcut($shortcutPath)
            $shortcut.TargetPath = "powershell.exe"
            $shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$SELF_PATH`""
            $shortcut.IconLocation = $ICON_PATH
            $shortcut.Description = "Correios Tools Launcher"
            $shortcut.Save()
        }
    }
    catch {}
}

[xml]$xamlContent = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Correios Tools Launcher" Height="530" Width="420"
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
    <Grid>
        <Border BorderBrush="#333337" BorderThickness="1" CornerRadius="0">
            <Grid Margin="15">
                <Grid.RowDefinitions>
                    <RowDefinition Height="Auto"/>
                    <RowDefinition Height="Auto"/>
                    <RowDefinition Height="*"/>
                    <RowDefinition Height="Auto"/>
                    <RowDefinition Height="Auto"/>
                    <RowDefinition Height="Auto"/>
                    <RowDefinition Height="Auto"/>
                </Grid.RowDefinitions>
                <Grid Grid.Row="0">
                    <Grid.ColumnDefinitions>
                        <ColumnDefinition Width="*"/>
                        <ColumnDefinition Width="Auto"/>
                    </Grid.ColumnDefinitions>
                    <StackPanel Orientation="Horizontal" VerticalAlignment="Center">
                        <Image Name="AppIcon" Width="22" Height="22" Margin="0,0,8,0" RenderOptions.BitmapScalingMode="HighQuality"/>
                        <TextBlock Text="CORREIOS TOOLS" Foreground="White" FontSize="18" FontWeight="Bold"/>
                        <TextBlock Name="VersionText" Text="" Foreground="#666666" FontSize="10" VerticalAlignment="Bottom" Margin="8,0,0,2"/>
                    </StackPanel>
                    <Button Name="CloseButton" Content="X" Grid.Column="1" Background="Transparent" Foreground="#FF5555" FontWeight="Bold" Width="30"/>
                </Grid>
                <TextBlock Name="StatusText" Grid.Row="1" Text="Iniciando..." Foreground="#AAAAAA" Margin="0,20,0,10" HorizontalAlignment="Center" TextWrapping="Wrap" TextAlignment="Center"/>
                <StackPanel Grid.Row="2" VerticalAlignment="Center" HorizontalAlignment="Center">
                    <Grid>
                        <Grid.ColumnDefinitions>
                            <ColumnDefinition Width="Auto"/>
                            <ColumnDefinition Width="30"/>
                            <ColumnDefinition Width="Auto"/>
                        </Grid.ColumnDefinitions>
                        <Button Name="EdgeButton" Width="130" Height="130" Background="Transparent">
                            <StackPanel>
                                <Image Name="EdgeImage" Width="90" Height="90" RenderOptions.BitmapScalingMode="HighQuality"/>
                                <TextBlock Name="EdgeLabel" Text="Microsoft Edge" Foreground="White" HorizontalAlignment="Center" Margin="0,10,0,0"/>
                            </StackPanel>
                        </Button>
                        <Button Name="ChromeButton" Grid.Column="2" Width="130" Height="130" Background="Transparent">
                            <StackPanel>
                                <Image Name="ChromeImage" Width="90" Height="90" RenderOptions.BitmapScalingMode="HighQuality"/>
                                <TextBlock Name="ChromeLabel" Text="Google Chrome" Foreground="White" HorizontalAlignment="Center" Margin="0,10,0,0"/>
                            </StackPanel>
                        </Button>
                    </Grid>
                </StackPanel>
                <StackPanel Grid.Row="3" Margin="0,15">
                    <ProgressBar Name="MainProgressBar" Height="3" Background="#2D2D30" Foreground="#007ACC" IsIndeterminate="False" Opacity="0"/>
                </StackPanel>
                <Grid Grid.Row="4" Margin="0,5,0,0">
                    <Grid.ColumnDefinitions>
                        <ColumnDefinition Width="*"/>
                        <ColumnDefinition Width="5"/>
                        <ColumnDefinition Width="35"/>
                    </Grid.ColumnDefinitions>
                    <Button Name="UpdateButton" Content="Verificar Atualizacoes" Height="35" FontSize="11"/>
                    <Button Name="FolderButton" Grid.Column="2" Height="35" Width="35" ToolTip="Abrir Pasta">
                        <Image Name="FolderIcon" Width="18" Height="18" RenderOptions.BitmapScalingMode="HighQuality"/>
                    </Button>
                </Grid>
                <TextBlock Name="RepoLink" Grid.Row="6" Text="GitHub: henrique-coder/correios-tools" Foreground="#555555" FontSize="10" HorizontalAlignment="Center" Margin="0,15,0,0" Cursor="Hand">
                    <TextBlock.Style>
                        <Style TargetType="TextBlock">
                            <Style.Triggers>
                                <Trigger Property="IsMouseOver" Value="True">
                                    <Setter Property="Foreground" Value="#007ACC"/>
                                    <Setter Property="TextDecorations" Value="Underline"/>
                                </Trigger>
                            </Style.Triggers>
                        </Style>
                    </TextBlock.Style>
                </TextBlock>
            </Grid>
        </Border>
        <Border Name="LoadingOverlay" Background="#EE1E1E1E" Visibility="Collapsed">
            <StackPanel VerticalAlignment="Center" HorizontalAlignment="Center">
                <TextBlock Name="LoadingText" Text="Carregando..." Foreground="#007ACC" FontSize="16" FontWeight="Bold" HorizontalAlignment="Center"/>
                <ProgressBar IsIndeterminate="True" Width="200" Height="4" Margin="0,15,0,0" Background="#2D2D30" Foreground="#007ACC"/>
            </StackPanel>
        </Border>
    </Grid>
</Window>
"@

$window = [Windows.Markup.XamlReader]::Load((New-Object System.Xml.XmlNodeReader $xamlContent))

$CloseButton = $window.FindName("CloseButton")
$EdgeButton = $window.FindName("EdgeButton")
$ChromeButton = $window.FindName("ChromeButton")
$UpdateButton = $window.FindName("UpdateButton")
$FolderButton = $window.FindName("FolderButton")

$StatusText = $window.FindName("StatusText")
$VersionText = $window.FindName("VersionText")
$LoadingText = $window.FindName("LoadingText")
$LoadingOverlay = $window.FindName("LoadingOverlay")
$AppIcon = $window.FindName("AppIcon")
$FolderIcon = $window.FindName("FolderIcon")
$EdgeImage = $window.FindName("EdgeImage")
$ChromeImage = $window.FindName("ChromeImage")
$EdgeLabel = $window.FindName("EdgeLabel")
$ChromeLabel = $window.FindName("ChromeLabel")
$MainProgressBar = $window.FindName("MainProgressBar")
$RepoLink = $window.FindName("RepoLink")

$BrowserButtons = @($EdgeButton, $ChromeButton, $UpdateButton)

function Set-ButtonsEnabled {
    param([bool]$Enabled)
    foreach ($btn in $BrowserButtons) { $btn.IsEnabled = $Enabled }
}

function Set-UIStatus {
    param([string]$Message, [bool]$IsLoading = $false)
    $StatusText.Text = $Message
    $MainProgressBar.IsIndeterminate = $IsLoading
    $MainProgressBar.Opacity = if ($IsLoading) { 1 } else { 0 }
    [System.Windows.Threading.Dispatcher]::CurrentDispatcher.Invoke([Action] {}, [System.Windows.Threading.DispatcherPriority]::Background)
}

function Show-LoadingOverlay {
    param([string]$Message = "Carregando...")
    $LoadingText.Text = $Message
    $LoadingOverlay.Visibility = [System.Windows.Visibility]::Visible
    [System.Windows.Threading.Dispatcher]::CurrentDispatcher.Invoke([Action] {}, [System.Windows.Threading.DispatcherPriority]::Background)
}

function Hide-LoadingOverlay {
    $LoadingOverlay.Visibility = [System.Windows.Visibility]::Collapsed
    [System.Windows.Threading.Dispatcher]::CurrentDispatcher.Invoke([Action] {}, [System.Windows.Threading.DispatcherPriority]::Background)
}

function Update-InfoPanel {
    $VersionText.Text = "v$($script:AppVersion)"
    Update-Countdown
}

function Update-Countdown {
}

function Reset-UpdateTimer {
    $script:NextCheckTime = (Get-Date).AddHours($UPDATE_INTERVAL_HOURS)
    if ($script:UpdateTimer) {
        $script:UpdateTimer.Stop()
        $script:UpdateTimer.Start()
    }
    Update-Countdown
}

function Invoke-SafeAction {
    param([scriptblock]$Action)
    if ($script:IsProcessing) { return }
    $script:IsProcessing = $true
    Set-ButtonsEnabled $false
    try { & $Action } catch {}
    finally {
        $script:IsProcessing = $false
        Set-ButtonsEnabled $true
    }
}

function Load-WindowIcon {
    try {
        if (-not (Test-Path $ICON_PATH)) {
            Invoke-WebRequest -Uri $ICON_URL -OutFile $ICON_PATH -UseBasicParsing
        }
        if (Test-Path $ICON_PATH) {
            $uri = New-Object System.Uri($ICON_PATH)
            $bitmap = New-Object System.Windows.Media.Imaging.BitmapImage
            $bitmap.BeginInit()
            $bitmap.UriSource = $uri
            $bitmap.CacheOption = [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
            $bitmap.CreateOptions = [System.Windows.Media.Imaging.BitmapCreateOptions]::IgnoreImageCache
            $bitmap.EndInit()
            $bitmap.Freeze()
            $window.Icon = $bitmap
        }
    }
    catch {}
}

function Load-BrowserIcons {
    try {
        if (-not (Test-Path $EDGE_ICON_PATH)) { Invoke-WebRequest -Uri $EDGE_ICON_URL -OutFile $EDGE_ICON_PATH -UseBasicParsing }
        if (-not (Test-Path $CHROME_ICON_PATH)) { Invoke-WebRequest -Uri $CHROME_ICON_URL -OutFile $CHROME_ICON_PATH -UseBasicParsing }

        if (Test-Path $EDGE_ICON_PATH) {
            $edgeBitmap = New-Object System.Windows.Media.Imaging.BitmapImage
            $edgeBitmap.BeginInit()
            $edgeBitmap.UriSource = New-Object System.Uri($EDGE_ICON_PATH)
            $edgeBitmap.CacheOption = [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
            $edgeBitmap.EndInit()
            $edgeBitmap.Freeze()
            $EdgeImage.Source = $edgeBitmap
        }

        if (Test-Path $CHROME_ICON_PATH) {
            $chromeBitmap = New-Object System.Windows.Media.Imaging.BitmapImage
            $chromeBitmap.BeginInit()
            $chromeBitmap.UriSource = New-Object System.Uri($CHROME_ICON_PATH)
            $chromeBitmap.CacheOption = [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
            $chromeBitmap.EndInit()
            $chromeBitmap.Freeze()
            $ChromeImage.Source = $chromeBitmap
        }
    }
    catch {}
}

function Load-AppIcons {
    try {
        if (-not (Test-Path $ICON_PNG_PATH)) { Invoke-WebRequest -Uri $ICON_PNG_URL -OutFile $ICON_PNG_PATH -UseBasicParsing }
        if (-not (Test-Path $FOLDER_ICON_PATH)) { Invoke-WebRequest -Uri $FOLDER_ICON_URL -OutFile $FOLDER_ICON_PATH -UseBasicParsing }

        if (Test-Path $ICON_PNG_PATH) {
            $appBitmap = New-Object System.Windows.Media.Imaging.BitmapImage
            $appBitmap.BeginInit()
            $appBitmap.UriSource = New-Object System.Uri($ICON_PNG_PATH)
            $appBitmap.CacheOption = [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
            $appBitmap.EndInit()
            $appBitmap.Freeze()
            $AppIcon.Source = $appBitmap
        }

        if (Test-Path $FOLDER_ICON_PATH) {
            $folderBitmap = New-Object System.Windows.Media.Imaging.BitmapImage
            $folderBitmap.BeginInit()
            $folderBitmap.UriSource = New-Object System.Uri($FOLDER_ICON_PATH)
            $folderBitmap.CacheOption = [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
            $folderBitmap.EndInit()
            $folderBitmap.Freeze()
            $FolderIcon.Source = $folderBitmap
        }
    }
    catch {}
}

function Check-BrowserAvailability {
    $edgePath = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
    $edgePathAlt = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
    $chromePath = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
    $chromePathAlt = "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"

    $script:EdgeAvailable = (Test-Path $edgePath) -or (Test-Path $edgePathAlt) -or ((Get-Command msedge -ErrorAction SilentlyContinue) -ne $null)
    $script:ChromeAvailable = (Test-Path $chromePath) -or (Test-Path $chromePathAlt) -or ((Get-Command chrome -ErrorAction SilentlyContinue) -ne $null)

    if (-not $script:EdgeAvailable) {
        $EdgeButton.IsEnabled = $false
        $EdgeButton.Opacity = 0.4
        $EdgeLabel.Text = "Nao instalado"
        $EdgeLabel.Foreground = [System.Windows.Media.Brushes]::Gray
    }

    if (-not $script:ChromeAvailable) {
        $ChromeButton.IsEnabled = $false
        $ChromeButton.Opacity = 0.4
        $ChromeLabel.Text = "Nao instalado"
        $ChromeLabel.Foreground = [System.Windows.Media.Brushes]::Gray
    }
}

function Trigger-Restart {
    $script:NeedsRestart = $true
    $window.Close()
}

function Check-LauncherUpdate {
    param([bool]$ShowCountdown = $true)

    Set-UIStatus "Verificando launcher..." $true

    try {
        $metadata = Get-Metadata
        if ($metadata -eq $null -or $metadata.scripts -eq $null -or $metadata.scripts.launcher -eq $null) {
            Set-UIStatus "Pronto! Selecione o navegador." $false
            return $false
        }

        $launcherInfo = $metadata.scripts.launcher
        $remoteVersion = $launcherInfo.version
        $remoteHash = $launcherInfo.hashes.sha256

        if ($remoteVersion -and $remoteVersion -eq $script:AppVersion) {
            Set-UIStatus "Launcher atualizado." $false
            return $false
        }

        $localHash = Calculate-FileHash $SELF_PATH
        if ($localHash -eq $remoteHash) {
            Set-UIStatus "Launcher atualizado." $false
            return $false
        }

        Set-UIStatus "Atualizacao do launcher encontrada!" $false

        if ($ShowCountdown) {
            for ($i = 5; $i -gt 0; $i--) {
                Set-UIStatus "Reiniciando em $i..." $false
                Start-Sleep -Seconds 1
            }
        }

        Set-UIStatus "Baixando launcher..." $true
        $tempPath = "$DATA_DIR\launcher_update.tmp"
        Invoke-WebRequest -Uri $LAUNCHER_DOWNLOAD_URL -OutFile $tempPath -UseBasicParsing

        $downloadedHash = Calculate-FileHash $tempPath
        if ($downloadedHash -ne $remoteHash) {
            Set-UIStatus "Erro: Hash invalido." $false
            Remove-Item $tempPath -Force -ErrorAction SilentlyContinue
            return $false
        }

        Set-UIStatus "Instalando atualizacao..." $true
        Copy-Item $tempPath $SELF_PATH -Force
        Remove-Item $tempPath -Force -ErrorAction SilentlyContinue

        Set-UIStatus "Reiniciando..." $true
        Trigger-Restart
        return $true
    }
    catch {
        Set-UIStatus "Pronto! Selecione o navegador." $false
        return $false
    }
}

function Download-Extensions {
    param([bool]$Silent = $false)

    if (-not $Silent) { Set-UIStatus "Verificando extensoes..." $true }

    $metadata = Get-Metadata
    if ($metadata -eq $null -or $metadata.extensions -eq $null) {
        if (-not $Silent) { Set-UIStatus "Erro ao verificar extensoes." $false }
        return $false
    }

    $allSuccess = $true
    $extensionNames = $metadata.extensions.PSObject.Properties.Name

    foreach ($extName in $extensionNames) {
        $extInfo = $metadata.extensions.$extName
        if ($extInfo -eq $null) { continue }

        $localVersionFile = "$DATA_DIR\extension_$extName.json"
        $localVersion = $null
        if (Test-Path $localVersionFile) {
            try { $localVersion = (Get-Content $localVersionFile -Raw | ConvertFrom-Json).version } catch {}
        }

        $remoteVersion = $extInfo.version
        $remoteHash = $extInfo.hashes.sha256

        if ($remoteVersion -and $localVersion -eq $remoteVersion -and (Test-Path "$EXTENSIONS_DIR\$extName")) {
            continue
        }

        if (-not $Silent) { Set-UIStatus "Baixando $extName..." $true }

        $downloadUrl = "https://github.com/henrique-coder/correios-tools/releases/download/assets/extension-$extName.zip"
        $tempZip = "$DATA_DIR\extension_$extName.zip"

        try {
            Invoke-WebRequest -Uri $downloadUrl -OutFile $tempZip -UseBasicParsing

            $downloadedHash = Calculate-FileHash $tempZip
            if ($downloadedHash -ne $remoteHash) {
                if (-not $Silent) { Set-UIStatus "Erro: Hash de $extName invalido." $false }
                Remove-Item $tempZip -Force -ErrorAction SilentlyContinue
                $allSuccess = $false
                continue
            }

            $extDir = "$EXTENSIONS_DIR\$extName"
            if (Test-Path $extDir) { Remove-Item $extDir -Recurse -Force -ErrorAction SilentlyContinue }
            New-Item -ItemType Directory -Path $extDir -Force | Out-Null

            Expand-Archive -Path $tempZip -DestinationPath $extDir -Force
            Remove-Item $tempZip -Force -ErrorAction SilentlyContinue

            $versionJson = @{ version = $remoteVersion } | ConvertTo-Json -Compress
            $versionJson | Set-Content $localVersionFile -Encoding UTF8
        }
        catch {
            if (-not $Silent) { Set-UIStatus "Erro ao baixar $extName." $false }
            Remove-Item $tempZip -Force -ErrorAction SilentlyContinue
            $allSuccess = $false
        }
    }

    if ($allSuccess -and -not $Silent) { Set-UIStatus "Extensoes atualizadas!" $false }
    return $allSuccess
}

function Get-ExtensionPaths {
    $paths = @()
    if (Test-Path $EXTENSIONS_DIR) {
        $dirs = Get-ChildItem -Path $EXTENSIONS_DIR -Directory -ErrorAction SilentlyContinue
        foreach ($dir in $dirs) {
            if (Test-Path "$($dir.FullName)\manifest.json") { $paths += $dir.FullName }
        }
    }
    return ($paths -join ",")
}

function Wait-ProcessExit {
    param([string]$ProcessName)
    $timeout = 15
    $elapsed = 0
    while ($elapsed -lt $timeout) {
        $proc = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
        if ($proc -eq $null) { return $true }
        Start-Sleep -Milliseconds 200
        $elapsed += 0.2
        [System.Windows.Threading.Dispatcher]::CurrentDispatcher.Invoke([Action] {}, [System.Windows.Threading.DispatcherPriority]::Background)
    }
    return $false
}

function Configure-PreferencesFile {
    param([string]$PrefPath)
    if (-not (Test-Path $PrefPath)) { return }
    try {
        $prefs = Get-Content $PrefPath -Raw -Encoding UTF8 | ConvertFrom-Json
        $modified = $false

        if ($prefs.session -eq $null) { $prefs | Add-Member -NotePropertyName "session" -NotePropertyValue @{} -Force }
        if ($prefs.session.restore_on_startup -ne 1) { $prefs.session.restore_on_startup = 1; $modified = $true }

        if ($prefs.extensions -eq $null) { $prefs | Add-Member -NotePropertyName "extensions" -NotePropertyValue @{} -Force }
        if ($prefs.extensions.ui -eq $null) { $prefs.extensions | Add-Member -NotePropertyName "ui" -NotePropertyValue @{} -Force }
        if ($prefs.extensions.ui.developer_mode -ne $true) { $prefs.extensions.ui.developer_mode = $true; $modified = $true }

        if ($modified) { $prefs | ConvertTo-Json -Depth 100 -Compress | Set-Content $PrefPath -Encoding UTF8 }
    }
    catch {}
}

function Configure-BrowserPreferences {
    param([string]$BrowserName)
    $userDataPath = ""
    if ($BrowserName -eq "Edge") { $userDataPath = "$env:LOCALAPPDATA\Microsoft\Edge\User Data" }
    elseif ($BrowserName -eq "Chrome") { $userDataPath = "$env:LOCALAPPDATA\Google\Chrome\User Data" }

    if (-not (Test-Path $userDataPath)) { return }

    $defaultPref = "$userDataPath\Default\Preferences"
    if (Test-Path $defaultPref) { Configure-PreferencesFile $defaultPref }

    $profiles = Get-ChildItem -Path $userDataPath -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match "^Profile \d+$" }
    foreach ($profile in $profiles) {
        $profilePref = "$($profile.FullName)\Preferences"
        if (Test-Path $profilePref) { Configure-PreferencesFile $profilePref }
    }
}

function Launch-Browser {
    param([string]$BrowserName, [string]$ProcessName)

    $downloadOk = Download-Extensions
    if (-not $downloadOk) {
        $ext = Get-ExtensionPaths
        if ([string]::IsNullOrEmpty($ext)) {
            Set-UIStatus "Sem extensoes disponiveis." $false
            return
        }
    }

    $extensionPaths = Get-ExtensionPaths

    $existingProcess = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
    if ($existingProcess) {
        Set-UIStatus "Fechando $BrowserName..." $true
        Stop-Process -Name $ProcessName -Force -ErrorAction SilentlyContinue
        Wait-ProcessExit $ProcessName
    }

    Set-UIStatus "Configurando $BrowserName..." $true
    Configure-BrowserPreferences $BrowserName

    Set-UIStatus "Iniciando $BrowserName..." $true
    
    $argString = "--restore-last-session --no-first-run --no-default-browser-check $START_URL"
    if (-not [string]::IsNullOrEmpty($extensionPaths)) {
        $argString += " --load-extension=`"$extensionPaths`""
    }

    try {
        Start-Process -FilePath $ProcessName -ArgumentList $argString -ErrorAction Stop
        Set-UIStatus "$BrowserName iniciado!" $false
    }
    catch {
        Set-UIStatus "Erro ao iniciar $BrowserName." $false
    }
}

function Invoke-AutoUpdateCheck {
    try {
        if ($script:IsProcessing) { return }
        $script:IsProcessing = $true
        Set-ButtonsEnabled $false
        $script:CachedMetadata = $null

        $metadata = Get-Metadata
        if ($metadata -eq $null -or $metadata.scripts -eq $null -or $metadata.scripts.launcher -eq $null) {
            return
        }

        $launcherInfo = $metadata.scripts.launcher
        $remoteVersion = $launcherInfo.version
        $remoteHash = $launcherInfo.hashes.sha256

        if ($remoteVersion -and $remoteVersion -eq $script:AppVersion) {
            return
        }

        $localHash = Calculate-FileHash $SELF_PATH
        if ($localHash -eq $remoteHash) {
            return
        }

        for ($i = 5; $i -gt 0; $i--) {
            Set-UIStatus "Atualizacao encontrada! Reiniciando em $i..." $false
            Start-Sleep -Seconds 1
        }

        Set-UIStatus "Baixando atualizacao..." $true
        $tempPath = "$DATA_DIR\launcher_update.tmp"
        Invoke-WebRequest -Uri $LAUNCHER_DOWNLOAD_URL -OutFile $tempPath -UseBasicParsing

        $downloadedHash = Calculate-FileHash $tempPath
        if ($downloadedHash -ne $remoteHash) {
            Set-UIStatus "Erro: Hash invalido." $false
            Remove-Item $tempPath -Force -ErrorAction SilentlyContinue
            return
        }

        Copy-Item $tempPath $SELF_PATH -Force
        Remove-Item $tempPath -Force -ErrorAction SilentlyContinue

        Set-UIStatus "Reiniciando..." $true
        Trigger-Restart
    }
    catch {
        Set-UIStatus "Pronto! Selecione o navegador." $false
    }
    finally {
        Download-Extensions -Silent $true
        $script:IsProcessing = $false
        Set-ButtonsEnabled $true
        Reset-UpdateTimer
    }
}


function Initialize-UpdateTimer {
    $script:NextCheckTime = (Get-Date).AddHours($UPDATE_INTERVAL_HOURS)
    $script:UpdateTimer = New-Object System.Windows.Threading.DispatcherTimer
    $script:UpdateTimer.Interval = [TimeSpan]::FromHours($UPDATE_INTERVAL_HOURS)
    $script:UpdateTimer.Add_Tick({ 
        try { Invoke-AutoUpdateCheck } catch {}
    })
    $script:UpdateTimer.Start()

    $script:CountdownTimer = New-Object System.Windows.Threading.DispatcherTimer
    $script:CountdownTimer.Interval = [TimeSpan]::FromMinutes(1)
    $script:CountdownTimer.Add_Tick({ Update-Countdown })
    $script:CountdownTimer.Start()
}

function Start-Application {
    Set-ButtonsEnabled $false
    $script:IsProcessing = $true
    Show-LoadingOverlay "Iniciando..."

    Load-WindowIcon
    Load-AppIcons
    Load-BrowserIcons
    Check-BrowserAvailability
    Create-DesktopShortcuts

    Hide-LoadingOverlay
    Show-LoadingOverlay "Verificando atualizacoes..."

    Check-LauncherUpdate -ShowCountdown $true
    Download-Extensions

    $script:LastUpdateCheck = Get-Date
    Initialize-UpdateTimer
    Update-InfoPanel

    Hide-LoadingOverlay
    Set-UIStatus "Pronto! Selecione o navegador." $false
    $script:IsProcessing = $false
    Set-ButtonsEnabled $true
}

$CloseButton.Add_Click({ $window.Close() })

$UpdateButton.Add_Click({
        Invoke-SafeAction {
            Show-LoadingOverlay "Verificando atualizacoes..."
            $script:CachedMetadata = $null
            $needsRestart = Check-LauncherUpdate -ShowCountdown $true
            if ($needsRestart) { return }
            Download-Extensions
            $script:LastUpdateCheck = Get-Date
            Reset-UpdateTimer
            Update-InfoPanel
            Hide-LoadingOverlay
            Set-UIStatus "Pronto! Selecione o navegador." $false
        }
    })

$EdgeButton.Add_Click({
        Invoke-SafeAction { Launch-Browser "Edge" "msedge" }
    })

$ChromeButton.Add_Click({
        Invoke-SafeAction { Launch-Browser "Chrome" "chrome" }
    })

$RepoLink.Add_MouseLeftButtonDown({
        Start-Process "https://github.com/henrique-coder/correios-tools"
    })

$FolderButton.Add_Click({
        Start-Process "explorer.exe" -ArgumentList $INSTALL_DIR
    })

$window.Add_Loaded({
        $window.Topmost = $true
        $window.Activate()
        $window.Focus()
        $window.Topmost = $false
        Start-Application
    })
$window.Add_MouseLeftButtonDown({ $window.DragMove() })

$window.Add_Closed({
        if ($script:NeedsRestart) {
            Start-Sleep -Milliseconds 1000
            $shortcutPath = "$([Environment]::GetFolderPath('Desktop'))\Correios Tools.lnk"
            if (Test-Path $shortcutPath) {
                Start-Process -FilePath $shortcutPath
            }
            else {
                Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$SELF_PATH`"" -WindowStyle Hidden
            }
        }
    })

[void]$window.ShowDialog()
