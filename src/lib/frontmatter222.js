"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFrontmatter = parseFrontmatter;
exports.stripFrontmatterFromHtml = stripFrontmatterFromHtml;
function parseFrontmatter(content) {
    var frontmatter = {};
    var markdownContent = content;
    // Check if content starts with frontmatter
    if (content.startsWith('---')) {
        var endOfFrontmatter = content.indexOf('---', 3);
        if (endOfFrontmatter !== -1) {
            var frontmatterText = content.slice(3, endOfFrontmatter).trim();
            markdownContent = content.slice(endOfFrontmatter + 3).trim();
            // Parse frontmatter
            frontmatterText.split('\n').forEach(function (line) {
                var _a = line.split(':'), key = _a[0], valueParts = _a.slice(1);
                if (key && valueParts.length > 0) {
                    var value = valueParts.join(':').trim();
                    if (key === 'tags') {
                        frontmatter[key] = value.split(',').map(function (tag) { return tag.trim(); });
                    }
                    else {
                        frontmatter[key] = value;
                    }
                }
            });
        }
    }
    return { frontmatter: frontmatter, content: markdownContent };
}
// Utility to strip frontmatter block from GitHub-rendered HTML
function stripFrontmatterFromHtml(html) {
    // Remove <pre>...</pre> or <code>...</code> or <p>...</p> at the very top if it matches the frontmatter
    // This covers most cases for GitHub Discussions
    var clean = html.replace(/^<pre>[\s\S]*?---[\s\S]*?---[\s\S]*?<\/pre>\n?/i, '');
    clean = clean.replace(/^<code>[\s\S]*?---[\s\S]*?---[\s\S]*?<\/code>\n?/i, '');
    clean = clean.replace(/^<p>[\s\S]*?---[\s\S]*?---[\s\S]*?<\/p>\n?/i, '');
    return clean;
}
// Add CommonJS exports for Node.js scripts
module.exports = {
    parseFrontmatter: parseFrontmatter,
    stripFrontmatterFromHtml: stripFrontmatterFromHtml,
};
