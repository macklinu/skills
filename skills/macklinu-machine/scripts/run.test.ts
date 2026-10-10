import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { generateKeyPairSync, verify } from 'node:crypto'
import { once } from 'node:events'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { test, type TestContext } from 'node:test'
import { pathToFileURL } from 'node:url'

const runScript = resolve('skills/macklinu-machine/scripts/run.ts')
const setupScript = resolve('skills/setup-macklinu-machine/scripts/setup.ts')

function fixture(t: TestContext) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'machine-test-')))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const home = join(root, 'home')
  const directory = join(home, '.config', 'macklinu-machine')
  const file = join(directory, 'config.json')
  const keyDirectory = join(home, 'private keys')
  const keyPath = join(keyDirectory, 'app.pem')
  const bin = join(root, 'bin')
  mkdirSync(directory, { recursive: true, mode: 0o700 })
  mkdirSync(keyDirectory, { recursive: true, mode: 0o700 })
  mkdirSync(bin)
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  })
  writeFileSync(keyPath, privateKey, { mode: 0o600 })
  const config = {
    private_key_path: keyPath,
    installation_ids: { macklinu: 101, 'fairfield-consulting': 202 },
  }
  writeFileSync(file, JSON.stringify(config), { mode: 0o600 })
  const requestMarker = join(root, 'request.json')
  const loader = join(root, 'fetch.ts')
  // Never use the network, even if a guard regresses.
  writeFileSync(loader, `
import { writeFileSync } from 'node:fs'
globalThis.fetch = async (url, options) => {
  writeFileSync(${JSON.stringify(requestMarker)}, JSON.stringify({ url, ...options }), { mode: 0o600 })
  return new Response(JSON.stringify({ token: 'fixture-token' }), { status: 201 })
}
`)
  const childMarker = join(root, 'child.json')
  writeFileSync(join(bin, 'gh'), `#!${process.execPath}
const env = Object.fromEntries(['GH_TOKEN', 'GH_REPO', 'GH_HOST', 'GITHUB_TOKEN', 'GH_ENTERPRISE_TOKEN', 'GH_DEBUG', 'GIT_TRACE'].map(name => [name, process.env[name]]))
require('node:fs').writeFileSync(${JSON.stringify(childMarker)}, JSON.stringify(env), { mode: 0o600 })
process.exit(17)
`, { mode: 0o700 })
  const pushMarker = join(root, 'push.json')
  writeFileSync(join(bin, 'git'), `#!${process.execPath}
const args = process.argv.slice(2)
if (args.includes('push')) {
  require('node:fs').writeFileSync(${JSON.stringify(pushMarker)}, JSON.stringify(args), { mode: 0o600 })
  process.exit(23)
}
const result = require('node:child_process').spawnSync('/usr/bin/git', args, { stdio: 'inherit' })
process.exit(result.status ?? 1)
`, { mode: 0o700 })
  const env = {
    ...process.env, HOME: home, PATH: `${bin}:${process.env.PATH}`,
    GIT_CONFIG_GLOBAL: join(root, 'no-global-config'), GIT_CONFIG_NOSYSTEM: '1',
    GH_TOKEN: 'inherited-personal', GITHUB_TOKEN: 'inherited-personal',
    GH_ENTERPRISE_TOKEN: 'inherited-personal', GH_DEBUG: 'api', GIT_TRACE: '1',
  }
  assert.equal(spawnSync('git', ['init', '-q', root], { env }).status, 0)
  const runtimeArgs = [...process.execArgv, '--import', pathToFileURL(loader).href]
  return {
    root, home, file, directory, keyPath, keyDirectory, privateKey, publicKey,
    config, requestMarker, childMarker, pushMarker, env, runtimeArgs,
    run({ script = runScript, args, input }: { script?: string; args: string[]; input?: string }) {
      // Reuse tsx without a package download for every fixture command.
      return spawnSync(process.execPath, [...runtimeArgs, script, ...args], {
        cwd: root, env, input, encoding: 'utf8', timeout: 10_000,
      })
    },
  }
}

