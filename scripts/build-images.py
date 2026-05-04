#!/usr/bin/env python3
import subprocess
import sys
from dataclasses import dataclass
from functools import cache
from pathlib import Path

import tomllib

ORGANISATION = "CogniVox-Research"

# dokcer context dir is repo root to allow including lib/*
context_dir = Path(__file__).parent.parent


@dataclass
class Image:
    dir_name: str
    service_name: str
    docker_file: str
    variant: str | None = None

    @property
    def docker_file_path(self):
        if self.variant is None:
            return self.path / self.docker_file

        return self.path / f"{self.variant}.{self.docker_file}"

    @property
    def path(self):
        return context_dir / "services" / self.dir_name

    def image_ref(self):
        base = f"ghcr.io/{ORGANISATION.lower()}/{self.service_name}"
        if self.variant is None:
            return f"{base}:{get_current_git_tag()}"
        return f"{base}_{self.variant}:{get_current_git_tag()}"


@cache
def get_current_git_tag() -> str:
    try:
        tag = subprocess.check_output(
            ["git", "describe", "--tags", "--exact-match", "--abbrev=0"],
            text=True,
        ).strip()

        if not tag:
            raise ValueError("empty tag")
    except Exception:
        tag = subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"], text=True
        ).strip()
    return tag


def load_config() -> list[Image]:
    path = Path(__file__).parent / "images.toml"
    if not path.is_file():
        print(f"{path} does not exist.")
        sys.exit(1)

    with path.open("rb") as f:
        data = tomllib.load(f)

    images: list[Image] = []

    if not isinstance(data, dict) and "image" in data:
        print("Cannot get image list from config")
        sys.exit(1)

    for entry in data["image"]:
        path = entry.pop("path")
        image = Image(
            dir_name=path,
            service_name=entry.get("name", path + "_service"),
            docker_file=entry.pop("dockerfile", "Dockerfile"),
            variant=entry.pop("variant", None),
        )

        if not image.docker_file_path.exists():
            print(f"Docker file {image.docker_file_path} does not exist")
            sys.exit(1)

        images.append(image)

    return images


def build_and_push(image: Image) -> None:
    image_ref = image.image_ref()

    print(f"Building {image_ref}")

    subprocess.run(
        [
            "docker",
            "build",
            "-t",
            image_ref,
            "--file",
            str(image.docker_file_path),
            str(context_dir),
        ],
        check=True,
    )

    print(f"Pushing {image_ref}")
    subprocess.run(["docker", "push", image_ref], check=True)


def main() -> None:
    print(f"Image tag is {get_current_git_tag()}")
    images = load_config()

    for image in images:
        build_and_push(image)


if __name__ == "__main__":
    main()
