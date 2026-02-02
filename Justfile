default:
    @just --list

lint:
    npx prettier --check .
    pwsh -Command 'Invoke-ScriptAnalyzer -Path scripts/ -Recurse -Settings CodeFormatting -EnableExit'

format:
    node strip-comments.js
    npx prettier --write .
    pwsh -File format-ps1.ps1
