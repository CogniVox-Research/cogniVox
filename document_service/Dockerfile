FROM rust:1.93.1-slim-trixie AS base
RUN apt update
RUN --mount=type=cache,target=/var/cache/apt \
    apt install sccache
ENV RUSTC_WRAPPER=sccache SCCACHE_DIR=/sccache

FROM base AS builder
WORKDIR /app/document_service
COPY document_service/Cargo.toml Cargo.toml
COPY document_service/Cargo.lock Cargo.lock
COPY common ../common
RUN mkdir ./src && echo 'fn main() { println!("Dummy!"); }' > ./src/main.rs
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=$SCCACHE_DIR \
    cargo build --release
RUN rm -rf ./src
COPY document_service/src src
COPY document_service/assets assets
WORKDIR /app/document_service
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=$SCCACHE_DIR \
    cargo build --release


FROM scratch
WORKDIR /app
COPY document_service/Rocket.toml Rocket.toml
COPY --from=builder /app/document_service/target/release/document_service /app/document_service
EXPOSE 8000
CMD ["/app/document_service"]
