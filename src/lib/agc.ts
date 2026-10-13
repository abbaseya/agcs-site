import { getEntry, render } from 'astro:content';
import config from '../../agc.config.json';

export const AGC = config;
export const REPO_URL = `https://github.com/${config.repo}`;

// Renders one fetched AGC document, for example ("v0.1.2", "SPEC").
export async function renderDocument(tag: string, name: string) {
  const entry = await getEntry('agc', `${tag}/${name}`);
  if (!entry) throw new Error(`Missing ${tag}/${name}.md. Run yarn fetch:agc.`);
  return render(entry);
}
