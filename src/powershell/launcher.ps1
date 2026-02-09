Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$code = @"
   
    public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
   
    public static extern IntPtr GetConsoleWindow();
"@
$win32 = Add-Type -MemberDefinition $code -Name "Win32" -Namespace Win32 -PassThru
$hwnd = $win32::GetConsoleWindow()
$win32::ShowWindowAsync($hwnd, 0)

$BASE_DIR = "$env:PUBLIC\correios-tools"
$DATA_DIR = "$BASE_DIR\data"
$EXT_DIR = "$BASE_DIR\extensions"
$ASSETS_DIR = "$BASE_DIR\assets"

if (!(Test-Path $DATA_DIR)) { New-Item -ItemType Directory -Path $DATA_DIR -Force | Out-Null }
if (!(Test-Path $EXT_DIR)) { New-Item -ItemType Directory -Path $EXT_DIR -Force | Out-Null }

$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Correios Tools Launcher" Height="250" Width="400" 
        WindowStartupLocation="CenterScreen" ResizeMode="CanMinimize" Background="#F0F0F0">
    <Grid Margin="20">
        <StackPanel VerticalAlignment="Center">
            <TextBlock Text="Selecione o Navegador" FontSize="16" FontWeight="Bold" HorizontalAlignment="Center" Margin="0,0,0,20"/>
            
            <Button Name="BtnChrome" Content="Google Chrome" Height="40" Margin="0,5,0,5" Background="#FFFFFF" BorderBrush="#CCCCCC"/>
            <Button Name="BtnEdge" Content="Microsoft Edge" Height="40" Margin="0,5,0,5" Background="#FFFFFF" BorderBrush="#CCCCCC"/>
            
            <TextBlock Name="txtStatus" Text="Aguardando acao..." Foreground="#666666" HorizontalAlignment="Center" Margin="0,20,0,0"/>
            <ProgressBar Name="pbStatus" Height="4" Margin="0,5,0,0" Visibility="Hidden"/>
        </StackPanel>
    </Grid>
</Window>
"@

$reader =::Create(::new($xaml))
$window =::Load($reader)

$btnChrome = $window.FindName("BtnChrome")
$btnEdge = $window.FindName("BtnEdge")
$txtStatus = $window.FindName("txtStatus")
$pbStatus = $window.FindName("pbStatus")

function Update-UIStatus {
    param($message, $loading)
    $window.Dispatcher.Invoke({
        $txtStatus.Text = $message
        if ($loading) {
            $pbStatus.Visibility = "Visible"
            $pbStatus.IsIndeterminate = $true
            $btnChrome.IsEnabled = $false
            $btnEdge.IsEnabled = $false
        } else {
            $pbStatus.Visibility = "Hidden"
            $btnChrome.IsEnabled = $true
            $btnEdge.IsEnabled = $true
        }
    })
}

function Force-CloseBrowser {
    param($procName)
    $attempts = 0
    do {
        $procs = Get-Process -Name $procName -ErrorAction SilentlyContinue
        if ($procs) {
            Update-UIStatus "Fechando $procName..." $true
            foreach ($p in $procs) {
                try { $p.Kill(); $p.WaitForExit(1000) } catch {}
            }
            Start-Sleep -Milliseconds 500
        }
        $attempts++
    } while ((Get-Process -Name $procName -ErrorAction SilentlyContinue) -and ($attempts -lt 10))
}

function Update-Preferences {
    param($path)
    try {
        if (Test-Path $path) {
            $content = Get-Content -Path $path -Raw
            $json = $content | ConvertFrom-Json
            
            if (-not $json.extensions) { $json | Add-Member -Name "extensions" -Value @{} -MemberType NoteProperty }
            if (-not $json.extensions.ui) { $json.extensions | Add-Member -Name "ui" -Value @{} -MemberType NoteProperty }
            
            $json.extensions.ui.developer_mode = $true
            
            $newContent = $json | ConvertTo-Json -Depth 100 -Compress
            $utf8NoBom = New-Object System.Text.UTF8Encoding $false
           ::WriteAllText($path, $newContent, $utf8NoBom)
        }
    } catch {}
}

