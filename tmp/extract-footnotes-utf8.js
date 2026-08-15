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
      const lis = Array.from(document.querySelectorAll('section.footnotes li, [data-footnotes] li'));
      return lis.map((li) => ({
        text: li.innerText,
        html: li.innerHTML,
        links: Array.from(li.querySelectorAll('a')).map(a => a.getAttribute('href')),
      }));
    });
    out.push({ slug, title: await page.title(), footnotes: data });
    await page.close();
  }

  fs.writeFileSync('C:\\Neerzy\\tmp\\footnotes-rendered.json', JSON.stringify(out, null, 2), 'utf8');
  await browser.close();
  console.log('WROTE tmp/footnotes-rendered.json');
}

main().catch((e) => { console.error(e); process.exit(1); });
