<#
.SYNOPSIS
    Nettoie l'intégralité du projet en supprimant tous les artefacts de build
    (target, build, dist, node_modules, .turbo, etc.).

.DESCRIPTION
    Ce script parcourt récursivement le projet (backend + frontend) et supprime
    tous les répertoires générés par les outils de build (Maven, pnpm/npm, Vite, etc.)
    afin de repartir d'un état propre.

.EXAMPLE
    .\clean.ps1
#>

$ErrorActionPreference = "Stop"

$rootPath = $PSScriptRoot

# Liste des noms de dossiers à supprimer partout dans le projet.
$dirsToRemove = @(
    "target",       # Maven
    "build",        # Gradle / outils front
    "dist",         # Build front (Vite/Rollup/etc.)
    "node_modules", # Dépendances npm/pnpm
    ".turbo",       # Cache Turborepo
    ".next",        # Cache Next.js (si utilisé)
    ".cache",       # Cache générique
    "out"           # Sorties diverses (Tauri, etc.)
)

Write-Host "Nettoyage du projet : $rootPath" -ForegroundColor Cyan

foreach ($dirName in $dirsToRemove) {
    $matches = Get-ChildItem -Path $rootPath -Recurse -Directory -Force -Filter $dirName -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -notmatch '\\\.git\\' }

    foreach ($dir in $matches) {
        try {
            Write-Host "Suppression : $($dir.FullName)" -ForegroundColor Yellow
            Remove-Item -LiteralPath $dir.FullName -Recurse -Force -ErrorAction Stop
        }
        catch {
            Write-Warning "Impossible de supprimer $($dir.FullName) : $_"
        }
    }
}

Write-Host "Nettoyage terminé." -ForegroundColor Green
