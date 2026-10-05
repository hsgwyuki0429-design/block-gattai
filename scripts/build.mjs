import { mkdir, copyFile, cp, writeFile } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
for (const file of ['index.html','style.css','favicon.svg']) await copyFile(file, `dist/${file}`);
await cp('src', 'dist/src', {recursive:true});
await writeFile('dist/.nojekyll','');
console.log('Static site ready: dist/ (all asset paths are relative)');
