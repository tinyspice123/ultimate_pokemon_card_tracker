#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { releaseNotes, renderChangelog } from './release-lib.mjs';

const tag = process.env.NEXT_TAG;
const notes = process.env.NOTES;
const date = process.env.RELEASE_DATE || new Date().toISOString().slice(0, 10);
if (!tag || !notes) throw new Error('NEXT_TAG and NOTES are required');
const path = process.env.CHANGELOG_PATH || 'CHANGELOG.md';

// Git is the trusted, runner-provided executable; arguments are fixed internally.
const git = args => execFileSync('git', args, { encoding: 'utf8' }).trim(); // NOSONAR
const parseCommits = range => {
  const raw = git(['log', range, '--format=%H%x1f%s%x1f%b%x1e']);
  return raw.split('\x1e').map(entry => entry.trim()).filter(Boolean).map(entry => {
    const [sha, subject, body = ''] = entry.split('\x1f');
    return { sha, subject, body };
  });
};

const tags = git(['tag', '--list', 'v[0-9]*.[0-9]*.[0-9]*', '--sort=-version:refname'])
  .split('\n').filter(Boolean);
const releases = [];
if (!tags.includes(tag)) releases.push({ tag, date, notes });
for (let index = 0; index < tags.length; index++) {
  const current = tags[index];
  const previous = tags[index + 1];
  const range = previous ? `${previous}..${current}` : current;
  releases.push({
    tag: current,
    date: git(['log', '-1', '--format=%cs', current]),
    notes: releaseNotes(parseCommits(range)),
  });
}
fs.writeFileSync(path, renderChangelog(releases));
