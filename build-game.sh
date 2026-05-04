#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=`realpath "$(dirname "$0")"`

PROJECT_PATH="${SCRIPT_DIR}/vr-game/game"
ASSETS_DIR="${SCRIPT_DIR}/app/mobile/src/main/assets"
ZIP_FILE="/tmp/a.zip"

mkdir -p "${ASSETS_DIR}" 

BIN="${ASSETS_DIR}/project.binary"

if [[ ! -f "${BIN}" ]]; then
    if [[ "$(find "${ASSETS_DIR}" -mindepth 1 | wc -l)" -gt 0 ]]; then
        echo "ERROR: 'project.binary' missing in ${ASSETS_DIR} while the folder still contains other files." >&2
        exit 1
    fi
else
    rm -r "${ASSETS_DIR:?}"
    mkdir -p "${ASSETS_DIR}" 
fi

echo

godot --headless --export-pack "Android" "${ZIP_FILE}" --path "${PROJECT_PATH}"

unzip -o "${ZIP_FILE}" -d "${ASSETS_DIR}"
