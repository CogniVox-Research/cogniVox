# CogniVox — RunPod Deployment Guide

RunPod does not support `docker-compose`. Each service must be deployed as a
**separate RunPod Pod** (or combined into an "infra" pod where it makes sense).

Pods communicate via **RunPod Global Networking** which gives each pod a
hostname like `<pod-id>.runpod.internal`.

---

## Architecture Overview

| Pod Name | Image | Exposed Port(s) | GPU? |
|---|---|---|---|
| **infra** | `cognivox/runpod-infra` | 5672, 15672, 8333, 9333 | No |
| **asr_service** | `ghcr.io/cognivox-research/asr_service` | 8001 | Optional (CUDA variant available) |
| **auth_service** | `ghcr.io/cognivox-research/auth_service` | 8010 | No |
| **biometric_service** | `ghcr.io/cognivox-research/biometric_service` | 8011 | No |
| **document_service** | `ghcr.io/cognivox-research/document_service` | 8003 | No |
| **game_service** | `ghcr.io/cognivox-research/game_service` | 8004 | No |
| **sds_service** | `ghcr.io/cognivox-research/sds_service` | 8006 | No |
| **stuck_detection_service** | `ghcr.io/cognivox-research/stuck_detection_service` | 8012 | No |
| **transcript_analysis_service** | `ghcr.io/cognivox-research/transcript_analysis_service` | 8005 | No |
| **llm_service** | `ghcr.io/cognivox-research/llm_service` | 8013 | No |
| **gateway** | `cognivox/runpod-gateway` | 7000 (→ 80 internal) | No |

---

## Step 1: Build & Push Images

All commands are run from the **repository root** (`cogniVox/`).

### Infrastructure Pod (RabbitMQ + SeaweedFS)
```bash
docker build -f docker/runpod/Dockerfile.infra -t cognivox/runpod-infra .
docker push cognivox/runpod-infra
```

### Application Services
Each service uses its **existing Dockerfile** — no changes needed:
```bash
# ASR (CPU)
docker build -f services/asr/Dockerfile -t ghcr.io/cognivox-research/asr_service:runpod .

# ASR (CUDA — if deploying with GPU)
docker build -f services/asr/cuda.Dockerfile -t ghcr.io/cognivox-research/asr_service_cuda:runpod .

# Auth
docker build -f services/auth/Dockerfile -t ghcr.io/cognivox-research/auth_service:runpod .

# Biometric
docker build -f services/biometric/Dockerfile -t ghcr.io/cognivox-research/biometric_service:runpod .

# Document
docker build -f services/document/Dockerfile -t ghcr.io/cognivox-research/document_service:runpod .

# Game
docker build -f services/game/Dockerfile -t ghcr.io/cognivox-research/game_service:runpod .

# SDS
docker build -f services/sds/Dockerfile -t ghcr.io/cognivox-research/sds_service:runpod .

# Stuck Detection
docker build -f services/stuck_detection/Dockerfile -t ghcr.io/cognivox-research/stuck_detection_service:runpod .

# Transcript Analysis
docker build -f services/transcript_analysis/Dockerfile -t ghcr.io/cognivox-research/transcript_analysis_service:runpod .

# LLM
docker build -f services/llm/Dockerfile -t ghcr.io/cognivox-research/llm_service:runpod .
```

### Gateway
```bash
docker build -f docker/runpod/Dockerfile.gateway -t cognivox/runpod-gateway .
docker push cognivox/runpod-gateway
```

---

## Step 2: Create RunPod Pods

> **Important:** Enable **Global Networking** on every pod so they can reach
> each other via `<pod-id>.runpod.internal`.

### 2.1 — Deploy `infra` pod first
1. Create a new Pod → Image: `cognivox/runpod-infra`
2. Expose ports: `5672`, `15672`, `8333`, `9333`
3. Enable **Global Networking**
4. Note the pod ID (e.g., `abc123`) → hostname: `abc123.runpod.internal`

### 2.2 — Deploy application pods
For each service pod, set these **environment variables** (adjust hostnames):

```env
# ---- Connection to infra pod ----
CG_RABBITMQ__URL=amqp://appuser:apppass@<infra-pod-id>.runpod.internal:5672
CG_RABBITMQ__connection_name=runpod

CG_FILE_STORE__TYPE=s3
CG_FILE_STORE__ENDPOINT=http://<infra-pod-id>.runpod.internal:8333
CG_FILE_STORE__BUCKET=cg-data
CG_FILE_STORE__ACCESS_KEY_ID=admin_access_key
CG_FILE_STORE__SECRET_ACCESS_KEY=admin_secret_key

# ---- Cross-service URLs (set the actual pod IDs) ----
CG_URLS__TRANSCRIPT_ANALYSIS=http://<transcript-pod-id>.runpod.internal:8005
CG_URLS__SPEECH_SCORE=http://<sds-pod-id>.runpod.internal:8006/analyze-speech
CG_URLS__LLM__BASE=http://<llm-pod-id>.runpod.internal:8013/api/v1
CG_LLM_CONTINUE_URL=http://<llm-pod-id>.runpod.internal:8013/api/v1/generate-continuation-hint
```

### 2.3 — Deploy `gateway` pod last
Set environment variables for upstream resolution:

```env
AUTH_SERVICE_HOST=<auth-pod-id>.runpod.internal:8010
DOCUMENT_SERVICE_HOST=<document-pod-id>.runpod.internal:8003
GAME_SERVICE_HOST=<game-pod-id>.runpod.internal:8004
LLM_SERVICE_HOST=<llm-pod-id>.runpod.internal:8013
TRANSCRIPT_SERVICE_HOST=<transcript-pod-id>.runpod.internal:8005
SDS_SERVICE_HOST=<sds-pod-id>.runpod.internal:8006
```

---

## Step 3: Verify

1. Check RabbitMQ management UI at `http://<infra-pod-public-ip>:15672`
2. Hit each service's `/health` endpoint
3. Access the gateway at port `7000` for API routing

---

## File Reference

| File | Purpose |
|---|---|
| `docker/runpod/Dockerfile.infra` | Combined RabbitMQ + SeaweedFS infra pod |
| `docker/runpod/Dockerfile.gateway` | NGINX gateway with env-var-based upstreams |
| `docker/runpod/nginx.conf.template` | NGINX template with `envsubst` placeholders |
| `docker/runpod/supervisord.conf` | Supervisor config for infra pod processes |
| `docker/runpod/s3.json` | SeaweedFS S3 credentials config |
| `docker/runpod/.env.runpod.template` | Template env file with all variables |

---

## Notes

- **Volumes**: RunPod supports **Network Volumes** for persistent data.
  Attach a network volume and mount it to `/data` for the infra pod to
  persist RabbitMQ queues and SeaweedFS data across restarts.
- **GPU**: Only the ASR (CUDA) service requires a GPU pod. All others
  can run on CPU-only pods to save cost.
- **Scaling**: Each service is independently scalable — just deploy
  more pods of a particular service and load-balance via the gateway.