test('blocks credential-output, host and repository escapes without token requests', t => {
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
    const result = f.run({ args: ['macklinu/example-repo', ...args] })
    assert.equal(result.status, 1, JSON.stringify(args))
    assert.equal(existsSync(f.requestMarker), false)
    assert.equal(existsSync(f.childMarker), false)
    assert.equal(existsSync(f.pushMarker), false)
  }
})

test('rejects insecure, linked or incomplete config before token requests', t => {
  const f = fixture(t)
  for (const config of [[], {}, { ...f.config, installation_ids: { macklinu: 0 } }, { ...f.config, private_key_path: 'relative.pem' }]) {
    writeFileSync(f.file, JSON.stringify(config))
    assert.equal(f.run({ args: ['macklinu/example-repo', 'gh', 'pr', 'view', '1'] }).status, 1)
    assert.equal(existsSync(f.requestMarker), false)
  }
  writeFileSync(f.file, JSON.stringify(f.config))
  chmodSync(f.file, 0o644)
  assert.equal(f.run({ args: ['macklinu/example-repo', 'gh', 'pr', 'view', '1'] }).status, 1)
  chmodSync(f.file, 0o600)
  chmodSync(f.directory, 0o755)
  assert.equal(f.run({ args: ['macklinu/example-repo', 'gh', 'pr', 'view', '1'] }).status, 1)
  chmodSync(f.directory, 0o700)
  const linked = join(f.root, 'linked-config')
  writeFileSync(linked, JSON.stringify(f.config), { mode: 0o600 })
  rmSync(f.file)
  symlinkSync(linked, f.file)
  assert.equal(f.run({ args: ['macklinu/example-repo', 'gh', 'pr', 'view', '1'] }).status, 1)
  assert.equal(existsSync(f.requestMarker), false)
  assert.equal(existsSync(f.childMarker), false)
})

test('unsafe, unreadable and non-RSA keys stop setup and runtime without private output', t => {
  const f = fixture(t)
  const assertRejected = () => {
    for (const command of [
      { args: ['macklinu/example-repo', 'gh', 'pr', 'view', '1'] },
      { script: setupScript, args: [] },
    ]) {
      const result = f.run(command)
      assert.equal(result.status, 1)
      assert.equal((result.stdout + result.stderr).includes(f.keyPath), false)
      assert.equal((result.stdout + result.stderr).includes(f.privateKey), false)
      assert.equal(existsSync(f.requestMarker), false)
      assert.equal(existsSync(f.childMarker), false)
    }
  }
  for (const mode of [0o644, 0o000]) {
    chmodSync(f.keyPath, mode)
    assertRejected()
  }
  chmodSync(f.keyPath, 0o600)
  chmodSync(f.keyDirectory, 0o777)
  assertRejected()
  chmodSync(f.keyDirectory, 0o700)
  rmSync(f.keyPath)
  assertRejected()
  const target = join(f.root, 'key-target')
  writeFileSync(target, f.privateKey, { mode: 0o600 })
  symlinkSync(target, f.keyPath)
  assertRejected()
  rmSync(f.keyPath)
  mkdirSync(f.keyPath)
  assertRejected()
  rmSync(f.keyPath, { recursive: true })
  const ec = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
  })
  for (const content of ['invalid PEM', ec.privateKey.export({ type: 'pkcs8', format: 'pem' }), '-----BEGIN OPENSSH PRIVATE KEY-----\ninvalid\n-----END OPENSSH PRIVATE KEY-----']) {
    writeFileSync(f.keyPath, content, { mode: 0o600 })
    assertRejected()
  }
})

test('push refuses URL rewrites before reading credentials', t => {
  const f = fixture(t)
  assert.equal(spawnSync('git', ['config', 'url.ssh://fixture/.pushInsteadOf', 'https://github.com/'], { cwd: f.root, env: f.env }).status, 0)
  const result = f.run({ args: ['macklinu/example-repo', 'push', 'HEAD'] })
  assert.equal(result.status, 1)
  assert.equal(existsSync(f.requestMarker), false)
  assert.equal(existsSync(f.pushMarker), false)
})

