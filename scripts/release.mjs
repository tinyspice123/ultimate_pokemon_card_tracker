#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { analyzeRelease } from './release-lib.mjs';

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

const currentTag = latestTag();
const commits = commitsSince(currentTag);
const result = analyzeRelease(currentTag, commits);

if (!result.release) {
  writeOutput({ release: 'false', latest_tag: result.latestTag, commits_inspected: result.commitsInspected, reason: result.reason });
  writeSummary(`## Release skipped\n\n- Previous tag: ${result.latestTag || 'none'}\n- Commits inspected: ${result.commitsInspected}\n- Reason: ${result.reason}\n`);
  console.log(`Release skipped: ${result.reason} Commits inspected: ${result.commitsInspected}.`);
  process.exit(0);
}

writeOutput({
  release: 'true',
  bump: result.bump,
  latest_tag: result.latestTag,
  next_tag: result.nextTag,
  notes: result.notes,
});
writeSummary(`## Release\n\n- Previous tag: ${result.latestTag || 'none'}\n- Next tag: ${result.nextTag}\n- Bump: ${result.bump}\n\n${result.notes}\n`);
