/**
 * Longevity Digest Marketing Launch — CDP Browser Automation
 * Connects to existing Chrome at http://127.0.0.1:18800
 */

import puppeteer from '/Users/borisdjordjevic/.local/node/lib/node_modules/@cli4ai/notebooklm/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';

const BROWSER_URL = 'http://127.0.0.1:18800';
const EMAIL = 'longevity199@gmail.com';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function connectBrowser() {
  // Get list of targets
  const res = await fetch(`${BROWSER_URL}/json/list`);
  const targets = await res.json();
  console.log('Available targets:', targets.map(t => ({ id: t.id, url: t.url, type: t.type })));
  
  const browser = await puppeteer.connect({
    browserURL: BROWSER_URL,
    defaultViewport: null,
  });
  return browser;
}

async function getOrCreatePage(browser, url) {
  const pages = await browser.pages();
  // Find existing page or create new one
  let page = pages.find(p => p.url() !== 'about:blank') || pages[0];
  if (!page) {
    page = await browser.newPage();
  }
  return page;
}

async function screenshot(page, name) {
  try {
    await page.screenshot({ path: `/tmp/launch-${name}.png`, fullPage: false });
    console.log(`Screenshot saved: /tmp/launch-${name}.png`);
  } catch(e) {
    console.log(`Screenshot failed: ${e.message}`);
  }
}

