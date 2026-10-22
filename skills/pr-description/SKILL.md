---
name: pr-description
description: Create, open, or update a GitHub pull request with a concise, review-ready description. Use when a request is to create or open a PR or pull request, edit a PR body, write a PR description or summary, complete a pull request template, or add visual evidence to a PR. Do not use for an internal code review, release notes, or a generic change summary that does not accompany a PR.
compatibility: Requires GitHub CLI (`gh`) to create or edit PRs and upload visual attachments.
---

# PR description

Write a PR body that tells reviewers what changed and why. Do not restate the issue or narrate the diff. Keep the whole body concise; link long technical details instead of copying them.

Distinguish implementation assumptions from stated requirements and unverified release prerequisites.

## Workflow

Before any GitHub command, including help, read repository instructions and select the requested or required publishing identity. When `macklinu-machine` is requested or required, load that skill and use its runner for GitHub commands, including its verified personal-user `gh stack` path. Only its image-upload exception permits direct user-authenticated commands.

1. Read `.github/PULL_REQUEST_TEMPLATE.md` if it exists.
   - Keep its headings, fields, and checkboxes.
   - Fill each applicable field briefly and set checkboxes accurately. Do not remove template fields or leave applicable fields empty.
   - Template requirements take priority over the default format.
2. Without a template, use one `## Summary` section with brief bullets about the result.
3. If a visual explains the change better than prose, load `show-me` to choose the smallest useful format.
   - Do not repeat the same point in prose and a visual or restate the issue or diff.
   - Use GitHub-supported Markdown. Follow GitHub's [code block guide](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-and-highlighting-code-blocks) and [diagram guide](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams) for rendering limits. Do not assume renderer-specific output works on GitHub.
   - Local HTML files and artifact paths are not usable PR evidence. Explanatory illustrations do not replace the visual evidence required below.
4. Do not list commands, test runs, dependency installs, or routine setup.
   - When CI runs, let it report testing. Do not add a testing section unless the template requires it.
   - If no CI exists and verification needs a note, write one outcome sentence without command history.
5. Before creating or updating the PR, verify facts, concise wording, and valid Markdown.

## Visual changes

For every PR that changes a user-visible surface, include before-and-after evidence in a Markdown table.

1. Capture the same state before and after the change, with useful alt text.
2. Prepare both image references for the attachment step. Use this structure unless the template requires another location:

   ```markdown
   | Before                                       | After                                                        |
   | -------------------------------------------- | ------------------------------------------------------------ |
   | ![Before: empty profile state](./before.png) | ![After: empty profile state with retry action](./after.png) |
   ```

3. Immediately before creating or editing the PR, read the applicable current `gh pr create --help` or `gh pr edit --help` through the selected identity's workflow.
4. Use only the attachment behavior documented by that `gh` version. For machine publication, follow `macklinu-machine`'s image-upload policy and operation order. Otherwise, attach files in the same `gh pr create` or `gh pr edit` command when it supports uploads, so GitHub can replace local references with uploaded asset URLs.
5. Re-read the created or updated PR body even if the attachment command exits non-zero: partial uploads can still create or update the PR. Confirm that the table shows both images, has useful alt text, and links to uploaded assets instead of local paths. Report incomplete evidence; do not repeat the command without checking the resulting PR.

Never fabricate visual evidence. Omit the table when the change has no visual effect.

## Default body example

```markdown
## Summary

- Return a retry action when the profile request has no result.
- Keep the previous loading and error behavior unchanged.
```
