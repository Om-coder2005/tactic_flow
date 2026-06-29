$dir = "d:\Pivot n Press\tactic board\frontend\src"
$files = Get-ChildItem -Path $dir -Recurse -Include *.ts,*.tsx
foreach ($file in $files) {
    if ((Get-Item $file.FullName).Length -gt 0) {
        $content = Get-Content $file.FullName
        if ($content.Count -gt 0 -and $content[0] -match '// @ts-nocheck') {
            $newContent = $content | Select-Object -Skip 1
            Set-Content $file.FullName -Value $newContent
        }
    }
}
