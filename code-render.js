function loadScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

function loadCSS(href) {
    return new Promise((resolve, reject) => {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = href;
        l.onload = resolve;
        l.onerror = reject;
        document.head.appendChild(l);
    });
}

// Load and highlight VB file
async function renderCode() {
    await loadCSS('/highlight.min.css');
    await loadCSS('/github-dark.min.css');
    await loadScript('/highlight.min.js');
    await loadScript('/vbnet.min.js');

    fetch(vbFile)
        .then((response) => {
            if (!response.ok) throw new Error('File not found');
            return response.text();
        })
        .then((code) => {
            const codeBlock = document.getElementById('codeBlock');

            const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

            codeBlock.innerHTML = escaped;
            hljs.highlightAll();
        })
        .catch((err) => {
            document.getElementById('codeBlock').textContent =
                'Error loading ' + vbFile + ': ' + err.message;
        });
}

// Dynamically get this HTML file name
const htmlFile = window.location.pathname.split('/').pop();

// Remove ".html" extension → get base name
const baseName = htmlFile.replace(/\.html$/i, '');

// Set the page title
document.title = baseName + '.vb';

// Build the VB file name
const vbFile = baseName + '.vb';

renderCode();
