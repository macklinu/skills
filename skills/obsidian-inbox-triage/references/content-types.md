# Content type snapshots

Use this reference only for URL-only Inbox notes. Read only the section that matches each source type.

## Shared rules

The original URL is the living document. Store a brief, source-grounded snapshot, not a copy of the source.

1. Retrieve with a content reader first. If relevant content is missing, inspect the public browser rendering. Inspect images when they contain relevant text or subject information.
2. Preserve the original URL. Add a canonical URL when the source publishes a different canonical URL.
3. Use one to three factual bullets and no more than 150 words per source. A short social post or image-text extract may be preserved verbatim when it is the complete primary content.
4. Do not add a model-authored summary, interpretation, guessed fact, navigation text, boilerplate, full article, full README, full video transcript, or full PDF text.
5. If the source is unavailable, primary content is incomplete, or selecting a snapshot would need interpretation, follow the uncertainty protocol.

Stage this body format:

```markdown
## Sources
- Original: <captured URL>
- Canonical: <canonical URL when different>

## Snapshot

### <resource title>
- Source type: <type>
- <source-grounded fact or direct short quote>
```

Repeat the H3 snapshot section in source order for multiple URLs.

## Web article

Extract the title, author or publisher when visible, publication date when visible, and one to three central facts or direct short quotations. Do not copy the article body.

## Social post

Extract the author, handle when visible, post date, and complete post text when it is short. For each attached image, include legible image text and label it `Image text`. If an image has no relevant text, include only a short literal observation needed to identify the post subject.

## GitHub repository

From the skill directory, run `python3 scripts/source_metadata.py github <url>` before any generic URL reader. Use its repository name, description, primary language, and canonical URL. Do not extract README text, issue text, pull requests, stars, forks, navigation, or generated metadata.

## Video

From the skill directory, run `python3 scripts/source_metadata.py youtube <url>` before any generic URL reader. Use its title, channel, and any available upload date, duration, or source-provided description sentences. Do not extract or summarize captions or transcripts.

## PDF or other document

Extract title, author or publisher when visible, publication date when visible, and one to three directly supported facts or short quotations. Include page numbers when they are visible. Do not copy the full document.

## Product page

Extract product name, price, availability when visible, and one or two sentences from the product description. Do not extract reviews, recommendations, related products, or store navigation.

## Image-only page

Extract legible text. If no text is relevant, add one short literal observation that identifies the visible subject. Do not infer context, identity, location, or intent.

## Unknown source

Extract the title, publisher when visible, and one directly supported fact. If this does not identify the subject, follow the uncertainty protocol.
