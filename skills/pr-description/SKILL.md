---
name: pr-description
description: Create, open, or update a GitHub pull request with a concise, review-ready description. Use when a request is to create or open a PR or pull request, edit a PR body, write a PR description or summary, complete a pull request template, or add visual evidence to a PR. Do not use for an internal code review, release notes, or a generic change summary that does not accompany a PR.
compatibility: Requires GitHub CLI (`gh`) to create or edit PRs and upload visual attachments.
---

# PR description

Write a PR body that tells reviewers what changed and why. Do not restate the issue or narrate the diff.

## Workflow

1. Read `.github/PULL_REQUEST_TEMPLATE.md` if it exists.
   - Keep its headings, fields, and checkboxes.
   - Fill each applicable field briefly and set checkboxes accurately. Do not remove template fields or leave applicable fields empty.
   - Template requirements take priority over the default format.
2. Without a template, use one `## Summary` section with brief bullets about the result.
3. Add a Mermaid diagram, short code sample, or visual description only when it is clearer than prose.
   - Do not duplicate the issue or diff.
4. Do not list commands, test runs, dependency installs, or routine setup.
   - When CI runs, let it report testing. Do not add a testing section unless the template requires it.
   - If no CI exists and verification needs a note, write one outcome sentence without command history.
5. Before creating or updating the PR, verify facts, concise wording, and valid Markdown.

## Visual changes

For every PR that changes a user-visible surface, include before-and-after evidence in a Markdown table.

1. Capture the same state before and after the change, with useful alt text.
2. Add both image references to the body before the PR command. Use this structure unless the template requires another location:

   ```markdown
   | Before                                       | After                                                        |
   | -------------------------------------------- | ------------------------------------------------------------ |
   | ![Before: empty profile state](./before.png) | ![After: empty profile state with retry action](./after.png) |
   ```

3. Immediately before creating or editing the PR, run the applicable current help command:

   ```sh
   gh pr create --help
   # or
   gh pr edit --help
   ```

4. Use only the attachment behavior documented by that `gh` version. Attach files in the same `gh pr create` or `gh pr edit` command when it supports uploads, so GitHub can replace local references with uploaded asset URLs.
5. Re-read the created or updated PR body. Confirm that the table shows both images, has useful alt text, and links to uploaded assets instead of local paths.

Never fabricate visual evidence. Omit the table when the change has no visual effect.

## Default body example

```markdown
## Summary

- Return a retry action when the profile request has no result.
- Keep the previous loading and error behavior unchanged.
```
