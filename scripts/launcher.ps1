$mutexName = "Global\CorreiosToolsLauncherUI"
$mutex = New-Object System.Threading.Mutex($false, $mutexName)
if (-not $mutex.WaitOne(0, $false)) { Exit }

Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);' -Name Win32 -Namespace Native -PassThru | Out-Null
$wh = (Get-Process -Id $PID).MainWindowHandle
if ($wh -ne [IntPtr]::Zero) { [Native.Win32]::ShowWindowAsync($wh, 0) | Out-Null }

Add-Type -AssemblyName PresentationFramework, System.Windows.Forms, System.Drawing

$script:isProcessing = $false
$script:timer = $null
$script:needsRestart = $false

$baseDir = "C:\Users\Public\correios-tools"
$dataDir = "$baseDir\data"
$extDir = "$dataDir\extensions"
$assetsDir = "$dataDir\assets"
$hashFile = "$dataDir\launcher.hash"
$selfPath = $MyInvocation.MyCommand.Path

$cdnBase = "https://cdn.jsdelivr.net/gh/henrique-coder/correios-tools"
$iconUrl = "$cdnBase/assets/icon.ico"
$iconPath = "$dataDir\icon.ico"
$edgeIconUrl = "$cdnBase/assets/logos/edge.png"
$chromeIconUrl = "$cdnBase/assets/logos/chrome.png"
$edgeIconPath = "$assetsDir\edge.png"
$chromeIconPath = "$assetsDir\chrome.png"

$apiBase = "https://api.github.com/repos/henrique-coder/correios-tools/releases/tags"
$scriptsApi = "$apiBase/minified-scripts"
$extApi = "$apiBase/browser-extensions"
$launcherUrl = "https://github.com/henrique-coder/correios-tools/releases/download/minified-scripts/launcher.min.ps1"

$extNames = @("sroweb-induction", "sroweb-loecview-hud")
$startUrl = "https://sroweb.correios.com.br/app/index.php"

try { New-Item -ItemType Directory -Path $dataDir, $assetsDir -Force -EA 0 | Out-Null } catch {}
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

function Get-Hash { try { if (Test-Path $hashFile) { $c = Get-Content $hashFile -Raw -EA 0; if ($c) { return $c.Trim() } } } catch {}; return "" }
function Save-Hash($h) { try { [IO.File]::WriteAllText($hashFile, $h) } catch {} }

function Get-Release($url) { try { return Invoke-RestMethod -Uri $url -Headers @{"User-Agent"="PS";"Accept"="application/vnd.github+json"} -Method Get -TimeoutSec 30 } catch { return $null } }
function Get-Digest($rel, $name) { try { foreach ($a in $rel.assets) { if ($a.name -eq $name -and $a.digest) { return $a.digest } } } catch {}; return "" }
function Get-Url($rel, $name) { try { foreach ($a in $rel.assets) { if ($a.name -eq $name) { return $a.browser_download_url } } } catch {}; return "" }