async function main() {
  const results = {
    productHunt: 'not attempted',
    reddit: {},
    hackerNews: 'not attempted',
    twitter: 'not attempted',
    longecity: 'not attempted',
    outreach: 'created at ~/Projects/research-feed/OUTREACH.md',
  };

  let browser;
  try {
    browser = await connectBrowser();
    console.log('Connected to browser');
    
    const pages = await browser.pages();
    const page = pages[0] || await browser.newPage();
    
    // ============================================================
    // TASK 1: Product Hunt
    // ============================================================
    console.log('\n=== TASK 1: Product Hunt ===');
    try {
      await page.goto('https://www.producthunt.com', { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(2000);
      await screenshot(page, 'ph-home');
      
      // Check if logged in
      const pageContent = await page.content();
      const isLoggedIn = pageContent.includes('Sign out') || pageContent.includes('logout') || pageContent.includes('profile');
      console.log('PH logged in:', isLoggedIn);
      
      if (!isLoggedIn) {
        // Try to login
        const loginBtn = await page.$('[data-test="sign-in-button"], a[href*="login"], button:has-text("Sign in")');
        if (loginBtn) {
          await loginBtn.click();
          await sleep(2000);
          await screenshot(page, 'ph-login');
          
          // Look for Google OAuth
          const googleBtn = await page.$('button:has-text("Google"), a:has-text("Google"), [data-provider="google"]');
          if (googleBtn) {
            await googleBtn.click();
            await sleep(3000);
            await screenshot(page, 'ph-google-oauth');
          }
        }
      }
      
      // Try to submit product
      await page.goto('https://www.producthunt.com/posts/new', { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(2000);
      await screenshot(page, 'ph-new-post');
      
      const pageUrl = page.url();
      console.log('PH current URL:', pageUrl);
      results.productHunt = `Page reached: ${pageUrl} - manual login/submission required`;
      
    } catch(e) {
      console.error('PH error:', e.message);
      results.productHunt = `Error: ${e.message}`;
    }
    
    // ============================================================
    // TASK 2: Reddit
    // ============================================================
    console.log('\n=== TASK 2: Reddit ===');
    
    const redditPosts = [
      {
        subreddit: 'longevity',
        title: 'We built a free daily longevity research digest using two AI agents — launching today',
        body: `Hey r/longevity — I'm Boris, founder of 199 Biotechnologies. We've been building a daily longevity research digest at longevitydigest.co. What makes it different: it's actually built and curated by two AI agents (Boba and Gamba) running on OpenClaw, who read PubMed, Fight Aging!, bioRxiv and longevity.technology every day and distill the most significant findings into plain English. Mon-Fri, free to subscribe. Today's digest covers: senolytic-resistant cells, partial reprogramming conservation across species, and sex-specific differences in senescent cell clearance. Would love feedback from people who actually know this space.`,
      },
      {
        subreddit: 'Biohacking',
        title: 'Free daily longevity research digest — curated by two AI agents, protocol-relevant findings Mon-Fri',
        body: `Hey r/Biohacking — I'm Boris, founder of 199 Biotechnologies. We built Longevity Digest (longevitydigest.co) specifically because biohackers need reliable signal from the primary literature without spending hours on PubMed. Two AI agents (Boba and Gamba) read PubMed, Fight Aging!, bioRxiv and longevity.technology every morning and distill what's actionable or at least worth tracking. Today: senolytic resistance mechanisms, partial reprogramming cross-species data, sex-specific differences in senescent cell clearance — the stuff that actually affects protocol decisions. Free, Mon-Fri. Would love feedback from people running real n=1 experiments.`,
      },
      {
        subreddit: 'singularity',
        title: 'Two AI agents built a daily longevity research digest — they coordinate every morning without human prompting',
        body: `Something I think this community will find interesting: we built two OpenClaw AI agents (Boba and Gamba) who genuinely care about longevity science and produce a daily research digest every weekday at longevitydigest.co. The interesting part isn't the newsletter — it's that the agents coordinate daily without being prompted. They read PubMed, Fight Aging!, bioRxiv, longevity.technology, synthesise the most significant findings, and publish by morning. No human in the loop for the daily production. This is a working multi-agent system in a specific scientific domain. Happy to discuss the architecture. 199 Biotechnologies.`,
      },
      {
        subreddit: 'artificial',
        title: 'We built two AI agents who read longevity research every morning and publish a daily digest — here\'s what we learned',
        body: `At 199 Biotechnologies, we built two OpenClaw agents — Boba and Gamba — with a specific domain: longevity science. Every weekday morning, they autonomously: 1) read PubMed, bioRxiv, Fight Aging!, longevity.technology 2) cross-reference and identify the 6-8 most significant findings 3) synthesise into plain English with editorial framing 4) coordinate to produce a coherent digest 5) publish without human prompting. The output is Longevity Digest (longevitydigest.co). The interesting ML/agent questions: how do you give agents genuine domain interest rather than generic summarisation? How do they handle conflicting or preliminary findings? Happy to dig into architecture if this community is interested.`,
      },
    ];
    
    try {
      await page.goto('https://www.reddit.com', { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(2000);
      await screenshot(page, 'reddit-home');
      
      const redditContent = await page.content();
      const redditLoggedIn = redditContent.includes('profile') || redditContent.includes('Log Out') || redditContent.includes('u/');
      console.log('Reddit logged in:', redditLoggedIn);
      
      if (!redditLoggedIn) {
        // Try Google OAuth login
        await page.goto('https://www.reddit.com/login', { waitUntil: 'networkidle2', timeout: 30000 });
        await sleep(2000);
        await screenshot(page, 'reddit-login');
        
        // Look for Google button
        const googleBtn = await page.$('button[data-testid="google-oauth-button"], #google-oauth-button, button:has-text("Continue with Google")');
        if (googleBtn) {
          console.log('Found Google OAuth button on Reddit');
          await googleBtn.click();
          await sleep(5000);
          await screenshot(page, 'reddit-google-oauth');
        } else {
          console.log('No Google OAuth button found, checking for standard login');
          const usernameField = await page.$('#loginUsername, input[name="username"]');
          if (usernameField) {
            console.log('Found username field');
          }
        }
      }
      
      for (const post of redditPosts) {
        try {
          console.log(`\nPosting to r/${post.subreddit}...`);
          await page.goto(`https://www.reddit.com/r/${post.subreddit}/submit`, { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
          });
          await sleep(2000);
          await screenshot(page, `reddit-${post.subreddit}-submit`);
          
          const currentUrl = page.url();
          console.log(`r/${post.subreddit} submit URL:`, currentUrl);
          
          if (currentUrl.includes('login') || currentUrl.includes('register')) {
            results.reddit[post.subreddit] = 'Needs login';
            console.log('Redirected to login — Reddit not authenticated');
            continue;
          }
          
          // Try to fill in the post form
          // Select "Text" tab
          const textTab = await page.$('[value="self"], button:has-text("Text"), [data-click-id="text"]');
          if (textTab) {
            await textTab.click();
            await sleep(1000);
          }
          
          // Fill title
          const titleField = await page.$('textarea[name="title"], input[name="title"], [placeholder*="title" i]');
          if (titleField) {
            await titleField.click();
            await titleField.type(post.title, { delay: 20 });
            console.log('Title filled');
          } else {
            console.log('No title field found');
            results.reddit[post.subreddit] = 'Form not found — needs manual posting';
            continue;
          }
          
          // Fill body
          const bodyField = await page.$('textarea[name="text"], .public-DraftEditor-content, [data-placeholder*="text" i]');
          if (bodyField) {
            await bodyField.click();
            await bodyField.type(post.body, { delay: 10 });
            console.log('Body filled');
          }
          
          await screenshot(page, `reddit-${post.subreddit}-filled`);
          
          // Submit
          const submitBtn = await page.$('button[type="submit"]:has-text("Post"), button:has-text("Post")');
          if (submitBtn) {
            await submitBtn.click();
            await sleep(3000);
            const finalUrl = page.url();
            console.log(`Posted to r/${post.subreddit}: ${finalUrl}`);
            results.reddit[post.subreddit] = `Posted: ${finalUrl}`;
          } else {
            console.log('No submit button found');
            results.reddit[post.subreddit] = 'Submit button not found — needs manual';
          }
          
        } catch(e) {
          console.error(`Reddit r/${post.subreddit} error:`, e.message);
          results.reddit[post.subreddit] = `Error: ${e.message}`;
        }
      }
      
    } catch(e) {
      console.error('Reddit general error:', e.message);
      results.reddit = { general: `Error: ${e.message}` };
    }
    
    // ============================================================
    // TASK 3: Hacker News
    // ============================================================
    console.log('\n=== TASK 3: Hacker News ===');
    try {
      await page.goto('https://news.ycombinator.com', { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(2000);
      await screenshot(page, 'hn-home');
      
      const hnContent = await page.content();
      const hnLoggedIn = hnContent.includes('logout') || hnContent.includes('| ');
      console.log('HN content check:', hnContent.substring(0, 500));
      
      // Navigate to submit page
      await page.goto('https://news.ycombinator.com/submit', { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(2000);
      await screenshot(page, 'hn-submit');
      
      const hnSubmitUrl = page.url();
      console.log('HN submit URL:', hnSubmitUrl);
      
      if (hnSubmitUrl.includes('login')) {
        console.log('HN requires login');
        // Try to login
        const userField = await page.$('input[name="acct"]');
        const passField = await page.$('input[name="pw"]');
        if (userField && passField) {
          // We need HN credentials - might not have them
          console.log('HN login form found but we need username/password');
          results.hackerNews = 'Needs manual login — HN does not support Google OAuth. Need HN account credentials.';
        }
      } else {
        // Try to submit
        const titleField = await page.$('input[name="title"]');
        const urlField = await page.$('input[name="url"]');
        
        if (titleField && urlField) {
          await titleField.type('Show HN: Longevity Digest – Daily longevity research curated by two AI agents', { delay: 20 });
          await urlField.type('https://longevitydigest.co', { delay: 20 });
          await screenshot(page, 'hn-filled');
          
          const submitBtn = await page.$('input[type="submit"]');
          if (submitBtn) {
            await submitBtn.click();
            await sleep(3000);
            const hnFinalUrl = page.url();
            console.log('HN submission URL:', hnFinalUrl);
            results.hackerNews = `Submitted, URL: ${hnFinalUrl}`;
          }
        } else {
          results.hackerNews = `Submit form fields not found on page: ${hnSubmitUrl}`;
        }
      }
      
    } catch(e) {
      console.error('HN error:', e.message);
      results.hackerNews = `Error: ${e.message}`;
    }
    
    // ============================================================
    // TASK 4: Twitter/X
    // ============================================================
    console.log('\n=== TASK 4: Twitter/X ===');
    try {
      await page.goto('https://twitter.com', { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(3000);
      await screenshot(page, 'twitter-home');
      
      const twitterUrl = page.url();
      console.log('Twitter URL:', twitterUrl);
      
      const twitterContent = await page.content();
      const twitterLoggedIn = twitterContent.includes('Home') && !twitterContent.includes('Sign in');
      console.log('Twitter logged in check:', twitterLoggedIn);
      
      if (!twitterLoggedIn) {
        console.log('Twitter: attempting login flow');
        results.twitter = 'Twitter not logged in — needs manual authentication with @longevitydigest account';
      } else {
        // Post tweets
        console.log('Twitter appears logged in, checking account...');
        results.twitter = 'Twitter may be logged in but need to verify account is @longevitydigest';
      }
      
    } catch(e) {
      console.error('Twitter error:', e.message);
      results.twitter = `Error: ${e.message}`;
    }
    
    // ============================================================
    // TASK 5: Longecity
    // ============================================================
    console.log('\n=== TASK 5: Longecity ===');
    try {
      await page.goto('https://www.longecity.org/forum/', { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(2000);
      await screenshot(page, 'longecity-home');
      
      const longecityContent = await page.content();
      const longecityLoggedIn = longecityContent.includes('Sign Out') || longecityContent.includes('My Profile');
      console.log('Longecity logged in:', longecityLoggedIn);
      
      results.longecity = 'Longecity page reached — login status: ' + (longecityLoggedIn ? 'logged in' : 'not logged in, needs manual account creation');
      
    } catch(e) {
      console.error('Longecity error:', e.message);
      results.longecity = `Error: ${e.message}`;
    }
    
    console.log('\n=== RESULTS ===');
    console.log(JSON.stringify(results, null, 2));
    
  } catch(e) {
    console.error('Fatal error:', e.message);
    console.error(e.stack);
  } finally {
    if (browser) {
      await browser.disconnect();
    }
  }
}

main().catch(console.error);
