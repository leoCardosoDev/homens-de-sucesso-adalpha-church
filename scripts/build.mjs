import { readFile, writeFile, mkdir, rm, copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { minify as minifyHTML } from 'html-minifier-terser';
import { minify as minifyJS } from 'terser';
import { transform } from 'lightningcss';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'dist');
const files = JSON.parse(await readFile(new URL('./build-assets.json', import.meta.url), 'utf8'));
const { sequence } = JSON.parse(await readFile(resolve(root, 'assets/asset-manifest.json'), 'utf8'));
let sourceBytes = 0;
let outputBytes = 0;
async function emit(path, code) {
  const destination = resolve(output, path);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, code);
  outputBytes += Buffer.byteLength(code);
}
async function source(path) {
  const code = await readFile(resolve(root, path));
  sourceBytes += code.length;
  return code;
}
await rm(output, { recursive: true, force: true });
for (const page of files.pages) {
  await emit(page, await minifyHTML((await source(page)).toString(), {
    collapseWhitespace: true, conservativeCollapse: true, removeComments: true
  }));
}
for (const name of files.css) {
  const path = `assets/css/${name}`;
  // Do not prune selectors or rewrite URL paths. Keep the existing cascade order.
  const { code } = transform({ filename: path, code: await source(path), minify: true,
    targets: { chrome: 100 << 16, firefox: 100 << 16, safari: (15 << 16) | (4 << 8) } });
  await emit(path, code);
}
for (const name of files.js) {
  const path = `assets/js/${name}`;
  const { code } = await minifyJS((await source(path)).toString(), {
    module: false, toplevel: false, compress: { unsafe: false }, mangle: { properties: false },
    format: { comments: /^!/ }
  });
  if (!code) throw new Error(`JavaScript vazio: ${path}`);
  await emit(path, code);
}
const media = files.media.map(path => `assets/images/${path}`);
for (let index = 1; index <= sequence.frameCount; index++) {
  media.push(sequence.pattern.replace('%04d', String(index).padStart(4, '0')));
}
for (const path of media) {
  const destination = resolve(output, path);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(resolve(root, path), destination);
}
console.log(`HTML/CSS/JS: ${sourceBytes} → ${outputBytes} bytes (${(100 * (1 - outputBytes / sourceBytes)).toFixed(1)}% menor).`);
console.log(`dist gerada: ${files.pages.length} páginas, ${media.length} arquivos de mídia; originais preservados.`);
