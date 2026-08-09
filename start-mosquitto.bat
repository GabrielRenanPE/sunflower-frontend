@echo off
:: ═══════════════════════════════════════════════════════════════════════════════
::  SUNFLOWER — Iniciar Broker Mosquitto (Desenvolvimento Local)
:: ═══════════════════════════════════════════════════════════════════════════════
::
::  Uso: Dê duplo clique neste arquivo, ou rode no terminal:
::       .\start-mosquitto.bat
::
::  Pré-requisito: Mosquitto instalado e no PATH
::    Instale via: winget install EclipseFoundation.Mosquitto
::    Ou baixe em: https://mosquitto.org/download/
::
:: ═══════════════════════════════════════════════════════════════════════════════

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║  SUNFLOWER — Broker Mosquitto               ║
echo  ║  Porta 1883 (TCP) · Sem autenticação        ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: Cria diretório de persistência se não existir
if not exist "%~dp0mosquitto\data" (
    mkdir "%~dp0mosquitto\data"
    echo [OK] Diretorio mosquitto\data criado.
)

:: Verifica se o Mosquitto está instalado
where mosquitto >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Mosquitto nao encontrado no PATH.
    echo        Instale com: winget install EclipseFoundation.Mosquitto
    echo        Ou baixe em: https://mosquitto.org/download/
    echo.
    echo        Apos instalar, adicione ao PATH ou rode diretamente:
    echo        "C:\Program Files\mosquitto\mosquitto.exe" -v -c mosquitto\mosquitto.conf
    echo.
    pause
    exit /b 1
)

echo [OK] Mosquitto encontrado. Iniciando broker...
echo [OK] Config: mosquitto\mosquitto.conf
echo [OK] Persistencia: mosquitto\data\
echo.
echo ─────────────────────────────────────────────────
echo  Pressione Ctrl+C para encerrar o broker
echo ─────────────────────────────────────────────────
echo.

:: Inicia o broker com verbose e o config do projeto
mosquitto -v -c "%~dp0mosquitto\mosquitto.conf"

:: Se o mosquitto fechar, pausa para ver mensagens de erro
echo.
echo [INFO] Broker Mosquitto encerrado.
pause
