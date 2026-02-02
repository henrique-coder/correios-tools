Add-Type -MemberDefinition @"
[DllImport("user32.dll")]
public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
"@ -Name Win32 -Namespace Native -PassThru | Out-Null

$currentProcess = Get-Process -Id $PID
$mainWindowHandle = $currentProcess.MainWindowHandle
if ($mainWindowHandle -ne [IntPtr]::Zero) {
    [Native.Win32]::ShowWindowAsync($mainWindowHandle, 0) | Out-Null
}

Add-Type -AssemblyName PresentationFramework, System.Windows.Forms, System.Drawing


$LAUNCHER_URL = "https://github.com/henrique-coder/correios-tools/releases/download/powershell-scripts/launcher.min.ps1"
$ICON_URL = "https://raw.githubusercontent.com/henrique-coder/correios-tools/refs/heads/dev/assets/icon.ico"
$INSTALL_DIR = "C:\Users\Public\correios-tools"
$DATA_DIR = "$INSTALL_DIR\data"
$LAUNCHER_PATH = "$DATA_DIR\launcher.ps1"
$ICON_PATH = "$DATA_DIR\icon.ico"


try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
}
catch {
    Write-Warning "Failed to set TLS 1.2 protocol."
}

[xml]$xamlContent = @"
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
                <Button Name="CloseButton" Content="X" Grid.Column="1" Background="Transparent" Foreground="#FF5555" FontWeight="Bold" Width="30"/>
            </Grid>
            <StackPanel Grid.Row="1" VerticalAlignment="Center" HorizontalAlignment="Center">
                <TextBlock Name="TitleText" Text="INSTALADOR" Foreground="#007ACC" FontSize="24" FontWeight="Bold" HorizontalAlignment="Center"/>
                <TextBlock Name="StatusText" Text="Aguardando..." Foreground="#AAAAAA" FontSize="12" HorizontalAlignment="Center" Margin="0,15,0,0" TextWrapping="Wrap" TextAlignment="Center"/>
            </StackPanel>
            <StackPanel Grid.Row="2" Margin="0,15">
                <ProgressBar Name="MainProgressBar" Height="4" Background="#2D2D30" Foreground="#007ACC" IsIndeterminate="False" Opacity="0"/>
            </StackPanel>
            <Button Name="InstallButton" Grid.Row="3" Content="Instalar" Height="40" FontSize="14" FontWeight="Bold"/>
        </Grid>
    </Border>
</Window>
"@

$window = [Windows.Markup.XamlReader]::Load((New-Object System.Xml.XmlNodeReader $xamlContent))


$closeButton = $window.FindName("CloseButton")
$installButton = $window.FindName("InstallButton")
$titleText = $window.FindName("TitleText")
$statusText = $window.FindName("StatusText")
$progressBar = $window.FindName("MainProgressBar")

function Set-UIStatus {
    param(
        [string]$Message,
        [bool]$IsLoading = $false
    )
    $statusText.Text = $Message
    $progressBar.IsIndeterminate = $IsLoading
    $progressBar.Opacity = if ($IsLoading) { 1 } else { 0 }

    
    [System.Windows.Threading.Dispatcher]::CurrentDispatcher.Invoke([Action] {}, [System.Windows.Threading.DispatcherPriority]::Background)
}

function Load-WindowIcon {
    try {
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
    catch {
        Write-Warning "Could not load window icon."
    }
}

function Test-BrowserRunning {
    $processes = Get-Process -Name "msedge", "chrome" -ErrorAction SilentlyContinue
    return ($null -ne $processes)
}

function Stop-Browsers {
    Stop-Process -Name "msedge", "chrome" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
}

function Create-Shortcut {
    param([string]$LinkPath)

    try {
        $wshShell = New-Object -ComObject WScript.Shell
        $shortcut = $wshShell.CreateShortcut($LinkPath)
        $shortcut.TargetPath = "powershell.exe"
        $shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$LAUNCHER_PATH`""
        $shortcut.IconLocation = $ICON_PATH
        $shortcut.Description = "Correios Tools Launcher"
        $shortcut.Save()
        return $true
    }
    catch {
        return $false
    }
}

function Start-Installation {
    $installButton.IsEnabled = $false

    if (Test-BrowserRunning) {
        $userResponse = [System.Windows.Forms.MessageBox]::Show(
            "Precisamos fechar o Chrome e o Edge para configurar o ambiente.`n`nPodemos fechar agora?",
            "Configuração Correios Tools",
            [System.Windows.Forms.MessageBoxButtons]::YesNo,
            [System.Windows.Forms.MessageBoxIcon]::Question
        )

        if ($userResponse -eq "Yes") {
            Set-UIStatus "Fechando navegadores..." $true
            Stop-Browsers
        }
        else {
            Set-UIStatus "Instalação cancelada pelo usuário." $false
            $installButton.IsEnabled = $true
            return
        }
    }

    Set-UIStatus "Criando diretórios..." $true
    if (-not (Test-Path $DATA_DIR)) {
        New-Item -ItemType Directory -Path $DATA_DIR -Force | Out-Null
    }

    try {
        Set-UIStatus "Baixando launcher..." $true
        Invoke-WebRequest -Uri $LAUNCHER_URL -OutFile $LAUNCHER_PATH -UseBasicParsing

        Set-UIStatus "Baixando ícone..." $true
        Invoke-WebRequest -Uri $ICON_URL -OutFile $ICON_PATH -UseBasicParsing

        Load-WindowIcon
    }
    catch {
        [System.Windows.Forms.MessageBox]::Show(
            "Falha ao baixar arquivos. Verifique a conexão.",
            "Erro Fatal",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error
        )
        $installButton.IsEnabled = $true
        Set-UIStatus "Erro na instalação." $false
        return
    }

    Set-UIStatus "Criando atalho na pasta pública..." $true
    Create-Shortcut "$INSTALL_DIR\Correios Tools.lnk" | Out-Null

    Set-UIStatus "Criando atalho na área de trabalho..." $true
    $desktopDir = [Environment]::GetFolderPath("Desktop")
    Create-Shortcut "$desktopDir\Correios Tools.lnk" | Out-Null

    Set-UIStatus "Instalação concluída!" $false
    $titleText.Text = "CONCLUÍDO"
    $titleText.Foreground = [System.Windows.Media.Brushes]::LimeGreen
    $installButton.Content = "Abrir Pasta"
    $installButton.IsEnabled = $true
    $installButton.Tag = "COMPLETED"
}

function Open-InstallationFolder {
    Start-Process "explorer.exe" -ArgumentList $INSTALL_DIR
    $window.Close()
}

$closeButton.Add_Click({ $window.Close() })

$installButton.Add_Click({
        if ($installButton.Tag -eq "COMPLETED") {
            Open-InstallationFolder
        }
        else {
            Start-Installation
        }
    })

$window.Add_Loaded({
        Set-UIStatus "Clique em Instalar para iniciar." $false
    })

$window.Add_MouseLeftButtonDown({ $window.DragMove() })

[void]$window.ShowDialog()
