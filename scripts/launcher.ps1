$mutexName = "Global\CorreiosToolsLauncherUI"
$mutex = New-Object System.Threading.Mutex($false, $mutexName)
if (-not $mutex.WaitOne(0, $false)) { exit }

Write-Host "`n  [Correios Tools] " -NoNewline -ForegroundColor Cyan
Write-Host "Nao feche esta janela, ela sera fechada automaticamente ou junto com o aplicativo!" -ForegroundColor Yellow
Write-Host ""

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

Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$script:isProcessing = $false
$script:updateTimer = $null
$script:countdownTimer = $null
$script:needsRestart = $false
$script:appVersion = "1.0.2"
$script:lastUpdateCheck = $null
$script:nextCheckTime = $null

$baseDir = "C:\Users\Public\correios-tools"
$dataDir = "$baseDir\data"
$extensionsDir = "$dataDir\extensions"
$assetsDir = "$dataDir\assets"
$hashFile = "$dataDir\launcher.hash"
$selfPath = $MyInvocation.MyCommand.Path

$iconUrl = "https://cdn.jsdelivr.net/gh/henrique-coder/correios-tools/assets/icon.ico"
$iconPath = "$dataDir\icon.ico"
$edgeIconUrl = "https://cdn.jsdelivr.net/gh/henrique-coder/correios-tools/assets/logos/edge.png"
$chromeIconUrl = "https://cdn.jsdelivr.net/gh/henrique-coder/correios-tools/assets/logos/chrome.png"
$edgeIconPath = "$assetsDir\edge.png"
$chromeIconPath = "$assetsDir\chrome.png"

$scriptsApiUrl = "https://api.github.com/repos/henrique-coder/correios-tools/releases/tags/minified-scripts"
$extensionsApiUrl = "https://api.github.com/repos/henrique-coder/correios-tools/releases/tags/browser-extensions"
$launcherDownloadUrl = "https://github.com/henrique-coder/correios-tools/releases/download/minified-scripts/launcher.min.ps1"

$extensionNames = @("correios-tools")

$updateIntervalHours = 4
$startUrl = "https://sroweb.correios.com.br/app/index.php"

if (!(Test-Path $dataDir)) { New-Item -ItemType Directory -Path $dataDir -Force | Out-Null }
if (!(Test-Path $assetsDir)) { New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null }

try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

function Get-StoredHash {
    try {
        if (Test-Path $hashFile) {
            $content = Get-Content $hashFile -Raw -ErrorAction SilentlyContinue
            if ($content) { return $content.Trim() }
        }
    }
    catch {}
    return ""
}

function Save-Hash {
    param([string]$hash)
    try { [System.IO.File]::WriteAllText($hashFile, $hash) } catch {}
}

function Get-ReleaseInfo {
    param([string]$apiUrl)
    try {
        $headers = @{ "User-Agent" = "PowerShell"; "Accept" = "application/vnd.github+json" }
        return Invoke-RestMethod -Uri $apiUrl -Headers $headers -Method Get -TimeoutSec 30
    }
    catch { return $null }
}

function Get-AssetDigest {
    param($releaseInfo, [string]$assetName)
    try {
        if ($releaseInfo -and $releaseInfo.assets) {
            foreach ($asset in $releaseInfo.assets) {
                if ($asset.name -eq $assetName -and $asset.digest) { return $asset.digest }
            }
        }
    }
    catch {}
    return ""
}

function Get-AssetDownloadUrl {
    param($releaseInfo, [string]$assetName)
    try {
        if ($releaseInfo -and $releaseInfo.assets) {
            foreach ($asset in $releaseInfo.assets) {
                if ($asset.name -eq $assetName) { return $asset.browser_download_url }
            }
        }
    }
    catch {}
    return ""
}

