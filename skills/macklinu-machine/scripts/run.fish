#!/usr/bin/env fish

# Disable inherited tracing before reading private configuration or credentials.
set --global --unexport fish_trace ''

if test (count $argv) -lt 3
    printf '%s\n' 'Usage: run.fish OWNER/REPO gh|commit|push ARGS...' >&2
    exit 1
end

set -l repository $argv[1]
set -l operation $argv[2]
set -l arguments $argv[3..-1]

if not string match --quiet --regex '^(macklinu|fairfield-consulting)/[A-Za-z0-9_.-]+$' -- "$repository"
    printf '%s\n' 'Unsupported target repository.' >&2
    exit 1
end

switch $operation
    case gh commit push
    case '*'
        printf '%s\n' 'Unsupported operation.' >&2
        exit 1
end

# Empty arguments are not a publishing command.
if test -z "$arguments[1]"
    printf '%s\n' 'A command or commit/push argument is required.' >&2
    exit 1
end

if test "$operation" = commit
    command env \
        GIT_AUTHOR_NAME='macklinu-machine[bot]' \
        GIT_AUTHOR_EMAIL='340227694+macklinu-machine[bot]@users.noreply.github.com' \
        GIT_COMMITTER_NAME='macklinu-machine[bot]' \
        GIT_COMMITTER_EMAIL='340227694+macklinu-machine[bot]@users.noreply.github.com' \
        git commit $arguments
    exit $status
end

# The caller must not replace the repository or host selected above.
for argument in $arguments
    if string match --quiet --regex '^(-R.*|--repo($|=)|--hostname($|=))' -- "$argument"
        printf '%s\n' 'Repository and host overrides are not allowed.' >&2
        exit 1
    end
end

set -l owner (string split / -- "$repository")[1]
set -l installation_id
switch $owner
    case macklinu
        set installation_id 169669532
    case fairfield-consulting
        set installation_id 169669603
end

set --local --unexport private_key_reference (command jq --exit-status --raw-output \
    '.private_key_reference | strings | select(test("^op://[^/[:cntrl:]]+/[^/[:cntrl:]]+/[^/[:cntrl:]]+$"))' \
    "$HOME/.config/macklinu-machine/config.json" 2>/dev/null)
set -l config_status $status
if test "$config_status" -ne 0; or test (count $private_key_reference) -ne 1
    printf '%s\n' 'Machine configuration is missing or invalid. Run /setup-macklinu-machine.' >&2
    exit 1
end

# Keep the key in non-exported memory so op failure cannot reach generation.
set --local --unexport pem (command op read "$private_key_reference" 2>/dev/null)
set -l read_status $status
set --erase private_key_reference
if test "$read_status" -ne 0; or test (count $pem) -eq 0
    printf '%s\n' 'Cannot read the machine private key from 1Password.' >&2
    exit 1
end

# Check the FIFO reader before opening a pipe; a missing extension cannot read it.
if not command env GH_HOST=github.com GH_DEBUG= GH_TOKEN= GITHUB_TOKEN= \
        gh token generate --help >/dev/null 2>&1
    printf '%s\n' 'Install the Link-/gh-token extension before publishing.' >&2
    exit 1
end

# psub's FIFO belongs to this command and is removed when it exits.
# An RSA-2048 PEM is smaller than Fish's documented 8 KiB FIFO limit.
set --local --unexport token_json (command env GH_HOST=github.com GH_DEBUG= GH_TOKEN= GITHUB_TOKEN= \
    gh token generate --app-id 5252838 --installation-id "$installation_id" \
    --key (printf '%s\n' $pem | psub --fifo) 2>/dev/null)
set -l generation_status $status
set --erase pem
if test "$generation_status" -ne 0
    printf '%s\n' 'Cannot generate a machine installation token.' >&2
    exit 1
end

set --local --unexport token (printf '%s\n' $token_json | command jq --exit-status --raw-output \
    '.token | strings | select(length > 0 and test("^[^\\r\\n\\t ]+$"))' 2>/dev/null)
set -l token_status $status
set --erase token_json
if test "$token_status" -ne 0; or test (count $token) -ne 1
    printf '%s\n' 'Token generation returned no valid token.' >&2
    exit 1
end

set --local --export GH_TOKEN "$token"
set --local --export GH_REPO "$repository"
set --local --export GH_HOST github.com
set --local --export GH_DEBUG ''

switch $operation
    case gh
        command gh $arguments
    case push
        set --local --unexport GIT_TRACE ''
        set --local --unexport GIT_TRACE_CURL ''
        set --local --unexport GIT_CURL_VERBOSE ''
        command env GIT_TERMINAL_PROMPT=0 GIT_ASKPASS=/usr/bin/false SSH_ASKPASS=/usr/bin/false \
            GIT_TRACE_REDACT=1 \
            git -c credential.helper= -c 'credential.helper=!gh auth git-credential' \
            -c http.extraHeader= -c 'http.https://github.com/.extraHeader=' \
            push "https://github.com/$repository.git" $arguments
end
set -l command_status $status
set --erase token
exit $command_status
