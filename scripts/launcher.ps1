$mutexName = "Global\CorreiosToolsLauncherUI"
$mutex = New-Object System.Threading.Mutex($false, $mutexName)
if (-not $mutex.WaitOne(0, $false)) { Exit }

Add-Type -Name Window -Namespace Console -MemberDefinition '
[DllImport("Kernel32.dll")]
public static extern IntPtr GetConsoleWindow();
[DllImport("user32.dll")]
public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
'
$consolePtr = [Console.Window]::GetConsoleWindow()
[Console.Window]::ShowWindow($consolePtr, 0)

[void][System.Reflection.Assembly]::LoadWithPartialName('presentationframework')
[void][System.Reflection.Assembly]::LoadWithPartialName('System.Drawing')
[void][System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms')

$baseDir = "C:\Users\Public\correios-tools"
$dataDir = "$baseDir\data"
$extensionsDir = "$dataDir\extensions"
$scriptsDir = "$dataDir\scripts"
$assetsDir = "$dataDir\assets"
$selfPath = $MyInvocation.MyCommand.Path
$iconPath = "$dataDir\icon.ico"

$edgeIconUrl = "https://raw.githubusercontent.com/henrique-coder/correios-tools/refs/heads/dev/assets/edge_icon.png"
$chromeIconUrl = "https://raw.githubusercontent.com/henrique-coder/correios-tools/refs/heads/dev/assets/chrome_icon.png"
$selfUpdateUrl = "https://github.com/henrique-coder/correios-tools/releases/download/minified-scripts/launcher.min.ps1"
$extensionUrls = @("https://github.com/henrique-coder/correios-tools/releases/download/browser-extensions/sroweb_inducao.zip")
$scriptUrls = @()
$startUrl = "https://sroweb.correios.com.br/app/entregaexternaautomatica/lancamento/index.php"

if (!(Test-Path $assetsDir)) { New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null }
$edgeIconPath = "$assetsDir\edge.png"
$chromeIconPath = "$assetsDir\chrome.png"

try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Correios Tools Launcher" Height="550" Width="420"
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

            <TextBlock Name="TxtStatus" Grid.Row="1" Text="Pronto para iniciar..." Foreground="#AAAAAA" Margin="0,20,0,10" HorizontalAlignment="Center"/>

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

                <Button Name="BtnAll" Content="ABRIR EM AMBOS OS NAVEGADORES" Margin="0,30,0,0" Height="45" FontSize="13" FontWeight="Bold" Background="#007ACC"/>
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
                <Button Name="BtnUpdate" Grid.Column="0" Content="Atualizar Script" Height="35" FontSize="11"/>
                <Button Name="BtnExt" Grid.Column="2" Content="Sincronizar Extensoes" Height="35" FontSize="11"/>
                <Button Name="BtnScripts" Grid.Column="4" Content="Scripts Extras" Height="35" FontSize="11"/>
            </Grid>
        </Grid>
    </Border>
</Window>
"@

$reader = (New-Object System.Xml.XmlNodeReader ([xml]$xaml))
$window = [Windows.Markup.XamlReader]::Load($reader)

$BtnClose = $window.FindName("BtnClose")
$BtnEdge = $window.FindName("BtnEdge")
$BtnChrome = $window.FindName("BtnChrome")
$BtnAll = $window.FindName("BtnAll")
$BtnUpdate = $window.FindName("BtnUpdate")
$BtnExt = $window.FindName("BtnExt")
$BtnScripts = $window.FindName("BtnScripts")
$TxtStatus = $window.FindName("TxtStatus")
$ImgEdge = $window.FindName("ImgEdge")
$ImgChrome = $window.FindName("ImgChrome")
$PbMain = $window.FindName("PbMain")

function Set-Status {
    param([string]$msg, [bool]$loading = $false)
    $TxtStatus.Text = $msg
    $PbMain.IsIndeterminate = $loading
    $PbMain.Opacity = if ($loading) { 1 } else { 0 }
    [System.Windows.Threading.Dispatcher]::CurrentDispatcher.Invoke([Action]{}, [System.Windows.Threading.DispatcherPriority]::Background)
}

function Load-WindowIcon {
    try {
        if (Test-Path $iconPath) {
            $iconUri = New-Object Uri($iconPath)
            $iconBitmap = New-Object System.Windows.Media.Imaging.BitmapImage($iconUri)
            $window.Icon = $iconBitmap
        }
    } catch {}
}

function Download-Assets {
    try {
        if (!(Test-Path $edgeIconPath)) { Invoke-WebRequest -Uri $edgeIconUrl -OutFile $edgeIconPath -UseBasicParsing }
        if (!(Test-Path $chromeIconPath)) { Invoke-WebRequest -Uri $chromeIconUrl -OutFile $chromeIconPath -UseBasicParsing }

        $edgeBitmap = New-Object System.Windows.Media.Imaging.BitmapImage
        $edgeBitmap.BeginInit()
        $edgeBitmap.UriSource = New-Object Uri($edgeIconPath)
        $edgeBitmap.CacheOption = "OnLoad"
        $edgeBitmap.EndInit()
        $ImgEdge.Source = $edgeBitmap

        $chromeBitmap = New-Object System.Windows.Media.Imaging.BitmapImage
        $chromeBitmap.BeginInit()
        $chromeBitmap.UriSource = New-Object Uri($chromeIconPath)
        $chromeBitmap.CacheOption = "OnLoad"
        $chromeBitmap.EndInit()
        $ImgChrome.Source = $chromeBitmap
    } catch {}
}

function Update-Self-Logic {
    Set-Status "Verificando atualizacoes..." $true
    try {
        $tempPath = "$dataDir\launcher_new.tmp"
        Invoke-WebRequest -Uri $selfUpdateUrl -OutFile $tempPath -UseBasicParsing
        $newContent = Get-Content $tempPath -Raw
        $oldContent = Get-Content $selfPath -Raw

        if ($newContent.Length -ne $oldContent.Length) {
            Set-Status "Atualizacao encontrada. Reiniciando..." $true
            Copy-Item $tempPath $selfPath -Force
            Remove-Item $tempPath -Force
            Start-Process powershell.exe -ArgumentList "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$selfPath`""
            Exit
        }
        Remove-Item $tempPath -Force
        Set-Status "Sistema atualizado." $false
    }
    catch {
        Set-Status "Erro na verificacao. Modo offline." $false
    }
}

function Sync-Extensions-Logic {
    Set-Status "Sincronizando extensoes..." $true
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
        } catch { }
    }
    Set-Status "Extensoes sincronizadas." $false
}

