Add-Type -AssemblyName PresentationFramework, System.Drawing, System.Windows.Forms, Microsoft.VisualBasic

$mutexName = "Global\CorreiosToolsLauncher"
$mutex = New-Object System.Threading.Mutex($false, $mutexName)
if (-not $mutex.WaitOne(0, $false)) { Exit }

$code = @"
[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
[DllImport("kernel32.dll")] public static extern IntPtr GetConsoleWindow();
"@
$win32 = Add-Type -MemberDefinition $code -Name "Win32" -Namespace Win32 -PassThru
$win32::ShowWindow($win32::GetConsoleWindow(), 0)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
try { chcp 65001 | Out-Null } catch {}

$ExtensionUrls = @("https://github.com/henrique-coder/correios-tools/releases/download/browser-extensions/sroweb_inducao.zip")
$ScriptUrls = @()
$SelfUpdateUrl = "https://github.com/henrique-coder/correios-tools/releases/download/minified-scripts/launcher.min.ps1"
$IconEdgeUrl = "https://raw.githubusercontent.com/henrique-coder/correios-tools/refs/heads/dev/assets/edge_icon.png"
$IconChromeUrl = "https://raw.githubusercontent.com/henrique-coder/correios-tools/refs/heads/dev/assets/chrome_icon.png"

$BaseDir = "C:\Users\Public\correios-tools"
$DataDir = "$BaseDir\data"
$ExtensionsDir = "$DataDir\extensions"
$ScriptsDir = "$DataDir\scripts"
$AssetsDir = "$DataDir\assets"
$SelfPath = $MyInvocation.MyCommand.Path

if (!(Test-Path $AssetsDir)) { New-Item -ItemType Directory -Path $AssetsDir -Force | Out-Null }

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Update-UI {
    [System.Windows.Threading.Dispatcher]::CurrentDispatcher.Invoke([Action]{}, [System.Windows.Threading.DispatcherPriority]::Background)
}

function Log-Message {
    param([string]$Message, [string]$Color = "#CCCCCC")
    $txtLog.Dispatcher.Invoke({
        $paragraph = New-Object System.Windows.Documents.Paragraph
        $run = New-Object System.Windows.Documents.Run($Message)
        $brush = (New-Object System.Windows.Media.BrushConverter).ConvertFromString($Color)
        $run.Foreground = $brush
        $paragraph.Inlines.Add($run)
        $paragraph.Margin = "0"
        $txtLog.Document.Blocks.Add($paragraph)
        $txtLog.ScrollToEnd()
    })
    Update-UI
}

function Get-LocalAsset {
    param($Url, $FileName)
    $Path = "$AssetsDir\$FileName"
    if (!(Test-Path $Path)) {
        try { Invoke-WebRequest -Uri $Url -OutFile $Path -UseBasicParsing } catch {}
    }
    return $Path
}

$EdgeIconPath = Get-LocalAsset -Url $IconEdgeUrl -FileName "edge.png"
$ChromeIconPath = Get-LocalAsset -Url $IconChromeUrl -FileName "chrome.png"

$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Correios Tools" Height="600" Width="420" WindowStyle="None" ResizeMode="NoResize" AllowsTransparency="True" Background="Transparent">
    <Window.Resources>
        <Style TargetType="Button">
            <Setter Property="Background" Value="#2D2D30"/>
            <Setter Property="Foreground" Value="White"/>
            <Setter Property="FontSize" Value="14"/>
            <Setter Property="BorderThickness" Value="0"/>
            <Setter Property="Padding" Value="10"/>
            <Setter Property="Margin" Value="5"/>
            <Setter Property="Cursor" Value="Hand"/>
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="Button">
                        <Border x:Name="border" Background="{TemplateBinding Background}" CornerRadius="8">
                            <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                        </Border>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter TargetName="border" Property="Background" Value="#444444"/>
                            </Trigger>
                            <Trigger Property="IsPressed" Value="True">
                                <Setter TargetName="border" Property="Background" Value="#007ACC"/>
                            </Trigger>
                            <Trigger Property="IsEnabled" Value="False">
                                <Setter TargetName="border" Property="Background" Value="#111111"/>
                                <Setter Property="Foreground" Value="#555555"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>
    </Window.Resources>
    
    <Border Background="#1E1E1E" CornerRadius="12" BorderBrush="#333333" BorderThickness="1">
        <Grid Margin="20">
            <Grid.RowDefinitions>
                <RowDefinition Height="Auto"/>
                <RowDefinition Height="Auto"/>
                <RowDefinition Height="Auto"/>
                <RowDefinition Height="*"/>
                <RowDefinition Height="Auto"/>
            </Grid.RowDefinitions>

            <Grid Grid.Row="0" Margin="0,0,0,20">
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="Auto"/>
                </Grid.ColumnDefinitions>
                <StackPanel Orientation="Vertical">
                    <TextBlock Text="CORREIOS TOOLS" Foreground="White" FontSize="20" FontWeight="Bold"/>
                    <TextBlock x:Name="lblSysInfo" Text="Inicializando..." Foreground="#999999" FontSize="12"/>
                </StackPanel>
                <Button x:Name="btnClose" Grid.Column="1" Content="✕" Width="35" Height="35" Background="Transparent" Foreground="#FF5555" FontSize="16" FontWeight="Bold"/>
            </Grid>

            <Grid Grid.Row="1" Margin="0,0,0,20">
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="*"/>
                </Grid.ColumnDefinitions>
                
                <Button x:Name="btnEdge" Grid.Column="0" Height="110" Margin="0,0,8,0" Background="#252526">
                    <StackPanel>
                        <Image Source="$EdgeIconPath" Width="50" Height="50" Margin="0,0,0,10"/>
                        <TextBlock Text="EDGE" FontWeight="Bold"/>
                    </StackPanel>
                </Button>

                <Button x:Name="btnChrome" Grid.Column="1" Height="110" Margin="8,0,0,0" Background="#252526">
                    <StackPanel>
                        <Image Source="$ChromeIconPath" Width="50" Height="50" Margin="0,0,0,10"/>
                        <TextBlock Text="CHROME" FontWeight="Bold"/>
                    </StackPanel>
                </Button>
            </Grid>

            <Button x:Name="btnDual" Grid.Row="2" Content="ABRIR AMBOS (SEQUENCIAL)" Height="50" Background="#007ACC" FontWeight="Bold" Margin="0,0,0,25"/>

            <RichTextBox x:Name="txtLog" Grid.Row="3" Background="#111111" Foreground="#CCCCCC" BorderThickness="0" IsReadOnly="True" VerticalScrollBarVisibility="Auto" Padding="8" Margin="0,0,0,15">
                <FlowDocument>
                    <Paragraph Margin="0"><Run Text="Sistema pronto."/></Paragraph>
                </FlowDocument>
            </RichTextBox>

            <Grid Grid.Row="4">
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="*"/>
                </Grid.ColumnDefinitions>
                <Button x:Name="btnUpdate" Grid.Column="0" Content="⟳ APP" FontSize="13" Height="45" ToolTip="Atualizar Launcher"/>
                <Button x:Name="btnExt" Grid.Column="1" Content="⬇ EXT" FontSize="13" Height="45" ToolTip="Baixar Extensoes"/>
                <Button x:Name="btnScripts" Grid.Column="2" Content="⚙ SCRIPTS" FontSize="13" Height="45" ToolTip="Scripts Extras"/>
            </Grid>
        </Grid>
    </Border>
</Window>
"@

$reader = (New-Object System.Xml.XmlNodeReader ([xml]$xaml))
$window = [System.Windows.Markup.XamlReader]::Load($reader)

$lblSysInfo = $window.FindName("lblSysInfo")
$btnClose = $window.FindName("btnClose")
$btnEdge = $window.FindName("btnEdge")
$btnChrome = $window.FindName("btnChrome")
$btnDual = $window.FindName("btnDual")
$txtLog = $window.FindName("txtLog")
$btnUpdate = $window.FindName("btnUpdate")
$btnExt = $window.FindName("btnExt")
$btnScripts = $window.FindName("btnScripts")

$window.Add_MouseLeftButtonDown({ $window.DragMove() })
$btnClose.Add_Click({ $window.Close() })

function Get-SystemInfo {
    try {
        $os = (Get-WmiObject Win32_OperatingSystem).Caption -replace "Microsoft Windows", "Win"
        $ram = [math]::Round((Get-WmiObject Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 0)
        return "$os | ${ram}GB RAM | $env:COMPUTERNAME"
    } catch { return "$env:COMPUTERNAME" }
}

$lblSysInfo.Text = Get-SystemInfo

function Set-BrowserRestoreSession {
    param([string]$BrowserName)
    $prefPath = ""
    if ($BrowserName -eq "Edge") { $prefPath = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Preferences" }
    elseif ($BrowserName -eq "Chrome") { $prefPath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Preferences" }

    if (Test-Path $prefPath) {
        try {
            $content = Get-Content $prefPath -Raw
            if ($content -notmatch '"restore_on_startup":1') {
                $new = $content -replace '"restore_on_startup":\d', '"restore_on_startup":1'
                if ($new -ne $content) { Set-Content -Path $prefPath -Value $new -Encoding UTF8 }
                Log-Message "Configuracao aplicada: $BrowserName" "#888888"
            }
        } catch {}
    }
}

function Get-ExtensionPaths {
    $paths = @()
    if (Test-Path $ExtensionsDir) {
        Get-ChildItem -Path $ExtensionsDir -Directory -Recurse | ForEach-Object {
            if (Test-Path "$($_.FullName)\manifest.json") { $paths += $_.FullName }
        }
    }
    return ($paths -join ",")
}

function Disable-UI {
    $btnEdge.IsEnabled = $false
    $btnChrome.IsEnabled = $false
    $btnDual.IsEnabled = $false
    Update-UI
}

function Enable-UI {
    $btnEdge.IsEnabled = $true
    $btnChrome.IsEnabled = $true
    $btnDual.IsEnabled = $true
    Update-UI
}

function Bring-To-Front {
    param($ProcessName)
    try {
        $id = (Get-Process -Name $ProcessName -ErrorAction SilentlyContinue | Select-Object -First 1).Id
        if ($id) { [Microsoft.VisualBasic.Interaction]::AppActivate($id) }
    } catch {}
}

function Start-Browser {
    param($Name, $Bin, $Url)
    
    Disable-UI
    Log-Message "Iniciando $Name..." "White"
    
    try {
        Stop-Process -Name $Bin -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
        
        Set-BrowserRestoreSession -BrowserName $Name
        
        $extArgs = Get-ExtensionPaths
        $args = @("--restore-last-session", "--no-first-run", "--no-default-browser-check", $Url)
        if ($extArgs) { $args += "--load-extension=`"$extArgs`"" }
        
        $proc = Start-Process $Bin -ArgumentList $args -PassThru
        
        Log-Message "$Name aberto com sucesso." "#00FF00"
        
        # Tenta focar na janela
        Start-Sleep -Seconds 1
        Bring-To-Front -ProcessName $Bin
    } catch {
        Log-Message "Erro ao abrir $Name." "#FF5555"
    } finally {
        Enable-UI
    }
}

function Task-UpdateSelf {
    Log-Message "Verificando Launcher..." "Cyan"
    $temp = "$DataDir\launcher_new.tmp"
    try {
        Invoke-WebRequest -Uri $SelfUpdateUrl -OutFile $temp -UseBasicParsing
        $new = Get-Content $temp -Raw
        $old = Get-Content $SelfPath -Raw
        if ($new.Length -ne $old.Length) {
            Log-Message "Nova versao encontrada! Reiniciando..." "Magenta"
            Copy-Item $temp $SelfPath -Force
            Remove-Item $temp -Force
            Start-Process powershell.exe -ArgumentList "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$SelfPath`""
            $window.Close()
        } else {
            Log-Message "Launcher atualizado." "Green"
            Remove-Item $temp -Force
        }
    } catch { Log-Message "Erro update app: $_" "Red" }
}

function Task-SyncExtensions {
    Log-Message "Baixando extensoes..." "Cyan"
    if (Test-Path $ExtensionsDir) { Remove-Item $ExtensionsDir -Recurse -Force }
    New-Item -ItemType Directory -Path $ExtensionsDir -Force | Out-Null
    
    $count = 0
    foreach ($url in $ExtensionUrls) {
        $count++
        try {
            $name = [System.IO.Path]::GetFileNameWithoutExtension($url)
            if (!$name) { $name = "Ext_$count" }
            $zip = "$DataDir\$name.zip"
            $dest = "$ExtensionsDir\$name"
            Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
            Expand-Archive -Path $zip -DestinationPath $dest -Force
            Remove-Item $zip -Force
            Log-Message "OK: $name" "Green"
        } catch { Log-Message "Falha URL: $url" "Red" }
    }
}

function Task-RunScripts {
    Log-Message "Verificando scripts extras..." "Cyan"
    if (Test-Path $ScriptsDir) { Remove-Item $ScriptsDir -Recurse -Force }
    New-Item -ItemType Directory -Path $ScriptsDir -Force | Out-Null
    
    if ($ScriptUrls.Count -eq 0) { Log-Message "Nenhum script extra configurado." "Yellow"; return }

    foreach ($url in $ScriptUrls) {
        try {
            $name = [System.IO.Path]::GetFileName($url)
            $local = "$ScriptsDir\$name"
            Invoke-WebRequest -Uri $url -OutFile $local -UseBasicParsing
            Log-Message "Executando: $name" "Yellow"
            & $local
        } catch { Log-Message "Erro script: $_" "Red" }
    }
    Log-Message "Scripts concluidos." "Green"
}

$StartUrl = "https://sroweb.correios.com.br/app/entregaexternaautomatica/lancamento/index.php"

$btnEdge.Add_Click({ Start-Browser "Edge" "msedge" $StartUrl })
$btnChrome.Add_Click({ Start-Browser "Chrome" "chrome" $StartUrl })
$btnDual.Add_Click({ 
    Disable-UI
    try {
        Log-Message "Modo Sequencial Iniciado." "Cyan"
        Start-Browser "Edge" "msedge" $StartUrl
        Start-Sleep -Seconds 2
        Start-Browser "Chrome" "chrome" $StartUrl 
    } finally {
        Enable-UI
    }
})

$btnUpdate.Add_Click({ Task-UpdateSelf })
$btnExt.Add_Click({ Task-SyncExtensions })
$btnScripts.Add_Click({ Task-RunScripts })

$window.Add_Loaded({
    Update-UI
    Task-UpdateSelf
    Task-SyncExtensions
    Log-Message "Sistema pronto para uso." "White"
})

$window.ShowDialog() | Out-Null
