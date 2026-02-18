FROM rust:1.93.1-slim-trixie AS build-base
RUN apt update
RUN --mount=type=cache,target=/var/cache/apt \
    apt install -y build-essential pkg-config clang-18 cmake openssl libssl-dev git
RUN --mount=type=cache,target=/var/cache/apt \
    apt install sccache
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    cargo install cargo-chef

FROM build-base AS base
RUN --mount=type=cache,target=/var/cache/apt \
    apt install -y ffmpeg libavcodec-dev libavutil-dev libavformat-dev libavfilter-dev libavdevice-dev
ENV RUSTC_WRAPPER=sccache SCCACHE_DIR=/sccache
RUN apt install -y libvulkan-dev glslc

FROM base AS builder
WORKDIR /app
COPY Cargo.toml Cargo.toml
COPY Cargo.lock Cargo.lock
COPY src src
COPY assets assets
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=$SCCACHE_DIR \
    cargo build --no-default-features --features vulkan,ffmpeg

FROM debian:trixie-slim
WORKDIR /app
COPY models /app/models
COPY Rocket.toml Rocket.toml
RUN apt update
RUN apt install -y ffmpeg libvulkan1
COPY --from=builder /app/target/debug/asr_service /app/asr_service
COPY --from=builder /app/assets /app/assets
RUN ls /app
EXPOSE 8000
CMD ["/app/asr_service"]