test('setup migrates an explicit path, preserves custom data and instructions, then reuses it', async t => {
  const f = fixture(t)
  writeFileSync(f.file, JSON.stringify({
    keep: { enabled: true }, private_key_reference: 'obsolete-metadata',
    installation_ids: { macklinu: 303, 'fairfield-consulting': 404 },
  }))
  chmodSync(f.file, 0o644)
  chmodSync(f.directory, 0o755)
  const agents = '# Existing instructions\n\nKeep this content.\n'
  writeFileSync(join(f.root, 'AGENTS.md'), agents)
  const missing = f.run({ script: setupScript, args: [] })
  assert.equal(missing.status, 1)
  assert.equal(readFileSync(join(f.root, 'AGENTS.md'), 'utf8'), agents)
  const first = f.run({ script: setupScript, args: ['--key-path-stdin'], input: '~/private keys/app.pem\n' })
  assert.equal(first.status, 0, first.stderr)
  assert.equal((first.stdout + first.stderr).includes(f.keyPath), false)
  const firstAgents = readFileSync(join(f.root, 'AGENTS.md'), 'utf8')
  const result = JSON.parse(readFileSync(f.file, 'utf8'))
  assert.deepEqual(result, {
    keep: { enabled: true }, private_key_path: f.keyPath,
    installation_ids: { macklinu: 303, 'fairfield-consulting': 404 },
  })
  assert.ok(firstAgents.startsWith(agents))
  // Keep stdin open: valid config must finish without asking for another path.
  const repeat = spawn(process.execPath, [...f.runtimeArgs, setupScript], {
    cwd: f.root, env: f.env, stdio: ['pipe', 'ignore', 'ignore'],
  })
  t.after(() => { repeat.stdin.destroy(); repeat.kill() })
  const [code] = await once(repeat, 'exit', { signal: AbortSignal.timeout(10_000) })
  assert.equal(code, 0)
  assert.equal(readFileSync(join(f.root, 'AGENTS.md'), 'utf8'), firstAgents)
  assert.deepEqual(JSON.parse(readFileSync(f.file, 'utf8')), result)
  const ignored = f.run({ script: setupScript, args: ['--key-path-stdin'], input: '/not/a/replacement.pem' })
  assert.equal(ignored.status, 0)
  assert.deepEqual(JSON.parse(readFileSync(f.file, 'utf8')), result)
  assert.equal(statSync(f.directory).mode & 0o777, 0o700)
  assert.equal(statSync(f.file).mode & 0o777, 0o600)
})

test('setup refuses symlinks without changing their targets', t => {
  const f = fixture(t)
  const target = join(f.root, 'untouched')
  writeFileSync(target, 'untouched')
  rmSync(f.file)
  symlinkSync(target, f.file)
  const result = f.run({ script: setupScript, args: [] })
  assert.equal(result.status, 1)
  assert.equal(readFileSync(target, 'utf8'), 'untouched')
})

test('setup refuses an unsafe instruction target before changing configuration', t => {
  const f = fixture(t)
  const agents = join(f.root, 'AGENTS.md')
  const original = readFileSync(f.file, 'utf8')
  const target = join(f.root, 'existing-instructions')
  writeFileSync(target, 'keep')
  symlinkSync(target, agents)
  assert.equal(f.run({ script: setupScript, args: [] }).status, 1)
  assert.equal(readFileSync(target, 'utf8'), 'keep')
  assert.equal(readFileSync(f.file, 'utf8'), original)
  rmSync(agents)
  mkdirSync(agents)
  assert.equal(f.run({ script: setupScript, args: [] }).status, 1)
  assert.equal(readFileSync(f.file, 'utf8'), original)
})

