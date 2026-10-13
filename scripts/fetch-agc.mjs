// Downloads the AGC documents from tagged releases of agent-gate-contract into
// src/generated/, so the site never carries a hand-made copy of the standard.
//
// For the current tag: README.md (split into the home and validate pages),
// SPEC.md, EVIDENCE.md and BINDINGS.md. For every other listed tag: SPEC.md.
// Relative links are rewritten to site routes, or to the file on GitHub at
// the same tag.

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'generated');
const config = JSON.parse(readFileSync(join(ROOT, 'agc.config.json'), 'utf8'));

if (!config.versions.includes(config.current)) {
  throw new Error(`agc.config.json: current tag ${config.current} is not in versions.`);
}

const SITE_ROUTES = {
  'README.md': '/',
  'SPEC.md': '/spec/',
  'EVIDENCE.md': '/evidence/',
  'BINDINGS.md': '/bindings/',
};

async function download(tag, file) {
  const url = `https://raw.githubusercontent.com/${config.repo}/${tag}/${file}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}

// Rewrites the target of each relative Markdown link. Absolute URLs and
// in-page anchors stay as they are.
function rewriteLinks(markdown, tag, isCurrent) {
  return markdown.replace(/\]\(([^)\s]+)\)/g, (match, target) => {
    if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#')) return match;
    const [path, anchor] = target.split('#');
    const file = posix.normalize(path);
    const hash = anchor ? `#${anchor}` : '';
    if (isCurrent && SITE_ROUTES[file]) return `](${SITE_ROUTES[file]}${hash})`;
    const kind = file.endsWith('/') ? 'tree' : 'blob';
    return `](https://github.com/${config.repo}/${kind}/${tag}/${file}${hash})`;
  });
}

// Returns the README text from its start up to (not including) the heading
// `stopAt`, or the single section that starts at heading `section`.
function readmeSlice(readme, { from, stopAt }) {
  const lines = readme.split('\n');
  const startIndex = from ? lines.findIndex((line) => line === from) : 0;
  if (startIndex === -1) throw new Error(`README.md has no heading "${from}". Update scripts/fetch-agc.mjs.`);
  const endOffset = lines.slice(startIndex + 1).findIndex((line) => (stopAt ? line === stopAt : line.startsWith('## ')));
  if (stopAt && endOffset === -1) throw new Error(`README.md has no heading "${stopAt}". Update scripts/fetch-agc.mjs.`);
  const endIndex = endOffset === -1 ? lines.length : startIndex + 1 + endOffset;
  return lines.slice(startIndex, endIndex).join('\n').trim() + '\n';
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  for (const tag of config.versions) {
    const isCurrent = tag === config.current;
    const dir = join(OUT, tag);
    await mkdir(dir, { recursive: true });
    const files = isCurrent ? ['SPEC.md', 'EVIDENCE.md', 'BINDINGS.md'] : ['SPEC.md'];
    for (const file of files) {
      await writeFile(join(dir, file), rewriteLinks(await download(tag, file), tag, isCurrent));
    }
    if (isCurrent) {
      const readme = rewriteLinks(await download(tag, 'README.md'), tag, true);
      // The home page drops the README's H1, because the page layout shows the title.
      const home = readmeSlice(readme, { stopAt: '## Validate' }).replace(/^# .*\n+/, '');
      await writeFile(join(dir, 'HOME.md'), home);
      await writeFile(join(dir, 'VALIDATE.md'), readmeSlice(readme, { from: '## Validate' }));
    }
  }
  process.stdout.write(`Fetched AGC ${config.current} and ${config.versions.length - 1} older specs from ${config.repo}.\n`);
}

await main();
