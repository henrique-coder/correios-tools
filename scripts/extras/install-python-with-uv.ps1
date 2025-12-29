<#
.SYNOPSIS
    Installs UV and Python
.DESCRIPTION
    Configures UV and Python for corporate Windows environments.
#>

[CmdletBinding()]
param(
    [string]$PythonVersion = "3.14"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Write-Status {
    param(
        [Parameter(Mandatory)][string]$Message,
        [ValidateSet("Info", "Success", "Warning", "Error", "Debug")][string]$Type = "Info"
    )

    $colors = @{ Info = "Gray"; Success = "Green"; Warning = "Yellow"; Error = "Red"; Debug = "DarkGray" }
    $prefixes = @{ Info = "INFO"; Success = "OK"; Warning = "AVISO"; Error = "ERRO"; Debug = "DEBUG" }

    Write-Host "  > [$($prefixes[$Type])] $Message" -ForegroundColor $colors[$Type]
}

function Update-PathFromRegistry {
    $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$userPath;$machinePath"
}

function Test-CommandExists {
    param([Parameter(Mandatory)][string]$Command)
    return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
}

function Install-Uv {
    Write-Status "UV não encontrado. Instalando..." -Type Warning

    try {
        $script = Invoke-RestMethod -Uri "https://astral.sh/uv/install.ps1" -UseBasicParsing
        & ([ScriptBlock]::Create($script))
    }
    catch {
        Write-Status "Instalação primária falhou, tentando alternativa..." -Type Warning

        try {
            $proc = Start-Process -FilePath "powershell.exe" `
                -ArgumentList "-ExecutionPolicy", "ByPass", "-NoProfile", "-Command", `
                "Invoke-RestMethod -Uri 'https://astral.sh/uv/install.ps1' -UseBasicParsing | Invoke-Expression" `
                -Wait -PassThru -NoNewWindow

            if ($proc.ExitCode -ne 0) { throw "Código de saída: $($proc.ExitCode)" }
        }
        catch {
            Write-Status "Instalação falhou: $_" -Type Error
            return $false
        }
    }

    Update-PathFromRegistry

    if (-not (Test-CommandExists "uv")) {
        Write-Status "UV não encontrado no PATH após instalação" -Type Error
        return $false
    }

    Write-Status "UV instalado com sucesso!" -Type Success
    return $true
}

function Update-Uv {
    Write-Status "Verificando atualizações do UV..." -Type Debug
    try { & uv self update 2>&1 | Out-Null } catch { }
}

function Install-Python {
    param([Parameter(Mandatory)][string]$Version)

    Write-Status "Instalando Python $Version..." -Type Info

    $uvArgs = @("python", "install", $Version, "--default")
    if ($Version -match "^3\.(1[4-9]|[2-9][0-9])") {
        $uvArgs += "--preview"
        Write-Status "Usando modo preview (versão pré-lançamento)" -Type Warning
    }

    try {
        & uv --native-tls @uvArgs
        if ($LASTEXITCODE -ne 0) { throw "Código de saída: $LASTEXITCODE" }
        Write-Status "Python $Version instalado com sucesso!" -Type Success
        return $true
    }
    catch {
        Write-Status "Falha ao instalar Python: $_" -Type Error
        return $false
    }
}

function Main {
    Write-Host ""
    Write-Status "Verificando UV..." -Type Info

    Update-PathFromRegistry

    if (Test-CommandExists "uv") {
        Update-Uv
    }
    else {
        if (-not (Install-Uv)) { return 1 }
    }

    if (-not (Install-Python -Version $PythonVersion)) { return 1 }

    Write-Host ""
    Write-Status "Ambiente pronto!" -Type Success
    Write-Status "UV: $(uv --version)" -Type Info
    Write-Status "Python: $(uv run python --version)" -Type Info
    Write-Host ""

    return 0
}

exit (Main)
