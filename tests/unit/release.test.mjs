import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeRelease, classify, releaseNotes, updateChangelog } from '../../scripts/release-lib.mjs';

const commit = (subject, body = '', sha = '1234567890abcdef') => ({ subject, body, sha });

test('classifies patch, minor, and major conventional commits', () => {
  assert.equal(classify(commit('fix: repair export')), 'patch');
  assert.equal(classify(commit('perf(ui): render less')), 'patch');
  assert.equal(classify(commit('feat: add wishlist')), 'minor');
  assert.equal(classify(commit('feat(api)!: replace schema')), 'major');
  assert.equal(classify(commit('docs: explain setup', 'BREAKING CHANGE: renamed config')), 'major');
});

test('strongest commit determines the next version', () => {
  const result = analyzeRelease('v3.1.4', [commit('fix: one'), commit('feat: two')]);
  assert.equal(result.release, true);
  assert.equal(result.bump, 'minor');
  assert.equal(result.nextTag, 'v3.2.0');
});

test('merge and maintenance commits do not force a release', () => {
  const result = analyzeRelease('v3.1.0', [commit('Merge pull request #42'), commit('Daily backup')]);
  assert.equal(result.release, false);
  assert.equal(result.commitsInspected, 2);
  assert.match(result.reason, /No commit used/);
});

test('release notes group changes and retain merge context', () => {
  const notes = releaseNotes([commit('feat: add preview'), commit('fix: repair cache'), commit('Merge pull request #1')]);
  assert.match(notes, /### Features/);
  assert.match(notes, /### Fixes/);
  assert.match(notes, /### Other changes/);
});

test('changelog prepends a release once', () => {
  const first = updateChangelog('', 'v4.0.0', '2026-10-31', '### Features\n- New pipeline');
  const second = updateChangelog(first, 'v4.0.0', '2026-10-31', 'duplicate');
  assert.equal(second, first);
  assert.match(first, /^# Changelog[\s\S]*## \[v4\.0\.0\] - 2026-10-31/);
  assert.ok(first.indexOf('All notable changes') < first.indexOf('## [v4.0.0]'));
});
