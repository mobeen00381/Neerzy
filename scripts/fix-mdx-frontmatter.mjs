import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(__dirname, '..', 'content', 'guides');

const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.mdx'));

for (const file of files) {
  const filePath = path.join(contentDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Find the frontmatter block
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    console.log(`SKIP ${file}: no frontmatter`);
    continue;
  }
  
  const original = match[0];
  const body = content.slice(match[0].length);
  
  // Parse lines to extract key-values
  const lines = match[1].split('\n');
  const newLines = [];
  
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) {
      newLines.push(line);
      continue;
    }
    
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    
    // Handle JSON arrays/objects
    if (value.startsWith('[') || value.startsWith('{')) {
      newLines.push(`${key}: ${value}`);
      continue;
    }
    
    // Handle booleans
    if (value === 'true' || value === 'false') {
      newLines.push(`${key}: ${value}`);
      continue;
    }
    
    // Strip surrounding quotes
    let unquoted = value;
    if ((unquoted.startsWith('"') && unquoted.endsWith('"')) ||
        (unquoted.startsWith("'") && unquoted.endsWith("'"))) {
      unquoted = unquoted.slice(1, -1);
    }
    
    // Unescape any escaped quotes
    unquoted = unquoted.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    
    // YAML-safe: if string contains single quotes, use double-quoted with escapes
    if (unquoted.includes("'")) {
      const escaped = unquoted.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      newLines.push(`${key}: "${escaped}"`);
    } else {
      newLines.push(`${key}: '${unquoted}'`);
    }
  }
  
  const newFrontmatter = '---\n' + newLines.join('\n') + '\n---';
  const newContent = newFrontmatter + body;
  
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`FIXED: ${file}`);
}

console.log('Done!');