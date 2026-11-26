"""Almacenamiento de objetos: S3 en producción, una carpeta local para desarrollo."""

from __future__ import annotations

import shutil
from pathlib import Path
from typing import Protocol
from urllib.parse import urlparse


class Storage(Protocol):
    uri: str

    def put_file(self, local_path: Path, key: str, content_type: str) -> str:
        """Sube un archivo y devuelve su URI completa."""

    def list_keys(self, prefix: str) -> list[str]:
        """Lista las keys que empiezan con `prefix`, ordenadas."""

    def read_bytes(self, key: str) -> bytes:
        """Lee el contenido completo de una key."""


class LocalStorage:
    def __init__(self, root: Path) -> None:
        self.root = root
        self.uri = str(root)

    def put_file(self, local_path: Path, key: str, content_type: str) -> str:
        dest = self.root / key
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(local_path, dest)
        return str(dest)

    def list_keys(self, prefix: str) -> list[str]:
        if not self.root.exists():
            return []
        keys = (p.relative_to(self.root).as_posix() for p in self.root.rglob("*") if p.is_file())
        return sorted(k for k in keys if k.startswith(prefix))

    def read_bytes(self, key: str) -> bytes:
        return (self.root / key).read_bytes()


class S3Storage:
    def __init__(self, bucket: str, client=None) -> None:
        self.bucket = bucket
        self.uri = f"s3://{bucket}"
        self._client = client

    @property
    def client(self):
        if self._client is None:
            import boto3

            self._client = boto3.client("s3")
        return self._client

    def put_file(self, local_path: Path, key: str, content_type: str) -> str:
        self.client.upload_file(
            str(local_path), self.bucket, key, ExtraArgs={"ContentType": content_type}
        )
        return f"s3://{self.bucket}/{key}"

    def list_keys(self, prefix: str) -> list[str]:
        keys: list[str] = []
        paginator = self.client.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=self.bucket, Prefix=prefix):
            keys.extend(obj["Key"] for obj in page.get("Contents", []))
        return sorted(keys)

    def read_bytes(self, key: str) -> bytes:
        return self.client.get_object(Bucket=self.bucket, Key=key)["Body"].read()


def storage_from_uri(uri: str) -> Storage:
    """`s3://bucket` → S3Storage; cualquier otra cosa se trata como carpeta local."""
    parsed = urlparse(uri)
    if parsed.scheme == "s3":
        if not parsed.netloc or parsed.path.strip("/"):
            raise ValueError(f"Usa solo el bucket, sin prefijo: {uri!r}")
        return S3Storage(parsed.netloc)
    if parsed.scheme == "file":
        return LocalStorage(Path(parsed.path))
    if parsed.scheme:
        raise ValueError(f"Esquema no soportado: {uri!r}")
    return LocalStorage(Path(uri))
