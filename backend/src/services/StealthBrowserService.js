/**
 * NEXUS LEVIATHAN - Stealth Browser Service
 * Human-like browser automation with fingerprint rotation
 *
 * Features:
 * - Puppeteer with stealth plugin
 * - Browser fingerprint rotation
 * - Human-like interaction patterns
 * - Proxy integration
 * - Session management
 */

let puppeteer;
let StealthPlugin;

// Dynamic import for optional puppeteer
const initPuppeteer = async () => {
  if (!puppeteer) {
    try {
      puppeteer = require('puppeteer-extra');
      StealthPlugin = require('puppeteer-extra-plugin-stealth');
      puppeteer.use(StealthPlugin());
    } catch (error) {
      console.warn('[StealthBrowser] Puppeteer not installed. Install with: npm install puppeteer-extra puppeteer-extra-plugin-stealth');
      return false;
    }
  }
  return true;
};

class StealthBrowserService {
  constructor(pool, proxyService = null, config = {}) {
    this.pool = pool;
    this.proxyService = proxyService;
    this.browsers = new Map();
    this.config = {
      headless: config.headless !== false ? 'new' : false,
      defaultTimeout: config.timeout || 30000,
      maxBrowsers: config.maxBrowsers || 5
    };
  }

  /**
   * Get or create a browser fingerprint
   */
  async getFingerprint() {
    // Try to get an unused fingerprint
    let result = await this.pool.query(`
      SELECT * FROM browser_fingerprints
      WHERE uses < max_uses
      ORDER BY uses ASC, RANDOM()
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      // Generate new fingerprint
      return await this.generateFingerprint();
    }

    const fp = result.rows[0];

    // Increment usage
    await this.pool.query(
      'UPDATE browser_fingerprints SET uses = uses + 1, last_used = NOW() WHERE id = $1',
      [fp.id]
    );

    return fp;
  }

  /**
   * Generate a new browser fingerprint
   */
  async generateFingerprint() {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0'
    ];

    const resolutions = ['1920x1080', '2560x1440', '1366x768', '1536x864', '1440x900', '1680x1050'];
    const timezones = [
      'America/New_York', 'America/Los_Angeles', 'America/Chicago',
      'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney'
    ];
    const languages = [
      ['en-US', 'en'],
      ['en-GB', 'en'],
      ['en-US', 'en', 'es'],
      ['en-US']
    ];

    const crypto = require('crypto');

    const fingerprint = {
      user_agent: userAgents[Math.floor(Math.random() * userAgents.length)],
      screen_resolution: resolutions[Math.floor(Math.random() * resolutions.length)],
      timezone: timezones[Math.floor(Math.random() * timezones.length)],
      languages: languages[Math.floor(Math.random() * languages.length)],
      webgl_hash: crypto.randomBytes(32).toString('hex'),
      canvas_hash: crypto.randomBytes(32).toString('hex')
    };

    const fingerprintData = {
      ...fingerprint,
      platform: fingerprint.user_agent.includes('Windows') ? 'Win32' :
                fingerprint.user_agent.includes('Mac') ? 'MacIntel' : 'Linux x86_64',
      colorDepth: 24,
      deviceMemory: [4, 8, 16][Math.floor(Math.random() * 3)],
      hardwareConcurrency: [4, 8, 12, 16][Math.floor(Math.random() * 4)]
    };

    const result = await this.pool.query(`
      INSERT INTO browser_fingerprints
      (fingerprint_data, user_agent, screen_resolution, timezone, languages, webgl_hash, canvas_hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      fingerprintData,
      fingerprint.user_agent,
      fingerprint.screen_resolution,
      fingerprint.timezone,
      fingerprint.languages,
      fingerprint.webgl_hash,
      fingerprint.canvas_hash
    ]);

    return result.rows[0];
  }