test('setup requires explicit path input for fresh config and leaves failed migration unchanged', t => {
  const f = fixture(t)
  rmSync(f.file)
  assert.equal(f.run({ script: setupScript, args: [] }).status, 1)
  assert.equal(existsSync(f.file), false)
  for (const input of ['/does/not/exist.pem', '~another/key.pem', '\n', 'one\ntwo\n']) {
    assert.equal(f.run({ script: setupScript, args: ['--key-path-stdin'], input }).status, 1)
    assert.equal(existsSync(f.file), false)
    assert.equal(existsSync(join(f.root, 'AGENTS.md')), false)
  }
  const success = f.run({ script: setupScript, args: ['--key-path-stdin'], input: 'home/private keys/app.pem\n' })
  assert.equal(success.status, 0, success.stderr)
  assert.equal(JSON.parse(readFileSync(f.file, 'utf8')).private_key_path, f.keyPath)
  const legacy = JSON.stringify({ private_key_reference: 'obsolete', installation_ids: { macklinu: 303 } })
  writeFileSync(f.file, legacy)
  assert.equal(f.run({ script: setupScript, args: ['--key-path-stdin'], input: '/missing.pem' }).status, 1)
  assert.equal(readFileSync(f.file, 'utf8'), legacy)
})

test('local PEM signs a valid scoped JWT for each owner without inherited personal credentials', t => {
  const f = fixture(t)
  for (const [owner, id] of [['macklinu', 101], ['fairfield-consulting', 202]]) {
    const result = f.run({ args: [`${owner}/example-repo`, 'gh', 'pr', 'view', '1'] })
    assert.equal(result.status, 17, result.stderr)
    const request = JSON.parse(readFileSync(f.requestMarker, 'utf8'))
    assert.equal(request.url, `https://api.github.com/app/installations/${id}/access_tokens`)
    assert.equal(request.method, 'POST')
    assert.deepEqual(JSON.parse(request.body), { repositories: ['example-repo'] })
    const jwt = request.headers.Authorization.slice('Bearer '.length).split('.')
    assert.equal(verify('RSA-SHA256', Buffer.from(`${jwt[0]}.${jwt[1]}`), f.publicKey, Buffer.from(jwt[2], 'base64url')), true)
    const header = JSON.parse(Buffer.from(jwt[0], 'base64url').toString())
    const claims = JSON.parse(Buffer.from(jwt[1], 'base64url').toString())
    assert.equal(header.alg, 'RS256')
    assert.equal(claims.iss, '5252838')
    const now = Math.floor(Date.now() / 1000)
    assert.ok(claims.iat <= now && now - claims.iat <= 65)
    assert.ok(claims.exp > now && claims.exp - claims.iat <= 600)
    const child = JSON.parse(readFileSync(f.childMarker, 'utf8'))
    assert.equal(child.GH_REPO, `${owner}/example-repo`)
    assert.equal(child.GH_HOST, 'github.com')
    for (const name of ['GITHUB_TOKEN', 'GH_ENTERPRISE_TOKEN', 'GH_DEBUG', 'GIT_TRACE']) {
      assert.equal(child[name], undefined)
    }
  }
})

test('commit needs no configuration or PEM and sets bot author and committer', t => {
  const f = fixture(t)
  rmSync(f.file)
  rmSync(f.keyPath)
  writeFileSync(join(f.root, 'change.txt'), 'fixture')
  assert.equal(spawnSync('git', ['add', 'change.txt'], { cwd: f.root, env: f.env }).status, 0)
  const result = f.run({ args: ['macklinu/example-repo', 'commit', '-m', 'fixture commit'] })
  assert.equal(result.status, 0, result.stderr)
  const identities = spawnSync('git', ['show', '-s', '--format=%an <%ae>%n%cn <%ce>'], {
    cwd: f.root, env: f.env, encoding: 'utf8',
  })
  const identity = 'macklinu-machine[bot] <340227694+macklinu-machine[bot]@users.noreply.github.com>'
  assert.equal(identities.stdout.trim(), `${identity}\n${identity}`)
  assert.equal(existsSync(f.requestMarker), false)
})

test('a linked key directory cannot bypass local key protection', t => {
  const f = fixture(t)
  rmSync(f.keyDirectory, { recursive: true })
  symlinkSync(f.directory, f.keyDirectory)
  writeFileSync(f.keyPath, f.privateKey, { mode: 0o600 })
  for (const command of [
    { args: ['macklinu/example-repo', 'gh', 'pr', 'view', '1'] },
    { script: setupScript, args: [] },
  ]) {
    assert.equal(f.run(command).status, 1)
    assert.equal(existsSync(f.requestMarker), false)
    assert.equal(existsSync(f.childMarker), false)
  }
})
