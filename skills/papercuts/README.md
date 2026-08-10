# Papercuts

`SKILL.md` defines how an agent records a resolved, unexpected obstacle as a structured Markdown note.

## Automatic invocation

The skill does not disable model invocation. Its description tells compatible skill hosts to select it after an agent resolves an unexpected minor obstacle.

Automatic selection is useful, but it is not a complete guarantee. Add this instruction to the global agent prompt or task-completion workflow:

> Before you finish a user request, decide if you resolved an unexpected minor obstacle that caused delay, failure, ambiguity, or avoidable rework. If it has reuse value and you can state a concrete resolution or safe workaround, invoke the `papercuts` skill and record one note. Do not record routine work, unresolved issues, secrets, private user content, prompts, tokens, cookies, or full tool transcripts.

This instruction gives agents a reliable completion checkpoint. The skill supplies the qualification rules, configuration, metadata schema, safe write process, and verification requirements.

## Files

- `SKILL.md` — agent workflow and note schema.
- `scripts/validate_config.py` — non-mutating TOML validator.
- `scripts/create_papercut.py` — validated, atomic Markdown note creator.

See `SKILL.md` for configuration and input contracts.
