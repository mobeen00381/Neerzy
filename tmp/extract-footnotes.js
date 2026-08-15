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

  for (const slug of slugs) {
    const url = `http://localhost:3000/${slug}`;
    const page = await browser.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
      const data = await page.evaluate(() => {
        // Footnote reference in body (the [1] superscript link)
        const ref = document.querySelector('sup a[href*="fn"]');
        // Footnote definition section produced by remark footnotes
        const fnSection = document.querySelector('section.footnotes, [data-footnotes]');
        let defs = [];
        if (fnSection) {
          const lis = fnSection.querySelectorAll('li');
          lis.forEach((li) => {
            const links = Array.from(li.querySelectorAll('a')).map(a => ({ text: a.textContent, href: a.getAttribute('href') }));
            defs.push({ text: li.innerText, html: li.innerHTML, links });
          });
        }
        // Custom "Sources" section (frontmatter.sources) rendered in page.tsx
        const sourcesSection = document.querySelector('#source-1') ? document.querySelector('#source-1').closest('section') : null;
        let sourcesHtml = null;
        if (sourcesSection) sourcesHtml = sourcesSection.outerHTML;
        return {
          title: document.title,
          refHref: ref ? ref.getAttribute('href') : null,
          refText: ref ? ref.textContent : null,
          fnSectionHtml: fnSection ? fnSection.outerHTML : null,
          defs,
          sourcesHtml,
        };
      });
      console.log('============================================================');
      console.log('URL:', url);
      console.log('TITLE:', data.title);
      console.log('REF (sup link):', JSON.stringify({ href: data.refHref, text: data.refText }));
      console.log('--- FOOTNOTE SECTION outerHTML ---');
      console.log(data.fnSectionHtml);
      console.log('--- FOOTNOTE DEFINITIONS (text) ---');
      data.defs.forEach((d, i) => {
        console.log(`[def ${i}] TEXT: ${JSON.stringify(d.text)}`);
        console.log(`[def ${i}] LINKS: ${JSON.stringify(d.links)}`);
      });
      console.log('--- CUSTOM SOURCES SECTION outerHTML ---');
      console.log(data.sourcesHtml);
    } catch (e) {
      console.log('ERROR on', url, '->', e && e.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
