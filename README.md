# correios-tools

Ferramentas para uso interno dos Correios.

## Instalação

> **Requisito:** PowerShell deve estar habilitado no sistema.

**Habilitar PowerShell (se necessário):**

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
```

**Instalar:**

```powershell
irm https://github.com/henrique-coder/correios-tools/releases/download/powershell-scripts/install.min.ps1 | iex
```

**Alternativa via CMD:**

```cmd
powershell -ep bypass -c "irm https://github.com/henrique-coder/correios-tools/releases/download/powershell-scripts/install.min.ps1 | iex"
```

## Uso

Após instalação, o atalho **Correios Tools** será criado na Área de Trabalho.

Funcionalidades:

- Abrir Edge/Chrome com extensões carregadas
- Sincronização automática
- Auto-atualização

## Desenvolvimento

```bash
just format   # Formatar código
just lint     # Verificar linting
```

## Licença

Uso interno — Correios do Brasil
