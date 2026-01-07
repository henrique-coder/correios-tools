# =============================================================================
# BOOTSTRAPPER (GARANTE MODO GRÁFICO SEGURO)
# =============================================================================
if ([System.Threading.Thread]::CurrentThread.GetApartmentState() -ne 'STA') {
    # Reinicia oculto e em modo STA (Single Threaded Apartment) necessário para GUI
    Start-Process powershell.exe -ArgumentList "-NoProfile -Sta -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$MyInvocation.MyCommand.Path`""
    Exit
}

# =============================================================================
# BLOCO DE SEGURANÇA (TRY/CATCH GLOBAL)
# =============================================================================
try {
    # 1. Bloqueio de Multiplas Instancias
    $mutexName = "Global\CorreiosToolsLauncher_V4"
    $mutex = New-Object System.Threading.Mutex($false, $mutexName)
    if (-not $mutex.WaitOne(0, $false)) { Exit }

    # 2. Carrega Bibliotecas Visuais
    Add-Type -AssemblyName PresentationFramework, System.Drawing, System.Windows.Forms, Microsoft.VisualBasic

    # 3. Configurações e Caminhos
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    try { chcp 65001 | Out-Null } catch {}
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

    $BaseDir = "C:\Users\Public\correios-tools"
    $DataDir = "$BaseDir\data"
    $AssetsDir = "$DataDir\assets"
    $ExtensionsDir = "$DataDir\extensions"
    $ScriptsDir = "$DataDir\scripts"
    $SelfPath = $MyInvocation.MyCommand.Path

    # Garante que pastas existam
    if (!(Test-Path $AssetsDir)) { New-Item -ItemType Directory -Path $AssetsDir -Force | Out-Null }

    # URLs
    $IconEdgeUrl = "https://raw.githubusercontent.com/henrique-coder/correios-tools/refs/heads/dev/assets/edge_icon.png"
    $IconChromeUrl = "https://raw.githubusercontent.com/henrique-coder/correios-tools/refs/heads/dev/assets/chrome_icon.png"
    $ExtensionUrls = @("https://github.com/henrique-coder/correios-tools/releases/download/browser-extensions/sroweb_inducao.zip")
    $SelfUpdateUrl = "https://github.com/henrique-coder/correios-tools/releases/download/minified-scripts/launcher.min.ps1"
    $StartUrl = "https://sroweb.correios.com.br/app/entregaexternaautomatica/lancamento/index.php"

    # =========================================================================
    # FUNÇÕES DE UTILIDADE
    # =========================================================================
    function Update-UI {
        # Mantem a janela responsiva (anti-travamento)
        [System.Windows.Threading.Dispatcher]::CurrentDispatcher.Invoke([Action]{}, [System.Windows.Threading.DispatcherPriority]::Background)
    }

    function Log-Message {
        param([string]$Msg, [string]$Color = "#CCCCCC")
        if ($txtLog) {
            $txtLog.Dispatcher.Invoke({
                $para = New-Object System.Windows.Documents.Paragraph
                $run = New-Object System.Windows.Documents.Run($Msg)
                try {
                    $brush = (New-Object System.Windows.Media.BrushConverter).ConvertFromString($Color)
                    $run.Foreground = $brush
                } catch { $run.Foreground = [System.Windows.Media.Brushes]::White }
                $para.Inlines.Add($run)
                $para.Margin = "0"
                $txtLog.Document.Blocks.Add($para)
                $txtLog.ScrollToEnd()
            })
            Update-UI
        }
    }

    function Get-CachedImage {
        param($Url, $Name)
        $LocalPath = "$AssetsDir\$Name"
        # Se nao existe, retorna $null agora e baixa depois em background
        if (Test-Path $LocalPath) { return $LocalPath }
        return $null
    }

    # =========================================================================
    # INTERFACE GRÁFICA (XAML)
    # =========================================================================
    # Caminhos iniciais (podem ser nulos se for a primeira vez)
    $ImgEdge = Get-CachedImage $IconEdgeUrl "edge.png"
    $ImgChrome = Get-CachedImage $IconChromeUrl "chrome.png"

    $xaml = @"
    <Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
            xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
            Title="Correios Tools" Height="580" Width="400" WindowStyle="None" ResizeMode="NoResize" AllowsTransparency="True" Background="Transparent">
        
        <Window.Resources>
            <Style TargetType="Button">
                <Setter Property="Background" Value="#2D2D30"/>
                <Setter Property="Foreground" Value="White"/>
                <Setter Property="FontSize" Value="14"/>
                <Setter Property="Cursor" Value="Hand"/>
                <Setter Property="Template">
                    <Setter.Value>
                        <ControlTemplate TargetType="Button">
                            <Border x:Name="border" Background="{TemplateBinding Background}" CornerRadius="8" BorderBrush="#444" BorderThickness="1">
                                <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center" Margin="5"/>
                            </Border>
                            <ControlTemplate.Triggers>
                                <Trigger Property="IsMouseOver" Value="True">
                                    <Setter TargetName="border" Property="Background" Value="#444444"/>
                                </Trigger>
                                <Trigger Property="IsPressed" Value="True">
                                    <Setter TargetName="border" Property="Background" Value="#007ACC"/>
                                </Trigger>
                                <Trigger Property="IsEnabled" Value="False">
                                    <Setter TargetName="border" Property="Background" Value="#1E1E1E"/>
                                    <Setter Property="Foreground" Value="#555555"/>
                                </Trigger>
                            </ControlTemplate.Triggers>
                        </ControlTemplate>
                    </Setter.Value>
                </Setter>
            </Style>
        </Window.Resources>

        <Border Background="#1E1E1E" CornerRadius="10" BorderBrush="#333" BorderThickness="2">
            <Grid Margin="15">
                <Grid.RowDefinitions>
                    <RowDefinition Height="Auto"/> <RowDefinition Height="Auto"/> <RowDefinition Height="Auto"/> <RowDefinition Height="*"/>    <RowDefinition Height="Auto"/> </Grid.RowDefinitions>

                <Grid Grid.Row="0" Margin="0,0,0,15">
                    <Grid.ColumnDefinitions>
                        <ColumnDefinition Width="*"/>
                        <ColumnDefinition Width="Auto"/>
                    </Grid.ColumnDefinitions>
                    <StackPanel>
                        <TextBlock Text="CORREIOS TOOLS" Foreground="White" FontSize="18" FontWeight="Bold"/>
                        <TextBlock x:Name="lblSysInfo" Text="Iniciando..." Foreground="#888" FontSize="11"/>
                    </StackPanel>
                    <Button x:Name="btnClose" Grid.Column="1" Content=" X " Width="30" Height="30" Background="#992222" FontWeight="Bold"/>
                </Grid>

                <Grid Grid.Row="1" Margin="0,0,0,10">
                    <Grid.ColumnDefinitions>
                        <ColumnDefinition Width="*"/>
                        <ColumnDefinition Width="*"/>
                    </Grid.ColumnDefinitions>
                    
                    <Button x:Name="btnEdge" Grid.Column="0" Height="100" Margin="0,0,5,0">
                        <StackPanel>
                            <Image x:Name="imgEdge" Source="$ImgEdge" Height="48" Margin="0,0,0,5"/>
                            <TextBlock Text="EDGE" FontWeight="Bold"/>
                        </StackPanel>
                    </Button>

                    <Button x:Name="btnChrome" Grid.Column="1" Height="100" Margin="5,0,0,0">
                        <StackPanel>
                            <Image x:Name="imgChrome" Source="$ImgChrome" Height="48" Margin="0,0,0,5"/>
                            <TextBlock Text="CHROME" FontWeight="Bold"/>
                        </StackPanel>
                    </Button>
                </Grid>

                <Button x:Name="btnDual" Grid.Row="2" Content="ABRIR AMBOS" Height="45" Background="#005A9E" FontWeight="Bold" Margin="0,0,0,15"/>

                <RichTextBox x:Name="txtLog" Grid.Row="3" Background="#111" Foreground="#CCC" BorderThickness="0" IsReadOnly="True" VerticalScrollBarVisibility="Auto" Margin="0,0,0,10" Padding="5"/>

                <Grid Grid.Row="4">
                    <Grid.ColumnDefinitions>
                        <ColumnDefinition Width="*"/>
                        <ColumnDefinition Width="*"/>
                        <ColumnDefinition Width="*"/>
                    </Grid.ColumnDefinitions>
                    <Button x:Name="btnUpdate" Grid.Column="0" Content="ATUALIZAR" FontSize="10" Height="35"/>
                    <Button x:Name="btnExt" Grid.Column="1" Content="EXTENSÕES" FontSize="10" Height="35"/>
                    <Button x:Name="btnScripts" Grid.Column="2" Content="SCRIPTS" FontSize="10" Height="35"/>
                </Grid>
            </Grid>
        </Border>
    </Window>
"@

    # Parse XAML com segurança
    try {
        $reader = (New-Object System.Xml.XmlNodeReader ([xml]$xaml))
        $window = [System.Windows.Markup.XamlReader]::Load($reader)
    } catch {
        throw "Erro ao desenhar interface: $($_.Exception.Message)"
    }

    # Mapear Controles
    $btnClose = $window.FindName("btnClose")
    $btnEdge = $window.FindName("btnEdge")
    $btnChrome = $window.FindName("btnChrome")
    $btnDual = $window.FindName("btnDual")
    $txtLog = $window.FindName("txtLog")
    $lblSysInfo = $window.FindName("lblSysInfo")
    $btnUpdate = $window.FindName("btnUpdate")
    $btnExt = $window.FindName("btnExt")
    $btnScripts = $window.FindName("btnScripts")
    $imgEdgeCtrl = $window.FindName("imgEdge")
    $imgChromeCtrl = $window.FindName("imgChrome")

    # Eventos Básicos
    $window.Add_MouseLeftButtonDown({ try { $window.DragMove() } catch {} })
    $btnClose.Add_Click({ $window.Close() })

    # Info do Sistema
    try {
        $os = (Get-WmiObject Win32_OperatingSystem).Caption -replace "Microsoft Windows", "Win"
        $ram = [math]::Round((Get-WmiObject Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 0)
        $lblSysInfo.Text = "$os | ${ram}GB RAM | $env:COMPUTERNAME"
    } catch {
        $lblSysInfo.Text = "$env:COMPUTERNAME"
    }

    # =========================================================================
    # LÓGICA DE NEGÓCIO
    # =========================================================================

    function Toggle-Buttons($State) {
        $btnEdge.IsEnabled = $State
        $btnChrome.IsEnabled = $State
        $btnDual.IsEnabled = $State
        Update-UI
    }

    function Download-Images-Bg {
        # Baixa imagens se nao existirem e atualiza a UI
        try {
            if (!(Test-Path "$AssetsDir\edge.png")) {
                Invoke-WebRequest -Uri $IconEdgeUrl -OutFile "$AssetsDir\edge.png" -UseBasicParsing
                $imgEdgeCtrl.Source = "$AssetsDir\edge.png"
            }
            if (!(Test-Path "$AssetsDir\chrome.png")) {
                Invoke-WebRequest -Uri $IconChromeUrl -OutFile "$AssetsDir\chrome.png" -UseBasicParsing
                $imgChromeCtrl.Source = "$AssetsDir\chrome.png"
            }
        } catch {}
    }

    function Start-Browser {
        param($Name, $Bin, $Url)
        Toggle-Buttons $false
        Log-Message "Iniciando $Name..." "White"
        
        try {
            Stop-Process -Name $Bin -Force -ErrorAction SilentlyContinue
            Start-Sleep -Milliseconds 500
            
            # Configura sessao
            $pref = if ($Name -eq "Edge") { "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Preferences" } else { "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Preferences" }
            if (Test-Path $pref) {
                try {
                    $c = Get-Content $pref -Raw
                    if ($c -match '"restore_on_startup":\d' -and $c -notmatch '"restore_on_startup":1') {
                        $c = $c -replace '"restore_on_startup":\d', '"restore_on_startup":1'
                        Set-Content $pref $c -Encoding UTF8
                    }
                } catch {}
            }

            # Extensoes
            $extPath = ""
            if (Test-Path $ExtensionsDir) {
                $items = Get-ChildItem $ExtensionsDir -Directory -Recurse | Where { Test-Path "$($_.FullName)\manifest.json" }
                if ($items) { $extPath = ($items.FullName -join ",") }
            }

            $args = @("--restore-last-session", "--no-first-run", "--no-default-browser-check", $Url)
            if ($extPath) { $args += "--load-extension=`"$extPath`"" }

            $p = Start-Process $Bin -ArgumentList $args -PassThru
            Log-Message "$Name Aberto." "#00FF00"
            
            # Foco
            try { 
                Start-Sleep -Seconds 1
                [Microsoft.VisualBasic.Interaction]::AppActivate($p.Id) 
            } catch {}

        } catch {
            Log-Message "Erro: $_" "#FF5555"
        } finally {
            Toggle-Buttons $true
        }
    }

    function Task-Update {
        Log-Message "Verificando Launcher..." "Cyan"
        $tmp = "$DataDir\new.tmp"
        try {
            Invoke-WebRequest $SelfUpdateUrl -OutFile $tmp -UseBasicParsing
            if ((Get-Content $tmp -Raw).Length -ne (Get-Content $SelfPath -Raw).Length) {
                Log-Message "Atualizando..." "Magenta"
                Copy-Item $tmp $SelfPath -Force
                Start-Process powershell.exe -ArgumentList "-NoProfile -Sta -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$SelfPath`""
                $window.Close()
            } else {
                Log-Message "Launcher atualizado." "Green"
            }
            Remove-Item $tmp -Force
        } catch { Log-Message "Falha no update." "Red" }
    }

    function Task-Ext {
        Log-Message "Baixando Extensões..." "Cyan"
        if (Test-Path $ExtensionsDir) { Remove-Item $ExtensionsDir -Recurse -Force }
        try {
            New-Item -ItemType Directory -Path $ExtensionsDir -Force | Out-Null
            $i=0
            foreach ($u in $ExtensionUrls) {
                $i++
                $z = "$DataDir\ext$i.zip"
                $d = "$ExtensionsDir\ext$i"
                Invoke-WebRequest $u -OutFile $z -UseBasicParsing
                Expand-Archive $z $d -Force
                Remove-Item $z -Force
                Log-Message "Extensão $i OK." "Green"
            }
        } catch { Log-Message "Erro Ext: $_" "Red" }
    }

    # Binds
    $btnEdge.Add_Click({ Start-Browser "Edge" "msedge" $StartUrl })
    $btnChrome.Add_Click({ Start-Browser "Chrome" "chrome" $StartUrl })
    $btnDual.Add_Click({ 
        Toggle-Buttons $false
        Start-Browser "Edge" "msedge" $StartUrl
        Start-Sleep 1
        Start-Browser "Chrome" "chrome" $StartUrl 
        Toggle-Buttons $true
    })
    $btnUpdate.Add_Click({ Task-Update })
    $btnExt.Add_Click({ Task-Ext })
    $btnScripts.Add_Click({ Log-Message "Sem scripts extras." "Yellow" }) # Placeholder seguro

    # Auto-Start
    $window.Add_Loaded({
        Log-Message "Iniciado." "White"
        Update-UI
        # Roda tarefas pesadas APOS a janela aparecer
        Download-Images-Bg
        Task-Update
        Task-Ext
    })

    # Show
    $window.ShowDialog() | Out-Null

} catch {
    # SE TUDO FALHAR, MOSTRA ERRO NATIVO
    [System.Windows.Forms.MessageBox]::Show("Erro Crítico no Launcher:`n`n$($_)", "Erro Correios Tools", 0, 16)
}
