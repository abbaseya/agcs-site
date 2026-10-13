import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

// One entry per file that scripts/fetch-agc.mjs downloads, with ids such as
// "v0.1.2/SPEC".
const agc = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/generated',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
});

export const collections = { agc };
