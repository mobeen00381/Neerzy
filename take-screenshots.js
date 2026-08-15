const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function findBrowser() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Users\\PC\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chrome not found');
}

async function takeScreenshot(url, outputPath) {
  const browserPath = await findBrowser();
  console.log(`Using Chrome: ${browserPath}`);
  
  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    
    // Wait for content to fully render
    await new Promise(r => setTimeout(r, 2000));
    
    // Scroll to bottom to ensure full page loads
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    console.log(`Taking screenshot: ${outputPath}`);
    await page.screenshot({ 
      path: outputPath, 
      fullPage: true 
    });
    
    console.log(`Screenshot saved to ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`Error taking screenshot: ${error.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

async function main() {
  const baseUrl = 'http://localhost:3000';
  const screenshotsDir = 'c:\\Neerzy\\screenshots';
  
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  const results = [];
  
  results.push(await takeScreenshot(
    `${baseUrl}/seo-for-plumbers`,
    path.join(screenshotsDir, 'seo-for-plumbers.png')
  ));
  
  results.push(await takeScreenshot(
    `${baseUrl}/seo-for-electricians`,
    path.join(screenshotsDir, 'seo-for-electricians.png')
  ));
  
  console.log('All screenshots completed!', results);
}

main().catch(console.error);