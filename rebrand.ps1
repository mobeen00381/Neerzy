Get-ChildItem -Path "c:\seo-junction-final\src" -Recurse -Include "*.tsx","*.ts" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match 'SEO Junction') {
        $content = $content -replace 'SEO Junction', 'Neerzy'
        Set-Content $_.FullName -Value $content -NoNewline
        Write-Host "Updated: $($_.FullName)"
    }
}
# Also replace seo-junction.vercel.app with www.neerzy.com
Get-ChildItem -Path "c:\seo-junction-final\src" -Recurse -Include "*.tsx","*.ts" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match 'seo-junction\.vercel\.app') {
        $content = $content -replace 'seo-junction\.vercel\.app', 'www.neerzy.com'
        Set-Content $_.FullName -Value $content -NoNewline
        Write-Host "URL Updated: $($_.FullName)"
    }
}
Write-Host "Done!"
