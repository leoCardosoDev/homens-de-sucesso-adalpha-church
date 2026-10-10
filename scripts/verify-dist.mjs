import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script, runInNewContext } from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(root, 'dist');
const files = JSON.parse(await readFile(new URL('./build-assets.json', import.meta.url), 'utf8'));
const { sequence } = JSON.parse(await readFile(resolve(root, 'assets/asset-manifest.json'), 'utf8'));
const inventory = [];
async function walk(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, item.name);
    if (item.isDirectory()) await walk(path);
    else inventory.push(relative(dist, path));
  }
}
await walk(dist);
async function checkPath(value, base) {
  if (!value || /^(?:https?:|data:|mailto:|tel:|#|\/\/)/.test(value)) return;
  const path = value.split(/[?#]/)[0];
  const destination = resolve(path.startsWith('/') ? dist : base, path.replace(/^\//, '') || 'index.html');
  assert(!relative(dist, destination).startsWith('..'), `Caminho fora de dist: ${value}`);
  await readFile(destination);
}
for (const page of files.pages) {
  const html = await readFile(resolve(dist, page), 'utf8');
  assert.match(html, /lang="pt-BR"/);
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  for (const [, value] of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
    if (value.startsWith('#')) assert(ids.has(value.slice(1)), `Âncora inexistente: ${value}`);
    else await checkPath(value, dist);
  }
}
for (const name of files.css) {
  const path = resolve(dist, 'assets/css', name);
  const css = await readFile(path, 'utf8');
  for (const [, value] of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) await checkPath(value, dirname(path));
}
for (const name of files.js) {
  const code = await readFile(resolve(dist, 'assets/js', name), 'utf8');
  new Script(code, { filename: name });
  for (const [, value] of code.matchAll(/["'](assets\/[^"']+\.(?:webp|mp3))["']/g)) await checkPath(value, dist);
}
const sandbox = { window: {} };
runInNewContext(await readFile(resolve(dist, 'assets/js/content.js'), 'utf8'), sandbox);
assert.equal(sandbox.window.HDS_BOOKS.length, 4);
assert.equal(sandbox.window.HDS_ORGANOGRAM.bases.length, 12);
for (const book of sandbox.window.HDS_BOOKS) await checkPath(book.cover, dist);
const html = await readFile(resolve(dist, 'index.html'), 'utf8');
assert.deepEqual([...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*>/g)].map(match => match[1].split('?')[0]),
  files.js.map(name => `assets/js/${name}`), 'Ordem dos scripts alterada');
assert.equal(inventory.filter(path => path.startsWith('assets/images/davi/frames/')).length, sequence.frameCount);
for (const path of inventory.filter(path => path.startsWith('assets/images/'))) {
  assert.deepEqual(await readFile(resolve(dist, path)), await readFile(resolve(root, path)), `Mídia alterada: ${path}`);
}
const notFound = await readFile(resolve(dist, '404.html'), 'utf8');
assert.match(notFound, /name="robots" content="noindex"/);
assert.match(notFound, /href="\/"/);
assert(!inventory.some(path => /(?:\.DS_Store|reference|temp|\.map$|manifest\.json)/.test(path)));
console.log(`Verificação OK: ${inventory.length} arquivos; caminhos, âncoras, scripts, capas e ${sequence.frameCount} frames válidos.`);
