---
name: todo-txt
description: Read and safely edit line-based todo.txt files. Use for task creation, completion, reopening, priority, projects, contexts, or metadata.
---

# todo.txt

Treat each non-empty line as one task. Preserve untouched lines exactly; never sort, reformat, deduplicate, or rewrite the file unless requested.

## Format

An incomplete task has this optional header:

```text
[(A) ][YYYY-MM-DD ]body
```

- Priority is exactly `(A)` through `(Z)`, followed by one space, and is first.
- Creation date is `YYYY-MM-DD`; it follows priority, or is first when no priority exists.
- A `+project` or `@context` is a non-whitespace token after the optional header and preceded by a space. Do not treat an `@` inside another token, such as an email address, as a context.
- Extension metadata is a whitespace-delimited `key:value` token with exactly one colon; neither part contains whitespace or a colon. Preserve unknown metadata.

A completed task has this header:

```text
x YYYY-MM-DD [YYYY-MM-DD ]body
```

`x` is lowercase and followed by a space. The first date is completion; an existing creation date follows. Completed tasks have no leading priority.

## Safe operation

1. Read the target first. Follow its conventions for creation dates and metadata.
2. Target an exact line or an unambiguous combination of text and fields. If more than one task matches, show the matching lines and ask for disambiguation.
3. Change only requested lines. Preserve the body, projects, contexts, metadata, order, blank lines, and final-newline convention unless directed otherwise.
4. Do not repair malformed or noncanonical lines unless asked.
5. If no date is supplied, obtain the current local date rather than guessing.

## Mutations

### Add

Write one incomplete line. Add fields only when requested or clearly established by file convention. Put priority before creation date.

### Complete

Convert an incomplete task to `x <completion-date> [<creation-date> ]<body>`.

- Retain an existing creation date after the completion date.
- Remove a leading priority; it is not a completed-task header field.
- Preserve the body and trailing tokens. Add `pri:A` only when requested or already established by file convention.

### Reopen

Remove `x <completion-date> ` and retain a following creation date and body. Restore priority only when explicitly represented and requested.

### Reprioritize

For incomplete tasks, add, replace, or remove only the leading `(A)`–`(Z)` token. Reopen a completed task before assigning a leading priority.

### Projects, contexts, and metadata

Add or remove only complete whitespace-delimited tokens; do not use broad replacement. Append new tokens unless placement is specified. Use `key:value` only for requested metadata; due dates, recurrence, and other extensions are not core format.

## Reporting

After an edit, report the operation and exact changed lines. For filters and lists, return original lines.

## References

- [todo.txt format specification](https://github.com/todotxt/todo.txt/blob/master/README.md)
