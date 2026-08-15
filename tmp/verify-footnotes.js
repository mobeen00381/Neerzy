const puppeteer = require('puppeteer-core');
const fs = require('fs');

const slugs = ['seo-for-plumbers', 'seo-for-electricians', 'locksmith-seo'];

function findBrowser() {
  const paths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];
  for (const p of paths) if (fs.existsSync(p)) return p;
  return null;
}

async function main() {
  const exe = findBrowser();
  if (!exe) { console.error('no browser'); process.exit(1); }
  const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--no-sandbox'] });

  const out = [];
  for (const slug of slugs) {
    const page = await browser.newPage();
    await page.goto(`http://localhost:3000/${slug}`, { waitUntil: 'networkidle0', timeout: 60000 });
    const data = await page.evaluate(() => {
      const fnSections = document.querySelectorAll('section.footnotes, [data-footnotes]');
      const lis = Array.from(fnSections).flatMap(s => Array.from(s.querySelectorAll('li')));
      // Old custom "Sources" section detection
      const sourceAnchors = document.querySelectorAll('#source-1');
      const sourceHeadings = Array.from(document.querySelectorAll('h2, h3')).filter(h => h.textContent.trim().toLowerCase() === 'sources');
      return {
        footnoteSectionCount: fnSections.length,
        footnotes: lis.map((li) => ({
          text: li.innerText,
          links: Array.from(li.querySelectorAll('a')).map(a => a.getAttribute('href')),
        })),
        oldSourceAnchors: sourceAnchors.length,
        oldSourceHeadings: sourceHeadings.map(h => h.textContent.trim()),
      };
    });
    out.push({ slug, title: await page.title(), ...data });
    await page.close();
  }

  fs.writeFileSync('C:\\Neerzy\\tmp\\verify-footnotes.json', JSON.stringify(out, null, 2), 'utf8');
  await browser.close();
  console.log('WROTE tmp/verify-footnotes.json');
}

main().catch((e) => { console.error(e); process.exit(1); });
