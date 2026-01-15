Add-Type -MemberDefinition @"
[DllImport("user32.dll")]
public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
"@ -Name Win32 -Namespace Native -PassThru | Out-Null

$windowHandle = (Get-Process -Id $PID).MainWindowHandle
if ($windowHandle -ne [IntPtr]::Zero) { [Native.Win32]::ShowWindowAsync($windowHandle, 0) | Out-Null }

Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$launcherUrl = "https://github.com/henrique-coder/correios-tools/releases/download/minified-scripts/launcher.min.ps1"
$iconUrl = "https://raw.githubusercontent.com/henrique-coder/correios-tools/refs/heads/dev/assets/icon.ico"

$baseDir = "C:\Users\Public\correios-tools"
$dataDir = "$baseDir\data"
$launcherPath = "$dataDir\launcher.ps1"
$iconPath = "$dataDir\icon.ico"

try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

[xml]$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Correios Tools - Instalador" Height="300" Width="400"
        WindowStartupLocation="CenterScreen" ResizeMode="NoResize"
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
        <Grid Margin="20">
            <Grid.RowDefinitions>
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
            <StackPanel Grid.Row="1" VerticalAlignment="Center" HorizontalAlignment="Center">
                <TextBlock Name="TxtTitle" Text="INSTALADOR" Foreground="#007ACC" FontSize="24" FontWeight="Bold" HorizontalAlignment="Center"/>
                <TextBlock Name="TxtStatus" Text="Aguardando..." Foreground="#AAAAAA" FontSize="12" HorizontalAlignment="Center" Margin="0,15,0,0" TextWrapping="Wrap" TextAlignment="Center"/>
            </StackPanel>
            <StackPanel Grid.Row="2" Margin="0,15">
                <ProgressBar Name="PbMain" Height="4" Background="#2D2D30" Foreground="#007ACC" IsIndeterminate="False" Opacity="0"/>
            </StackPanel>
            <Button Name="BtnInstall" Grid.Row="3" Content="Instalar" Height="40" FontSize="14" FontWeight="Bold"/>
        </Grid>
    </Border>
</Window>
"@

$window = [Windows.Markup.XamlReader]::Load((New-Object System.Xml.XmlNodeReader $xaml))

$BtnClose = $window.FindName("BtnClose")
$BtnInstall = $window.FindName("BtnInstall")
$TxtTitle = $window.FindName("TxtTitle")
$TxtStatus = $window.FindName("TxtStatus")
$PbMain = $window.FindName("PbMain")

function Update-Status {
    param([string]$message, [bool]$loading = $false)
    $TxtStatus.Text = $message
    $PbMain.IsIndeterminate = $loading
    $PbMain.Opacity = if ($loading) { 1 } else { 0 }
    [System.Windows.Threading.Dispatcher]::CurrentDispatcher.Invoke([Action] {}, [System.Windows.Threading.DispatcherPriority]::Background)
}

function Initialize-WindowIcon {
    try {
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

function Test-BrowsersRunning {
    $browsers = Get-Process -Name "msedge", "chrome" -ErrorAction SilentlyContinue
    return ($browsers -ne $null)
}

function Close-Browsers {
    Stop-Process -Name "msedge", "chrome" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
}

function New-Shortcut {
    param([string]$linkPath)
    try {
        $shell = New-Object -ComObject WScript.Shell
        $shortcut = $shell.CreateShortcut($linkPath)
        $shortcut.TargetPath = "powershell.exe"
        $shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launcherPath`""
        $shortcut.IconLocation = $iconPath
        $shortcut.Description = "Correios Tools Launcher"
        $shortcut.Save()
        return $true
    }
    catch {
        return $false
    }
}

function Invoke-Installation {
    $BtnInstall.IsEnabled = $false

    if (Test-BrowsersRunning) {
        $result = [System.Windows.Forms.MessageBox]::Show(
            "Precisamos fechar o Chrome e o Edge para configurar o ambiente.`n`nPodemos fechar agora?",
            "Configuracao Correios Tools",
            [System.Windows.Forms.MessageBoxButtons]::YesNo,
            [System.Windows.Forms.MessageBoxIcon]::Question
        )
        if ($result -eq "Yes") {
            Update-Status "Fechando navegadores..." $true
            Close-Browsers
        }
        else {
            Update-Status "Instalacao cancelada pelo usuario." $false
            $BtnInstall.IsEnabled = $true
            return
        }
    }

    Update-Status "Criando diretorios..." $true
    if (!(Test-Path $dataDir)) {
        New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
    }

    try {
        Update-Status "Baixando launcher..." $true
        Invoke-WebRequest -Uri $launcherUrl -OutFile $launcherPath -UseBasicParsing

        Update-Status "Baixando icone..." $true
        Invoke-WebRequest -Uri $iconUrl -OutFile $iconPath -UseBasicParsing

        Initialize-WindowIcon
    }
    catch {
        [System.Windows.Forms.MessageBox]::Show(
            "Falha ao baixar arquivos. Verifique a conexao.",
            "Erro Fatal",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error
        )
        $BtnInstall.IsEnabled = $true
        Update-Status "Erro na instalacao." $false
        return
    }

    Update-Status "Criando atalho na pasta publica..." $true
    New-Shortcut "$baseDir\Correios Tools.lnk" | Out-Null

    Update-Status "Criando atalho na area de trabalho..." $true
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    New-Shortcut "$desktopPath\Correios Tools.lnk" | Out-Null

    Update-Status "Instalacao concluida!" $false
    $TxtTitle.Text = "CONCLUIDO"
    $TxtTitle.Foreground = [System.Windows.Media.Brushes]::LimeGreen
    $BtnInstall.Content = "Abrir Pasta"
    $BtnInstall.IsEnabled = $true

    $BtnInstall.Tag = "complete"
}

function Open-InstallFolder {
    Start-Process "explorer.exe" -ArgumentList $baseDir
    $window.Close()
}

$BtnClose.Add_Click({ $window.Close() })

$BtnInstall.Add_Click({
        if ($BtnInstall.Tag -eq "complete") {
            Open-InstallFolder
        }
        else {
            Invoke-Installation
        }
    })

$window.Add_Loaded({
        Update-Status "Clique em Instalar para iniciar." $false
    })

$window.Add_MouseLeftButtonDown({ $window.DragMove() })

[void]$window.ShowDialog()
