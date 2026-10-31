#!/usr/bin/env node
import fs from 'node:fs';
import { updateChangelog } from './release-lib.mjs';

const tag = process.env.NEXT_TAG;
const notes = process.env.NOTES;
const date = process.env.RELEASE_DATE || new Date().toISOString().slice(0, 10);
if (!tag || !notes) throw new Error('NEXT_TAG and NOTES are required');
const path = process.env.CHANGELOG_PATH || 'CHANGELOG.md';
const existing = fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : '';
fs.writeFileSync(path, updateChangelog(existing, tag, date, notes));
