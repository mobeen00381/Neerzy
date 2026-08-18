const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to /seo-for-plumbers...');
  await page.goto('http://localhost:3000/seo-for-plumbers', { 
    waitUntil: 'networkidle', 
    timeout: 60000 
  });
  console.log('Loaded.');
  
  // Wait for React hydration
  await new Promise(r => setTimeout(r, 5000));

  // Check content loaded
  const title = await page.title();
  console.log('Title:', title);
  
  // Scroll down to find Section 2 (it's deep in a 35-minute guide)
  console.log('Scrolling to find Section 2...');
  let found = false;
  const steps = 40;
  for (let step = 1; step <= steps; step++) {
    const pct = Math.round((step / steps) * 100);
    await page.evaluate((pctNum) => window.scrollTo(0, document.body.scrollHeight * pctNum / 100), pct);
    await new Promise(r => setTimeout(r, 500));
    
    if (step % 5 === 0 || step === steps) {
      const hasText = await page.evaluate(() => {
        return document.innerText && document.innerText.includes('What Is SEO for Plumbers');
      }).catch(() => false);
      if (hasText) {
        console.log(`Found heading at ${pct}% scroll`);
        found = true;
        break;
      }
    }
  }
  
  // Find the h2 element for Section 2
  const section2El = await page.$('#section-2').catch(() => null) || 
                     await page.evaluateHandle(() => {
                       const els = document.querySelectorAll('h2');
                       for (const el of els) {
                         if (el.textContent && el.textContent.includes('What Is SEO for Plumbers')) return el;
                       }
                       return null;
                     });
  
  if (section2El) {
    try {
      const handle = typeof section2El === 'object' && section2El.asElement ? section2El : await section2El;
      if (handle && handle.asElement) {
        const box = await handle.asElement().boundingBox();
        if (box) {
          console.log(`Section 2 bounding box: x=${Math.round(box.x)}, y=${Math.round(box.y)}, w=${Math.round(box.width)}, h=${Math.round(box.height)}`);
          const clipW = Math.min(1280, box.width + 80);
          const clipH = 700;
          
          await page.screenshot({ 
            path: 'c:\\Neerzy\\screenshot-section2.png', 
            fullPage: false, 
            clip: { 
              x: Math.max(0, box.x - 20), 
              y: Math.max(0, box.y - 30), 
              width: clipW, 
              height: clipH 
            } 
          });
          console.log('Screenshot saved to c:\\Neerzy\\screenshot-section2.png (Section 2 region)');
        } else {
          throw new Error('No bounding box');
        }
      }
    } catch(e) {
      console.log('Could not get bounding box, falling back to full scroll position');
    }
  }
  
  // Take screenshot at current scroll position (where Section 2 should be)
  await page.screenshot({ path: 'c:\\Neerzy\\screenshot-section2.png', fullPage: false });
  console.log('Saved screenshot to c:\\Neerzy\\screenshot-section2.png');
  
  await browser.close();
  console.log('Done.');
})().catch(err => {
  console.error('Fatal Error:', err.message);
  process.exit(1);
});





