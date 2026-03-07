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
ENV NAME="services/asr"
WORKDIR /app/asr_service
COPY $NAME/Cargo.toml Cargo.toml
COPY $NAME/Cargo.lock Cargo.lock
COPY lib/common ../common
ENV RUSTC_WRAPPER=sccache SCCACHE_DIR=/sccache
ENV PATH="/root/.cargo/bin:${PATH}"
COPY $NAME/src src
COPY $NAME/assets assets
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=$SCCACHE_DIR \
    cargo build --release --target-dir /build

FROM nvidia/cuda:13.1.1-runtime-ubuntu24.04
WORKDIR /app
COPY --from=builder /build/release/asr_service /app/asr_service
EXPOSE 8001
CMD ["/app/asr_service"]
