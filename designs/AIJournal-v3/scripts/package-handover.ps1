param(
  [string]$OutputPath,
  [switch]$IncludeVerification
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$handoverRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if (-not $OutputPath) {
  $OutputPath = Join-Path (Split-Path $handoverRoot -Parent) ('AIJournal-v3-delivery-' + (Get-Date -Format 'yyyy-MM-dd-HHmmss') + '.zip')
}
$packagePath = [IO.Path]::GetFullPath($OutputPath)
# Explicit delivery contents: source, portable exports, tools and handoff docs.
# Historical studies and browser evidence are not runtime dependencies.
$deliveryFiles = @(foreach ($file in Get-ChildItem -LiteralPath $handoverRoot -Recurse -File) {
  $relative = $file.FullName.Substring($handoverRoot.Length + 1).Replace('\','/')
  $include = $relative -match '^[^/]+\.(md|txt|css|html)$' -or
    $relative -match '^(mobile-web|tablet-web|desktop-web|mobile-app)/[^/]+\.html$' -or
    $relative -match '^assets/fonts/[^/]+\.(woff2|json|txt|md)$' -or
    $relative -match '^docs/.+\.md$' -or
    $relative -match '^scripts/[^/]+\.(mjs|js|ps1)$' -or
    $relative -match '^design system/(index(\.source)?\.html|build-export\.mjs|README\.md)$' -or
    $relative -match '^design system/components/.+\.(css|js|ts|json|md|html)$'
  if ($relative -eq 'auth-alternatives/inset-backgrounds/05-glass-diagonal-light.html') { $include = $true }
  if ($relative -match '^auth-alternatives/.*\.md$') { $include = $true }
  if ($relative -match '^verification/') { $include = $IncludeVerification -or $relative -eq 'verification/recommendedchanges-review.md' }
  if ($include -and $file.FullName -ne $packagePath) { [PSCustomObject]@{file=$file;relative=$relative} }
})
foreach ($required in @('journal-website.html','journal-prototype.html','journal-prototype-tablet.html','journal-prototype-desktop.html','lock.css','README.md','EXPORT-HANDOFF.md','scripts/build.mjs','design system/index.html')) {
  if ($required -notin $deliveryFiles.relative) { throw "Missing delivery file: $required" }
}
# CreateNew protects earlier deliveries, including a user-supplied output path.
$packageStream = [IO.File]::Open($packagePath, [IO.FileMode]::CreateNew)
$archive = [IO.Compression.ZipArchive]::new($packageStream, [IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($item in $deliveryFiles) {
    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $item.file.FullName, "AIJournal-v3/$($item.relative)", [IO.Compression.CompressionLevel]::Optimal) | Out-Null
  }
} finally { $archive.Dispose(); $packageStream.Dispose() }
Write-Output $packagePath
