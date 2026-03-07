FROM rust:1.93.1-slim-trixie AS base
RUN apt update
RUN --mount=type=cache,target=/var/cache/apt \
    apt install sccache
ENV RUSTC_WRAPPER=sccache SCCACHE_DIR=/sccache

FROM base AS builder
ENV NAME="services/document"
WORKDIR /app/$NAME
COPY $NAME/Cargo.toml Cargo.toml
COPY $NAME/Cargo.lock Cargo.lock
COPY lib/common /app/lib/common
COPY $NAME/src src
COPY $NAME/assets assets
WORKDIR /app/$NAME
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=$SCCACHE_DIR \
    cargo build --release --target-dir /build


FROM rust:1.93.1-slim-trixie
WORKDIR /app
COPY --from=builder /build/release/document_service /app
EXPOSE 8003
CMD ["/app/document_service"]