function Run-Scripts-Logic {
    Set-Status "Executando scripts extras..." $true
    if (Test-Path $scriptsDir) { Remove-Item $scriptsDir -Recurse -Force }
    New-Item -ItemType Directory -Path $scriptsDir -Force | Out-Null

    foreach ($url in $scriptUrls) {
        try {
            $fileName = [System.IO.Path]::GetFileName($url)
            $localPath = "$scriptsDir\$fileName"
            Invoke-WebRequest -Uri $url -OutFile $localPath -UseBasicParsing
            & $localPath
        } catch {}
    }
    Set-Status "Scripts executados." $false
}

function Get-ExtensionPaths {
    $paths = @()
    if (Test-Path $extensionsDir) {
        $dirs = Get-ChildItem -Path $extensionsDir -Directory -Recurse
        foreach ($dir in $dirs) {
            if (Test-Path "$($dir.FullName)\manifest.json") {
                $paths += $dir.FullName
            }
        }
    }
    return ($paths -join ",")
}

function Prepare-Browser {
    param($name)
    $prefPath = ""
    if ($name -eq "Edge") { $prefPath = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Preferences" }
    elseif ($name -eq "Chrome") { $prefPath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Preferences" }

    if (Test-Path $prefPath) {
        try {
            $content = Get-Content $prefPath -Raw
            if ($content -notmatch '"restore_on_startup":1') {
                $new = $content -replace '"restore_on_startup":\d', '"restore_on_startup":1'
                if ($new -ne $content) { Set-Content $prefPath $new -Encoding UTF8 }
            }
        } catch {}
    }
}

function Launch-Browser {
    param($browser, $process, $extPaths)
    Set-Status "Iniciando $browser..." $true

    Stop-Process -Name $process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
    Prepare-Browser $browser

    $args = @("--restore-last-session", "--no-first-run", "--no-default-browser-check", $startUrl)
    if (-not [string]::IsNullOrWhiteSpace($extPaths)) { $args += "--load-extension=`"$extPaths`"" }

    try {
        Start-Process $process -ArgumentList $args
        Set-Status "$browser Iniciado com sucesso!" $false
    } catch {
        Set-Status "Erro ao iniciar $browser." $false
    }
}

$BtnClose.Add_Click({ $window.Close() })

$BtnUpdate.Add_Click({ Update-Self-Logic })
$BtnExt.Add_Click({ Sync-Extensions-Logic })
$BtnScripts.Add_Click({ Run-Scripts-Logic })

$BtnEdge.Add_Click({
    $ext = Get-ExtensionPaths
    if ([string]::IsNullOrWhiteSpace($ext)) { Sync-Extensions-Logic; $ext = Get-ExtensionPaths }
    Launch-Browser "Edge" "msedge" $ext
})

$BtnChrome.Add_Click({
    $ext = Get-ExtensionPaths
    if ([string]::IsNullOrWhiteSpace($ext)) { Sync-Extensions-Logic; $ext = Get-ExtensionPaths }
    Launch-Browser "Chrome" "chrome" $ext
})

$BtnAll.Add_Click({
    $ext = Get-ExtensionPaths
    if ([string]::IsNullOrWhiteSpace($ext)) { Sync-Extensions-Logic; $ext = Get-ExtensionPaths }
    Launch-Browser "Edge" "msedge" $ext
    Start-Sleep -Seconds 1
    Launch-Browser "Chrome" "chrome" $ext
})

$window.Add_Loaded({
    Set-Status "Carregando recursos..." $true
    Load-WindowIcon
    Download-Assets
    Update-Self-Logic
    Set-Status "Pronto." $false
})

$window.Add_MouseLeftButtonDown({ $window.DragMove() })
$window.ShowDialog() | Out-Null
