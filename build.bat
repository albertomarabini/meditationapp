@echo off


set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.15.6-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"
echo JAVA_HOME is set to: %JAVA_HOME%

echo === Reset permissions to ensure user access ===
takeown /F . /R /D Y >nul 2>&1
icacls . /grant %USERNAME%:F /T >nul 2>&1

echo Remove node_modules and lock file
call npx rimraf node_modules
call npx rimraf .expo
del package-lock.json

echo Now safely remove Android Gradle cache
call npx rimraf android/.gradle
call npx rimraf android/app/build

echo npm/expo install
call npm install
@REM call npx expo install --check

@REM pause

echo Stop any running Gradle daemons
cd android
call gradlew --stop

echo Clear global Gradle cache (uncomment if needed)
call npx rimraf "%USERPROFILE%\.gradle\caches"

echo clean build outputs
call gradlew clean
cd ..

echo Run expo prebuild (WITHOUT --clean, so your manual android changes are kept)
call npx expo prebuild

@echo Ready to build or run the project.
call npx expo run:android
