const puppeteer = require('puppeteer-core');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function main() {
  // Find Edge/Chrome executable
  const possiblePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];

  let executablePath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      executablePath = p;
      break;
    }
  }

  if (!executablePath) {
    // Try to find via where command
    try {
      const result = execSync('where msedge', { encoding: 'utf8', shell: 'cmd.exe' });
      executablePath = result.trim().split('\n')[0].trim();
    } catch (e) {
      try {
        const result = execSync('where chrome', { encoding: 'utf8', shell: 'cmd.exe' });
        executablePath = result.trim().split('\n')[0].trim();
      } catch (e2) {
        console.error('Could not find Edge or Chrome');
        process.exit(1);
      }
    }
  }

  console.log('Using browser:', executablePath);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to about page...');
  await page.goto('http://localhost:3000/about', {
    waitUntil: 'networkidle0',
    timeout: 30000,
  });

  // Wait a bit for any animations
  await new Promise(r => setTimeout(r, 1000));

  // Take full page screenshot
  const outputPath = path.join(__dirname, 'public', 'about-page-full.png');
  await page.screenshot({
    path: outputPath,
    fullPage: true,
  });
  console.log('Full page screenshot saved to:', outputPath);

  // Take viewport screenshot
  const outputPath2 = path.join(__dirname, 'public', 'about-page-viewport.png');
  await page.screenshot({
    path: outputPath2,
    fullPage: false,
  });
  console.log('Viewport screenshot saved to:', outputPath2);

  await browser.close();
  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
