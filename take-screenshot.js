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

  // Screenshot 1: Understanding Your Audit Score
  console.log('Navigating to understanding-your-gbp-audit-score...');
  await page.goto('http://localhost:3000/understanding-your-gbp-audit-score', {
    waitUntil: 'networkidle0',
    timeout: 30000,
  });
  await new Promise(r => setTimeout(r, 2000));

  const outputPath1 = path.join(__dirname, 'public', 'understanding-score-full.png');
  await page.screenshot({
    path: outputPath1,
    fullPage: true,
  });
  console.log('Saved:', outputPath1);

  // Screenshot 2: Visual Content Score Guide
  console.log('Navigating to visual-content-score-guide...');
  await page.goto('http://localhost:3000/visual-content-score-guide', {
    waitUntil: 'networkidle0',
    timeout: 30000,
  });
  await new Promise(r => setTimeout(r, 2000));

  const outputPath2 = path.join(__dirname, 'public', 'visual-content-score-full.png');
  await page.screenshot({
    path: outputPath2,
    fullPage: true,
  });
  console.log('Saved:', outputPath2);

  await browser.close();
  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
