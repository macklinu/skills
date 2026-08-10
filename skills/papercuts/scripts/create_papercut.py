#!/usr/bin/env python3
"""Create one validated Papercuts Markdown note from a JSON input object."""

from __future__ import annotations

import json
import os
import re
import sys
import tempfile
import tomllib
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

from validate_config import validate

INPUT_KEYS = {
    "title",
    "status",
    "cwd",
    "repository_root",
    "git_branch",
    "git_commit",
    "agent",
    "tooling",
    "tags",
    "sources",
    "papercut",
    "resolution",
    "prevention",
}

REQUIRED_INPUT_KEYS = INPUT_KEYS - {"repository_root", "git_branch", "git_commit"}
AGENT_KEYS = {"runtime", "provider", "model", "session_id", "task_id"}
RUNTIMES = {
    "omp",
    "opencode",
    "pi",
    "claude-code",
    "codex",
    "cursor",
    "other",
    "unknown",
}
STATUSES = {"resolved", "workaround"}
TAG = re.compile(r"^[a-z0-9]+(?:[/-][a-z0-9]+)*$")
GIT_COMMIT = re.compile(r"^[0-9a-f]{40}(?:[0-9a-f]{24})?$")


def fail(*errors: str) -> None:
    print(json.dumps({"created": False, "errors": list(errors)}))
    raise SystemExit(1)


def require_string(value: Any, name: str, errors: list[str]) -> str | None:
    if not isinstance(value, str) or not value.strip():
        errors.append(f"{name} must be a non-empty string")
        return None
    if "\x00" in value:
        errors.append(f"{name} must not contain a null byte")
        return None
    return value.strip()


def nullable_string(value: Any, name: str, errors: list[str]) -> str | None:
    if value is None:
        return None
    return require_string(value, name, errors)


def require_absolute_path(value: Any, name: str, errors: list[str]) -> str | None:
    path_value = require_string(value, name, errors)
    if path_value is not None and not Path(path_value).is_absolute():
        errors.append(f"{name} must be an absolute path")
    return path_value



def require_string_list(value: Any, name: str, errors: list[str]) -> list[str] | None:
    if not isinstance(value, list) or not value:
        errors.append(f"{name} must be a non-empty list of strings")
        return None
    items: list[str] = []
    for index, item in enumerate(value):
        item_value = require_string(item, f"{name}[{index}]", errors)
        if item_value is not None:
            items.append(item_value)
    return items


def validate_input(data: Any) -> tuple[dict[str, Any], list[str]]:
    errors: list[str] = []
    if not isinstance(data, dict):
        return {}, ["input must be a JSON object"]

    unknown = set(data) - INPUT_KEYS
    missing = REQUIRED_INPUT_KEYS - set(data)
    if unknown:
        errors.append(f"unknown input keys: {', '.join(sorted(unknown))}")
    if missing:
        errors.append(f"missing input keys: {', '.join(sorted(missing))}")

    title = require_string(data.get("title"), "title", errors)
    if title is not None and not 3 <= len(title.split()) <= 12:
        errors.append("title must contain 3 to 12 words")
    status = require_string(data.get("status"), "status", errors)
    if status is not None and status not in STATUSES:
        errors.append("status must be resolved or workaround")
    cwd = require_absolute_path(data.get("cwd"), "cwd", errors)

    repository_root = data.get("repository_root")
    if repository_root is not None:
        repository_root = require_absolute_path(
            repository_root, "repository_root", errors
        )
    git_branch = nullable_string(data.get("git_branch"), "git_branch", errors)
    git_commit = nullable_string(data.get("git_commit"), "git_commit", errors)
    if git_commit is not None and not GIT_COMMIT.fullmatch(git_commit):
        errors.append("git_commit must be a full lowercase SHA-1 or SHA-256 object ID")

    agent = data.get("agent")
    if not isinstance(agent, dict):
        errors.append("agent must be an object")
        normalized_agent: dict[str, str | None] = {}
    else:
        unknown_agent = set(agent) - AGENT_KEYS
        missing_agent = AGENT_KEYS - set(agent)
        if unknown_agent:
            errors.append(f"unknown agent keys: {', '.join(sorted(unknown_agent))}")
        if missing_agent:
            errors.append(f"missing agent keys: {', '.join(sorted(missing_agent))}")
        runtime = require_string(agent.get("runtime"), "agent.runtime", errors)
        if runtime is not None and runtime not in RUNTIMES:
            errors.append("agent.runtime is unsupported")
        normalized_agent = {"runtime": runtime}
        for key in sorted(AGENT_KEYS - {"runtime"}):
            normalized_agent[key] = nullable_string(agent.get(key), f"agent.{key}", errors)

    tooling = require_string_list(data.get("tooling"), "tooling", errors)
    tags = require_string_list(data.get("tags"), "tags", errors)
    if tags is not None:
        for index, tag in enumerate(tags):
            if not TAG.fullmatch(tag):
                errors.append(f"tags[{index}] must be lowercase and slash-safe")
    sources = require_string_list(data.get("sources"), "sources", errors)
    papercut = require_string(data.get("papercut"), "papercut", errors)
    resolution = require_string(data.get("resolution"), "resolution", errors)
    prevention = require_string(data.get("prevention"), "prevention", errors)

    normalized = {
        "title": title,
        "status": status,
        "cwd": cwd,
        "repository_root": repository_root,
        "git_branch": git_branch,
        "git_commit": git_commit,
        "agent": normalized_agent,
        "tooling": tooling,
        "tags": tags,
        "sources": sources,
        "papercut": papercut,
        "resolution": resolution,
        "prevention": prevention,
    }
    return normalized, errors