function Sync-Extensions {
    Update-UIStatus "Verificando extensoes..." $true
    
    try {
       ::SecurityProtocol =::Tls12
        $metaUrl = "https://github.com/henrique-coder/correios-tools/releases/download/assets/metadata.json"
        $metaJson = Invoke-RestMethod -Uri $metaUrl -UseBasicParsing
        
        foreach ($extName in $metaJson.extensions) {
            Update-UIStatus "Baixando $extName..." $true
            $zipPath = "$DATA_DIR\$extName.zip"
            $destPath = "$EXT_DIR\$extName"
            $url = "https://github.com/henrique-coder/correios-tools/releases/download/assets/extension-$extName.zip"
            
            Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
            
            if (Test-Path $destPath) { Remove-Item -Path $destPath -Recurse -Force }
            New-Item -ItemType Directory -Path $destPath -Force | Out-Null
            
            Expand-Archive -Path $zipPath -DestinationPath $destPath -Force
            Remove-Item -Path $zipPath -Force
        }
    } catch {
        Update-UIStatus "Erro ao baixar extensoes." $false
        Start-Sleep -Seconds 2
    }
}

function Get-ExtensionsPaths {
    $paths = @()
    if (Test-Path $EXT_DIR) {
        $items = Get-ChildItem -Path $EXT_DIR -Directory
        foreach ($item in $items) { $paths += $item.FullName }
    }
    return $paths -join ","
}

function Launch-Browser {
    param($type)
    
    if ($type -eq "chrome") {
        $procName = "chrome"
        $exePath = "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe"
        if (-not (Test-Path $exePath)) { $exePath = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe" }
        $prefPath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Preferences"
    } else {
        $procName = "msedge"
        $exePath = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
        $prefPath = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Preferences"
    }

    if (-not (Test-Path $exePath)) {
       ::Show("Navegador nao encontrado.", "Erro", 0, 16)
        return
    }

    Start-ThreadJob -ScriptBlock {
        param($procName, $exePath, $prefPath, $window, $BtnChrome, $BtnEdge, $TxtStatus, $PbStatus, $funcClose, $funcSync, $funcPref, $funcExtPath)
        
        # Funcoes injetadas no Job
        ${function:Force-CloseBrowser} = $funcClose
        ${function:Sync-Extensions} = $funcSync
        ${function:Update-Preferences} = $funcPref
        ${function:Get-ExtensionsPaths} = $funcExtPath
        ${function:Update-UIStatus} = {
            param($m, $l) 
            $args.Dispatcher.Invoke({
                $args.[1]Text = $m
                if ($l) { $args.[2]Visibility = "Visible"; $args.[2]IsIndeterminate = $true; $args.[3]IsEnabled = $false; $args.[4]IsEnabled = $false }
                else { $args.[2]Visibility = "Hidden"; $args.[3]IsEnabled = $true; $args.[4]IsEnabled = $true }
            })
        }

        Force-CloseBrowser $procName
        Sync-Extensions
        Update-Preferences $prefPath
        
        $extPaths = Get-ExtensionsPaths
        $targetUrl = "https://sroweb.correios.com.br/app/index.php"
        
        $procArgs = @(
            "--load-extension=`"$extPaths`"",
            $targetUrl
        )

        Update-UIStatus "Iniciando..." $true $window $BtnChrome $TxtStatus $PbStatus $BtnEdge
        Start-Process -FilePath $exePath -ArgumentList $procArgs
        
        Start-Sleep -Seconds 3
        Update-UIStatus "Pronto" $false $window $BtnChrome $TxtStatus $PbStatus $BtnEdge
        
    } -ArgumentList $procName, $exePath, $prefPath, $window, $btnChrome, $btnEdge, $txtStatus, $pbStatus, ${function:Force-CloseBrowser}, ${function:Sync-Extensions}, ${function:Update-Preferences}, ${function:Get-ExtensionsPaths} | Out-Null
}

$btnChrome.Add_Click({ Launch-Browser "chrome" })
$btnEdge.Add_Click({ Launch-Browser "edge" })

$window.ShowDialog() | Out-Null