function Create-Shortcuts {
    try {
        $desktopPath = [Environment]::GetFolderPath("Desktop")
        $shortcutPath = "$desktopPath\Correios Tools.lnk"
        
        $shell = New-Object -ComObject WScript.Shell
        
        if (!(Test-Path $shortcutPath)) {
            $shortcut = $shell.CreateShortcut($shortcutPath)
            $shortcut.TargetPath = "powershell.exe"
            $shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$selfPath`""
            $shortcut.IconLocation = $iconPath
            $shortcut.Description = "Correios Tools Launcher"
            $shortcut.Save()
        }

        try {
            $shellApp = New-Object -ComObject Shell.Application
            $desktopFolder = $shellApp.NameSpace($desktopPath)
            $desktopItem = $desktopFolder.ParseName("Correios Tools.lnk")
            
            if ($desktopItem) {
                $verbs = $desktopItem.Verbs()
                foreach ($verb in $verbs) {
                    if ($verb.Name -like "*bar*") {
                        $verb.DoIt()
                        break
                    }
                }
            }
        } catch {}
    }
    catch {}
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
                </Grid.RowDefinitions>
                <Grid Grid.Row="0">
                    <Grid.ColumnDefinitions>
                        <ColumnDefinition Width="*"/>
                        <ColumnDefinition Width="Auto"/>
                    </Grid.ColumnDefinitions>
                    <StackPanel Orientation="Horizontal" VerticalAlignment="Center">
                        <TextBlock Text="CORREIOS TOOLS" Foreground="White" FontSize="18" FontWeight="Bold"/>
                        <TextBlock Name="TxtVersion" Text="" Foreground="#666666" FontSize="10" VerticalAlignment="Bottom" Margin="8,0,0,2"/>
                    </StackPanel>
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
                                <TextBlock Text="Microsoft Edge" Foreground="White" HorizontalAlignment="Center" Margin="0,10,0,0"/>
                            </StackPanel>
                        </Button>
                        <Button Name="BtnChrome" Grid.Column="2" Width="130" Height="130" Background="Transparent">
                            <StackPanel>
                                <Image Name="ImgChrome" Width="90" Height="90" RenderOptions.BitmapScalingMode="HighQuality"/>
                                <TextBlock Text="Google Chrome" Foreground="White" HorizontalAlignment="Center" Margin="0,10,0,0"/>
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
                    <Button Name="BtnUpdate" Grid.Column="0" Content="Verificar Atualizacoes" Height="35" FontSize="11"/>
                    <Button Name="BtnScripts" Grid.Column="2" Content="Executar Scripts Extras" Height="35" FontSize="11"/>
                </Grid>
                <Border Grid.Row="5" Background="#252526" CornerRadius="3" Margin="0,15,0,0" Padding="10">
                    <TextBlock Name="TxtCountdown" Text="Proxima verificacao em: --" Foreground="#007ACC" FontSize="10" FontWeight="Bold" HorizontalAlignment="Center"/>
                </Border>
            </Grid>
        </Border>
        <Border Name="LoadingOverlay" Background="#EE1E1E1E" Visibility="Collapsed">
            <StackPanel VerticalAlignment="Center" HorizontalAlignment="Center">
                <TextBlock Name="TxtLoading" Text="Carregando..." Foreground="#007ACC" FontSize="16" FontWeight="Bold" HorizontalAlignment="Center"/>
                <ProgressBar IsIndeterminate="True" Width="200" Height="4" Margin="0,15,0,0" Background="#2D2D30" Foreground="#007ACC"/>
            </StackPanel>
        </Border>
    </Grid>
</Window>
"@

$window = [Windows.Markup.XamlReader]::Load((New-Object System.Xml.XmlNodeReader $xaml))

$BtnClose = $window.FindName("BtnClose")
$BtnEdge = $window.FindName("BtnEdge")
$BtnChrome = $window.FindName("BtnChrome")
$BtnUpdate = $window.FindName("BtnUpdate")
$BtnScripts = $window.FindName("BtnScripts")
$TxtStatus = $window.FindName("TxtStatus")
$TxtVersion = $window.FindName("TxtVersion")
$TxtCountdown = $window.FindName("TxtCountdown")
$TxtLoading = $window.FindName("TxtLoading")
$LoadingOverlay = $window.FindName("LoadingOverlay")
$ImgEdge = $window.FindName("ImgEdge")
$ImgChrome = $window.FindName("ImgChrome")
$PbMain = $window.FindName("PbMain")

$allButtons = @($BtnEdge, $BtnChrome, $BtnUpdate, $BtnScripts)

function Set-ButtonsEnabled {
    param([bool]$enabled)
    foreach ($btn in $allButtons) { $btn.IsEnabled = $enabled }
}

function Update-Status {
    param([string]$message, [bool]$loading = $false)
    $TxtStatus.Text = $message
    $PbMain.IsIndeterminate = $loading
    $PbMain.Opacity = if ($loading) { 1 } else { 0 }
    [System.Windows.Threading.Dispatcher]::CurrentDispatcher.Invoke([Action] {}, [System.Windows.Threading.DispatcherPriority]::Background)
}

function Show-LoadingOverlay {
    param([string]$message = "Carregando...")
    $TxtLoading.Text = $message
    $LoadingOverlay.Visibility = [System.Windows.Visibility]::Visible
    [System.Windows.Threading.Dispatcher]::CurrentDispatcher.Invoke([Action] {}, [System.Windows.Threading.DispatcherPriority]::Background)
}

function Hide-LoadingOverlay {
    $LoadingOverlay.Visibility = [System.Windows.Visibility]::Collapsed
    [System.Windows.Threading.Dispatcher]::CurrentDispatcher.Invoke([Action] {}, [System.Windows.Threading.DispatcherPriority]::Background)
}

function Update-InfoPanel {
    $TxtVersion.Text = "v$($script:appVersion)"
    Update-Countdown
}

function Update-Countdown {
    if ($script:nextCheckTime) {
        $remaining = $script:nextCheckTime - (Get-Date)
        if ($remaining.TotalSeconds -gt 0) {
            $hours = [math]::Floor($remaining.TotalHours)
            $mins = $remaining.Minutes
            $TxtCountdown.Text = "Proxima verificacao em: ${hours}h ${mins}m"
        }
        else {
            $TxtCountdown.Text = "Verificando em breve..."
        }
    }
    else {
        $TxtCountdown.Text = "Proxima verificacao em: --"
    }
}

function Reset-UpdateTimer {
    $script:nextCheckTime = (Get-Date).AddHours($updateIntervalHours)
    if ($script:updateTimer) {
        $script:updateTimer.Stop()
        $script:updateTimer.Start()
    }
    Update-Countdown
}

function Invoke-SafeAction {
    param([scriptblock]$action)
    if ($script:isProcessing) { return }
    $script:isProcessing = $true
    Set-ButtonsEnabled $false
    try { & $action } catch {}
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
    }
    catch {}
}

function Initialize-BrowserIcons {
    try {
        if (!(Test-Path $edgeIconPath)) { Invoke-WebRequest -Uri $edgeIconUrl -OutFile $edgeIconPath -UseBasicParsing }
        if (!(Test-Path $chromeIconPath)) { Invoke-WebRequest -Uri $chromeIconUrl -OutFile $chromeIconPath -UseBasicParsing }

        if (Test-Path $edgeIconPath) {
            $edgeBitmap = New-Object System.Windows.Media.Imaging.BitmapImage
            $edgeBitmap.BeginInit()
            $edgeBitmap.UriSource = New-Object System.Uri($edgeIconPath)
            $edgeBitmap.CacheOption = [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
            $edgeBitmap.EndInit()
            $edgeBitmap.Freeze()
            $ImgEdge.Source = $edgeBitmap
        }

        if (Test-Path $chromeIconPath) {
            $chromeBitmap = New-Object System.Windows.Media.Imaging.BitmapImage
            $chromeBitmap.BeginInit()
            $chromeBitmap.UriSource = New-Object System.Uri($chromeIconPath)
            $chromeBitmap.CacheOption = [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
            $chromeBitmap.EndInit()
            $chromeBitmap.Freeze()
            $ImgChrome.Source = $chromeBitmap
        }
    }
    catch {}
}

function Invoke-TriggerRestart {
    $script:needsRestart = $true
    $window.Close()
}

function Invoke-CheckLauncherUpdate {
    param([bool]$showCountdown = $true)

    Update-Status "Verificando atualizacoes..." $true

    try {
        $releaseInfo = Get-ReleaseInfo $scriptsApiUrl
        if ($releaseInfo -eq $null) {
            Update-Status "Pronto! Selecione o navegador." $false
            return
        }

        $remoteHash = Get-AssetDigest $releaseInfo "launcher.min.ps1"
        if ([string]::IsNullOrEmpty($remoteHash)) {
            Update-Status "Pronto! Selecione o navegador." $false
            return
        }

        $localHash = Get-StoredHash
        if ($remoteHash -eq $localHash) {
            Update-Status "Pronto! Selecione o navegador." $false
            return
        }

        if ($showCountdown) {
            for ($i = 5; $i -gt 0; $i--) {
                Update-Status "Atualizacao encontrada! Reiniciando em $i..." $false
                Start-Sleep -Seconds 1
            }
        }

        Update-Status "Baixando atualizacao..." $true
        $tempPath = "$dataDir\launcher_update.tmp"
        Invoke-WebRequest -Uri $launcherDownloadUrl -OutFile $tempPath -UseBasicParsing

        Save-Hash $remoteHash

        Copy-Item $tempPath $selfPath -Force
        Remove-Item $tempPath -Force -ErrorAction SilentlyContinue

        Update-Status "Reiniciando..." $true
        Invoke-TriggerRestart
    }
    catch {
        Update-Status "Pronto! Selecione o navegador." $false
    }
}

function Invoke-DownloadExtensions {
    Update-Status "Baixando extensoes..." $true

    try {
        if (Test-Path $extensionsDir) {
            Remove-Item $extensionsDir -Recurse -Force -ErrorAction SilentlyContinue
        }
        New-Item -ItemType Directory -Path $extensionsDir -Force | Out-Null

        $releaseInfo = Get-ReleaseInfo $extensionsApiUrl
        if ($releaseInfo -eq $null) {
            Update-Status "Erro: sem conexao." $false
            return $false
        }

        $count = 0
        $total = $extensionNames.Count

        foreach ($extName in $extensionNames) {
            $count++
            Update-Status "Baixando $extName ($count/$total)..." $true

            $zipName = "$extName.zip"
            $downloadUrl = Get-AssetDownloadUrl $releaseInfo $zipName

            if ($downloadUrl) {
                $tempZip = "$dataDir\temp_$zipName"
                $extFolder = "$extensionsDir\$extName"

                New-Item -ItemType Directory -Path $extFolder -Force | Out-Null
                Invoke-WebRequest -Uri $downloadUrl -OutFile $tempZip -UseBasicParsing -TimeoutSec 60
                Expand-Archive -Path $tempZip -DestinationPath $extFolder -Force
                Remove-Item $tempZip -Force -ErrorAction SilentlyContinue
            }
        }

        return $true
    }
    catch {
        Update-Status "Erro ao baixar extensoes." $false
        return $false
    }
}

function Invoke-RunExtraScripts {
    Update-Status "Nenhum script extra configurado." $false
}

function Get-ExtensionPaths {
    $paths = @()
    if (Test-Path $extensionsDir) {
        $dirs = Get-ChildItem -Path $extensionsDir -Directory -ErrorAction SilentlyContinue
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
        [System.Windows.Threading.Dispatcher]::CurrentDispatcher.Invoke([Action] {}, [System.Windows.Threading.DispatcherPriority]::Background)
    }
    return $false
}

function Set-PreferencesFile {
    param([string]$prefPath)
    if (!(Test-Path $prefPath)) { return }
    try {
        $prefs = Get-Content $prefPath -Raw -Encoding UTF8 | ConvertFrom-Json
        $modified = $false

        if ($prefs.session -eq $null) { $prefs | Add-Member -NotePropertyName "session" -NotePropertyValue @{} -Force }
        if ($prefs.session.restore_on_startup -ne 1) { $prefs.session.restore_on_startup = 1; $modified = $true }

        if ($prefs.extensions -eq $null) { $prefs | Add-Member -NotePropertyName "extensions" -NotePropertyValue @{} -Force }
        if ($prefs.extensions.ui -eq $null) { $prefs.extensions | Add-Member -NotePropertyName "ui" -NotePropertyValue @{} -Force }
        if ($prefs.extensions.ui.developer_mode -ne $true) { $prefs.extensions.ui.developer_mode = $true; $modified = $true }

        if ($modified) { $prefs | ConvertTo-Json -Depth 100 -Compress | Set-Content $prefPath -Encoding UTF8 }
    }
    catch {}
}

function Set-BrowserPreferences {
    param([string]$browserName)
    $userDataPath = ""
    if ($browserName -eq "Edge") { $userDataPath = "$env:LOCALAPPDATA\Microsoft\Edge\User Data" }
    elseif ($browserName -eq "Chrome") { $userDataPath = "$env:LOCALAPPDATA\Google\Chrome\User Data" }

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

    $downloadOk = Invoke-DownloadExtensions
    if (-not $downloadOk) {
        $ext = Get-ExtensionPaths
        if ([string]::IsNullOrEmpty($ext)) {
            Update-Status "Sem extensoes disponiveis." $false
            return
        }
    }

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
    if (-not [string]::IsNullOrEmpty($extensionPaths)) { $browserArgs += "--load-extension=`"$extensionPaths`"" }

    try {
        Start-Process $processName -ArgumentList $browserArgs
        Update-Status "$browserName iniciado!" $false
    }
    catch {
        Update-Status "Erro ao iniciar $browserName." $false
    }
}

function Invoke-AutoUpdateCheck {
    while ($script:isProcessing) {
        Start-Sleep -Seconds 1
        [System.Windows.Threading.Dispatcher]::CurrentDispatcher.Invoke([Action] {}, [System.Windows.Threading.DispatcherPriority]::Background)
    }

    $script:isProcessing = $true
    Set-ButtonsEnabled $false

    try {
        $releaseInfo = Get-ReleaseInfo $scriptsApiUrl
        if ($releaseInfo -ne $null) {
            $remoteHash = Get-AssetDigest $releaseInfo "launcher.min.ps1"
            $localHash = Get-StoredHash

            if (-not [string]::IsNullOrEmpty($remoteHash) -and $remoteHash -ne $localHash) {
                for ($i = 5; $i -gt 0; $i--) {
                    Update-Status "Atualizacao encontrada! Reiniciando em $i..." $false
                    Start-Sleep -Seconds 1
                }

                Update-Status "Baixando atualizacao..." $true
                $tempPath = "$dataDir\launcher_update.tmp"
                Invoke-WebRequest -Uri $launcherDownloadUrl -OutFile $tempPath -UseBasicParsing

                Save-Hash $remoteHash

                Copy-Item $tempPath $selfPath -Force
                Remove-Item $tempPath -Force -ErrorAction SilentlyContinue

                Update-Status "Reiniciando..." $true
                Invoke-TriggerRestart
                return
            }
        }
    }
    catch {}

    $script:isProcessing = $false
    Set-ButtonsEnabled $true
}

function Initialize-UpdateTimer {
    $script:nextCheckTime = (Get-Date).AddHours($updateIntervalHours)
    $script:updateTimer = New-Object System.Windows.Threading.DispatcherTimer
    $script:updateTimer.Interval = [TimeSpan]::FromHours($updateIntervalHours)
    $script:updateTimer.Add_Tick({ Invoke-AutoUpdateCheck })
    $script:updateTimer.Start()

    $script:countdownTimer = New-Object System.Windows.Threading.DispatcherTimer
    $script:countdownTimer.Interval = [TimeSpan]::FromMinutes(1)
    $script:countdownTimer.Add_Tick({ Update-Countdown })
    $script:countdownTimer.Start()
}

function Invoke-StartupSequence {
    Set-ButtonsEnabled $false
    $script:isProcessing = $true
    Show-LoadingOverlay "Iniciando..."

    Initialize-WindowIcon
    Initialize-BrowserIcons
    Create-Shortcuts

    Hide-LoadingOverlay
    Show-LoadingOverlay "Verificando atualizacoes..."

    Invoke-CheckLauncherUpdate -showCountdown $true

    $script:lastUpdateCheck = Get-Date
    Initialize-UpdateTimer
    Update-InfoPanel

    Hide-LoadingOverlay
    Update-Status "Pronto! Selecione o navegador." $false
    $script:isProcessing = $false
    Set-ButtonsEnabled $true
}

$BtnClose.Add_Click({ $window.Close() })

$BtnUpdate.Add_Click({
        Invoke-SafeAction {
            Show-LoadingOverlay "Verificando atualizacoes..."
            Invoke-CheckLauncherUpdate -showCountdown $true
            $script:lastUpdateCheck = Get-Date
            Reset-UpdateTimer
            Update-InfoPanel
            Hide-LoadingOverlay
        }
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

$window.Add_Loaded({
        $window.Topmost = $true
        $window.Activate()
        $window.Focus()
        $window.Topmost = $false
        Invoke-StartupSequence
    })
$window.Add_MouseLeftButtonDown({ $window.DragMove() })

$window.Add_Closed({
        if ($script:needsRestart) {
            Start-Sleep -Milliseconds 1000
            $shortcutPath = "$([Environment]::GetFolderPath('Desktop'))\Correios Tools.lnk"
            if (Test-Path $shortcutPath) {
                Start-Process -FilePath $shortcutPath
            }
            else {
                Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$selfPath`"" -WindowStyle Hidden
            }
        }
    })

[void]$window.ShowDialog()
