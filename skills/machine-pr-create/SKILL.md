---
name: machine-pr-create
description: Create or reuse a machine PR and request macklinu's review.
disable-model-invocation: true
compatibility: Requires macklinu-machine and a writable same-repository PR head.
---

# Machine PR create

Invocation: `/machine-pr-create [PR context]`; context may specify purpose, base, or draft intent.

Read repository instructions and load `macklinu-machine`. Use its runner for every GitHub operation and commit, including linked-guide commands; follow it for identity checks. Use normal `git push` with the repository's existing authentication to publish the intended branch.

## 1. Publish the intended work

Confirm the worktree, repository, head, base, and every commit/change to publish. Use the requested or established base; otherwise use the current repository default. Preserve unrelated work and existing user commits. For changes or verification, load `macklinu-code-style`; for production TypeScript changes, also load the relevant `effect` references. Prepare only missing intended commits and publish normally.

**Gate:** the complete intended scope is accounted for, bot identities are verified for new commits, and the remote head equals local HEAD. Uncertain targeting/publication stops PR writes.

## 2. Select or create the PR

Read the [PR listing guide](https://docs.github.com/en/rest/pulls/pulls#list-pull-requests) and [CLI API guide](https://cli.github.com/manual/gh_api) to find all open matches by both repository names and head/base refs. Reuse the unique exact match. Ambiguous matches require a decision; uncertain creation requires a fresh lookup before another create.

Use `--paginate --jq` for per-page matching and inspect every page. With `--paginate --slurp`, process collected JSON outside the runner; do not combine `--slurp` with `--jq` or `--template`.

When creating a PR or changing its title/body, load `pr-description`. For a new PR, read the [CLI creation guide](https://cli.github.com/manual/gh_pr_create) and supply explicit head/base; `--head` prevents implicit CLI push/fork behavior. Preserve the requested/existing draft state. Check the resulting PR's full commit/diff scope, published body, and author; report reused human authorship accurately instead of creating a duplicate.

**Gate:** exactly one open PR matches the repository, head/base, published SHA, and intended scope; its body is accurate and author is verified. Claim machine authorship only for a bot-authored PR.

## 3. Request review

Read the [review-request guide](https://docs.github.com/en/rest/pulls/review-requests). For the selected PR, check current state/head/author and pending reviewers. Pending `macklinu` means verify and skip—never remove/re-add. Otherwise request the user `macklinu`, not an assignee or mention. A completed review is not pending.

If the author is `macklinu`, report the self-review restriction. Preserve PR stage and report state/permission/API refusals separately from publication. Inspect current state before retrying uncertain writes; keep this workflow limited to publication and review requesting, not merge.

**Gate:** `macklinu` is verified pending, or the exact reviewer blocker is recorded. Handoff: PR URL, published SHA, and reviewer outcome.
