FROM rust:1.93.1-slim-trixie AS build-base
RUN apt update
RUN --mount=type=cache,target=/var/cache/apt/archives \
    apt install -y build-essential pkg-config clang-18 cmake openssl libssl-dev git
RUN --mount=type=cache,target=/var/cache/apt/archives \
    apt install sccache



FROM base AS builder
WORKDIR /app/asr_service
COPY asr_service/Cargo.toml Cargo.toml
COPY asr_service/Cargo.lock Cargo.lock
COPY common ../common
ENV RUSTC_WRAPPER=sccache SCCACHE_DIR=/sccache
RUN mkdir ./src && echo 'fn main() { println!("Dummy!"); }' > ./src/main.rs
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=$SCCACHE_DIR \
    cargo build --release --no-default-features --features rust_audio
RUN rm -rf ./src
COPY asr_service/src src
COPY asr_service/assets assets
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=$SCCACHE_DIR \
    cargo build --release --no-default-features --features rust_audio


FROM debian:trixie-slim
WORKDIR /app
COPY asr_service/Rocket.toml Rocket.toml
COPY --from=builder /app/asr_service/target/release/asr_service /app/asr_service
EXPOSE 8000
CMD ["/app/asr_service"]
