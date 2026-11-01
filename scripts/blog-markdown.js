// Preserve the source Markdown while making its links portable to other sites.
const { Marked } = require('marked');
const { blogImageUrl } = require('./blog');

function exportMarkdown(post, siteUrl) {
    const pageUrl = new URL(post.url, siteUrl).href;
    const resolve = (href, image) => {
        if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href)) return href;
        return new URL(image ? blogImageUrl(href) : href, pageUrl).href;
    };
    const marked = new Marked({ gfm: true });
    function children(token) {
        if (token.type === 'table') {
            return [...token.header, ...token.rows.flat()].flatMap((cell) => cell.tokens);
        }
        return token.tokens || token.items || [];
    }
    function rewrite(source, tokens) {
        let cursor = 0;
        let result = '';
        const pending = [...tokens];
        for (let index = 0; index < pending.length; index++) {
            const token = pending[index];
            const start = source.indexOf(token.raw, cursor);
            // Block quotes and indented lists can remove prefixes from child raw text.
            // In that case, locate their inline tokens individually instead.
            if (start < 0) {
                pending.splice(index + 1, 0, ...children(token));
                continue;
            }
            result += source.slice(cursor, start);
            let raw = token.raw;
            if (token.type === 'link' || token.type === 'image') {
                const image = token.type === 'image';
                const href = resolve(token.href, image);
                if (href === token.href) {
                    result += rewrite(raw, children(token));
                    cursor = start + token.raw.length;
                    continue;
                }
                // Find the label's closing bracket, respecting nested brackets and escapes.
                let depth = 0;
                let end = image ? 1 : 0;
                for (; end < raw.length; end++) {
                    if (raw[end] === '\\') {
                        end++;
                        continue;
                    }
                    if (raw[end] === '[') depth++;
                    if (raw[end] === ']' && --depth === 0) break;
                }
                const label = rewrite(raw.slice(0, end + 1), children(token));
                const title = token.title ? ' ' + JSON.stringify(token.title) : '';
                raw = label + '(<' + href + '>' + title + ')';
            } else if (token.type === 'html') {
                raw = raw.replace(
                    /(\s)(src|href)=(['"])(.*?)\3/gi,
                    (_, space, attr, quote, href) =>
                        space +
                        attr +
                        '=' +
                        quote +
                        resolve(href, attr.toLowerCase() === 'src') +
                        quote,
                );
            } else if (token.type !== 'code' && token.type !== 'codespan') {
                raw = rewrite(raw, children(token));
            }
            result += raw;
            cursor = start + token.raw.length;
        }
        return result + source.slice(cursor);
    }
    const body = rewrite(post.markdown, marked.lexer(post.markdown));
    // JSON-quoted strings are valid YAML and keep colons, quotes and newlines safe.
    const metadata = [
        '---',
        'title: ' + JSON.stringify(post.title),
        'published: ' + !post.draft,
        'canonical_url: ' + JSON.stringify(pageUrl),
        'description: ' + JSON.stringify(post.summary),
        'tags: ' + JSON.stringify((post.tags || []).slice(0, 4).join(', ')),
    ];
    if (post.image) metadata.push('cover_image: ' + JSON.stringify(resolve(post.image, true)));
    metadata.push('---');
    return metadata.join('\n') + '\n\n' + body.trim() + '\n';
}

module.exports = { exportMarkdown };
