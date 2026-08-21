#!/usr/bin/env python3
"""Validate a papercuts TOML configuration without mutating files."""

from __future__ import annotations

import json
import sys
import tomllib
from pathlib import Path
from typing import Any

VERSION = 1
ROOT_KEYS = {"version", "papercuts_root"}


def fail(*errors: str) -> None:
    print(json.dumps({"valid": False, "errors": list(errors)}))
    raise SystemExit(1)


def validate(config: dict[str, Any]) -> tuple[dict[str, str], list[str]]:
    errors: list[str] = []
    unknown = set(config) - ROOT_KEYS
    if unknown:
        errors.append(f"unknown top-level keys: {', '.join(sorted(unknown))}")

    if config.get("version") != VERSION:
        errors.append(f"version must be {VERSION}")

    root_value = config.get("papercuts_root")
    if not isinstance(root_value, str) or not root_value:
        errors.append("papercuts_root must be a non-empty string")
        return {}, errors

    root = Path(root_value).expanduser()
    if not root.is_absolute():
        errors.append("papercuts_root must be an absolute path")
    elif not root.is_dir():
        errors.append("papercuts_root must be an existing directory")

    return {"papercuts_root": str(root)}, errors


def main() -> None:
    if len(sys.argv) != 2:
        fail("usage: validate_config.py <config-path>")

    config_path = Path(sys.argv[1]).expanduser()
    try:
        with config_path.open("rb") as config_file:
            config = tomllib.load(config_file)
    except (OSError, tomllib.TOMLDecodeError) as error:
        fail(f"could not read valid TOML: {error}")

    if not isinstance(config, dict):
        fail("configuration root must be a TOML table")

    result, errors = validate(config)
    if errors:
        fail(*errors)
    print(json.dumps({"valid": True, **result}, sort_keys=True))


if __name__ == "__main__":
    main()
