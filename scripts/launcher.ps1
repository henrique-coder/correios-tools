Add-Type -AssemblyName PresentationFramework, System.Drawing, System.Windows.Forms

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

function Download-Asset {
    param($Url, $Path)
    if (!(Test-Path $Path)) {
        try { Invoke-WebRequest -Uri $Url -OutFile $Path -UseBasicParsing } catch {}
    }
    return $Path
}

$EdgeIconPath = Download-Asset -Url $IconEdgeUrl -Path "$AssetsDir\edge.png"
$ChromeIconPath = Download-Asset -Url $IconChromeUrl -Path "$AssetsDir\chrome.png"

$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Correios Tools" Height="550" Width="400" WindowStyle="None" ResizeMode="NoResize" AllowsTransparency="True" Background="Transparent">
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
    
    <Border Background="#1E1E1E" CornerRadius="12" BorderBrush="#333333" BorderThickness="1">
        <Grid Margin="15">
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
                    <TextBlock Text="CORREIOS TOOLS" Foreground="White" FontSize="18" FontWeight="Bold"/>
                    <TextBlock x:Name="lblSysInfo" Text="Carregando info..." Foreground="#888888" FontSize="11"/>
                </StackPanel>
                <Button x:Name="btnClose" Grid.Column="1" Content="✕" Width="30" Height="30" Background="Transparent" Foreground="#FF5555" FontSize="14" FontWeight="Bold"/>
            </Grid>

            <Grid Grid.Row="1" Margin="0,0,0,20">
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="*"/>
                </Grid.ColumnDefinitions>
                
                <Button x:Name="btnEdge" Grid.Column="0" Height="100" Margin="0,0,5,0" Background="#252526">
                    <StackPanel>
                        <Image Source="$EdgeIconPath" Width="48" Height="48" Margin="0,0,0,10"/>
                        <TextBlock Text="EDGE" FontWeight="Bold"/>
                    </StackPanel>
                </Button>

                <Button x:Name="btnChrome" Grid.Column="1" Height="100" Margin="5,0,0,0" Background="#252526">
                    <StackPanel>
                        <Image Source="$ChromeIconPath" Width="48" Height="48" Margin="0,0,0,10"/>
                        <TextBlock Text="CHROME" FontWeight="Bold"/>
                    </StackPanel>
                </Button>
            </Grid>

            <Button x:Name="btnDual" Grid.Row="2" Content="ABRIR AMBOS (SEQUENCIAL)" Height="45" Background="#007ACC" FontWeight="Bold" Margin="0,0,0,20"/>

            <RichTextBox x:Name="txtLog" Grid.Row="3" Background="#111111" Foreground="#CCCCCC" BorderThickness="0" IsReadOnly="True" VerticalScrollBarVisibility="Auto" Padding="5" Margin="0,0,0,10">
                <FlowDocument>
                    <Paragraph Margin="0"><Run Text="Pronto para iniciar..."/></Paragraph>
                </FlowDocument>
            </RichTextBox>

            <Grid Grid.Row="4">
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="*"/>
                </Grid.ColumnDefinitions>
                <Button x:Name="btnUpdate" Grid.Column="0" Content="Atualizar App" FontSize="11"/>
                <Button x:Name="btnExt" Grid.Column="1" Content="Recarregar Ext" FontSize="11"/>
                <Button x:Name="btnScripts" Grid.Column="2" Content="Scripts Extras" FontSize="11"/>
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
                Log-Message "Sessao configurada para $BrowserName" "#666666"
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

function Start-Browser {
    param($Name, $Bin, $Url)
    Log-Message "Iniciando $Name..." "White"
    Stop-Process -Name $Bin -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
    Set-BrowserRestoreSession -BrowserName $Name
    
    $extArgs = Get-ExtensionPaths
    $args = @("--restore-last-session", "--no-first-run", "--no-default-browser-check", $Url)
    if ($extArgs) { $args += "--load-extension=`"$extArgs`"" }
    
    try {
        Start-Process $Bin -ArgumentList $args
        Log-Message "$Name aberto com sucesso." "#00FF00"
    } catch {
        Log-Message "Erro ao abrir $Name." "#FF0000"
    }
}

function Task-UpdateSelf {
    Log-Message "Buscando atualizacoes do Launcher..." "Cyan"
    $temp = "$DataDir\launcher_new.tmp"
    try {
        Invoke-WebRequest -Uri $SelfUpdateUrl -OutFile $temp -UseBasicParsing
        $new = Get-Content $temp -Raw
        $old = Get-Content $SelfPath -Raw
        if ($new.Length -ne $old.Length) {
            Log-Message "Atualizacao encontrada! Reiniciando..." "Magenta"
            Copy-Item $temp $SelfPath -Force
            Remove-Item $temp -Force
            Start-Process powershell.exe -ArgumentList "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$SelfPath`""
            $window.Close()
        } else {
            Log-Message "O sistema ja esta atualizado." "Green"
            Remove-Item $temp -Force
        }
    } catch { Log-Message "Erro na atualizacao: $_" "Red" }
}

function Task-SyncExtensions {
    Log-Message "Sincronizando extensoes..." "Cyan"
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
            Log-Message "Instalado: $name" "Green"
        } catch { Log-Message "Falha em $url" "Red" }
    }
}

function Task-RunScripts {
    Log-Message "Executando scripts remotos..." "Cyan"
    if (Test-Path $ScriptsDir) { Remove-Item $ScriptsDir -Recurse -Force }
    New-Item -ItemType Directory -Path $ScriptsDir -Force | Out-Null
    
    if ($ScriptUrls.Count -eq 0) { Log-Message "Nenhum script na lista." "Yellow"; return }

    foreach ($url in $ScriptUrls) {
        try {
            $name = [System.IO.Path]::GetFileName($url)
            $local = "$ScriptsDir\$name"
            Invoke-WebRequest -Uri $url -OutFile $local -UseBasicParsing
            Log-Message "Executando: $name" "Yellow"
            & $local
        } catch { Log-Message "Erro no script: $_" "Red" }
    }
    Log-Message "Scripts finalizados." "Green"
}

$StartUrl = "https://sroweb.correios.com.br/app/entregaexternaautomatica/lancamento/index.php"

$btnEdge.Add_Click({ Start-Browser "Edge" "msedge" $StartUrl })
$btnChrome.Add_Click({ Start-Browser "Chrome" "chrome" $StartUrl })
$btnDual.Add_Click({ 
    Start-Browser "Edge" "msedge" $StartUrl
    Start-Sleep -Seconds 1
    Start-Browser "Chrome" "chrome" $StartUrl 
})

$btnUpdate.Add_Click({ Task-UpdateSelf })
$btnExt.Add_Click({ Task-SyncExtensions })
$btnScripts.Add_Click({ Task-RunScripts })

$window.Add_Loaded({
    Log-Message "Interface carregada." "#666666"
    Task-SyncExtensions
})

$window.ShowDialog() | Out-Null
