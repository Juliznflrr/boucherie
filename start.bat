@echo off
title 🚀 Lancement du Serveur Node.js
color 0A

:: Encadrement stylisé
echo.
echo ╔══════════════════════════════════════╗
echo ║   🚀 Lancement du serveur Node.js   ║
echo ╚══════════════════════════════════════╝
echo.

:: Animation de chargement (optionnelle)
set /p =Chargement. <nul
ping -n 1 127.0.0.1 >nul
set /p =. <nul
ping -n 1 127.0.0.1 >nul
set /p =. <nul
ping -n 1 127.0.0.1 >nul
echo.

:: Lancement du serveur
node server.js

:: Pause à la fin pour voir les erreurs éventuelles
echo.
echo ╔══════════════════════════════════════╗
echo ║     Serveur terminé ou en erreur     ║
echo ╚══════════════════════════════════════╝
pause