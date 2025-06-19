interface Frontmatter {
  slug?: string;
  tags?: string[];
  [key: string]: any;
}

export function parseFrontmatter(content: string): { frontmatter: Frontmatter; content: string } {
  const frontmatter: Frontmatter = {};
  let markdownContent = content;

  // Check if content starts with frontmatter in --- block
  if (content.startsWith('---')) {
    const endOfFrontmatter = content.indexOf('---', 3);
    if (endOfFrontmatter !== -1) {
      const frontmatterText = content.slice(3, endOfFrontmatter).trim();
      markdownContent = content.slice(endOfFrontmatter + 3).trim();
      // Parse frontmatter
      frontmatterText.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          const value = valueParts.join(':').trim();
          if (key === 'tags') {
            frontmatter[key] = value.split(',').map(tag => tag.trim());
          } else {
            frontmatter[key] = value;
          }
        }
      });
    }
  } else {
    // Check if content starts with a <h2> block containing frontmatter lines
    const h2FrontmatterMatch = content.match(/<h2 dir="auto">([\s\S]*?)<\/h2>/g);
    if (h2FrontmatterMatch) {
      // Extract the content inside the first <h2>...</h2>
      const h2Content = h2FrontmatterMatch[0].replace(/<h2 dir="auto">|<\/h2>/g, '');
      // Each line is like 'key: value<br>'
      h2Content.split('<br>').forEach(line => {
        const cleanLine = line.replace(/<[^>]+>/g, '').trim();
        console.log("Line", cleanLine)
        if (!cleanLine) return;
        const [key, ...valueParts] = cleanLine.split(':');
        if (key && valueParts.length > 0) {
          const value = valueParts.join(':').trim();
          if (key === 'tags') {
            frontmatter[key] = value.split(',').map(tag => tag.trim());
          } else {
            frontmatter[key] = value;
          }
        }
      });
      markdownContent = content.slice(h2FrontmatterMatch[0].length).trim();
    }
  }

  return { frontmatter, content: markdownContent };
}

// // Utility to strip frontmatter block from GitHub-rendered HTML
export function stripFrontmatterFromHtml(html: string): string {
  // Remove <pre>...</pre>, <code>...</code>, <p>...</p>, or <h2>...</h2> at the very top if it matches frontmatter
  let clean = html.replace(/^<pre>[\s\S]*?---[\s\S]*?---[\s\S]*?<\/pre>\n?/i, '');
  clean = clean.replace(/^<code>[\s\S]*?---[\s\S]*?---[\s\S]*?<\/code>\n?/i, '');
  clean = clean.replace(/^<p>[\s\S]*?---[\s\S]*?---[\s\S]*?<\/p>\n?/i, '');
  // Remove <h2>...</h2> if it looks like frontmatter (lines with key: value)
  clean = clean.replace(
    /<h2 dir="auto">([\s\S]*?)<\/h2>/g,
    ''
  );
  return clean;
}

// Add CommonJS exports for Node.js scripts
// module.exports = {
//   parseFrontmatter,
//   stripFrontmatterFromHtml,
// }; 