#!/usr/bin/env bash
set -euo pipefail
REGISTRY="${REGISTRY:-ghcr.io/cognivox-research}"
TAG="${TAG:-runpod}"
echo "Building CogniVox images for RunPod (Registry: ${REGISTRY}, Tag: ${TAG})"

docker build -f docker/runpod/Dockerfile.infra -t "${REGISTRY}/infra:${TAG}" .
docker build -f services/asr/Dockerfile -t "${REGISTRY}/asr_service:${TAG}" .
docker build -f services/auth/Dockerfile -t "${REGISTRY}/auth_service:${TAG}" .
docker build -f services/biometric/Dockerfile -t "${REGISTRY}/biometric_service:${TAG}" .
docker build -f services/document/Dockerfile -t "${REGISTRY}/document_service:${TAG}" .
docker build -f services/game/Dockerfile -t "${REGISTRY}/game_service:${TAG}" .
docker build -f services/sds/Dockerfile -t "${REGISTRY}/sds_service:${TAG}" .
docker build -f services/stuck_detection/Dockerfile -t "${REGISTRY}/stuck_detection_service:${TAG}" .
docker build -f services/transcript_analysis/Dockerfile -t "${REGISTRY}/transcript_analysis_service:${TAG}" .
docker build -f services/llm/Dockerfile -t "${REGISTRY}/llm_service:${TAG}" .
docker build -f docker/runpod/Dockerfile.gateway -t "${REGISTRY}/gateway:${TAG}" .

echo "All images built! Push with: docker push ${REGISTRY}/<name>:${TAG}"
