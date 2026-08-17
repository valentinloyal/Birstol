@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

REM ============================================================
REM  Memento - publication sur GitHub Pages
REM  Cree le depot, pousse le code, active Pages, ouvre l'URL.
REM ============================================================

set REPO=bristol

echo.
echo == Memento : publication sur GitHub Pages ==
echo.

where gh >nul 2>&1
if errorlevel 1 (
  echo GitHub CLI n'est pas installe.
  echo Installez-le puis relancez :
  echo     winget install --id GitHub.cli
  pause
  exit /b 1
)

where git >nul 2>&1
if errorlevel 1 (
  echo Git n'est pas installe : winget install --id Git.Git
  pause
  exit /b 1
)

gh auth status >nul 2>&1
if errorlevel 1 (
  echo Connexion a GitHub requise...
  gh auth login || goto :err
)

for /f "delims=" %%u in ('gh api user --jq .login') do set OWNER=%%u
if "!OWNER!"=="" goto :err
echo Compte : !OWNER!

set /p ANSWER=Nom du depot [!REPO!] : 
if not "!ANSWER!"=="" set REPO=!ANSWER!

echo.
echo [1/4] Preparation du depot local...
if not exist .git (
  git init -b main >nul || goto :err
) else (
  git checkout -B main >nul 2>&1
)
git add -A || goto :err
git diff --cached --quiet && (echo     Rien de nouveau a valider.) || git commit -m "Memento - fiches de revision" >nul || goto :err

echo [2/4] Creation du depot distant...
gh repo view !OWNER!/!REPO! >nul 2>&1
if errorlevel 1 (
  gh repo create !REPO! --public --source=. --remote=origin --push || goto :err
) else (
  echo     Le depot existe deja, mise a jour.
  git remote remove origin >nul 2>&1
  git remote add origin https://github.com/!OWNER!/!REPO!.git || goto :err
  git push -u origin main --force || goto :err
)

echo [3/4] Activation de GitHub Pages...
> "%TEMP%\pages.json" echo {"source":{"branch":"main","path":"/"}}
gh api -X POST repos/!OWNER!/!REPO!/pages --input "%TEMP%\pages.json" >nul 2>&1
if errorlevel 1 (
  gh api -X PUT repos/!OWNER!/!REPO!/pages --input "%TEMP%\pages.json" >nul 2>&1
)
del "%TEMP%\pages.json" >nul 2>&1

echo [4/4] Attente de la mise en ligne ^(1 a 2 minutes^)...
set URL=https://!OWNER!.github.io/!REPO!/

echo.
echo ==========================================================
echo   !URL!
echo ==========================================================
echo.
echo Sur le telephone : ouvrir cette URL dans Chrome,
echo puis menu ^(trois points^) ^> Installer l'application.
echo.

start "" "!URL!"
pause
exit /b 0

:err
echo.
echo Echec. Verifiez la connexion et les droits du compte GitHub.
pause
exit /b 1
