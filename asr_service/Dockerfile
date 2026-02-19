FROM rust:1.93.1-slim-trixie AS build-base
RUN apt update
RUN --mount=type=cache,target=/var/cache/apt \
    apt install -y build-essential pkg-config clang-18 cmake openssl libssl-dev git nasm
RUN --mount=type=cache,target=/var/cache/apt \
    apt install sccache


FROM build-base AS base
RUN --mount=type=cache,target=/var/cache/apt \
    apt install -y ffmpeg libavcodec-dev libavutil-dev libavformat-dev libavfilter-dev libavdevice-dev
RUN apt install -y libvulkan-dev glslc


FROM base AS builder
WORKDIR /app/asr_service
COPY asr_service/Cargo.toml Cargo.toml
COPY asr_service/Cargo.lock Cargo.lock
COPY common ../common
ENV RUSTC_WRAPPER=sccache SCCACHE_DIR=/sccache
RUN mkdir ./src && echo 'fn main() { println!("Dummy!"); }' > ./src/main.rs
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=$SCCACHE_DIR \
    cargo build --release --no-default-features --features vulkan,ffmpeg
RUN rm -rf ./src
COPY asr_service/src src
COPY asr_service/assets assets
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=$SCCACHE_DIR \
    cargo build --release --no-default-features --features vulkan,ffmpeg

FROM debian:trixie-slim AS run-base
WORKDIR /app
RUN apt update
RUN apt install -y ffmpeg libvulkan1

FROM run-base
WORKDIR /app
COPY asr_service/Rocket.toml Rocket.toml
COPY --from=builder /app/asr_service/target/release/asr_service /app/asr_service
EXPOSE 8000
CMD ["/app/asr_service"]
