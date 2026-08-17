@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

REM ============================================================
REM  Memento - mise a jour du site (commit + push)
REM  A lancer depuis le dossier du depot.
REM ============================================================

echo.
echo == Memento : envoi de la mise a jour ==
echo.

where git >nul 2>&1
if errorlevel 1 (
  echo Git n'est pas installe : winget install --id Git.Git
  pause & exit /b 1
)

if not exist .git (
  echo Ce dossier n'est pas encore un depot Git.
  echo Lancez d'abord publier.bat, il cree le depot et active Pages.
  pause & exit /b 1
)

git add -A || goto :err

git diff --cached --quiet
if not errorlevel 1 (
  echo Aucune modification a envoyer. Tout est deja en ligne.
  pause & exit /b 0
)

set MSG=Mise a jour Memento
set /p ANSWER=Message du commit [!MSG!] : 
if not "!ANSWER!"=="" set MSG=!ANSWER!

git commit -m "!MSG!" >nul || goto :err

echo Envoi vers GitHub...
git push || goto :err

for /f "delims=" %%u in ('git config --get remote.origin.url') do set URL=%%u
echo.
echo ==========================================================
echo   Pousse. GitHub Pages reconstruit le site (1 a 2 min).
echo   Depot : !URL!
echo ==========================================================
echo.
echo Sur le telephone : rechargez deux fois.
echo Si l'app est installee, fermez-la completement d'abord.
echo.
pause
exit /b 0

:err
echo.
echo Echec. Si Git demande vos identifiants, connectez-vous une fois
echo avec : gh auth login
pause
exit /b 1
