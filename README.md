# Correios Tools

Ferramentas para otimizar tarefas operacionais nos Correios.

## Instalação Rápida

> **Requisito:** Windows 10/11 com PowerShell

**Via PowerShell:**

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
irm https://github.com/henrique-coder/correios-tools/releases/download/assets/script-installer.ps1 | iex
```

**Via CMD:**

```cmd
powershell -ep bypass -c "irm https://github.com/henrique-coder/correios-tools/releases/download/assets/script-installer.ps1 | iex"
```

## Funcionalidades

- 🚀 Abertura rápida do Edge/Chrome com extensões
- 🔄 Auto-atualização de launcher e extensões
- 📦 Sincronização automática a cada 4 horas
- ✨ Interface moderna com indicadores de status

## Desenvolvimento

```sh
just format   # Formatar código
just lint     # Verificar linting
```

## Licença

Uso interno — Correios do Brasil
