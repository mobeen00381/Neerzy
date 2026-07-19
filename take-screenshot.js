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

  // ── Screenshot 1: Audit Landing Page (desktop, showing Google Maps URL input) ──
  console.log('Navigating to /gmb-audit-tool...');
  const page1 = await browser.newPage();
  await page1.setViewport({ width: 1440, height: 900 });
  await page1.goto('http://localhost:3000/gmb-audit-tool', {
    waitUntil: 'networkidle0',
    timeout: 30000,
  });
  await new Promise(r => setTimeout(r, 2000));

  const outputPath1 = path.join(__dirname, 'public', 'images', 'audit-landing-input.png');
  await page1.screenshot({
    path: outputPath1,
    fullPage: false, // viewport only — captures the input field area
  });
  console.log('Saved:', outputPath1);

  // ── Screenshot 2: Audit Dashboard (mobile viewport, 375px) ──
  console.log('Navigating to /dashboard/audit-report...');
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 375, height: 812 }); // iPhone X dimensions
  await page2.goto('http://localhost:3000/dashboard/audit-report', {
    waitUntil: 'networkidle0',
    timeout: 30000,
  });
  await new Promise(r => setTimeout(r, 2000));

  const outputPath2 = path.join(__dirname, 'public', 'images', 'audit-dashboard-mobile.png');
  await page2.screenshot({
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
