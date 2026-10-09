import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { test, type TestContext } from 'node:test'

const runScript = resolve('skills/macklinu-machine/scripts/run.ts')
const setupScript = resolve('skills/setup-macklinu-machine/scripts/setup.ts')

interface CommandFixture {
  root: string
  env: NodeJS.ProcessEnv
}

function fixture(t: TestContext) {
  const root = mkdtempSync(join(tmpdir(), 'machine-test-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const home = join(root, 'home')
  const directory = join(home, '.config', 'macklinu-machine')
  const file = join(directory, 'config.json')
  const bin = join(root, 'bin')
  mkdirSync(directory, { recursive: true, mode: 0o700 })
  mkdirSync(bin)
  const config = {
    private_key_reference: 'op://fixture vault/fixture item/private field',
    installation_ids: { macklinu: 101, 'fairfield-consulting': 202 },
  }
  writeFileSync(file, JSON.stringify(config), { mode: 0o600 })
  const opMarker = join(root, 'op-called')
  writeFileSync(join(bin, 'op'), `#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(opMarker)}, 'called'); console.error('op://fixture vault/fixture item/private field'); process.exit(1)\n`, { mode: 0o700 })
  const env = { ...process.env, HOME: home, PATH: `${bin}:${process.env.PATH}`, GIT_CONFIG_GLOBAL: join(root, 'no-global-config'), GIT_CONFIG_NOSYSTEM: '1' }
  assert.equal(spawnSync('git', ['init', '-q', root], { env }).status, 0)
  return { root, file, directory, config, opMarker, env }
}

function invoke({ fixture: f, script = runScript, args, input }: {
  fixture: CommandFixture
  script?: string
  args: string[]
  input?: string
}) {
  // Reuse the parent tsx loader without another package download per fixture command.
  return spawnSync(process.execPath, [...process.execArgv, script, ...args], {
    cwd: f.root, env: f.env, input, encoding: 'utf8', timeout: 10_000,
  })
}

test('rejects credential-output, host and repository escape commands before reading the key', t => {
  const f = fixture(t)
  for (const args of [
    ['gh', 'auth', 'token'],
    ['gh', 'token', 'generate'],
    ['gh', 'extension', 'exec', 'fixture'],
    ['gh', 'pr', 'view', '1', '-Relsewhere/repo'],
    ['gh', 'pr', 'view', 'https://github.com/macklinu/other/pull/1'],
    ['gh', 'api', 'repos/macklinu/other/pulls'],
    ['gh', 'api', 'repos/macklinu/example-repo/../../other/pulls'],
    ['gh', 'api', 'repos/macklinu/example-repo/%2e%2e/other'],
    ['gh', 'api', 'repos/macklinu/example-repo/pulls', '--verbose'],
    ['gh', 'api', 'repos/macklinu/example-repo/pulls', '-HAuthorization: fixture'],
    ['gh', 'api', 'repos/macklinu/example-repo/pulls', '--hostname=elsewhere'],
    ['push', 'HEAD', '--repo=elsewhere'],
    ['push', 'HEAD', '--rep=elsewhere'],
    ['push', 'HEAD', '--recurse-submodules=on-demand'],
    ['commit', '--auth=Someone Else <other@example.test>', '-m', 'fixture'],
    ['push', 'HEAD', '--rec=on-demand'],
  ]) {
    const result = invoke({ fixture: f, args: ['macklinu/example-repo', ...args] })
    assert.equal(result.status, 1, JSON.stringify(args))
    assert.equal(existsSync(f.opMarker), false)
  }
})

test('rejects insecure, linked or incomplete config before accessing 1Password', t => {
  const f = fixture(t)
  for (const config of [[], {}, { ...f.config, installation_ids: { macklinu: 0 } }, { ...f.config, private_key_reference: 'op://invalid' }]) {
    writeFileSync(f.file, JSON.stringify(config))
    assert.equal(invoke({ fixture: f, args: ['macklinu/example-repo', 'gh', 'pr', 'view', '1'] }).status, 1)
    assert.equal(existsSync(f.opMarker), false)
  }
  writeFileSync(f.file, JSON.stringify(f.config))
  chmodSync(f.file, 0o644)
  assert.equal(invoke({ fixture: f, args: ['macklinu/example-repo', 'gh', 'pr', 'view', '1'] }).status, 1)
  chmodSync(f.file, 0o600)
  const linked = join(f.root, 'linked-config')
  writeFileSync(linked, JSON.stringify(f.config), { mode: 0o600 })
  rmSync(f.file)
  symlinkSync(linked, f.file)
  assert.equal(invoke({ fixture: f, args: ['macklinu/example-repo', 'gh', 'pr', 'view', '1'] }).status, 1)
  assert.equal(existsSync(f.opMarker), false)
})

test('1Password failure stops publishing without showing the private reference or stderr', t => {
  const f = fixture(t)
  const result = invoke({ fixture: f, args: ['macklinu/example-repo', 'gh', 'pr', 'view', '1'] })
  assert.equal(result.status, 1)
  assert.equal(existsSync(f.opMarker), true)
  assert.equal(result.stdout, '')
  assert.equal(result.stderr.includes(f.config.private_key_reference), false)
  assert.match(result.stderr, /Cannot read the machine private key/)
})

test('push refuses URL rewrites before reading credentials', t => {
  const f = fixture(t)
  assert.equal(spawnSync('git', ['config', 'url.ssh://fixture/.pushInsteadOf', 'https://github.com/'], { cwd: f.root, env: f.env }).status, 0)
  const result = invoke({ fixture: f, args: ['macklinu/example-repo', 'push', 'HEAD'] })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /URL rewrites/)
  assert.equal(existsSync(f.opMarker), false)
})

test('setup preserves custom IDs and fields, secures config and adds the instruction once', t => {
  const f = fixture(t)
  writeFileSync(f.file, JSON.stringify({ keep: { enabled: true }, installation_ids: { macklinu: 303 } }))
  const agents = '# Existing instructions\n\nKeep this content.\n'
  writeFileSync(join(f.root, 'AGENTS.md'), agents)
  for (let i = 0; i < 2; i++) {
    const result = invoke({ fixture: f, script: setupScript, args: [], input: f.config.private_key_reference + '\n' })
    assert.equal(result.status, 0, result.stderr)
    assert.equal((result.stdout + result.stderr).includes(f.config.private_key_reference), false)
  }
  const result = JSON.parse(readFileSync(f.file, 'utf8'))
  assert.deepEqual(result, {
    keep: { enabled: true },
    private_key_reference: f.config.private_key_reference,
    installation_ids: { macklinu: 303, 'fairfield-consulting': 169669603 },
  })
  assert.equal(readFileSync(join(f.root, 'AGENTS.md'), 'utf8'), agents + '\nBefore using the `gh` CLI, always read and follow the `/macklinu-machine` skill.\n')
  assert.equal(existsSync(f.opMarker), false)
  assert.equal(statSync(f.directory).mode & 0o777, 0o700)
  assert.equal(statSync(f.file).mode & 0o777, 0o600)
})

test('setup refuses symlinks without changing their targets', t => {
  const f = fixture(t)
  const target = join(f.root, 'untouched')
  writeFileSync(target, 'untouched')
  rmSync(f.file)
  symlinkSync(target, f.file)
  const result = invoke({ fixture: f, script: setupScript, args: [], input: f.config.private_key_reference })
  assert.equal(result.status, 1)
  assert.equal(readFileSync(target, 'utf8'), 'untouched')
})
