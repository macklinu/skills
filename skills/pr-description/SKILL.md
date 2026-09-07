---
name: pr-description
description: Create or update concise GitHub pull request descriptions. Use when opening a pull request, editing a PR body, writing a PR description or summary, completing a pull request template, or attaching before-and-after visual references.
compatibility: Requires GitHub CLI (gh) to create or edit pull requests and upload visual attachments.
---

# PR description

Write a PR body that helps a reviewer understand the change without repeating the issue or narrating the diff.

## Workflow

1. Read `.github/PULL_REQUEST_TEMPLATE.md` when it exists.
   - Keep its headings, fields, and checkboxes.
   - Fill every applicable field succinctly and set checkboxes accurately. Do not remove fields or leave an applicable field empty.
   - Template requirements take priority over the default format below.
2. When no template exists, use only a short `## Summary` section with brief bullets that state the result of the change.
3. Prefer the clearest compact representation of the change:
   - Use a small Mermaid diagram for a meaningful state, data, or control-flow change.
   - Use a short code sample for an API, configuration, or behavior change when it is clearer than prose.
   - Use a visual description when it better shows the result.
   - Do not add diagrams, samples, or prose that merely restate the diff or issue.
4. Do not list commands or tests that you ran. Do not mention dependency installation or other routine setup.
   - When the repository has automated CI, leave test execution to CI. Do not add a testing section unless the template requires it.
   - If there is no CI workflow and a template or the change needs a verification note, add one brief outcome-focused sentence. Do not include command history.
5. Review the final body for factual statements, concise wording, and valid Markdown before creating or updating the PR.

## Visual changes

For every PR that changes a user-visible visual surface, attach comparable before-and-after visual evidence and place it in a Markdown table in the PR body.

1. Capture the same state before and after the change, with useful alt text.
2. Add both image references to the body before the PR command. Use this structure unless the template requires another location:

   ```markdown
   | Before | After |
   | --- | --- |
   | ![Before: empty profile state](./before.png) | ![After: empty profile state with retry action](./after.png) |
   ```

3. Immediately before creating or editing the PR, run the applicable current help command:

   ```sh
   gh pr create --help
   # or
   gh pr edit --help
   ```

4. Use the attachment syntax and behavior documented by that installed `gh` version. Do not assume flags or file-reference behavior from memory. Attach each visual file in the same `gh pr create` or `gh pr edit` operation so GitHub rewrites the Markdown references to uploaded assets when the current CLI supports it.
5. Re-read the created or updated PR body. Confirm that the table shows both images, has useful alt text, and links to uploaded assets rather than local paths.

Do not fabricate visual evidence. If the change has no visual effect, omit this table.

## Default body example

```markdown
## Summary

- Return a retry action when the profile request has no result.
- Keep the previous loading and error behavior unchanged.
```
