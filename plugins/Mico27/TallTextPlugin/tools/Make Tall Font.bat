@echo off
rem  Tall Text font generator.
rem
rem  Double-click for a guided run, or drag a .ttf onto this file. You can also
rem  drop a font and a GB Studio project folder together.
rem
rem  Any make_tall_font.js flag can be appended too, e.g.
rem     "Make Tall Font.bat" --size 16 --name myfont
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found on PATH. Install it from https://nodejs.org/
  pause
  exit /b 1
)
node "make_tall_font.js" %*
echo.
pause
