FROM rust:1.93.1-slim-trixie AS base
RUN apt update
RUN --mount=type=cache,target=/var/cache/apt \
    apt install sccache
ENV RUSTC_WRAPPER=sccache SCCACHE_DIR=/sccache

FROM base AS builder
ENV NAME="services/document"
COPY lib/common /app/lib/common
WORKDIR /app/$NAME
COPY $NAME/Cargo.toml Cargo.toml
COPY $NAME/Cargo.lock Cargo.lock
COPY $NAME/src src
COPY $NAME/assets assets
RUN --mount=type=cache,target=/root/.cargo/registry \
    --mount=type=cache,target=$SCCACHE_DIR \
    --mount=type=cache,target=/build \
    cargo build --release --target-dir /build
RUN    --mount=type=cache,target=/build \
    cp /build/release/document_service /document_service


FROM debian:trixie-slim
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates\
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /var/cache/apt/
WORKDIR /app
COPY --from=builder /document_service /app
EXPOSE 8003
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8003/health || exit 1
CMD ["/app/document_service"]
