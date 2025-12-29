<#
.SYNOPSIS
    Installs UV and Python without admin privileges.
.DESCRIPTION
    Configures UV (Astral) and Python for corporate Windows environments.
#>

[CmdletBinding()]
param(
    [string]$PythonVersion = "3.14"
)

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

# ==============================================================================
# UV FUNCTIONS
# ==============================================================================

function Install-Uv {
    Write-Status "UV not found. Installing..." -Type Warning

    try {
        $script = Invoke-RestMethod -Uri "https://astral.sh/uv/install.ps1" -UseBasicParsing
        & ([ScriptBlock]::Create($script))
    }
    catch {
        Write-Status "Primary install failed, trying alternative..." -Type Warning

        try {
            $proc = Start-Process -FilePath "powershell.exe" `
                -ArgumentList "-ExecutionPolicy", "ByPass", "-NoProfile", "-Command", `
                    "Invoke-RestMethod -Uri 'https://astral.sh/uv/install.ps1' -UseBasicParsing | Invoke-Expression" `
                -Wait -PassThru -NoNewWindow

            if ($proc.ExitCode -ne 0) { throw "Exit code: $($proc.ExitCode)" }
        }
        catch {
            Write-Status "Installation failed: $_" -Type Error
            return $false
        }
    }

    Update-PathFromRegistry

    if (-not (Test-CommandExists "uv")) {
        Write-Status "UV not found in PATH after install" -Type Error
        return $false
    }

    Write-Status "UV installed!" -Type Success
    return $true
}

function Update-Uv {
    Write-Status "Checking for UV updates..." -Type Debug
    try { & uv self update 2>&1 | Out-Null } catch {}
}

function Install-Python {
    param([Parameter(Mandatory)][string]$Version)

    Write-Status "Installing Python $Version..." -Type Info

    $args = @("python", "install", $Version, "--default")
    if ($Version -match "^3\.(1[4-9]|[2-9][0-9])") {
        $args += "--preview"
        Write-Status "Using preview mode (pre-release version)" -Type Warning
    }

    try {
        & uv --native-tls @args
        if ($LASTEXITCODE -ne 0) { throw "Exit code: $LASTEXITCODE" }
        Write-Status "Python $Version installed!" -Type Success
        return $true
    }
    catch {
        Write-Status "Python install failed: $_" -Type Error
        return $false
    }
}

# ==============================================================================
# MAIN LOGIC
# ==============================================================================

function Main {
    Write-Host ""
    Write-Status "Checking UV..." -Type Info

    Update-PathFromRegistry

    if (Test-CommandExists "uv") {
        Update-Uv
    }
    else {
        if (-not (Install-Uv)) { return 1 }
    }

    if (-not (Install-Python -Version $PythonVersion)) { return 1 }

    Write-Host ""
    Write-Status "Environment ready!" -Type Success
    Write-Status "UV: $(uv --version)" -Type Info
    Write-Status "Python: $(uv run python --version)" -Type Info
    Write-Host ""

    return 0
}

# ==============================================================================
# ENTRY POINT
# ==============================================================================

exit (Main)
