---
name: machine-pr-create
description: Create or reuse a machine PR and request macklinu's review.
disable-model-invocation: true
compatibility: Requires macklinu-machine and a writable same-repository PR head.
---

# Machine PR create

Invocation: `/machine-pr-create [PR context]`; context may specify purpose, base, or draft intent.

Read repository instructions and load the current `macklinu-machine` skill. Follow its operation-specific identity, authentication, runner, credential, and failure rules.

This workflow requires a writable PR head in the same repository as the base. It covers publication and review requests only. Do not merge.

## 1. Publish the intended work

1. Confirm the worktree, repository, head ref, base ref, and every commit and change you intend to publish.
2. Use the requested or established base. If neither exists, use the current repository default branch.
3. For changes or verification, load `code-style`. For production TypeScript changes, also load the relevant `effect` references.
4. Preserve unrelated work and existing user commits. Prepare only missing intended commits, verify their bot author and committer identities, and push the intended head.
5. Verify that the remote head ref points to local `HEAD`.

**Gate:** Account for the complete intended scope and verify bot attribution for new commits and remote-head equality. If targeting or publication is uncertain, stop PR writes until you resolve it.

## 2. Select or create the PR

1. Read the [PR listing guide](https://docs.github.com/en/rest/pulls/pulls#list-pull-requests) and [CLI API guide](https://cli.github.com/manual/gh_api).
2. List all open PRs in the intended base repository. Match each candidate on all four fields, not branch labels alone.
   - `head.repo.full_name` must equal the intended head repository.
   - `head.ref` must equal the intended head ref.
   - `base.repo.full_name` must equal the intended base repository.
   - `base.ref` must equal the selected base ref.
3. Inspect every page before deciding how many exact matches exist.
   - With `--paginate --jq`, match each page and collect matches across all pages.
   - With `--paginate --slurp`, process the collected JSON separately. Do not combine `--slurp` with `--jq` or `--template`.
4. Select the PR based on the complete lookup.
   - If exactly one PR matches, reuse it.
   - If more than one PR matches, stop for a decision. Do not choose one or create another.
   - If no PR matches, create one only after the publication gate passes.
5. For PR creation or title/body changes, load `pr-description`.
6. Before creating, read the [CLI creation guide](https://cli.github.com/manual/gh_pr_create) and supply explicit `--head` and `--base`. Explicit `--head` prevents implicit CLI push or fork behavior.
7. Preserve the requested draft state for a new PR and the existing draft state for a reused PR.
8. Check the resulting PR's full commit and diff scope, published body, author, and head SHA against the intended publication.

If a create has an uncertain result, repeat the full lookup before attempting another create. Reuse an exact match rather than creating a duplicate.

If any write has an uncertain result, inspect current remote state before retrying it. This also applies to pushes, metadata changes, and review requests.

For a reused human-authored PR, report its actual author. Do not create a duplicate to obtain bot authorship.

**Gate:** Exactly one open PR matches both repositories, both refs, the published SHA, and the intended scope. Verify its body and author. Claim machine authorship only for a bot-authored PR.

## 3. Request review

1. Read the [review-request guide](https://docs.github.com/en/rest/pulls/review-requests).
2. Recheck the selected PR's current state, head, author, and pending reviewers. If it is no longer open or its head differs from the verified publication, stop review writes and re-establish the PR gate.
3. Apply the matching condition.
   - If `macklinu` is already pending, verify that request and skip the write. Never remove and re-add a pending reviewer.
   - If `macklinu` authored the PR, report the self-review restriction instead of requesting review.
   - Otherwise, request the user `macklinu`. An assignee or mention is not a review request, and a completed review is not pending.
4. If you request review, verify that `macklinu` is pending afterward.

Preserve the PR's stage. Do not change draft or ready state to bypass a refusal. Report state, permission, or API refusals separately from publication.

**Gate:** Verify that `macklinu` is pending, or record the exact reviewer blocker.

## Handoff

Report the PR URL, published SHA, and actual PR author. State the publication result and reviewer outcome separately.
