const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });

fs.copyFileSync(path.join(root, 'ui', 'index.html'), path.join(dist, 'index.html'));
fs.cpSync(path.join(root, 'ui', 'assets'), path.join(dist, 'assets'), { recursive: true });
fs.writeFileSync(path.join(dist, '.nojekyll'), '');
