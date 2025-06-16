interface Frontmatter {
  slug?: string;
  tags?: string[];
  [key: string]: any;
}

export function parseFrontmatter(content: string): { frontmatter: Frontmatter; content: string } {
  const frontmatter: Frontmatter = {};
  let markdownContent = content;

  // Check if content starts with frontmatter
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
  }

  return { frontmatter, content: markdownContent };
} 