---
name: obsidian-inbox-triage
description: Manually triage Markdown notes from a configured Obsidian Inbox. Use to classify, enrich, rename, and move Inbox notes, or route them to configured collections.
disable-model-invocation: true
---

# Obsidian Inbox triage

## Configuration

Load TOML configuration from `$OBSIDIAN_INBOX_TRIAGE_CONFIG` when set. Otherwise load `${XDG_CONFIG_HOME:-$HOME/.config}/obsidian-inbox-triage/config.toml`.

From this skill directory, run `python3 scripts/validate_config.py <config-path>` before accessing Inbox. It writes one JSON result, exits with status 0 only for a valid configuration, and never changes vault files.

The configuration is private. Do not add it to a repository, quote its values in public output, or place personal paths, vault names, or person names in this skill.

```toml
version = 1
vault_root = "/absolute/path/to/vault"

[[collections]]
id = "person-quotes"
kind = "date-heading-log"
match_tag = "person-tag"
content_kind = "quote"
path = "Person quotes.md"

[[collections]]
id = "activity-records"
kind = "dated-files"
match_tag = "activity-tag"
content_kind = "activity-session"
path = "Activities"
```

- `vault_root` is the absolute vault directory. Inbox is `<vault_root>/Inbox`; the normal-note destination is `<vault_root>`.
- `collections.path` is relative to `vault_root` and MUST remain within it.
- `id` is unique and lowercase kebab case.
- `match_tag` is lowercase and slash-safe. A collection matches when its tag is in the source or staged tag list and its `content_kind` matches the analyzed note.
- Supported collection kinds are `date-heading-log` and `dated-files`. Supported content kinds are `quote` and `activity-session`.
- `date-heading-log.path` MUST be an existing `.md` file. `dated-files.path` is a directory path; it MAY be absent until an approved commit creates it.

Fail without changing any vault file when the validator reports an error. Do not duplicate or weaken its validation in ad hoc logic.

## Analyze and stage

1. List direct children of Inbox. Process only regular `.md` files. Do not recurse.
2. Read every candidate completely. Parse YAML frontmatter and require a list-form `tags` field. Treat missing or malformed frontmatter, tags, or dates as an uncertainty.
3. Stage each note's body, tags, filename, destination, directory creation, or collection append in memory. Do not write, rename, move, append, create, or remove a note during analysis.
4. Preserve all frontmatter fields except `tags` and an existing `updated` value. Keep `id` and `created` exactly unchanged.
5. An empty or nearly empty note is skipped. Do not infer a title, tags, or destination for it.

## URL-only enrichment

A note is URL-only only when its Markdown body contains one or more URLs separated only by whitespace. If it contains any other text, preserve its body exactly and do not add extracted content.

For each URL-only note:

1. Identify the source type.
2. For YouTube and GitHub repository URLs, run `python3 scripts/source_metadata.py <youtube|github> <url>` from this skill directory first. Use its compact JSON output; do not retrieve a transcript or README.
3. Read only the matching section in [references/content-types.md](references/content-types.md). Do not load unrelated content-type sections.
4. Stage the specified source and brief snapshot body. The source URL remains the living document; do not copy a full README, video transcript, article, or document.
5. If metadata retrieval or source content is unavailable, does not identify the subject, or cannot produce the specified factual snapshot, follow the uncertainty protocol.

## Uncertainty protocol

When a reasonable reader could interpret a note in more than one way, do not change that note. Finish analysis of unambiguous notes, then present the user with a numbered question list. Each question MUST state:

1. The exact source note path.
2. The observed text or retrieved content that causes uncertainty.
3. The decision required: extracted body content, collection selection, tags, filename, or destination.
4. Two to five concrete options, including a recommended option and its evidence.

Do not alter a note with an open question. Resume staging after the user resolves it. Do not commit until the user explicitly approves the complete triage plan.

## Collection routing

