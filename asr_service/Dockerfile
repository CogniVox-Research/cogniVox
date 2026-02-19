FROM rust:1.93.1-slim-trixie AS build-base
RUN apt update
RUN --mount=type=cache,target=/var/cache/apt \
    apt install -y build-essential pkg-config clang-18 cmake openssl libssl-dev git nasm
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
COPY asr_service/Cargo.toml asr_service/Cargo.toml
COPY asr_service/Cargo.lock asr_service/Cargo.lock
COPY asr_service/src asr_service/src
COPY asr_service/assets asr_service/assets
COPY common common
WORKDIR /app/asr_service
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=$SCCACHE_DIR \
    cargo build --no-default-features --features vulkan,ffmpeg


FROM debian:trixie-slim
WORKDIR /app
COPY asr_service/models /app/models
COPY asr_service/Rocket.toml Rocket.toml
RUN apt update
RUN apt install -y ffmpeg libvulkan1
COPY --from=builder /app/asr_service/target/debug/asr_service /app/asr_service
EXPOSE 8000
CMD ["/bin/sh", "-c", "'/app/asr_service'"]
