export function parseVersion(tag) {
  const match = /^v(\d+)\.(\d+)\.(\d+)$/.exec(tag);
  return match ? match.slice(1).map(Number) : [0, 0, 0];
}

export function bumpVersion([major, minor, patch], bump) {
  if (bump === 'major') return [major + 1, 0, 0];
  if (bump === 'minor') return [major, minor + 1, 0];
  return [major, minor, patch + 1];
}

export function classify(commit) {
  const text = `${commit.subject}\n${commit.body || ''}`;
  if (/BREAKING CHANGE:|^[a-z]+(?:\([^)]+\))?!:/i.test(text)) return 'major';
  if (/^feat(?:\([^)]+\))?:/i.test(commit.subject)) return 'minor';
  if (/^(fix|perf)(?:\([^)]+\))?:/i.test(commit.subject)) return 'patch';
  return '';
}

export function stronger(a, b) {
  const rank = { '': 0, patch: 1, minor: 2, major: 3 };
  return rank[b] > rank[a] ? b : a;
}

export function releaseNotes(commits) {
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
    for (const commit of matches) lines.push(`- ${commit.subject} (${commit.sha.slice(0, 7)})`);
    lines.push('');
  }
  return lines.join('\n').trim() || '- Maintenance release';
}

export function analyzeRelease(currentTag, commits) {
  let bump = '';
  for (const commit of commits) bump = stronger(bump, classify(commit));
  if (!commits.length || !bump) {
    const reason = !commits.length
      ? `No commits were found after ${currentTag || 'the beginning of history'}.`
      : 'No commit used `feat:`, `fix:`, `perf:`, `type!:`, or `BREAKING CHANGE:`.';
    return { release: false, latestTag: currentTag, commitsInspected: commits.length, reason };
  }
  const nextTag = `v${bumpVersion(parseVersion(currentTag), bump).join('.')}`;
  return { release: true, bump, latestTag: currentTag, nextTag, notes: releaseNotes(commits) };
}

export function updateChangelog(existing, tag, date, notes) {
  const header = '# Changelog\n\nAll notable changes to this project are documented here.\n';
  const base = existing.trim() ? existing.trimEnd() : header.trimEnd();
  if (new RegExp(`^## \\[${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'm').test(base)) return `${base}\n`;
  const section = `## [${tag}] - ${date}\n\n${notes.trim()}\n`;
  if (base.startsWith('# Changelog')) {
    const firstRelease = base.indexOf('\n## [');
    if (firstRelease >= 0)
      return `${base.slice(0, firstRelease).trimEnd()}\n\n${section}\n${base.slice(firstRelease).trim()}\n`;
    return `${base}\n\n${section}`;
  }
  return `${header}\n${section}\n${base}\n`;
}

export function renderChangelog(releases) {
  const header = '# Changelog\n\nAll notable changes to this project are documented here. New entries are generated from Conventional Commits when a release is published.\n';
  const sections = releases.map(({ tag, date, notes }) =>
    `## [${tag}] - ${date}\n\n${notes.trim()}`);
  return `${header}\n${sections.join('\n\n')}\n`;
}
