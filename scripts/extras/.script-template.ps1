# ==========================================
# MODELO DE SCRIPT EXTRA PARA O LAUNCHER
# ==========================================

# Regras:
# 1. Nao use 'Read-Host' (Isso trava a automacao do Launcher).
# 2. Use Write-Host com cores para feedback.
# 3. Se ocorrer erro critico, use 'exit 1' para o Launcher saber.

try {
    Write-Host "  > [TASK] Iniciando tarefa exemplo..." -ForegroundColor Gray

    # Seu codigo aqui...
    # Ex: Remove-Item "C:\Lixo" -Force

    Write-Host "  > [TASK] Tarefa concluida." -ForegroundColor Green
} catch {
    Write-Error "  [!] Falha na tarefa: $_"
    exit 1
}
