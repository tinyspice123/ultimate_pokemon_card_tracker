import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../../scripts/changelog.mjs', import.meta.url));

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' });

test('changelog command rebuilds complete ordered history from tags', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'tracker-changelog-'));
  try {
    git(cwd, 'init', '--quiet');
    git(cwd, 'config', 'user.name', 'Release Test');
    git(cwd, 'config', 'user.email', 'release-test@example.invalid');
    fs.writeFileSync(path.join(cwd, 'fixture.txt'), 'one\n');
    git(cwd, 'add', 'fixture.txt');
    git(cwd, 'commit', '--quiet', '-m', 'feat: first release');
    git(cwd, 'tag', 'v1.0.0');
    fs.appendFileSync(path.join(cwd, 'fixture.txt'), 'two\n');
    git(cwd, 'commit', '--quiet', '-am', 'fix: second release');
    git(cwd, 'tag', 'v1.0.1');

    const output = path.join(cwd, 'CHANGELOG.md');
    execFileSync(process.execPath, [script], {
      cwd,
      env: {
        ...process.env,
        NEXT_TAG: 'v1.1.0',
        NOTES: '### Features\n- Pending feature',
        RELEASE_DATE: '2026-10-31',
        CHANGELOG_PATH: output,
      },
    });
    const changelog = fs.readFileSync(output, 'utf8');
    assert.ok(changelog.indexOf('## [v1.1.0]') < changelog.indexOf('## [v1.0.1]'));
    assert.ok(changelog.indexOf('## [v1.0.1]') < changelog.indexOf('## [v1.0.0]'));
    assert.match(changelog, /fix: second release/);
    assert.match(changelog, /feat: first release/);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});
