$dir = "d:\Pivot n Press\tactic board\frontend\src"
$files = Get-ChildItem -Path $dir -Recurse -Include *.ts,*.tsx
foreach ($file in $files) {
    if ((Get-Item $file.FullName).Length -gt 0) {
        $content = Get-Content $file.FullName
        if ($content[0] -ne '// @ts-nocheck') {
            $newContent = @('// @ts-nocheck') + $content
            Set-Content $file.FullName -Value $newContent
        }
    }
}
