if (Get-Command "uv" -ErrorAction SilentlyContinue) {
    Write-Host "UV ja instalado. Atualizando..." -ForegroundColor Cyan
    uv --native-tls self update
} else {
    Write-Host "Instalando UV..." -ForegroundColor Cyan
    powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
}
