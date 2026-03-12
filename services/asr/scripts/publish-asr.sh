#!/bin/bash
set -euo pipefail
SCRIPT_DIR=`realpath "$(dirname "$0")"`
IMAGE_DIR=`dirname "$SCRIPT_DIR"`
cd $IMAGE_DIR

docker build -t ghcr.io/cognivox-research/asr_service:latest -f ./Dockerfile ../../
docker push ghcr.io/cognivox-research/asr_service:latest
