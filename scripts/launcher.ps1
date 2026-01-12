$mutexName = "Global\CorreiosToolsLauncherUI"
$mutex = New-Object System.Threading.Mutex($false, $mutexName)
if (-not $mutex.WaitOne(0, $false)) { Exit }

Add-Type -MemberDefinition @"
[DllImport("user32.dll")]
public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
"@ -Name Win32 -Namespace Native -PassThru | Out-Null

$hwnd = (Get-Process -Id $pid).MainWindowHandle
if ($hwnd -ne [IntPtr]::Zero) { [Native.Win32]::ShowWindowAsync($hwnd, 0) | Out-Null }

Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName System.Windows.Forms

$script:isProcessing = $false

$baseDir = "C:\Users\Public\correios-tools"
$dataDir = "$baseDir\data"
$extensionsDir = "$dataDir\extensions"
$scriptsDir = "$dataDir\scripts"
$assetsDir = "$dataDir\assets"
$selfPath = $MyInvocation.MyCommand.Path
$iconUrl = "https://raw.githubusercontent.com/henrique-coder/correios-tools/refs/heads/dev/assets/icon.ico"
$iconPath = "$dataDir\icon.ico"
$edgeIconUrl = "https://raw.githubusercontent.com/henrique-coder/correios-tools/refs/heads/dev/assets/logos/edge.png"
$chromeIconUrl = "https://raw.githubusercontent.com/henrique-coder/correios-tools/refs/heads/dev/assets/logos/chrome.png"
$selfUpdateUrl = "https://github.com/henrique-coder/correios-tools/releases/download/minified-scripts/launcher.min.ps1"
$extensionUrls = @(
    "https://github.com/henrique-coder/correios-tools/releases/download/browser-extensions/sroweb-induction.zip",
    "https://github.com/henrique-coder/correios-tools/releases/download/browser-extensions/sroweb-loecview-hud.zip",
    "https://github.com/henrique-coder/correios-tools/releases/download/browser-extensions/tactical-checklist.zip"
)
$scriptUrls = @()
$startUrl = "https://sroweb.correios.com.br/app/index.php"

if (!(Test-Path $dataDir)) { New-Item -ItemType Directory -Path $dataDir -Force | Out-Null }
if (!(Test-Path $assetsDir)) { New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null }
$edgeIconPath = "$assetsDir\edge.png"
$chromeIconPath = "$assetsDir\chrome.png"

try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

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
        if (!(Test-Path $iconPath)) { Invoke-WebRequest -Uri $iconUrl -OutFile $iconPath -UseBasicParsing }
        if (Test-Path $iconPath) {
            $iconBitmap = New-Object System.Windows.Media.Imaging.BitmapImage
            $iconBitmap.BeginInit()
            $iconBitmap.UriSource = New-Object Uri($iconPath)
            $iconBitmap.CacheOption = "OnLoad"
            $iconBitmap.EndInit()
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
            $edgeBitmap.CacheOption = "OnLoad"
            $edgeBitmap.EndInit()
            $ImgEdge.Source = $edgeBitmap
        }
        if (Test-Path $chromeIconPath) {
            $chromeBitmap = New-Object System.Windows.Media.Imaging.BitmapImage
            $chromeBitmap.BeginInit()
            $chromeBitmap.UriSource = New-Object Uri($chromeIconPath)
            $chromeBitmap.CacheOption = "OnLoad"
            $chromeBitmap.EndInit()
            $ImgChrome.Source = $chromeBitmap
        }
    } catch {}
}

function Invoke-SelfUpdate {
    param([bool]$silent = $false)
    if (!$silent) { Update-Status "Verificando atualizacoes do aplicativo..." $true }
    try {
        $tempPath = "$dataDir\launcher_new.tmp"
        Invoke-WebRequest -Uri $selfUpdateUrl -OutFile $tempPath -UseBasicParsing
        $newContent = Get-Content $tempPath -Raw
        $oldContent = Get-Content $selfPath -Raw
        if ($newContent.Length -ne $oldContent.Length) {
            Update-Status "Atualizacao encontrada! Reiniciando..." $true
            Copy-Item $tempPath $selfPath -Force
            Remove-Item $tempPath -Force
            Start-Process powershell.exe -ArgumentList "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$selfPath`""
            $window.Close()
            Exit
        }
        Remove-Item $tempPath -Force
        if (!$silent) { Update-Status "Aplicativo atualizado! Nenhuma nova versao disponivel." $false }
        return $true
    } catch {
        if (!$silent) { Update-Status "Sem conexao. Modo offline ativado." $false }
        return $false
    }
}

function Invoke-ForceReinstall {
    Update-Status "Reinstalando aplicativo... Aguarde." $true
    try {
        $tempPath = "$dataDir\launcher_new.tmp"
        Invoke-WebRequest -Uri $selfUpdateUrl -OutFile $tempPath -UseBasicParsing
        Update-Status "Download concluido. Aplicando atualizacao..." $true
        Copy-Item $tempPath $selfPath -Force
        Remove-Item $tempPath -Force
        Update-Status "Reinstalacao concluida! Reiniciando..." $true
        Start-Process powershell.exe -ArgumentList "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$selfPath`""
        $window.Close()
        Exit
    } catch {
        Update-Status "Erro ao reinstalar. Verifique sua conexao." $false
    }
}

