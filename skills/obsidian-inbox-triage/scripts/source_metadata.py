#!/usr/bin/env python3
"""Return compact, source-grounded metadata without downloading article bodies or transcripts."""

from __future__ import annotations

import html.parser
import json
import re
import sys
from pathlib import PurePosixPath
from typing import Any
from urllib.parse import parse_qs, quote, urlencode, urlparse
from urllib.request import Request, urlopen

USER_AGENT = "obsidian-inbox-triage/1.0"
MAX_RESPONSE_BYTES = 1_000_000


class MetadataParser(html.parser.HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.meta: dict[str, str] = {}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag != "meta":
            return
        values = {key.lower(): value for key, value in attrs if value is not None}
        content = values.get("content")
        key = values.get("property") or values.get("name") or values.get("itemprop")
        if content and key and key.lower() not in self.meta:
            self.meta[key.lower()] = content


def fail(message: str) -> None:
    print(json.dumps({"valid": False, "error": message}))
    raise SystemExit(1)


def fetch(url: str, accept: str) -> bytes:
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": accept})
    with urlopen(request, timeout=20) as response:
        return response.read(MAX_RESPONSE_BYTES + 1)


def fetch_json(url: str) -> dict[str, Any]:
    payload = fetch(url, "application/json")
    if len(payload) > MAX_RESPONSE_BYTES:
        fail("metadata response exceeds size limit")
    value = json.loads(payload)
    if not isinstance(value, dict):
        fail("metadata response is not an object")
    return value


def sentences(text: str, limit: int = 2) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", " ".join(text.split()))
    return [part for part in parts if part][:limit]


def youtube_video_id(url: str) -> str:
    parsed = urlparse(url)
    host = parsed.netloc.lower().removeprefix("www.")
    if host == "youtu.be":
        value = parsed.path.strip("/")
    elif host in {"youtube.com", "m.youtube.com"}:
        value = parse_qs(parsed.query).get("v", [""])[0]
    else:
        fail("expected a YouTube URL")
    if not re.fullmatch(r"[A-Za-z0-9_-]{11}", value):
        fail("YouTube URL has no valid video id")
    return value

def duration_iso8601(seconds: str | None) -> str | None:
    if seconds is None or not seconds.isdecimal():
        return None
    hours, remainder = divmod(int(seconds), 3600)
    minutes, seconds_value = divmod(remainder, 60)
    result = "PT"
    if hours:
        result += f"{hours}H"
    if minutes:
        result += f"{minutes}M"
    return result + f"{seconds_value}S"



def youtube(url: str) -> dict[str, Any]:
    video_id = youtube_video_id(url)
    canonical_url = f"https://www.youtube.com/watch?v={video_id}"
    oembed_url = "https://www.youtube.com/oembed?" + urlencode(
        {"url": canonical_url, "format": "json"}
    )
    oembed = fetch_json(oembed_url)

    metadata: dict[str, str] = {}
    page = ""
    try:
        payload = fetch(canonical_url, "text/html")
        if len(payload) <= MAX_RESPONSE_BYTES:
            page = payload.decode("utf-8", errors="replace")
            parser = MetadataParser()
            parser.feed(page)
            metadata = parser.meta
    except OSError:
        pass

    published_match = re.search(r'"publishDate":"([^"]+)"', page)
    duration_match = re.search(r'"lengthSeconds":"(\d+)"', page)
    description = metadata.get("description") or metadata.get("og:description") or ""
    return {
        "valid": True,
        "source_type": "video",
        "original_url": url,
        "canonical_url": canonical_url,
        "title": metadata.get("og:title") or oembed.get("title"),
        "channel": metadata.get("author") or oembed.get("author_name"),
        "published": metadata.get("datepublished")
        or (published_match.group(1) if published_match else None),
        "duration": metadata.get("duration")
        or duration_iso8601(duration_match.group(1) if duration_match else None),
        "description_sentences": sentences(description),
    }


def github(url: str) -> dict[str, Any]:
    parsed = urlparse(url)
    host = parsed.netloc.lower().removeprefix("www.")
    if host != "github.com":
        fail("expected a GitHub repository URL")
    components = [part for part in PurePosixPath(parsed.path).parts if part != "/"]
    if len(components) < 2:
        fail("GitHub URL must identify owner and repository")
    owner, repository = components[:2]
    api_url = f"https://api.github.com/repos/{quote(owner)}/{quote(repository)}"
    data = fetch_json(api_url)
    return {
        "valid": True,
        "source_type": "github-repository",
        "original_url": url,
        "canonical_url": data.get("html_url") or f"https://github.com/{owner}/{repository}",
        "repository": data.get("full_name"),
        "description": data.get("description"),
        "primary_language": data.get("language"),
    }


def main() -> None:
    if len(sys.argv) != 3:
        fail("usage: source_metadata.py <youtube|github> <url>")
    source_type, url = sys.argv[1:]
    try:
        if source_type == "youtube":
            result = youtube(url)
        elif source_type == "github":
            result = github(url)
        else:
            fail("source type must be youtube or github")
    except (OSError, ValueError, json.JSONDecodeError) as error:
        fail(f"could not retrieve source metadata: {error}")
    print(json.dumps(result, sort_keys=True))


if __name__ == "__main__":
    main()
