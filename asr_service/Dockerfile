FROM nvidia/cuda:13.1.1-devel-ubuntu24.04  AS build-base
RUN apt update
RUN --mount=type=cache,target=/var/cache/apt/archives \
    apt install -y build-essential pkg-config clang-18 cmake openssl libssl-dev git curl
RUN --mount=type=cache,target=/var/cache/apt/archives \
    apt install sccache
# RUN curl https://sh.rustup.rs -sSf | bash -s -- -y
RUN curl https://sh.rustup.rs -sSf | bash -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"


FROM build-base AS builder
WORKDIR /app/asr_service
COPY asr_service/Cargo.toml Cargo.toml
COPY asr_service/Cargo.lock Cargo.lock
COPY common ../common
ENV RUSTC_WRAPPER=sccache SCCACHE_DIR=/sccache
ENV PATH="/root/.cargo/bin:${PATH}"
RUN mkdir ./src && echo 'fn main() { println!("Dummy!"); }' > ./src/main.rs
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=$SCCACHE_DIR \
    cargo run --release --no-default-features --features rust_audio,cuda
RUN rm -rf ./src
RUN rm -rf ./target
COPY asr_service/src src
COPY asr_service/assets assets
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=$SCCACHE_DIR \
    cargo build --release --no-default-features --features rust_audio,cuda


FROM nvidia/cuda:13.1.1-runtime-ubuntu24.04
WORKDIR /app
COPY asr_service/Rocket.toml Rocket.toml
COPY --from=builder /app/asr_service/target/release/asr_service /app/asr_service
EXPOSE 8001
CMD ["/app/asr_service"]
