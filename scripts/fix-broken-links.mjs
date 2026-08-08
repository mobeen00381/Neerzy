import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const guidesDir = path.resolve(__dirname, '..', 'content', 'guides');

const files = fs.readdirSync(guidesDir).filter(f => f.endsWith('.mdx'));

for (const file of files) {
  const filePath = path.join(guidesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Fix 1: Original broken template literal {`$"/seo-for-plumbers"#section-N`} → "/seo-for-plumbers#section-N"
  content = content.replace(
    /\{\x60\$\"\/seo-for-plumbers\"#section-(\d+)\x60\}/g,
    '"/seo-for-plumbers#section-$1"'
  );

  // Fix 2: Unquoted href from previous bad fix → quoted href
  content = content.replace(
    /href=\/seo-for-plumbers#section-(\d+)\s/g,
    'href="/seo-for-plumbers#section-$1" '
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${file}`);
  } else {
    console.log(`No changes: ${file}`);
  }
}

console.log('Done.');