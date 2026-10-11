---
name: machine-pr-create
description: Open or reuse the intended checkout's PR as macklinu-machine and request macklinu as reviewer. Invoke manually with optional PR context.
disable-model-invocation: true
compatibility: Requires macklinu-machine and a writable same-repository PR head.
---

# Machine PR create

Invocation: `/machine-pr-create [PR context]`; context may specify purpose, base, or draft intent.

Read repository instructions and follow `macklinu-machine` for **every GitHub operation, commit, push, and identity check**. Follow `pr-description` for PR writing. If code work is needed, follow `macklinu-code-style` and conditional `effect` guidance. Use only the machine skill's supported repository scope and runner, including when following linked guides.

## Workflow

1. Confirm the intended worktree, repository, head branch, base, and complete commit/diff scope. Use the requested or established base; otherwise use the current repository default. Preserve unrelated work and user commits. Prepare only missing intended commits, publish normally, and verify the remote head matches local HEAD. Stop if targeting or publication is uncertain.
2. Follow the [PR listing guide](https://docs.github.com/en/rest/pulls/pulls#list-pull-requests) and [CLI API guide](https://cli.github.com/manual/gh_api) to find all open head/base matches. Match both repository names and refs, not branch names alone. Reuse the unique exact PR; update its description only when needed. Recheck after uncertain creation, rather than creating a duplicate or reopening a closed PR.
3. With no match, follow the [CLI creation guide](https://cli.github.com/manual/gh_pr_create) using the `pr-description` result and explicit head/base. Explicit `--head` prevents implicit CLI push/fork behavior. Preserve draft intent. Confirm the open PR's target, published SHA, body, complete scope, and bot author; a reused human-authored PR does not become bot-authored.
4. Follow the [review-request guide](https://docs.github.com/en/rest/pulls/review-requests) to request the user `macklinu` on new and reused PRs. Check pending reviewers first: already pending means verify and skip, never remove/re-add. A completed review is not pending. Use a reviewer request, not an assignee or mention, and verify actual pending state after requesting.

Keep draft/ready state unchanged. If the PR author is `macklinu`, report the self-review restriction. Report permission/API constraints separately from publication; do not claim success or change state to bypass them. Inspect current state before retrying an uncertain write. Report the PR URL and any blocker; do not merge.
