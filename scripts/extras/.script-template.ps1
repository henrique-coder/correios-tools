<#
.SYNOPSIS
    Brief description of what this script does.
.DESCRIPTION
    Detailed description. No admin privileges required.
#>

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================

function Write-Status {
    param(
        [Parameter(Mandatory)][string]$Message,
        [ValidateSet("Info", "Success", "Warning", "Error", "Debug")][string]$Type = "Info"
    )

    $colors = @{ Info = "Gray"; Success = "Green"; Warning = "Yellow"; Error = "Red"; Debug = "DarkGray" }
    $prefixes = @{ Info = "INFO"; Success = "OK"; Warning = "WARN"; Error = "FAIL"; Debug = "DEBUG" }

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
        [string]$ErrorMessage = "Command failed"
    )

    try {
        & $ScriptBlock
        if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) { throw "Exit code: $LASTEXITCODE" }
        return $true
    }
    catch {
        Write-Status "$ErrorMessage`: $_" -Type Error
        return $false
    }
}

# ==============================================================================
# MAIN LOGIC
# ==============================================================================

function Main {
    Write-Host ""
    Write-Status "Starting task..." -Type Info

    # YOUR CODE HERE

    Write-Status "Task completed!" -Type Success
    Write-Host ""
    return 0
}

# ==============================================================================
# ENTRY POINT (No Read-Host, use exit 1 for errors)
# ==============================================================================

exit (Main)
