#!/bin/bash
set -euo pipefail

docker build -t ghcr.io/cognivox-research/asr_service_cuda_13_0:latest -f ./cuda.Dockerfile ../../
docker push ghcr.io/cognivox-research/asr_service_cuda_13_0:latest
