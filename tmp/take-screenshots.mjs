import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3001/seo-for-plumbers', { waitUntil: 'networkidle' });

  // Screenshot A: Hero/title area (top 600px)
  await page.screenshot({ path: 'tmp/screenshot-a-hero.png', clip: { x: 0, y: 0, width: 1920, height: 600 } });
  console.log('A: Hero screenshot taken');

  // Screenshot B: Find first H2 and screenshot around it
  const h2 = await page.locator('h2').first();
  const h2Box = await h2.boundingBox();
  if (h2Box) {
    const clipY = Math.max(0, h2Box.y - 100);
    const clipH = 400;
    await page.screenshot({ path: 'tmp/screenshot-b-h2.png', clip: { x: 0, y: clipY, width: 1920, height: clipH } });
    console.log(`B: H2 screenshot taken at y=${clipY}`);
  } else {
    console.log('B: No H2 found!');
  }

  // Screenshot C: Find first H3 and screenshot around it (for H1→H2→H3 chain)
  const h3 = await page.locator('h3').first();
  const h3Box = await h3.boundingBox();
  if (h3Box) {
    const clipY = Math.max(0, h3Box.y - 100);
    const clipH = 400;
    await page.screenshot({ path: 'tmp/screenshot-c-h3.png', clip: { x: 0, y: clipY, width: 1920, height: clipH } });
    console.log(`C: H3 screenshot taken at y=${clipY}`);
  }

  // Check: count H1s on the page
  const h1Count = await page.locator('h1').count();
  console.log(`H1 count on page: ${h1Count}`);

  // Check: get the computed styles of the first H2
  if (h2Box) {
    const h2Styles = await h2.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        color: cs.color,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        borderBottomColor: cs.borderBottomColor,
        borderBottomWidth: cs.borderBottomWidth,
        borderBottomStyle: cs.borderBottomStyle,
      };
    });
    console.log('H2 computed styles:', JSON.stringify(h2Styles, null, 2));
  }

  await browser.close();
  console.log('Done');
})();
