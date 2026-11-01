// The source is embedded in the page so copying needs no network request.
(() => {
    const button = document.getElementById('copy-markdown');
    const source = document.getElementById('post-markdown');
    const status = document.getElementById('copy-markdown-status');
    if (!button || !source || !status) return;
    button.hidden = false;
    let timer;
    button.addEventListener('click', async () => {
        clearTimeout(timer);
        try {
            await navigator.clipboard.writeText(source.value);
            source.hidden = true;
            button.textContent = 'Copied!';
            status.textContent = 'Markdown copied.';
            timer = setTimeout(() => {
                button.textContent = 'Copy Markdown';
                status.textContent = '';
            }, 2500);
        } catch {
            source.hidden = false;
            source.focus();
            source.select();
            button.textContent = 'Copy Markdown';
            status.textContent = 'Select and copy the Markdown below.';
        }
    });
})();