function Invoke-SyncExtensions {
    Update-Status "Sincronizando extensoes... Aguarde." $true
    if (Test-Path $extensionsDir) { Remove-Item $extensionsDir -Recurse -Force }
    New-Item -ItemType Directory -Path $extensionsDir -Force | Out-Null

    try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

    $count = 0
    $total = $extensionUrls.Count
    foreach ($url in $extensionUrls) {
        $count++
        Update-Status "Baixando extensao $count de $total..." $true
        try {
            $fileName = [System.IO.Path]::GetFileNameWithoutExtension($url)
            if ([string]::IsNullOrWhiteSpace($fileName)) { $fileName = "Ext_$count" }
            $zipPath = "$dataDir\$fileName.zip"
            $destFolder = "$extensionsDir\$fileName"

            New-Item -ItemType Directory -Path $destFolder -Force | Out-Null

            Start-Sleep -Milliseconds 500

            Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing -TimeoutSec 30

            Expand-Archive -Path $zipPath -DestinationPath $destFolder -Force
            Remove-Item $zipPath -Force
        } catch {
            Update-Status "Falha ao baixar extensao $count. Verifique a internet." $false
            Start-Sleep -Seconds 2
        }
    }
}

function Invoke-RunExtraScripts {
    Update-Status "Executando ferramentas extras... Aguarde." $true
    if (Test-Path $scriptsDir) { Remove-Item $scriptsDir -Recurse -Force }
    New-Item -ItemType Directory -Path $scriptsDir -Force | Out-Null
    $total = $scriptUrls.Count
    if ($total -eq 0) {
        Update-Status "Nenhuma ferramenta extra configurada." $false
        return
    }
    $count = 0
    foreach ($url in $scriptUrls) {
        $count++
        Update-Status "Executando ferramenta $count de $total..." $true
        try {
            $fileName = [System.IO.Path]::GetFileName($url)
            $localPath = "$scriptsDir\$fileName"
            Invoke-WebRequest -Uri $url -OutFile $localPath -UseBasicParsing
            & $localPath
        } catch {}
    }
    Update-Status "Ferramentas extras executadas!" $false
}

function Invoke-RecreateCache {
    Update-Status "Recriando cache... Aguarde." $true
    try {
        if (Test-Path $extensionsDir) { Remove-Item $extensionsDir -Recurse -Force }
        if (Test-Path $scriptsDir) { Remove-Item $scriptsDir -Recurse -Force }
        if (Test-Path $assetsDir) { Remove-Item $assetsDir -Recurse -Force }
        if (Test-Path $iconPath) { Remove-Item $iconPath -Force }
        New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null
        Update-Status "Baixando icone do aplicativo..." $true
        Initialize-WindowIcon
        Update-Status "Baixando icones dos navegadores..." $true
        Initialize-BrowserIcons
        Update-Status "Sincronizando extensoes..." $true
        Invoke-SyncExtensions
        Update-Status "Cache recriado com sucesso!" $false
    } catch {
        Update-Status "Erro ao recriar cache." $false
    }
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

function Invoke-StartupSequence {
    Set-ButtonsEnabled $false
    $script:isProcessing = $true
    Update-Status "Iniciando aplicativo..." $true
    Initialize-WindowIcon
    Update-Status "Carregando icones..." $true
    Initialize-BrowserIcons
    Update-Status "Verificando atualizacoes..." $true
    $hasUpdate = Invoke-SelfUpdate -silent $false

    $ext = Get-ExtensionPaths
    $installedCount = if ([string]::IsNullOrWhiteSpace($ext)) { 0 } else { ($ext -split ",").Count }
    if ($installedCount -lt $extensionUrls.Count) {
        Update-Status "Detectado novas extensoes. Baixando..." $true
        Invoke-SyncExtensions
    }

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
        $installedCount = if ([string]::IsNullOrWhiteSpace($ext)) { 0 } else { ($ext -split ",").Count }

        if ($installedCount -lt $extensionUrls.Count) {
            Invoke-SyncExtensions
            $ext = Get-ExtensionPaths
        }
        Start-Browser "Edge" "msedge" $ext
    }
})

$BtnChrome.Add_Click({
    Invoke-SafeAction {
        $ext = Get-ExtensionPaths
        $installedCount = if ([string]::IsNullOrWhiteSpace($ext)) { 0 } else { ($ext -split ",").Count }

        if ($installedCount -lt $extensionUrls.Count) {
            Invoke-SyncExtensions
            $ext = Get-ExtensionPaths
        }
        Start-Browser "Chrome" "chrome" $ext
    }
})

$window.Add_Loaded({ Invoke-StartupSequence })
$window.Add_MouseLeftButtonDown({ $window.DragMove() })
[void]$window.ShowDialog()
