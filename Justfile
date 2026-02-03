default:
    @just --list

lint:
    npx prettier --check .
    pwsh -Command 'Invoke-ScriptAnalyzer -Path src/powershell/ -Recurse -Settings CodeFormatting -EnableExit'

format:
    node scripts/strip-comments.js
    npx prettier --write .
    pwsh -File scripts/format-ps1.ps1
