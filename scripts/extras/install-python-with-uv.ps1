[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding  = [System.Text.Encoding]::UTF8
try { chcp 65001 | Out-Null } catch {}

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Write-Host "  > [SETUP] Verificando ambiente..." -ForegroundColor Gray

$PossiveisCaminhos = @(
    "$env:USERPROFILE\.local\bin",
    "$env:USERPROFILE\.cargo\bin",
    "$env:LOCALAPPDATA\uv"
)

$UvExe = ""
foreach ($Caminho in $PossiveisCaminhos) {
    if (Test-Path "$Caminho\uv.exe") {
        $UvExe = "$Caminho\uv.exe"
        break
    }
}

if ($UvExe -ne "") {
    Write-Host "  > [SETUP] UV encontrado em: $UvExe" -ForegroundColor DarkGray
    Write-Host "  > [SETUP] Buscando atualizações..." -ForegroundColor DarkGray
    try {
        & $UvExe self update | Out-Null
    } catch {}
} else {
    Write-Host "  > [SETUP] UV não encontrado. Iniciando instalação..." -ForegroundColor Yellow
    
    try {
        $InstallScript = Invoke-RestMethod -Uri "https://astral.sh/uv/install.ps1" -UseBasicParsing
        Invoke-Expression $InstallScript | Out-Null
        
        foreach ($Caminho in $PossiveisCaminhos) {
            if (Test-Path "$Caminho\uv.exe") {
                $UvExe = "$Caminho\uv.exe"
                break
            }
        }
        Write-Host "  > [SETUP] UV baixado e instalado com sucesso." -ForegroundColor Green
    } catch {
        Write-Error "  [!] FALHA CRÍTICA AO BAIXAR UV: $_"
        exit 1
    }
}

if ($UvExe) {
    $PastaUv = [System.IO.Path]::GetDirectoryName($UvExe)
    if ($env:PATH -notlike "*$PastaUv*") {
        $env:PATH = "$PastaUv;$env:PATH"
        Write-Host "  > [SETUP] Path atualizado temporariamente para esta sessão." -ForegroundColor DarkGray
    }
} else {
    $UvExe = "uv" 
}

# 5. INSTALAÇÃO DO PYTHON
Write-Host "  > [SETUP] Configurando Python 3.14..." -ForegroundColor Gray

try {
    & $UvExe --native-tls python install 3.14 --preview --default --upgrade
    
    Write-Host "  > [SETUP] Python 3.14 configurado e pronto!" -ForegroundColor Green
} catch {
    Write-Error "  [!] Erro ao instalar Python: $_"
    exit 1
}