function New-Shortcut {
    try {
        $p = "$([Environment]::GetFolderPath('Desktop'))\Correios Tools.lnk"
        if (Test-Path $p) { return }
        $s = (New-Object -ComObject WScript.Shell).CreateShortcut($p)
        $s.TargetPath = "powershell.exe"
        $s.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$selfPath`""
        $s.IconLocation = $iconPath
        $s.Save()
    } catch {}
}

[xml]$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation" Title="Correios Tools" Height="500" Width="420" WindowStartupLocation="CenterScreen" ResizeMode="CanMinimize" Background="#1E1E1E" WindowStyle="None" AllowsTransparency="True">
<Window.Resources><Style TargetType="Button"><Setter Property="Background" Value="#2D2D30"/><Setter Property="Foreground" Value="White"/><Setter Property="BorderThickness" Value="0"/><Setter Property="FontSize" Value="12"/><Setter Property="Cursor" Value="Hand"/><Setter Property="Template"><Setter.Value><ControlTemplate TargetType="Button"><Border Name="b" Background="{TemplateBinding Background}" CornerRadius="5"><ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/></Border><ControlTemplate.Triggers><Trigger Property="IsMouseOver" Value="True"><Setter TargetName="b" Property="Background" Value="#3E3E42"/></Trigger><Trigger Property="IsPressed" Value="True"><Setter TargetName="b" Property="Background" Value="#007ACC"/></Trigger><Trigger Property="IsEnabled" Value="False"><Setter TargetName="b" Property="Background" Value="#1A1A1A"/><Setter Property="Foreground" Value="#555"/></Trigger></ControlTemplate.Triggers></ControlTemplate></Setter.Value></Setter></Style></Window.Resources>
<Border BorderBrush="#333337" BorderThickness="1"><Grid Margin="15"><Grid.RowDefinitions><RowDefinition Height="Auto"/><RowDefinition Height="Auto"/><RowDefinition Height="*"/><RowDefinition Height="Auto"/><RowDefinition Height="Auto"/></Grid.RowDefinitions>
<Grid><Grid.ColumnDefinitions><ColumnDefinition Width="*"/><ColumnDefinition Width="Auto"/></Grid.ColumnDefinitions><TextBlock Text="CORREIOS TOOLS" Foreground="White" FontSize="18" FontWeight="Bold" VerticalAlignment="Center"/><Button Name="BtnX" Content="X" Grid.Column="1" Background="Transparent" Foreground="#FF5555" FontWeight="Bold" Width="30"/></Grid>
<TextBlock Name="Txt" Grid.Row="1" Text="Iniciando..." Foreground="#AAA" Margin="0,20,0,10" HorizontalAlignment="Center" TextWrapping="Wrap" TextAlignment="Center"/>
<StackPanel Grid.Row="2" VerticalAlignment="Center" HorizontalAlignment="Center"><Grid><Grid.ColumnDefinitions><ColumnDefinition Width="Auto"/><ColumnDefinition Width="30"/><ColumnDefinition Width="Auto"/></Grid.ColumnDefinitions>
<Button Name="BtnE" Width="130" Height="130" Background="Transparent"><StackPanel><Image Name="ImgE" Width="90" Height="90" RenderOptions.BitmapScalingMode="HighQuality"/><TextBlock Text="Edge" Foreground="White" HorizontalAlignment="Center" Margin="0,10,0,0"/></StackPanel></Button>
<Button Name="BtnC" Grid.Column="2" Width="130" Height="130" Background="Transparent"><StackPanel><Image Name="ImgC" Width="90" Height="90" RenderOptions.BitmapScalingMode="HighQuality"/><TextBlock Text="Chrome" Foreground="White" HorizontalAlignment="Center" Margin="0,10,0,0"/></StackPanel></Button>
</Grid></StackPanel>
<StackPanel Grid.Row="3" Margin="0,15"><ProgressBar Name="Pb" Height="3" Background="#2D2D30" Foreground="#007ACC" IsIndeterminate="False" Opacity="0"/></StackPanel>
<Grid Grid.Row="4" Margin="0,5,0,0"><Grid.ColumnDefinitions><ColumnDefinition Width="*"/><ColumnDefinition Width="10"/><ColumnDefinition Width="*"/></Grid.ColumnDefinitions>
<Button Name="BtnU" Content="Verificar Atualizacoes" Height="35" FontSize="11"/><Button Name="BtnS" Grid.Column="2" Content="Scripts Extras" Height="35" FontSize="11"/></Grid>
</Grid></Border></Window>
"@

$w = [Windows.Markup.XamlReader]::Load((New-Object Xml.XmlNodeReader $xaml))
$BtnX = $w.FindName("BtnX"); $BtnE = $w.FindName("BtnE"); $BtnC = $w.FindName("BtnC"); $BtnU = $w.FindName("BtnU"); $BtnS = $w.FindName("BtnS")
$Txt = $w.FindName("Txt"); $ImgE = $w.FindName("ImgE"); $ImgC = $w.FindName("ImgC"); $Pb = $w.FindName("Pb")
$btns = @($BtnE, $BtnC, $BtnU, $BtnS)

function SetBtns($e) { try { foreach ($b in $btns) { $b.IsEnabled = $e } } catch {} }
function Status($m, $l=$false) { try { $Txt.Text = $m; $Pb.IsIndeterminate = $l; $Pb.Opacity = if($l){1}else{0}; [Windows.Threading.Dispatcher]::CurrentDispatcher.Invoke([Action]{},[Windows.Threading.DispatcherPriority]::Background) } catch {} }
function Safe($a) { if ($script:isProcessing) { return }; $script:isProcessing = $true; SetBtns $false; try { & $a } catch {}; $script:isProcessing = $false; SetBtns $true }

function LoadIcon($path, $url) { try { if (!(Test-Path $path)) { Invoke-WebRequest -Uri $url -OutFile $path -UseBasicParsing } } catch {} }
function SetImg($img, $path) { try { if (Test-Path $path) { $b = New-Object Windows.Media.Imaging.BitmapImage; $b.BeginInit(); $b.UriSource = [Uri]$path; $b.CacheOption = "OnLoad"; $b.EndInit(); $b.Freeze(); $img.Source = $b } } catch {} }

function InitIcons {
    LoadIcon $iconPath $iconUrl
    try { if (Test-Path $iconPath) { $b = New-Object Windows.Media.Imaging.BitmapImage; $b.BeginInit(); $b.UriSource = [Uri]$iconPath; $b.CacheOption = "OnLoad"; $b.EndInit(); $b.Freeze(); $w.Icon = $b } } catch {}
    LoadIcon $edgeIconPath $edgeIconUrl; LoadIcon $chromeIconPath $chromeIconUrl
    SetImg $ImgE $edgeIconPath; SetImg $ImgC $chromeIconPath
}

function DoRestart {
    $script:needsRestart = $true
    $w.Close()
}

function CheckUpdate($countdown=$true) {
    Status "Verificando atualizacoes..." $true
    try {
        $rel = Get-Release $scriptsApi
        if ($rel -eq $null) { Status "Pronto! Selecione o navegador." $false; return }
        $remote = Get-Digest $rel "launcher.min.ps1"
        if ([string]::IsNullOrEmpty($remote)) { Status "Pronto! Selecione o navegador." $false; return }
        $local = Get-Hash
        if ($remote -eq $local) { Status "Pronto! Selecione o navegador." $false; return }

        if ($countdown) { for ($i = 5; $i -gt 0; $i--) { Status "Atualizacao encontrada! Reiniciando em $i..." $false; Start-Sleep -Seconds 1 } }
        Status "Baixando atualizacao..." $true
        $tmp = "$dataDir\update.tmp"
        Invoke-WebRequest -Uri $launcherUrl -OutFile $tmp -UseBasicParsing
        Save-Hash $remote
        Copy-Item $tmp $selfPath -Force
        Remove-Item $tmp -Force -EA 0
        Status "Reiniciando..." $true
        DoRestart
    } catch { Status "Pronto! Selecione o navegador." $false }
}

function DownloadExt {
    Status "Baixando extensoes..." $true
    try {
        if (Test-Path $extDir) { Remove-Item $extDir -Recurse -Force -EA 0 }
        New-Item -ItemType Directory -Path $extDir -Force | Out-Null
        $rel = Get-Release $extApi
        if ($rel -eq $null) { Status "Erro: sem conexao." $false; return $false }
        $n = 0
        foreach ($ext in $extNames) {
            $n++; Status "Baixando $ext ($n/$($extNames.Count))..." $true
            $url = Get-Url $rel "$ext.zip"
            if ($url) {
                $zip = "$dataDir\$ext.zip"; $dir = "$extDir\$ext"
                New-Item -ItemType Directory -Path $dir -Force | Out-Null
                Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing -TimeoutSec 60
                Expand-Archive -Path $zip -DestinationPath $dir -Force
                Remove-Item $zip -Force -EA 0
            }
        }
        return $true
    } catch { Status "Erro ao baixar extensoes." $false; return $false }
}

function GetExtPaths { $p = @(); try { if (Test-Path $extDir) { Get-ChildItem $extDir -Directory -EA 0 | % { if (Test-Path "$($_.FullName)\manifest.json") { $p += $_.FullName } } } } catch {}; $p -join "," }

function WaitExit($proc) { $t = 0; while ($t -lt 15) { if (!(Get-Process -Name $proc -EA 0)) { return }; Start-Sleep -Milliseconds 200; $t += 0.2; try { [Windows.Threading.Dispatcher]::CurrentDispatcher.Invoke([Action]{},[Windows.Threading.DispatcherPriority]::Background) } catch {} } }

function SetPrefs($path) {
    try {
        if (!(Test-Path $path)) { return }
        $p = Get-Content $path -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($p.session -eq $null) { $p | Add-Member -NotePropertyName "session" -NotePropertyValue @{} -Force }
        if ($p.extensions -eq $null) { $p | Add-Member -NotePropertyName "extensions" -NotePropertyValue @{} -Force }
        if ($p.extensions.ui -eq $null) { $p.extensions | Add-Member -NotePropertyName "ui" -NotePropertyValue @{} -Force }
        $p.session.restore_on_startup = 1; $p.extensions.ui.developer_mode = $true
        $p | ConvertTo-Json -Depth 100 -Compress | Set-Content $path -Encoding UTF8
    } catch {}
}

function SetBrowserPrefs($name) {
    try {
        $ud = if ($name -eq "Edge") { "$env:LOCALAPPDATA\Microsoft\Edge\User Data" } else { "$env:LOCALAPPDATA\Google\Chrome\User Data" }
        if (!(Test-Path $ud)) { return }
        SetPrefs "$ud\Default\Preferences"
        Get-ChildItem $ud -Directory -EA 0 | ? { $_.Name -match "^Profile \d+$" } | % { SetPrefs "$($_.FullName)\Preferences" }
    } catch {}
}

function OpenBrowser($name, $proc) {
    if (!(DownloadExt)) { $ext = GetExtPaths; if ([string]::IsNullOrEmpty($ext)) { Status "Sem extensoes." $false; return } }
    $ext = GetExtPaths
    try { $existing = Get-Process -Name $proc -EA 0; if ($existing) { Status "Fechando $name..." $true; Stop-Process -Name $proc -Force -EA 0; WaitExit $proc } } catch {}
    Status "Configurando $name..." $true; SetBrowserPrefs $name
    Status "Iniciando $name..." $true
    $args = @("--restore-last-session", "--no-first-run", "--no-default-browser-check", $startUrl)
    if ($ext) { $args += "--load-extension=`"$ext`"" }
    try { Start-Process $proc -ArgumentList $args; Status "$name iniciado!" $false } catch { Status "Erro ao iniciar $name." $false }
}

function AutoCheck {
    if ($script:isProcessing) { return }
    $script:isProcessing = $true; SetBtns $false
    try {
        $rel = Get-Release $scriptsApi
        if ($rel -ne $null) {
            $remote = Get-Digest $rel "launcher.min.ps1"
            $local = Get-Hash
            if (-not [string]::IsNullOrEmpty($remote) -and $remote -ne $local) {
                for ($i = 5; $i -gt 0; $i--) { Status "Atualizacao encontrada! Reiniciando em $i..." $false; Start-Sleep -Seconds 1 }
                Status "Baixando atualizacao..." $true
                $tmp = "$dataDir\update.tmp"
                Invoke-WebRequest -Uri $launcherUrl -OutFile $tmp -UseBasicParsing
                Save-Hash $remote
                Copy-Item $tmp $selfPath -Force
                Remove-Item $tmp -Force -EA 0
                Status "Reiniciando..." $true
                DoRestart
                return
            }
        }
    } catch {}
    $script:isProcessing = $false; SetBtns $true
}

function InitTimer { try { $script:timer = New-Object Windows.Threading.DispatcherTimer; $script:timer.Interval = [TimeSpan]::FromHours(4); $script:timer.Add_Tick({ AutoCheck }); $script:timer.Start() } catch {} }

function Startup {
    SetBtns $false; $script:isProcessing = $true
    try { Status "Carregando..." $true; InitIcons; New-Shortcut; CheckUpdate $true; InitTimer; Status "Pronto! Selecione o navegador." $false }
    catch { Status "Pronto! Selecione o navegador." $false }
    $script:isProcessing = $false; SetBtns $true
}

$BtnX.Add_Click({ $w.Close() })
$BtnU.Add_Click({ Safe { CheckUpdate $true } })
$BtnS.Add_Click({ Safe { Status "Nenhum script extra configurado." $false } })
$BtnE.Add_Click({ Safe { OpenBrowser "Edge" "msedge" } })
$BtnC.Add_Click({ Safe { OpenBrowser "Chrome" "chrome" } })
$w.Add_Loaded({ Startup })
$w.Add_MouseLeftButtonDown({ $w.DragMove() })
$w.Add_Closed({
    if ($script:needsRestart) {
        Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$selfPath`""
    }
})
[void]$w.ShowDialog()
