module.exports = {
    printWidth: 100,
    useTabs: false,
    tabWidth: 4,
    singleQuote: true,
    semi: true,
    trailingComma: 'all',
    arrowParens: 'always',
    bracketSameLine: true,
    plugins: ['prettier-plugin-tailwindcss'],
    overrides: [
        {
            // Dev.to renders a single newline as a line break, so a post keeps each paragraph on one line.
            files: 'blog/2*.md',
            options: {
                proseWrap: 'never',
            },
        },
        {
            files: '*.html',
            options: {
                tabWidth: 2,
                printWidth: 150,
            },
        },
    ],
};