  /**
   * Launch a stealth browser
   */
  async launchBrowser(options = {}) {
    const puppeteerAvailable = await initPuppeteer();
    if (!puppeteerAvailable) {
      return { success: false, error: 'Puppeteer not available' };
    }

    // Check browser limit
    if (this.browsers.size >= this.config.maxBrowsers) {
      // Close oldest browser
      const oldestId = this.browsers.keys().next().value;
      await this.closeBrowser(oldestId);
    }

    // Get fingerprint
    const fingerprint = options.fingerprintId
      ? (await this.pool.query('SELECT * FROM browser_fingerprints WHERE id = $1', [options.fingerprintId])).rows[0]
      : await this.getFingerprint();

    // Get proxy if requested
    let proxy = null;
    if (options.useProxy && this.proxyService) {
      proxy = await this.proxyService.getProxy(options.platform, options.geoTarget);
    }

    // Build browser args
    const [width, height] = fingerprint.screen_resolution.split('x').map(Number);
    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      `--window-size=${width},${height}`,
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ];

    if (proxy) {
      args.push(`--proxy-server=http://${proxy.ip_address}:${proxy.port || 80}`);
    }

    try {
      const browser = await puppeteer.launch({
        headless: this.config.headless,
        args,
        defaultViewport: null
      });

      const page = await browser.newPage();

      // Apply fingerprint
      await this.applyFingerprint(page, fingerprint);

      // Set timeout
      page.setDefaultTimeout(this.config.defaultTimeout);

      // Generate browser ID
      const browserId = require('crypto').randomUUID();

      // Store browser instance
      this.browsers.set(browserId, {
        browser,
        page,
        fingerprint,
        proxy,
        createdAt: new Date()
      });

      return {
        success: true,
        browserId,
        page
      };
    } catch (error) {
      console.error('[StealthBrowser] Launch failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Apply fingerprint to page
   */
  async applyFingerprint(page, fingerprint) {
    // Set user agent
    await page.setUserAgent(fingerprint.user_agent);

    // Set viewport
    const [width, height] = fingerprint.screen_resolution.split('x').map(Number);
    await page.setViewport({ width, height });

    // Emulate timezone
    await page.emulateTimezone(fingerprint.timezone);

    // Inject fingerprint spoofing
    const fpData = fingerprint.fingerprint_data || {};

    await page.evaluateOnNewDocument((fp) => {
      // Override navigator properties
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'languages', { get: () => fp.languages || ['en-US'] });
      Object.defineProperty(navigator, 'platform', { get: () => fp.platform || 'Win32' });
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => fp.hardwareConcurrency || 8 });
      Object.defineProperty(navigator, 'deviceMemory', { get: () => fp.deviceMemory || 8 });

      // Override screen
      Object.defineProperty(screen, 'colorDepth', { get: () => fp.colorDepth || 24 });

      // Override WebGL
      const getParameterOrig = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) return 'Intel Inc.';
        if (parameter === 37446) return 'Intel Iris OpenGL Engine';
        return getParameterOrig.apply(this, arguments);
      };

      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) =>
        parameters.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery(parameters);

      // Override chrome property
      window.chrome = { runtime: {} };

      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });

    }, fpData);
  }

  /**
   * Human-like typing
   */
  async humanType(browserId, selector, text, options = {}) {
    const browserData = this.browsers.get(browserId);
    if (!browserData) return { success: false, error: 'Browser not found' };

    const { page } = browserData;

    try {
      await page.waitForSelector(selector, { timeout: 10000 });
      await page.click(selector);

      // Random delay before typing
      await this.humanPause(200, 500);

      // Type character by character with variable speed
      for (let i = 0; i < text.length; i++) {
        const char = text[i];

        // Type the character
        await page.type(selector, char, {
          delay: 50 + Math.random() * 100
        });

        // Occasional longer pause (simulating thinking)
        if (Math.random() > 0.95) {
          await this.humanPause(300, 800);
        }

        // Very rare typo and correction
        if (Math.random() > 0.99 && i < text.length - 2) {
          await page.type(selector, 'x', { delay: 50 });
          await this.humanPause(100, 200);
          await page.keyboard.press('Backspace');
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Human-like click
   */
  async humanClick(browserId, selector) {
    const browserData = this.browsers.get(browserId);
    if (!browserData) return { success: false, error: 'Browser not found' };

    const { page } = browserData;

    try {
      await page.waitForSelector(selector, { timeout: 10000 });
      const element = await page.$(selector);
      const box = await element.boundingBox();

      if (!box) {
        return { success: false, error: 'Element not visible' };
      }

      // Move mouse to random point within element
      const targetX = box.x + Math.random() * box.width;
      const targetY = box.y + Math.random() * box.height;

      // Move with human-like curve
      await page.mouse.move(targetX, targetY, {
        steps: 10 + Math.floor(Math.random() * 10)
      });

      // Small pause before click
      await this.humanPause(50, 150);

      // Click
      await page.mouse.click(targetX, targetY);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Human-like scroll
   */
  async humanScroll(browserId, distance = 500, direction = 'down') {
    const browserData = this.browsers.get(browserId);
    if (!browserData) return { success: false, error: 'Browser not found' };

    const { page } = browserData;

    try {
      const scrollAmount = direction === 'up' ? -distance : distance;
      const steps = Math.ceil(Math.abs(scrollAmount) / 100);

      for (let i = 0; i < steps; i++) {
        const stepAmount = 100 + Math.random() * 50;
        await page.evaluate((d) => window.scrollBy(0, d), direction === 'up' ? -stepAmount : stepAmount);
        await this.humanPause(100, 300);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Human pause
   */
  async humanPause(min = 500, max = 2000) {
    const duration = min + Math.random() * (max - min);
    await new Promise(resolve => setTimeout(resolve, duration));
  }

  /**
   * Navigate to URL
   */
  async navigate(browserId, url) {
    const browserData = this.browsers.get(browserId);
    if (!browserData) return { success: false, error: 'Browser not found' };

    try {
      await browserData.page.goto(url, { waitUntil: 'networkidle2' });
      return { success: true, url };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Take screenshot
   */
  async screenshot(browserId, options = {}) {
    const browserData = this.browsers.get(browserId);
    if (!browserData) return { success: false, error: 'Browser not found' };

    try {
      const screenshot = await browserData.page.screenshot({
        encoding: 'base64',
        fullPage: options.fullPage || false
      });
      return { success: true, screenshot };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get page content
   */
  async getContent(browserId) {
    const browserData = this.browsers.get(browserId);
    if (!browserData) return { success: false, error: 'Browser not found' };

    try {
      const content = await browserData.page.content();
      return { success: true, content };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Evaluate JavaScript
   */
  async evaluate(browserId, script) {
    const browserData = this.browsers.get(browserId);
    if (!browserData) return { success: false, error: 'Browser not found' };

    try {
      const result = await browserData.page.evaluate(script);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Wait for selector
   */
  async waitFor(browserId, selector, timeout = 10000) {
    const browserData = this.browsers.get(browserId);
    if (!browserData) return { success: false, error: 'Browser not found' };

    try {
      await browserData.page.waitForSelector(selector, { timeout });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Close browser
   */
  async closeBrowser(browserId) {
    const browserData = this.browsers.get(browserId);
    if (!browserData) return { success: false };

    try {
      await browserData.browser.close();
    } catch (error) {
      console.error('[StealthBrowser] Close error:', error.message);
    }

    this.browsers.delete(browserId);
    return { success: true };
  }

  /**
   * Get active browsers
   */
  getActiveBrowsers() {
    return Array.from(this.browsers.entries()).map(([id, data]) => ({
      id,
      createdAt: data.createdAt,
      hasProxy: !!data.proxy,
      fingerprint: data.fingerprint?.id
    }));
  }

  /**
   * Close all browsers
   */
  async closeAll() {
    for (const [browserId] of this.browsers) {
      await this.closeBrowser(browserId);
    }
    return { success: true, closed: this.browsers.size };
  }
}

module.exports = StealthBrowserService;