def yaml_value(value: str | None) -> str:
    return "null" if value is None else json.dumps(value, ensure_ascii=False)


def yaml_list(values: list[str]) -> list[str]:
    return [f"  - {yaml_value(value)}" for value in values]


def render_note(note: dict[str, Any], note_id: str, created: str) -> str:
    agent = note["agent"]
    frontmatter = [
        "---",
        f"id: {yaml_value(note_id)}",
        f"title: {yaml_value(note['title'])}",
        f"created: {yaml_value(created)}",
        f"status: {yaml_value(note['status'])}",
        f"cwd: {yaml_value(note['cwd'])}",
        f"repository_root: {yaml_value(note['repository_root'])}",
        f"git_branch: {yaml_value(note['git_branch'])}",
        f"git_commit: {yaml_value(note['git_commit'])}",
        "agent:",
    ]
    frontmatter.extend(f"  {key}: {yaml_value(agent[key])}" for key in sorted(AGENT_KEYS))
    frontmatter.append("tooling:")
    frontmatter.extend(yaml_list(note["tooling"]))
    frontmatter.append("tags:")
    frontmatter.extend(yaml_list(note["tags"]))
    frontmatter.append("sources:")
    frontmatter.extend(yaml_list(note["sources"]))
    frontmatter.extend(
        [
            "---",
            "",
            "## Papercut",
            "",
            note["papercut"],
            "",
            "## Resolution",
            "",
            note["resolution"],
            "",
            "## Prevention",
            "",
            note["prevention"],
            "",
        ]
    )
    return "\n".join(frontmatter)


def slugify(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return (slug or "papercut")[:72].rstrip("-")


def write_new_note(root: Path, filename: str, content: str) -> Path:
    destination = root / filename
    if destination.exists():
        raise FileExistsError(destination)

    descriptor, temporary_name = tempfile.mkstemp(prefix=".papercut-", dir=root, text=True)
    temporary = Path(temporary_name)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as output:
            output.write(content)
            output.flush()
            os.fsync(output.fileno())
        os.link(temporary, destination)
    finally:
        temporary.unlink(missing_ok=True)
    return destination


def load_json(input_path: str | None) -> Any:
    try:
        if input_path is None:
            return json.load(sys.stdin)
        with Path(input_path).open(encoding="utf-8") as input_file:
            return json.load(input_file)
    except (OSError, json.JSONDecodeError) as error:
        fail(f"could not read valid JSON input: {error}")


def main() -> None:
    if len(sys.argv) not in {2, 3}:
        fail("usage: create_papercut.py <config-path> [input-json-path]")

    config_path = Path(sys.argv[1]).expanduser()
    try:
        with config_path.open("rb") as config_file:
            config = tomllib.load(config_file)
    except (OSError, tomllib.TOMLDecodeError) as error:
        fail(f"could not read valid TOML: {error}")

    config_result, config_errors = validate(config)
    if config_errors:
        fail(*config_errors)

    note, input_errors = validate_input(load_json(sys.argv[2] if len(sys.argv) == 3 else None))
    if input_errors:
        fail(*input_errors)

    note_id = str(uuid.uuid4())
    created = datetime.now().astimezone().isoformat(timespec="seconds")
    filename = f"{created[:10]} — {slugify(note['title'])}--{note_id[:8]}.md"
    try:
        destination = write_new_note(Path(config_result["papercuts_root"]), filename, render_note(note, note_id, created))
    except OSError as error:
        fail(f"could not create papercut: {error}")

    print(json.dumps({"created": True, "id": note_id, "path": str(destination)}, sort_keys=True))


if __name__ == "__main__":
    main()
