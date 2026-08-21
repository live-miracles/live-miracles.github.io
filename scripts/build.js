const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });

fs.copyFileSync(path.join(root, 'ui', 'index.html'), path.join(dist, 'index.html'));
fs.copyFileSync(path.join(root, 'ui', 'assets', 'app.js'), path.join(dist, 'assets', 'app.js'));
fs.copyFileSync(
    path.join(root, 'ui', 'assets', 'logo.png'),
    path.join(dist, 'assets', 'logo.png'),
);
fs.writeFileSync(path.join(dist, '.nojekyll'), '');
