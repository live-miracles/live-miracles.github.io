// Text helpers shared by the site build, the docs link checker and the Markdown
// page reader.

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function decodeEntities(value) {
    return value
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&');
}

function stripTags(html) {
    return decodeEntities(html.replace(/<[^>]*>/g, ''));
}

// GitHub's heading anchor rule, so links like #capacity--limits written for
// github.com keep working here.
function githubSlug(text, counts) {
    const base = stripTags(text)
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}\s_-]/gu, '')
        .replace(/\s/g, '-');
    const seen = counts.get(base) ?? 0;
    counts.set(base, seen + 1);
    return seen ? `${base}-${seen}` : base;
}

module.exports = { escapeHtml, decodeEntities, stripTags, githubSlug };
