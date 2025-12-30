<#
.SYNOPSIS
    Brief description of what this script does.
.DESCRIPTION
    Detailed description. No admin privileges required.
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding  = [System.Text.Encoding]::UTF8
try { chcp 65001 | Out-Null } catch {}

[CmdletBinding()]
param()

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

function Invoke-SafeCommand {
    param(
        [Parameter(Mandatory)][scriptblock]$ScriptBlock,
        [string]$ErrorMessage = "Comando falhou"
    )

    try {
        & $ScriptBlock
        if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) { throw "Código de saída: $LASTEXITCODE" }
        return $true
    }
    catch {
        Write-Status "$ErrorMessage`: $_" -Type Error
        return $false
    }
}

function Main {
    Write-Host ""
    Write-Status "Iniciando tarefa..." -Type Info

    # YOUR CODE HERE

    Write-Status "Tarefa concluída!" -Type Success
    Write-Host ""
    return 0
}

exit (Main)
