param([string]$Version = "3.14")

if (-not (Get-Command "uv" -ErrorAction SilentlyContinue)) {
    Write-Host "ERRO: O 'uv' nao foi encontrado no PATH." -ForegroundColor Red
    exit 1
}

Write-Host "Instalando Python $Version..." -ForegroundColor Cyan
uv --native-tls python install $Version --preview-features python-install-default --default --upgrade
