import { stripFrontmatterFromHtml } from './frontmatter';

/**
 * Processes GitHub-rendered bodyHTML for safe display in the blog.
 * - Strips YAML frontmatter blocks rendered as <pre>, <code>, or <p> at the top.
 * - (Extend here for further processing if needed)
 */
// @ts-expect-error: katex has no types
import katex from 'katex';

/**
 * Render math expressions in HTML using KaTeX.
 * - Block math: $$...$$
 * - Inline math: $...$
 */
function renderMath(html: string): string {
  // Block math: $$...$$
  html = html.replace(/\$\$([\s\S]+?)\$\$/g, (match, expr) => {
    try {
      return katex.renderToString(expr, { displayMode: true });
    } catch {
      return match;
    }
  });
  // Inline math: $...$
  html = html.replace(/\$(.+?)\$/g, (match, expr) => {
    // Avoid replacing inside code blocks
    if (expr.includes('<code>') || expr.includes('</code>')) return match;
    try {
      return katex.renderToString(expr, { displayMode: false });
    } catch {
      return match;
    }
  });
  return html;
}

// Helper to decode HTML entities in code blocks
function decodeHTMLEntities(text: string): string {
  return text.replace(/&#(\d+);/g, (m, dec) => String.fromCharCode(dec))
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&amp;/g, '&')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'");
}


export function processGithubBodyHTML(html: string): string {
  const stripped = stripFrontmatterFromHtml(html);
  // console.log("stripped", stripped)
  const mathRendered = renderMath(stripped);
  return (mathRendered);
}