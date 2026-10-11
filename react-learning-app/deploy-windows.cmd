@echo off
REM =========================
REM Script deploy React frontend (Vite) trên Windows
REM =========================

REM Bước 0: Kiểm tra dist folder
if not exist dist (
    echo Dist folder not found! Chay "npm run build" truoc.
    exit /b 1
)

REM Bước 1: Xóa deploy folder cũ (nếu có)
if exist deploy (
    echo Removing old deploy folder...
    rmdir /S /Q deploy
)

REM Bước 2: Tạo folder deploy
mkdir deploy

REM Bước 3: Copy dist output
echo Copying dist output...
xcopy dist deploy /E /I /Y

REM Bước 4: Copy env-config.js
if exist public\env-config.js (
    echo Copying env-config.js...
    copy public\env-config.js deploy\
) else (
    echo WARNING: env-config.js not found in public\
)

REM Bước 5: Copy web.config nếu có
if exist public\web.config (
    echo Copying web.config...
    copy public\web.config deploy\
) else (
    echo No web.config found, skipping...
)

REM Bước 6: Zip folder deploy
echo Creating frontend-package.zip...
powershell -Command "Compress-Archive -Path deploy\* -DestinationPath frontend-package.zip -Force"

echo =========================
echo ✅ Deploy folder prepared!
echo File ready: frontend-package.zip
echo =========================
pause
