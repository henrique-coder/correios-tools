$LogPath = "$([Environment]::GetFolderPath('Desktop'))\correiostools.log"
function Log-Activity {
    param([string]$Message)
    $Line = "$(Get-Date -Format 'HH:mm:ss') - $Message"
    Add-Content -Path $LogPath -Value $Line -Force
}

Log-Activity "----------------------------------------"
Log-Activity "Iniciando Launcher v3.2 (Stable)"

$MUTEX_NAME = "Global\CorreiosToolsLauncherUI"
$mutex = New-Object System.Threading.Mutex($false, $MUTEX_NAME)
if (-not $mutex.WaitOne(0, $false)) { 
    Log-Activity "App ja esta rodando. Encerrando."
    exit 
}

$windowHelperCode = @"
using System;
using System.Runtime.InteropServices;
public class WindowHelper {
    [DllImport("kernel32.dll")]
    public static extern IntPtr GetConsoleWindow();
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    private const int SW_HIDE = 0;
    public static void HideConsole() {
        IntPtr handle = GetConsoleWindow();
        if (handle != IntPtr.Zero) { ShowWindow(handle, SW_HIDE); }
    }
}
"@
try { Add-Type -TypeDefinition $windowHelperCode -Language CSharp -ErrorAction SilentlyContinue } catch {}
try { [WindowHelper]::HideConsole() } catch {}

Add-Type -AssemblyName PresentationFramework, System.Windows.Forms, System.Drawing

$script:IsProcessing = $false
$script:AppVersion = "{{VERSION}}"

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

$START_URL = "https://sroweb.correios.com.br/app/index.php"
$METADATA_URL = "https://github.com/henrique-coder/correios-tools/releases/download/assets/metadata.json"
$LAUNCHER_DOWNLOAD_URL = "https://github.com/henrique-coder/correios-tools/releases/download/assets/script-launcher.ps1"

Log-Activity "Variaveis carregadas."

function Get-Metadata {
    Log-Activity "Baixando metadados..."
    try {
        return Invoke-RestMethod -Uri $METADATA_URL -Method Get -TimeoutSec 10
    }
    catch { 
        Log-Activity "Erro rede: $($_.Exception.Message)"
        return $null 
    }
}

