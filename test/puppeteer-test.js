const puppeteer = require('puppeteer');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

async function waitForServer(url, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          res.resume();
          res.on('end', resolve);
        });
        req.on('error', reject);
      });
      return;
    } catch (e) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  throw new Error('server did not become ready: ' + url);
}

(async () => {
  const testDir = path.resolve(__dirname);
  const extensionPath = path.resolve(__dirname, '..');

  console.log('Starting Go server from', testDir);
  const go = spawn('go', ['run', 'frontend.go'], { cwd: testDir, stdio: 'inherit' });

  // ensure Go server is up by polling internal endpoint
  try {
    await waitForServer('http://localhost:8080/internal/stats', 10000);
  } catch (err) {
    console.error('Go server failed to start:', err);
    go.kill();
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  const page = await browser.newPage();

  // helper to call internal stats endpoints
  async function getStats() {
    return new Promise((resolve, reject) => {
      http.get('http://localhost:8080/internal/stats', (res) => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => resolve(JSON.parse(body)));
      }).on('error', reject);
    });
  }
  async function resetStats() {
    return new Promise((resolve, reject) => {
      http.get('http://localhost:8080/internal/reset', (res) => {
        res.on('data', () => {});
        res.on('end', resolve);
      }).on('error', reject);
    });
  }

  try {
    // テスト1: 8081 を経由した場合、拡張が 8082 を叩く
    await resetStats();
    await page.goto('http://localhost:8080');
    await page.click('#requestButton');
    await page.waitForTimeout(800);
    let s = await getStats();
    console.log('after clicking 8081, stats=', s);
    if (s.end_hits !== 1) throw new Error('TEST1 FAILED: expected end_hits 1');

    // テスト2: 直接 8082 を呼んでも拡張は追加呼び出しを行わない
    await resetStats();
    await page.click('#request8082');
    await page.waitForTimeout(800);
    s = await getStats();
    console.log('after clicking 8082, stats=', s);
    if (s.end_hits !== 1) throw new Error('TEST2 FAILED: expected end_hits 1 (direct call)');

    console.log('ALL TESTS PASSED');
    await browser.close();
    go.kill();
    process.exit(0);
  } catch (err) {
    console.error(err);
    try { await browser.close(); } catch (e) {}
    go.kill();
    process.exit(1);
  }
})();
