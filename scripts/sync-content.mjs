// Sync updated pillar content: preserve existing MDX frontmatter, replace body with new markdown
import fs from 'fs';
import path from 'path';

const GUIDES_DIR = path.join(process.cwd(), 'content', 'guides');
const SOURCES = {
  'seo-for-plumbers.mdx': 'C:/Users/PC/Downloads/seo-for-plumbers-pillar-guide final.md',
  'seo-for-electricians.mdx': 'C:/Users/PC/Downloads/seo-for-electricians-pillar-guide final.md',
  'locksmith-seo.mdx': 'C:/Users/PC/Downloads/locksmith-seo-pillar-guide final.md',
};

function normalize(content) {
  return content.replace(/\r\n/g, '\n');
}

function splitFrontmatterBody(content) {
  const text = normalize(content);
  if (!text.startsWith('---\n')) return { frontmatter: null, body: text };
  const endIdx = text.indexOf('\n---\n', 4);
  if (endIdx === -1) return { frontmatter: null, body: text };
  return {
    frontmatter: text.slice(4, endIdx),
    body: text.slice(endIdx + 5).trim(),
  };
}

for (const [mdxFile, sourceFile] of Object.entries(SOURCES)) {
  const mdxPath = path.join(GUIDES_DIR, mdxFile);
  
  if (!fs.existsSync(mdxPath)) {
    console.log(`SKIP: ${mdxFile} not found`);
    continue;
  }
  if (!fs.existsSync(sourceFile)) {
    console.log(`SKIP: source file ${sourceFile} not found`);
    continue;
  }
  
  const currentMdx = normalize(fs.readFileSync(mdxPath, 'utf-8'));
  const sourceContent = normalize(fs.readFileSync(sourceFile, 'utf-8'));
  
  const current = splitFrontmatterBody(currentMdx);
  const incoming = splitFrontmatterBody(sourceContent);
  
  if (!current.frontmatter) {
    console.log(`ERROR: no frontmatter in ${mdxFile}`);
    continue;
  }
  if (!incoming.body) {
    console.log(`ERROR: no body in source for ${mdxFile}`);
    continue;
  }
  
  const output = `---\n${current.frontmatter}\n---\n\n${incoming.body}\n`;
  fs.writeFileSync(mdxPath, output, 'utf-8');
  console.log(`OK: ${mdxFile} — frontmatter preserved, body updated (${incoming.body.length} chars)`);
}

console.log('\nDone.');