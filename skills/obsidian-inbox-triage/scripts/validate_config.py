#!/usr/bin/env python3
"""Validate an obsidian-inbox-triage TOML configuration without mutating files."""

from __future__ import annotations

import json
import re
import sys
import tomllib
from pathlib import Path
from typing import Any

VERSION = 1
ROOT_KEYS = {"version", "vault_root", "collections"}
COLLECTION_KEYS = {"id", "kind", "match_tag", "content_kind", "path"}
COLLECTION_TYPES = {
    "date-heading-log": "quote",
    "dated-files": "activity-session",
}
IDENTIFIER = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
TAG = re.compile(r"^[a-z0-9]+(?:[/-][a-z0-9]+)*$")


def fail(*errors: str) -> None:
    print(json.dumps({"valid": False, "errors": list(errors)}))
    raise SystemExit(1)


def require_string(value: Any, name: str, errors: list[str]) -> str | None:
    if not isinstance(value, str) or not value:
        errors.append(f"{name} must be a non-empty string")
        return None
    return value


def inside(root: Path, candidate: Path) -> bool:
    try:
        candidate.resolve(strict=False).relative_to(root.resolve())
    except ValueError:
        return False
    return True


def validate(config: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    errors: list[str] = []
    unknown_root = set(config) - ROOT_KEYS
    if unknown_root:
        errors.append(f"unknown top-level keys: {', '.join(sorted(unknown_root))}")

    if config.get("version") != VERSION:
        errors.append(f"version must be {VERSION}")

    vault_root_value = require_string(config.get("vault_root"), "vault_root", errors)
    if vault_root_value is None:
        return {}, errors

    root = Path(vault_root_value).expanduser()
    if not root.is_absolute():
        errors.append("vault_root must be an absolute path")
    if not root.is_dir():
        errors.append("vault_root must be an existing directory")
    if not (root / "Inbox").is_dir():
        errors.append("vault_root/Inbox must be an existing directory")

    collections = config.get("collections")
    if not isinstance(collections, list):
        errors.append("collections must be an array")
        return {}, errors

    identifiers: set[str] = set()
    match_pairs: set[tuple[str, str]] = set()
    normalized: list[dict[str, str]] = []

    for index, collection in enumerate(collections):
        prefix = f"collections[{index}]"
        if not isinstance(collection, dict):
            errors.append(f"{prefix} must be a table")
            continue

        unknown_collection = set(collection) - COLLECTION_KEYS
        if unknown_collection:
            errors.append(
                f"{prefix} has unknown keys: {', '.join(sorted(unknown_collection))}"
            )

        identifier = require_string(collection.get("id"), f"{prefix}.id", errors)
        kind = require_string(collection.get("kind"), f"{prefix}.kind", errors)
        match_tag = require_string(collection.get("match_tag"), f"{prefix}.match_tag", errors)
        content_kind = require_string(
            collection.get("content_kind"), f"{prefix}.content_kind", errors
        )
        relative_path = require_string(collection.get("path"), f"{prefix}.path", errors)
        if None in (identifier, kind, match_tag, content_kind, relative_path):
            continue

        if not IDENTIFIER.fullmatch(identifier):
            errors.append(f"{prefix}.id must be lowercase kebab case")
        if kind not in COLLECTION_TYPES:
            errors.append(f"{prefix}.kind is unsupported")
        elif content_kind != COLLECTION_TYPES[kind]:
            errors.append(f"{prefix}.content_kind is invalid for {kind}")
        if not TAG.fullmatch(match_tag):
            errors.append(f"{prefix}.match_tag must be lowercase and slash-safe")

        candidate = Path(relative_path)
        if candidate.is_absolute() or relative_path in {".", ".."}:
            errors.append(f"{prefix}.path must be a vault-relative path")
            continue
        target = root / candidate
        if not inside(root, target):
            errors.append(f"{prefix}.path escapes vault_root")
            continue
        if kind == "date-heading-log":
            if target.suffix != ".md" or not target.is_file():
                errors.append(f"{prefix}.path must be an existing Markdown file")
        elif target.exists() and not target.is_dir():
            errors.append(f"{prefix}.path must be a directory when it exists")

        if identifier in identifiers:
            errors.append(f"duplicate collection id: {identifier}")
        identifiers.add(identifier)
        match_pair = (match_tag, content_kind)
        if match_pair in match_pairs:
            errors.append(f"duplicate collection match: {match_tag}/{content_kind}")
        match_pairs.add(match_pair)
        normalized.append(
            {
                "id": identifier,
                "kind": kind,
                "match_tag": match_tag,
                "content_kind": content_kind,
                "path": relative_path,
            }
        )

    return {"vault_root": str(root), "collections": normalized}, errors


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
