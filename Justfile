default:
    @just --list

lint:
    npx prettier --check .
    pwsh -Command 'Invoke-ScriptAnalyzer -Path . -Recurse -Settings CodeFormatting -EnableExit'

format:
    node strip-comments.js
    npx prettier --write .
    pwsh -Command 'Get-ChildItem -Path . -Include "*.ps1" -Recurse | ForEach-Object { Write-Host "Formatting: $($_.Name)"; $content = Get-Content $_.FullName -Raw; $formatted = Invoke-Formatter -ScriptDefinition $content; Set-Content -Path $_.FullName -Value $formatted -NoNewline }'