function Create-DesktopShortcuts {
    try {
        $desktopDir = [Environment]::GetFolderPath("Desktop")
        $shortcutPath = "$desktopDir\Correios Tools.lnk"
        $wshShell = New-Object -ComObject WScript.Shell
        if (-not (Test-Path $shortcutPath)) {
            Log-Activity "Criando atalho..."
            $shortcut = $wshShell.CreateShortcut($shortcutPath)
            $shortcut.TargetPath = "powershell.exe"
            $shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$SELF_PATH`""
            $shortcut.IconLocation = $ICON_PATH
            $shortcut.Description = "Correios Tools Launcher"
            $shortcut.Save()
        }
    } catch {}
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

Log-Activity "Carregando UI..."
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
    Log-Activity "UI Status: $Message"
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
}

function Invoke-SafeAction {
    param([scriptblock]$Action)
    if ($script:IsProcessing) { return }
    $script:IsProcessing = $true
    Set-ButtonsEnabled $false
    try { & $Action } catch { Log-Activity "Erro Action: $($_.Exception.Message)" }
    finally {
        $script:IsProcessing = $false
        Set-ButtonsEnabled $true
    }
}

function Load-Icons {
    Log-Activity "Carregando icones..."
    try {
        if (-not (Test-Path $ASSETS_DIR)) { New-Item -ItemType Directory -Path $ASSETS_DIR -Force | Out-Null }
        
        $icons = @{
            $ICON_PATH = $ICON_URL
            $ICON_PNG_PATH = $ICON_PNG_URL
            $FOLDER_ICON_PATH = $FOLDER_ICON_URL
            $EDGE_ICON_PATH = $EDGE_ICON_URL
            $CHROME_ICON_PATH = $CHROME_ICON_URL
        }

        foreach ($path in $icons.Keys) {
            if (-not (Test-Path $path)) { 
                Invoke-WebRequest -Uri $icons[$path] -OutFile $path -UseBasicParsing 
            }
        }

        $window.Icon = [System.Windows.Media.Imaging.BitmapFrame]::Create([System.Uri]$ICON_PATH)
        $AppIcon.Source = [System.Windows.Media.Imaging.BitmapFrame]::Create([System.Uri]$ICON_PNG_PATH)
        $FolderIcon.Source = [System.Windows.Media.Imaging.BitmapFrame]::Create([System.Uri]$FOLDER_ICON_PATH)
        $EdgeImage.Source = [System.Windows.Media.Imaging.BitmapFrame]::Create([System.Uri]$EDGE_ICON_PATH)
        $ChromeImage.Source = [System.Windows.Media.Imaging.BitmapFrame]::Create([System.Uri]$CHROME_ICON_PATH)
    } catch {}
}

function Check-BrowserAvailability {
    Log-Activity "Verificando navegadores..."
    $edgePath = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
    $edgePathAlt = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
    $chromePath = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
    $chromePathAlt = "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"

    $script:EdgeAvailable = (Test-Path $edgePath) -or (Test-Path $edgePathAlt)
    $script:ChromeAvailable = (Test-Path $chromePath) -or (Test-Path $chromePathAlt)

    if (-not $script:EdgeAvailable) {
        $EdgeButton.IsEnabled = $false
        $EdgeButton.Opacity = 0.4
        $EdgeLabel.Text = "Nao instalado"
    }
    if (-not $script:ChromeAvailable) {
        $ChromeButton.IsEnabled = $false
        $ChromeButton.Opacity = 0.4
        $ChromeLabel.Text = "Nao instalado"
    }
}

function Force-CloseBrowser {
    param([string]$ProcessName)
    Log-Activity "Tentando fechar $ProcessName..."
    $attempts = 0
    while ($attempts -lt 10) {
        $proc = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
        if ($proc) {
            Stop-Process -Name $ProcessName -Force -ErrorAction SilentlyContinue
            Start-Sleep -Milliseconds 800
        } else {
            Log-Activity "$ProcessName fechado."
            return
        }
        $attempts++
    }
}

function Sync-Extensions {
    Log-Activity "Sincronizando extensoes..."
    Set-UIStatus "Obtendo dados..." $true
    
    $metadata = Get-Metadata
    if ($metadata -eq $null -or $metadata.extensions -eq $null) { 
        Log-Activity "Metadata falhou. Usando local."
        Set-UIStatus "Modo Offline" $false
        Start-Sleep -Seconds 1
        return 
    }

    $extNames = $metadata.extensions.PSObject.Properties.Name
    $total = $extNames.Count
    $current = 0

    foreach ($extName in $extNames) {
        $current++
        Set-UIStatus "Baixando extensao $current / $total..." $true
        
        $downloadUrl = "https://github.com/henrique-coder/correios-tools/releases/download/assets/extension-$extName.zip"
        $tempZip = "$DATA_DIR\extension_$extName.zip"
        $extDir = "$EXTENSIONS_DIR\$extName"

        try {
            Log-Activity "Baixando $extName..."
            Invoke-WebRequest -Uri $downloadUrl -OutFile $tempZip -UseBasicParsing
            Start-Sleep -Milliseconds 300
            
            if (Test-Path $extDir) { Remove-Item $extDir -Recurse -Force -ErrorAction SilentlyContinue }
            New-Item -ItemType Directory -Path $extDir -Force | Out-Null
            
            Expand-Archive -Path $tempZip -DestinationPath $extDir -Force
            Remove-Item $tempZip -Force -ErrorAction SilentlyContinue
            Log-Activity "$extName OK."
        } catch {
            Log-Activity "FALHA ao baixar $extName - $($_.Exception.Message)"
            Set-UIStatus "Erro download $extName" $false
            Start-Sleep -Seconds 1
        }
    }
    Set-UIStatus "Extensoes prontas." $false
    Start-Sleep -Milliseconds 500
}

function Get-ExtensionString {
    $paths = @()
    if (Test-Path $EXTENSIONS_DIR) {
        $items = Get-ChildItem -Path $EXTENSIONS_DIR -Directory
        foreach ($item in $items) { $paths += $item.FullName }
    }
    Log-Activity "Paths: $($paths -join ',')"
    return $paths -join ","
}

function Start-Browser {
    param([string]$BrowserName, [string]$ProcessName)
    Log-Activity "Iniciando processo $BrowserName..."
    
    Force-CloseBrowser $ProcessName
    
    Sync-Extensions
    
    Set-UIStatus "Abrindo $BrowserName..." $true
    Start-Sleep -Milliseconds 500
    
    $extArgs = ""
    $extPaths = Get-ExtensionString
    if (-not [string]::IsNullOrEmpty($extPaths)) {
        $extArgs = "--load-extension=`"$extPaths`""
    } else {
        Log-Activity "AVISO: Sem extensoes."
    }

    $args = @(
        "--restore-last-session",
        "--no-first-run",
        "--no-default-browser-check",
        $extArgs,
        $START_URL
    )

    Log-Activity "Executando: $ProcessName"
    try {
        Start-Process -FilePath $ProcessName -ArgumentList $args
        Set-UIStatus "$BrowserName aberto!" $false
        Log-Activity "Sucesso."
        Start-Sleep -Seconds 1
        Set-UIStatus "Pronto." $false
    } catch {
        Log-Activity "ERRO START: $($_.Exception.Message)"
        Set-UIStatus "Erro ao abrir." $false
    }
}

function Check-LauncherUpdate {
    Log-Activity "Checando update..."
    try {
        $meta = Get-Metadata
        if ($meta -eq $null) { return }
        
        $remoteVer = $meta.scripts.launcher.version
        if ($remoteVer -eq $null -or $remoteVer -eq $script:AppVersion) { return }

        $selfHash = (Get-FileHash -Path $SELF_PATH -Algorithm SHA256).Hash.ToLower()
        $remoteHash = $meta.scripts.launcher.hashes.sha256.ToLower()
        
        if ($selfHash -eq $remoteHash) { return }

        Set-UIStatus "Atualizando App..." $true
        Log-Activity "Baixando update..."
        $temp = "$DATA_DIR\launcher_new.ps1"
        Invoke-WebRequest -Uri $LAUNCHER_DOWNLOAD_URL -OutFile $temp -UseBasicParsing
        
        if ((Get-FileHash $temp -Algorithm SHA256).Hash.ToLower() -eq $remoteHash) {
            Copy-Item $temp $SELF_PATH -Force
            Remove-Item $temp -Force
            Log-Activity "Update OK. Restart."
            $script:NeedsRestart = $true
            $window.Close()
        }
    } catch { Log-Activity "Erro update: $($_.Exception.Message)" }
}

$CloseButton.Add_Click({ 
    Log-Activity "Usuario fechou."
    $window.Close() 
})

$RepoLink.Add_MouseLeftButtonDown({ Start-Process "https://github.com/henrique-coder/correios-tools" })
$FolderButton.Add_Click({ Start-Process "explorer.exe" -ArgumentList $INSTALL_DIR })

$UpdateButton.Add_Click({
    Invoke-SafeAction {
        Show-LoadingOverlay "Verificando..."
        Check-LauncherUpdate
        Hide-LoadingOverlay
        Set-UIStatus "App atualizado." $false
    }
})

$EdgeButton.Add_Click({ Invoke-SafeAction { Start-Browser "Edge" "msedge" } })
$ChromeButton.Add_Click({ Invoke-SafeAction { Start-Browser "Chrome" "chrome" } })

$window.Add_Loaded({
    Log-Activity "App Carregado."
    $window.Topmost = $true
    $window.Activate()
    $window.Topmost = $false
    
    Set-UIStatus "Iniciando..." $true
    Load-Icons
    Check-BrowserAvailability
    Create-DesktopShortcuts
    Update-InfoPanel
    
    $timer = New-Object System.Windows.Threading.DispatcherTimer
    $timer.Interval = [TimeSpan]::FromSeconds(2)
    $timer.Add_Tick({ 
        $timer.Stop()
        Check-LauncherUpdate 
        Set-UIStatus "Pronto." $false
    })
    $timer.Start()
})

$window.Add_MouseLeftButtonDown({ $window.DragMove() })

$window.Add_Closed({
    Log-Activity "Fechando janela..."
    if ($script:NeedsRestart) {
        Log-Activity "Reiniciando..."
        Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$SELF_PATH`""
    }
})

[void]$window.ShowDialog()
