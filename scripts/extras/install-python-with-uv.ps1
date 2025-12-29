Write-Host "  > [SETUP] Verificando UV..." -ForegroundColor Gray

if (Get-Command "uv" -ErrorAction SilentlyContinue) {
    Write-Host "  > [SETUP] UV ja instalado. Buscando updates..." -ForegroundColor DarkGray
    uv --native-tls self update
} else {
    Write-Host "  > [SETUP] UV nao encontrado. Instalando..." -ForegroundColor Yellow

    powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

    $UvPath = "$env:USERPROFILE\.cargo\bin"
    if (Test-Path $UvPath) {
        $env:PATH = "$UvPath;$env:PATH"
        Write-Host "  > [SETUP] Path atualizado temporariamente." -ForegroundColor DarkGray
    }
}

Write-Host "  > [SETUP] Configurando Python 3.14..." -ForegroundColor Gray
uv --native-tls python install 3.14 --preview-features python-install-default --default --upgrade

Write-Host "  > [SETUP] Ambiente configurado com sucesso." -ForegroundColor Green
