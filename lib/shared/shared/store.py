import abc
import os
import secrets
from pathlib import Path
from typing import Literal, Union

import boto3
from pydantic import BaseModel


class ConfigLocal(BaseModel, extra="forbid"):
    type: Literal["local"] = "local"
    path: Path


class ConfigS3(BaseModel, extra="forbid"):
    type: Literal["s3"] = "s3"
    endpoint: str
    bucket: str
    access_key_id: str
    secret_access_key: str


StoreConfig = Union[ConfigLocal, ConfigS3]


class Store(abc.ABC):
    @abc.abstractmethod
    def get(self, key: str) -> bytes:
        raise NotImplementedError

    @abc.abstractmethod
    def put(self, key: str, data: bytes) -> None:
        raise NotImplementedError


class LocalStore(Store):
    def __init__(self, base_path: Path | os.PathLike) -> None:
        self.base = Path(base_path).expanduser().resolve()
        if not self.base.exists():
            self.base.mkdir(parents=True)

        if not self.base.is_dir():
            raise FileNotFoundError(f"{self.base!s} is not a directory")

    def _full_path(self, key: str) -> Path:
        return (self.base / key).resolve()

    def get(self, key: str) -> bytes:
        fp = self._full_path(key)
        if not fp.is_file():
            raise FileNotFoundError(fp)
        return fp.read_bytes()

    def put(self, key: str, data: bytes) -> None:
        fp = self._full_path(key)
        fp.parent.mkdir(parents=True, exist_ok=True)

        fp.write_bytes(data)


class S3Store(Store):
    def __init__(
        self, endpoint: str, bucket: str, access_key_id: str, secret_access_key: str
    ) -> None:
        self.bucket = bucket
        self.client = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
        )

    def get(self, key: str) -> bytes:
        resp = self.client.get_object(Bucket=self.bucket, Key=key)
        return resp["Body"].read()

    def put(self, key: str, data: bytes) -> None:
        self.client.put_object(Bucket=self.bucket, Key=key, Body=data)


def connect_store(cfg: StoreConfig) -> Store:
    if isinstance(cfg, ConfigLocal):
        return LocalStore(cfg.path)
    elif isinstance(cfg, ConfigS3):
        return S3Store(
            endpoint=cfg.endpoint,
            bucket=cfg.bucket,
            access_key_id=cfg.access_key_id,
            secret_access_key=cfg.secret_access_key,
        )
    else:
        raise TypeError("Unsupported store configuration")


def test_s3():
    s3 = ConfigS3(
        endpoint="http://localhost:8333",
        bucket="cg-data",
        access_key_id="admin_access_key",
        secret_access_key="admin_secret_key",
    )
    store = connect_store(s3)
    print(f"Connected to store {s3}")

    data = f"data {secrets.token_hex()}".encode("utf-8")
    key = "test-python"
    store.put(key, data)
    get_data = store.get(key)
    assert data == get_data


def test_local():
    import tempfile

    temp = Path(tempfile.mkdtemp())

    local = ConfigLocal(path=temp)
    store = connect_store(local)

    data = f"data {secrets.token_hex()}".encode("utf-8")
    key = "test-python"
    store.put(key, data)
    get_data = store.get(key)
    assert data == get_data
