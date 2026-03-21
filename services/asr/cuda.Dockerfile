FROM nvidia/cuda:13.0.2-devel-ubuntu24.04  AS build-base
RUN apt update
RUN --mount=type=cache,target=/var/cache/apt/archives \
    apt install -y build-essential pkg-config clang-18 cmake openssl libssl-dev git curl
RUN --mount=type=cache,target=/var/cache/apt/archives \
    apt install sccache
# RUN curl https://sh.rustup.rs -sSf | bash -s -- -y
RUN curl https://sh.rustup.rs -sSf | bash -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
ENV RUSTC_WRAPPER=sccache
ENV SCCACHE_DIR=/sccache


FROM build-base AS builder
ENV NAME="services/asr"
COPY lib/common /app/lib/common
COPY $NAME/ /app/$NAME/
WORKDIR /app/$NAME
RUN --mount=type=cache,target=/root/.cargo/registry \
    --mount=type=cache,target=$SCCACHE_DIR \
    --mount=type=cache,target=/build \
    cargo build --release --target-dir /build --features cuda
RUN    --mount=type=cache,target=/build \
    cp /build/release/asr_service /asr_service


FROM nvidia/cuda:13.0.2-base-ubuntu24.04
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates libcublas-13-0\
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /var/cache/apt/
WORKDIR /app
COPY --from=builder /asr_service /app/asr_service
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=10 \
  CMD  curl -f http://localhost:8001/health || exit 1
EXPOSE 8001
CMD ["/app/asr_service"]
