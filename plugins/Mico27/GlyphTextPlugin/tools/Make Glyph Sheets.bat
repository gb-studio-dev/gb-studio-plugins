@echo off
rem  Glyph Text Plugin - glyph sheet generator
rem
rem  Double-click to be asked for the font and the project, or drop a .ttf and
rem  a GB Studio project folder straight onto this file.
rem
rem  Any make_glyph_sheets.js flag can be appended too, e.g.
rem      "Make Glyph Sheets.bat" font.ttf myGame --name cjk --size 16

setlocal
cd /d "%~dp0"
title Glyph Text Plugin - glyph sheet generator

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js was not found on your PATH.
  echo   Install it from https://nodejs.org/ and run this again.
  echo.
  pause
  exit /b 1
)

node "make_glyph_sheets.js" %*
set EXITCODE=%ERRORLEVEL%

echo.
if %EXITCODE% NEQ 0 (
  echo   Finished with errors.
) else (
  echo   Done.
)
pause
exit /b %EXITCODE%
