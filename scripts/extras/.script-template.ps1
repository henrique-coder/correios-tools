[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding  = [System.Text.Encoding]::UTF8
try { chcp 65001 | Out-Null } catch {}

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Write-Status {
    param(
        [Parameter(Mandatory)][string]$message,
        [ValidateSet("Info", "Success", "Warning", "Error", "Debug")][string]$type = "Info"
    )

    $colors = @{ Info = "Gray"; Success = "Green"; Warning = "Yellow"; Error = "Red"; Debug = "DarkGray" }
    $prefixes = @{ Info = "INFO"; Success = "OK"; Warning = "AVISO"; Error = "ERRO"; Debug = "DEBUG" }

    Write-Host "  > [$($prefixes[$type])] $message" -ForegroundColor $colors[$type]
}

function Update-PathFromRegistry {
    $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$userPath;$machinePath"
}

function Test-CommandExists {
    param([Parameter(Mandatory)][string]$command)
    return [bool](Get-Command $command -ErrorAction SilentlyContinue)
}

function Invoke-SafeCommand {
    param(
        [Parameter(Mandatory)][scriptblock]$scriptBlock,
        [string]$errorMessage = "Comando falhou"
    )

    try {
        & $scriptBlock
        if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) { throw "Codigo de saida: $LASTEXITCODE" }
        return $true
    }
    catch {
        Write-Status "$errorMessage`: $_" -type Error
        return $false
    }
}

function Main {
    Write-Host ""
    Write-Status "Iniciando tarefa..." -type Info

    # YOUR CODE HERE

    Write-Status "Tarefa concluida!" -type Success
    Write-Host ""
    return 0
}

exit (Main)
