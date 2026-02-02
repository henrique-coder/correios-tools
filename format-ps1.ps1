Get-ChildItem -Path scripts/ -Include "*.ps1" -Recurse | ForEach-Object {
    Write-Host "Processing: $($_.Name)"

    $content = Get-Content $_.FullName -Raw
    $errors = $null
    $tokens = [System.Management.Automation.PSParser]::Tokenize($content, [ref]$errors)
    $comments = $tokens | Where-Object { $_.Type -eq "Comment" } | Sort-Object Start -Descending

    foreach ($comment in $comments) {
        $content = $content.Remove($comment.Start, $comment.Length)
    }

    $formatted = Invoke-Formatter -ScriptDefinition $content

    Set-Content -Path $_.FullName -Value $formatted -NoNewline
}
