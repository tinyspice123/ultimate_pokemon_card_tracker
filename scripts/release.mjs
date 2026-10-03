#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const outputPath = process.env.GITHUB_OUTPUT;
const summaryPath = process.env.GITHUB_STEP_SUMMARY;

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function writeOutput(values) {
  if (!outputPath) return;
  const lines = [];
  for (const [key, value] of Object.entries(values)) {
    const text = String(value);
    if (text.includes('\n')) {
      const delimiter = `EOF_${key}_${Math.random().toString(16).slice(2)}`;
      lines.push(`${key}<<${delimiter}`, text, delimiter);
    } else {
      lines.push(`${key}=${text}`);
    }
  }
  fs.appendFileSync(outputPath, `${lines.join('\n')}\n`);
}

function writeSummary(markdown) {
  if (summaryPath) fs.appendFileSync(summaryPath, markdown);
}

function latestTag() {
  try {
    return git(['describe', '--tags', '--match', 'v[0-9]*.[0-9]*.[0-9]*', '--abbrev=0']);
  } catch {
    return '';
  }
}

function parseVersion(tag) {
  const match = /^v(\d+)\.(\d+)\.(\d+)$/.exec(tag);
  if (!match) return [0, 0, 0];
  return match.slice(1).map(Number);
}

function bumpVersion(version, bump) {
  const [major, minor, patch] = version;
  if (bump === 'major') return [major + 1, 0, 0];
  if (bump === 'minor') return [major, minor + 1, 0];
  return [major, minor, patch + 1];
}

function commitRange(tag) {
  return tag ? `${tag}..HEAD` : 'HEAD';
}

function commitsSince(tag) {
  const format = '%H%x1f%s%x1f%b%x1e';
  const raw = git(['log', commitRange(tag), `--format=${format}`]);
  return raw.split('\x1e')
    .map(entry => entry.trim())
    .filter(Boolean)
    .map(entry => {
      const [sha, subject, body = ''] = entry.split('\x1f');
      return { sha, subject, body };
    });
}

function classify(commit) {
  const text = `${commit.subject}\n${commit.body}`;
  if (/BREAKING CHANGE:|^[a-z]+(?:\([^)]+\))?!:/i.test(text)) return 'major';
  if (/^feat(?:\([^)]+\))?:/i.test(commit.subject)) return 'minor';
  if (/^(fix|perf)(?:\([^)]+\))?:/i.test(commit.subject)) return 'patch';
  return '';
}

function stronger(a, b) {
  const rank = { '': 0, patch: 1, minor: 2, major: 3 };
  return rank[b] > rank[a] ? b : a;
}

function releaseNotes(commits) {
  const groups = [
    ['Features', commit => /^feat(?:\([^)]+\))?!?:/i.test(commit.subject)],
    ['Fixes', commit => /^(fix|perf)(?:\([^)]+\))?!?:/i.test(commit.subject)],
    ['Other changes', commit => !/^(feat|fix|perf)(?:\([^)]+\))?!?:/i.test(commit.subject)],
  ];
  const lines = [];
  for (const [title, predicate] of groups) {
    const matches = commits.filter(predicate);
    if (!matches.length) continue;
    lines.push(`### ${title}`);
    for (const commit of matches) {
      const shortSha = commit.sha.slice(0, 7);
      lines.push(`- ${commit.subject} (${shortSha})`);
    }
    lines.push('');
  }
  return lines.join('\n').trim() || '- Maintenance release';
}

const currentTag = latestTag();
const commits = commitsSince(currentTag);
let bump = '';
for (const commit of commits) bump = stronger(bump, classify(commit));

if (!commits.length || !bump) {
  writeOutput({ release: 'false', latest_tag: currentTag });
  writeSummary('## Release\n\nNo SemVer release needed for the commits in this run.\n');
  process.exit(0);
}

const nextVersion = bumpVersion(parseVersion(currentTag), bump).join('.');
const nextTag = `v${nextVersion}`;
const notes = releaseNotes(commits);

writeOutput({
  release: 'true',
  bump,
  latest_tag: currentTag,
  next_tag: nextTag,
  notes,
});
writeSummary(`## Release\n\n- Previous tag: ${currentTag || 'none'}\n- Next tag: ${nextTag}\n- Bump: ${bump}\n\n${notes}\n`);