After enrichment and tag staging, resolve the matching collection:

- No match: use normal root-note handling.
- One match: apply that collection's fixed behavior.
- More than one match: use the uncertainty protocol.

### Date-heading log

Use `date-heading-log` only when the analyzed note is a direct quote or records what the configured person said. An incidental person mention is not a quote.

1. Use the configured log file. Preserve its existing content and tag style.
2. Take the local calendar date from the source note's `created` value. It MUST be the first 10 characters in ISO 8601 form: `YYYY-MM-DD`.
3. Add the quote as a paragraph beneath the exact `## YYYY-MM-DD` heading. When that heading is absent, insert it without reordering existing entries and preserve the log's established chronological direction. If that direction is unclear, use the uncertainty protocol.
4. Preserve quote wording and useful source context. Do not add a title, tags, summary, or facts not present in the source note.
5. Compare the candidate to the date section after normalizing line endings and repeated whitespace only. If the quote already exists, do not append or remove the source; use the uncertainty protocol.
6. Every consolidated quote MUST appear beneath its ISO 8601 date H2 heading.

### Dated files

Use `dated-files` only when the analyzed note records a completed personal activity session. Instructions, plans, external references, and product links are not activity sessions.

1. Take the local date and time from `created`. The date is `YYYY-MM-DD`, the year is its first four characters, and the collision time is `HH-mm`.
2. Stage the destination directory as `<collection path>/<year>`. Create missing directories only during an approved commit.
3. Stage the filename as `YYYY-MM-DD — Title.md`. Keep title case with spaces.
4. If that filename exists, stage `YYYY-MM-DD HH-mm — Title.md`. If that also exists, use the uncertainty protocol. Never add an arbitrary numeric suffix.

## Classification

Replace the complete `tags` list with one or two content tags. Remove `inbox`; do not retain it. Use lowercase tags, with `/` only for a stable hierarchy.

- Inspect existing vault frontmatter tags before selecting tags. Reuse an exact existing tag when it fits the note subject.
- Create a new specific tag when no existing tag fits. Do not create a new tag merely because its wording differs from an existing suitable tag.
- Prefer durable subject tags. Add a narrower tag only when it materially improves retrieval.
- For a quotation, use the appropriate person tag when the speaker is known. Add `quote` only when useful.

## Filename, approval, and commit

1. For notes without a collection, use a factual 2–7 word title in title case. Prefer an explicit note title, then a retrieved resource title, then a factual description. Preserve `.md`; remove filesystem-invalid characters; do not add a date when the title is clear.
2. File names MUST use title case with spaces, not `kebab-case` or underscores. Treat `id` and `created` as canonical machine data; never parse the filename for them.
3. Never overwrite a destination file. A collision is an uncertainty.
4. Present the complete staged plan after all open questions are resolved. Include source path, body change, final tags, filename, destination or log heading, planned directory creation, and every source removal.
5. Obtain explicit user approval before committing any change. A request to triage, analyze, or dry-run is not approval.
6. Immediately before each approved commit, re-read the source and relevant destinations. Confirm that the source still matches the analyzed content, any log still has the expected date section, and the destination filename is still available.
7. If a re-read differs from the staged plan, do not change that note. Reanalyze it, present the revised plan or an uncertainty question, and obtain new explicit approval.
8. During an approved commit, set an existing `updated` field to the current local ISO 8601 timestamp with numeric UTC offset. Move normal and dated-file notes out of Inbox only after the pre-commit re-read succeeds. Verify that the destination exists once and the source no longer exists in Inbox. Remove a log source only after its quote appears exactly once in the log.

## Verification

After an approved commit, list Inbox and affected collection paths. Confirm that every moved note exists once at its planned destination and no moved source remains in Inbox; every consolidated quote appears once beneath its planned `## YYYY-MM-DD` heading and its source was removed only after a successful append; skipped and open-question notes remain unchanged in Inbox; and no destination collision occurred.
