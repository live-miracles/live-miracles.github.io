const express = require('express');
const router = express.Router();

const path = require('path');
const fs = require('fs');

const hljs = require('highlight.js/lib/core');
hljs.registerLanguage('vbnet', require('highlight.js/lib/languages/vbnet'));

router.get('/scripts/:filename', (req, res) => {
    const file = req.params.filename;
    console.log('Requested file:', file);

    const filePath = path.join(__dirname, 'scripts', file);

    fs.readFile(filePath, 'utf8', (err, content) => {
        if (err) return res.status(404).send('File not found ' + filePath.toString());

        const highlightedCode = hljs.highlight(content, { language: 'vbnet' }).value;

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${file}</title>
          <link rel="icon" type="image/png" href="../logo.svg" />
          <link rel="stylesheet" href="../github-dark.min.css">
          <style>
            body { background: #1e1e1e; color: #ddd; font-family: monospace; }
            pre { border-radius: 8px; padding: 10px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <pre><code class="language-vbnet">${highlightedCode}</code></pre>
        </body>
        </html>
      `;

        res.send(html);
    });
});

module.exports = router;
