# =====================================================================
# Lokalny podgląd strony WOOJIN PLAIMM (tylko do użytku na tym komputerze).
# Uruchamia prosty serwer HTTP dla folderu strony i otwiera ją w przeglądarce,
# dzięki czemu wszystko działa tak jak po publikacji - m.in. film z YouTube
# (przy otwieraniu plików prosto z dysku YouTube zgłasza "Błąd 153").
# Uruchamiaj przez "Podglad strony.bat". Zatrzymanie: zamknij okno serwera.
# Folderu _podglad nie trzeba wysyłać na serwer z publikowaną stroną.
# =====================================================================
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$rootFull = [System.IO.Path]::GetFullPath($root).TrimEnd('\') + '\'

$mime = @{
    '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'
    '.json' = 'application/json'; '.svg' = 'image/svg+xml'; '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'
    '.webp' = 'image/webp'; '.gif' = 'image/gif'; '.ico' = 'image/x-icon'; '.pdf' = 'application/pdf'
    '.woff' = 'font/woff'; '.woff2' = 'font/woff2'; '.ttf' = 'font/ttf'; '.mp4' = 'video/mp4'; '.webm' = 'video/webm'; '.txt' = 'text/plain; charset=utf-8'
}

# Pierwszy wolny port z listy
$listener = $null
foreach ($port in 8080, 8081, 8082, 8090, 8123, 8888) {
    try {
        $l = New-Object System.Net.HttpListener
        $l.Prefixes.Add("http://localhost:$port/")
        $l.Start()
        $listener = $l
        break
    } catch { }
}
if (-not $listener) {
    Write-Host 'Nie udało się uruchomić serwera (zajęte porty). Naciśnij Enter, aby zamknąć.'
    [void][Console]::ReadLine()
    exit 1
}

$url = "http://localhost:$port/index.html"
Write-Host ''
Write-Host '  Podgląd strony WOOJIN PLAIMM'
Write-Host "  Adres: $url"
Write-Host '  Aby zakończyć podgląd, zamknij to okno.'
Write-Host ''
Start-Process $url

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $res = $ctx.Response
    try {
        $rel = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
        if ([string]::IsNullOrEmpty($rel)) { $rel = 'index.html' }
        $file = [System.IO.Path]::GetFullPath((Join-Path $root ($rel -replace '/', '\')))
        if ((Test-Path -LiteralPath $file -PathType Container)) { $file = Join-Path $file 'index.html' }
        # tylko pliki z folderu strony
        if ($file.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $file -PathType Leaf)) {
            $ext = [System.IO.Path]::GetExtension($file).ToLower()
            $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
            $res.Headers.Add('Cache-Control', 'no-cache')
            $bytes = [System.IO.File]::ReadAllBytes($file)
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $res.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes('404 - nie znaleziono: ' + $rel)
            $res.ContentType = 'text/plain; charset=utf-8'
            $res.OutputStream.Write($msg, 0, $msg.Length)
        }
    } catch {
        try { $res.StatusCode = 500 } catch { }
    } finally {
        try { $res.OutputStream.Close() } catch { }
    }
}
