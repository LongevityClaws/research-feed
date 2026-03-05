/**
 * Longevity Digest Marketing Launch — CDP Browser Automation
 */

const puppeteer = require('/Users/borisdjordjevic/.local/node/lib/node_modules/@cli4ai/notebooklm/node_modules/puppeteer/lib/cjs/puppeteer/puppeteer.js');

const BROWSER_URL = 'http://127.0.0.1:18800';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function screenshot(page, name) {
  try {
    await page.screenshot({ path: `/tmp/launch-${name}.png` });
    console.log(`[screenshot] /tmp/launch-${name}.png`);
  } catch(e) {
    console.log(`[screenshot failed] ${name}: ${e.message}`);
  }
}

async function waitAndType(page, selector, text, opts = {}) {
  try {
    await page.waitForSelector(selector, { timeout: 8000 });
    await page.click(selector);
    await sleep(300);
    if (opts.clear) {
      await page.keyboard.down('Meta');
      await page.keyboard.press('a');
      await page.keyboard.up('Meta');
      await page.keyboard.press('Backspace');
    }
    await page.keyboard.type(text, { delay: opts.delay || 30 });
    return true;
  } catch(e) {
    console.log(`waitAndType failed for ${selector}: ${e.message}`);
    return false;
  }
}

async function main() {
  const results = {
    productHunt: 'not attempted',
    reddit: {},
    hackerNews: 'not attempted',
    twitter: 'not attempted',
    longecity: 'not attempted',
    outreach: '✅ Created at ~/Projects/research-feed/OUTREACH.md',
  };

  let browser;
  try {
    browser = await puppeteer.connect({
      browserURL: BROWSER_URL,
      defaultViewport: null,
    });
    console.log('✅ Connected to CDP browser');
    
    const pages = await browser.pages();
    console.log(`Found ${pages.length} open pages`);
    
    // Use first page or create new one
    let page = pages[0] || await browser.newPage();
    
    // ============================================================
    // TASK 1: Product Hunt
    // ============================================================
    console.log('\n=== TASK 1: Product Hunt ===');
    try {
      await page.goto('https://www.producthunt.com', { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
      await sleep(3000);
      await screenshot(page, '01-ph-home');
      
      const phContent = await page.content();
      
      // Check login state
      const loggedInIndicators = ['user-nav', 'profile-link', 'My Profile', 'Sign out', 'logout'];
      const isLoggedIn = loggedInIndicators.some(ind => phContent.includes(ind));
      console.log('PH - logged in:', isLoggedIn);
      console.log('PH - current URL:', page.url());
      
      if (!isLoggedIn) {
        console.log('PH - attempting login via Google OAuth...');
        // Click sign in
        try {
          await page.click('[data-test="sign-in-button"], button[aria-label*="sign in" i], a[href*="sign-in"], a[href*="login"]');
          await sleep(2000);
          await screenshot(page, '01-ph-login-modal');
          
          // Look for Google button
          const googleSel = 'button[data-provider="google"], button:has-text("Google"), a:has-text("Continue with Google")';
          await page.click(googleSel);
          await sleep(4000);
          await screenshot(page, '01-ph-google');
        } catch(e) {
          console.log('PH login click failed:', e.message);
        }
      }
      
      // Navigate to submit new product
      await page.goto('https://www.producthunt.com/posts/new', { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
      await sleep(3000);
      const phSubmitUrl = page.url();
      await screenshot(page, '01-ph-submit');
      console.log('PH submit page URL:', phSubmitUrl);
      
      if (phSubmitUrl.includes('/posts/new') || phSubmitUrl.includes('/submit')) {
        // Try to fill the form
        const urlFilled = await waitAndType(page, 'input[name="url"], input[placeholder*="producthunt" i], input[placeholder*="URL" i]', 'https://longevitydigest.co');
        await sleep(1000);
        
        if (urlFilled) {
          // Wait for name field
          const nameFilled = await waitAndType(page, 'input[name="name"], input[placeholder*="name" i]', 'Longevity Digest');
          const taglineFilled = await waitAndType(page, 'input[name="tagline"], textarea[name="tagline"], input[placeholder*="tagline" i]', 'Daily longevity research, curated by two AI agents');
          
          await screenshot(page, '01-ph-form-filled');
          results.productHunt = `Form partially filled on ${phSubmitUrl} — needs manual review and submission`;
        } else {
          results.productHunt = `Reached ${phSubmitUrl} — form fields not found, likely needs login`;
        }
      } else {
        results.productHunt = `Redirected to ${phSubmitUrl} — login required`;
      }
      
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
        sub: 'longevity',
        title: 'We built a free daily longevity research digest using two AI agents — launching today',
        body: "Hey r/longevity — I'm Boris, founder of 199 Biotechnologies. We've been building a daily longevity research digest at longevitydigest.co. What makes it different: it's actually built and curated by two AI agents (Boba and Gamba) running on OpenClaw, who read PubMed, Fight Aging!, bioRxiv and longevity.technology every day and distill the most significant findings into plain English. Mon-Fri, free to subscribe. Today's digest covers: senolytic-resistant cells, partial reprogramming conservation across species, and sex-specific differences in senescent cell clearance. Would love feedback from people who actually know this space.",
      },
      {
        sub: 'Biohacking',
        title: 'Free daily longevity research digest — AI-curated, protocol-relevant, Mon-Fri',
        body: "Hey r/Biohacking — I'm Boris, founder of 199 Biotechnologies. We built Longevity Digest (longevitydigest.co) because biohackers need reliable signal from the primary literature without spending hours on PubMed.\n\nTwo AI agents (Boba and Gamba) read PubMed, Fight Aging!, bioRxiv and longevity.technology every morning and distill what's actionable or worth tracking. Today: senolytic resistance mechanisms, partial reprogramming cross-species data, sex-specific differences in senescent cell clearance.\n\nFree, Mon-Fri. Would love feedback from people running real n=1 experiments.",
      },
      {
        sub: 'singularity',
        title: 'Two AI agents built a daily longevity research digest — they coordinate every morning without human prompting',
        body: "Something I think this community will appreciate: we built two OpenClaw AI agents (Boba and Gamba) who genuinely care about longevity science and produce a daily research digest every weekday at longevitydigest.co.\n\nThe interesting part isn't the newsletter — it's that the agents coordinate daily without being prompted. They read PubMed, Fight Aging!, bioRxiv, longevity.technology, synthesise the most significant findings, and publish by morning. No human in the loop for the daily production.\n\nThis is a working multi-agent system in a specific scientific domain. Happy to discuss the architecture. Built by 199 Biotechnologies.",
      },
      {
        sub: 'artificial',
        title: "We built two AI agents who read longevity research every morning and publish a daily digest — here's what we learned",
        body: "At 199 Biotechnologies, we built two OpenClaw agents — Boba and Gamba — with a specific domain: longevity science.\n\nEvery weekday morning, they autonomously:\n1. Read PubMed, bioRxiv, Fight Aging!, longevity.technology\n2. Cross-reference and identify the 6-8 most significant findings\n3. Synthesise into plain English with editorial framing\n4. Coordinate to produce a coherent digest\n5. Publish without human prompting\n\nThe output is Longevity Digest (longevitydigest.co).\n\nInteresting questions we're working through: how do you give agents genuine domain interest rather than generic summarisation? How do they handle conflicting or preliminary findings? Happy to dig into architecture.",
      },
    ];
    
    try {
      // First go to Reddit homepage to check login status
      await page.goto('https://www.reddit.com', { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
      await sleep(3000);
      await screenshot(page, '02-reddit-home');
      
      const redditContent = await page.content();
      const redditUrl = page.url();
      console.log('Reddit URL:', redditUrl);
      
      // Check if logged in - look for user avatar or username
      const redditLoggedIn = redditContent.includes('expand-user-drawer') || 
                              redditContent.includes('"isLoggedIn":true') ||
                              redditContent.includes('profileIcon') ||
                              !redditContent.includes('"isLoggedIn":false');
      console.log('Reddit - checking login...');
      
      // Check for login button presence
      const hasLoginBtn = redditContent.includes('Log In') || redditContent.includes('log-in-button');
      console.log('Reddit - has login button:', hasLoginBtn);
      
      if (hasLoginBtn) {
        console.log('Reddit - not logged in, trying Google OAuth...');
        // Navigate to login
        await page.goto('https://www.reddit.com/login', { 
          waitUntil: 'domcontentloaded', 
          timeout: 30000 
        });
        await sleep(3000);
        await screenshot(page, '02-reddit-login');
        
        // Look for Google OAuth
        try {
          await page.click('button[class*="google"], [data-testid*="google"], button:has-text("Continue with Google")');
          await sleep(5000);
          await screenshot(page, '02-reddit-google-oauth');
          console.log('Reddit - clicked Google OAuth');
        } catch(e) {
          console.log('Reddit - Google OAuth click failed:', e.message);
          // Try alternative selectors
          try {
            const btns = await page.$$('button');
            for (const btn of btns) {
              const text = await page.evaluate(el => el.textContent, btn);
              if (text && text.toLowerCase().includes('google')) {
                await btn.click();
                await sleep(5000);
                console.log('Reddit - clicked Google button:', text);
                break;
              }
            }
          } catch(e2) {
            console.log('Reddit - alternative Google click failed:', e2.message);
          }
        }
        
        await screenshot(page, '02-reddit-after-oauth');
        const postOauthUrl = page.url();
        console.log('Reddit - URL after OAuth attempt:', postOauthUrl);
      }
      
      // Now try posting to each subreddit
      for (const post of redditPosts) {
        console.log(`\nAttempting r/${post.sub}...`);
        try {
          await page.goto(`https://www.reddit.com/r/${post.sub}/submit?type=text`, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
          });
          await sleep(3000);
          await screenshot(page, `02-reddit-${post.sub}`);
          
          const submitUrl = page.url();
          console.log(`r/${post.sub} - URL:`, submitUrl);
          
          // Check if we got redirected to login
          if (submitUrl.includes('login') || submitUrl.includes('register')) {
            results.reddit[post.sub] = '❌ Redirected to login — needs manual authentication';
            console.log(`r/${post.sub} - redirected to login`);
            continue;
          }
          
          // Check for post form
          const submitContent = await page.content();
          
          // New Reddit submit form
          const titleSel = '[name="title"], textarea[placeholder*="title" i], .title-input';
          const hasTitleField = await page.$(titleSel);
          
          if (hasTitleField) {
            await waitAndType(page, titleSel, post.title);
            await sleep(500);
            
            // Body field - might be a rich text editor
            const bodySel = '[name="text"], .public-DraftEditor-content, div[contenteditable="true"], textarea[name="body"]';
            await waitAndType(page, bodySel, post.body);
            
            await screenshot(page, `02-reddit-${post.sub}-filled`);
            
            // Submit
            try {
              await page.click('button[type="submit"]:not([disabled]), button.submit-button');
              await sleep(4000);
              const finalUrl = page.url();
              console.log(`r/${post.sub} - submitted, URL:`, finalUrl);
              await screenshot(page, `02-reddit-${post.sub}-submitted`);
              results.reddit[post.sub] = `✅ Posted: ${finalUrl}`;
            } catch(e) {
              console.log(`r/${post.sub} - submit click failed:`, e.message);
              results.reddit[post.sub] = `⚠️ Form filled but submit failed: ${e.message}`;
            }
          } else {
            console.log(`r/${post.sub} - no title field found`);
            results.reddit[post.sub] = `⚠️ Submit form not found at ${submitUrl}`;
          }
          
        } catch(e) {
          console.error(`r/${post.sub} error:`, e.message);
          results.reddit[post.sub] = `❌ Error: ${e.message}`;
        }
      }
      
    } catch(e) {
      console.error('Reddit general error:', e.message);
      results.reddit = { general: `❌ Error: ${e.message}` };
    }
    
    // ============================================================
    // TASK 3: Hacker News
    // ============================================================
    console.log('\n=== TASK 3: Hacker News ===');
    try {
      await page.goto('https://news.ycombinator.com/login', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await sleep(2000);
      await screenshot(page, '03-hn-login');
      
      const hnContent = await page.content();
      console.log('HN URL:', page.url());
      
      // Check if already logged in (HN redirects to homepage if already logged in)
      if (page.url() === 'https://news.ycombinator.com/' || page.url().includes('news.ycombinator.com/news')) {
        console.log('HN - already logged in');
      }
      
      // Go to submit page
      await page.goto('https://news.ycombinator.com/submit', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await sleep(2000);
      
      const hnSubmitUrl = page.url();
      await screenshot(page, '03-hn-submit');
      console.log('HN submit URL:', hnSubmitUrl);
      
      if (hnSubmitUrl.includes('login')) {
        // Need to login first
        console.log('HN requires login - no Google OAuth support');
        results.hackerNews = '❌ HN requires username/password login (no Google OAuth). Need HN account credentials for longevity199@gmail.com.';
        
        // Try with default credentials if we happen to have them
        // HN username might be "longevity199" or similar
        const userField = await page.$('input[name="acct"]');
        const passField = await page.$('input[name="pw"]');
        
        if (userField && passField) {
          console.log('HN login form available — but no credentials in scope');
        }
      } else {
        // Logged in, try to submit
        const titleField = await page.$('input[name="title"]');
        const urlField = await page.$('input[name="url"]');
        
        if (titleField && urlField) {
          await page.click('input[name="title"]');
          await page.keyboard.type('Show HN: Longevity Digest – Daily longevity research curated by two AI agents', { delay: 30 });
          await page.click('input[name="url"]');
          await page.keyboard.type('https://longevitydigest.co', { delay: 30 });
          
          await screenshot(page, '03-hn-filled');
          
          const submitBtn = await page.$('input[type="submit"]');
          if (submitBtn) {
            await submitBtn.click();
            await sleep(4000);
            const hnFinalUrl = page.url();
            await screenshot(page, '03-hn-submitted');
            console.log('HN submitted:', hnFinalUrl);
            results.hackerNews = `✅ Submitted: ${hnFinalUrl}`;
            
            // Try to add comment
            try {
              const commentArea = await page.$('textarea[name="text"]');
              if (commentArea) {
                await page.click('textarea[name="text"]');
                await page.keyboard.type("Hi HN — I'm Boris, founder of 199 Biotechnologies. We built Longevity Digest as an experiment: two OpenClaw AI agents (Boba and Gamba) with genuine interest in longevity science curate the daily research digest. They read PubMed, Fight Aging!, bioRxiv, longevity.technology, and key X accounts (@agingdoc, @agingroy, @davidasinclair) and synthesise the top 6-8 findings into plain English with an editorial take in my voice. The agents coordinate daily without needing me to prompt them. longevitydigest.co — free, Mon-Fri.", { delay: 20 });
                const commentSubmit = await page.$('input[type="submit"]');
                if (commentSubmit) {
                  await commentSubmit.click();
                  await sleep(2000);
                  results.hackerNews += ' + comment added';
                }
              }
            } catch(e) {
              console.log('HN comment failed:', e.message);
            }
          }
        } else {
          results.hackerNews = `HN submit page reached (${hnSubmitUrl}) but form fields not found`;
        }
      }
      
    } catch(e) {
      console.error('HN error:', e.message);
      results.hackerNews = `❌ Error: ${e.message}`;
    }
    
    // ============================================================
    // TASK 4: Twitter/X
    // ============================================================
    console.log('\n=== TASK 4: Twitter/X ===');
    try {
      await page.goto('https://x.com/home', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await sleep(4000);
      await screenshot(page, '04-twitter-home');
      
      const twitterUrl = page.url();
      const twitterContent = await page.content();
      console.log('Twitter URL:', twitterUrl);
      
      const twitterLoggedIn = twitterUrl.includes('/home') && !twitterContent.includes('Sign in to X');
      console.log('Twitter logged in:', twitterLoggedIn);
      
      if (!twitterLoggedIn) {
        // Check current logged-in user
        const hasCompose = twitterContent.includes('What is happening') || twitterContent.includes('tweet-compose');
        
        if (!hasCompose) {
          results.twitter = '❌ Twitter not logged in as @longevitydigest — needs manual login with longevity199@gmail.com';
          console.log('Twitter: not logged in');
          
          // Show what account is currently logged in if any
          const usernameMatch = twitterContent.match(/@([A-Za-z0-9_]+)/);
          if (usernameMatch) {
            console.log('Twitter: possibly logged in as', usernameMatch[1]);
            results.twitter += ` (currently logged in as ${usernameMatch[1]}?)`;
          }
        }
      } else {
        console.log('Twitter: logged in, attempting to post thread...');
        
        // Check which account
        const accountInfo = await page.evaluate(() => {
          const metaEl = document.querySelector('[data-testid="UserCell"]');
          return metaEl ? metaEl.textContent : 'unknown';
        });
        console.log('Twitter account:', accountInfo);
        
        const tweets = [
          'We\'re launching Longevity Digest 🧬 Daily longevity research, Mon-Fri, free. But here\'s the twist:',
          'It\'s curated by two AI agents — Boba and Gamba — who read PubMed, Fight Aging!, bioRxiv and longevity.technology every day and distill what matters.',
          "Today's digest: senolytic-resistant cells, partial reprogramming in insects, sex differences in senescent cell clearance. The kind of research that should be on everyone's radar.",
          'Built by @199biotechnologies. Subscribe free: longevitydigest.co /cc @agingdoc @agingroy',
        ];
        
        let previousTweetUrl = null;
        const tweetUrls = [];
        
        for (let i = 0; i < tweets.length; i++) {
          try {
            if (i === 0) {
              // Click compose button
              await page.click('[data-testid="SideNav_NewTweet_Button"], [aria-label="Post"]');
            } else {
              // Reply to previous tweet
              if (previousTweetUrl) {
                await page.goto(previousTweetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
                await sleep(2000);
                await page.click('[data-testid="reply"]');
              }
            }
            
            await sleep(1500);
            
            // Type tweet
            const tweetInput = await page.waitForSelector('[data-testid="tweetTextarea_0"], [data-testid="tweetTextarea_0ifcd"], div[contenteditable="true"]', { timeout: 8000 });
            if (tweetInput) {
              await tweetInput.click();
              await page.keyboard.type(tweets[i], { delay: 30 });
              await sleep(500);
              
              await screenshot(page, `04-tweet-${i}`);
              
              // Post tweet
              await page.click('[data-testid="tweetButtonInline"], [data-testid="tweetButton"]');
              await sleep(3000);
              
              const currentUrl = page.url();
              tweetUrls.push(currentUrl);
              previousTweetUrl = currentUrl;
              console.log(`Tweet ${i+1} posted:`, currentUrl);
              
              await screenshot(page, `04-tweet-${i}-posted`);
            }
            
          } catch(e) {
            console.log(`Tweet ${i+1} failed:`, e.message);
            break;
          }
        }
        
        if (tweetUrls.length > 0) {
          results.twitter = `✅ Posted ${tweetUrls.length}/4 tweets: ${tweetUrls.join(', ')}`;
        } else {
          results.twitter = '⚠️ Twitter logged in but tweets failed — needs manual posting';
        }
      }
      
    } catch(e) {
      console.error('Twitter error:', e.message);
      results.twitter = `❌ Error: ${e.message}`;
    }
    
    // ============================================================
    // TASK 5: Longecity
    // ============================================================
    console.log('\n=== TASK 5: Longecity ===');
    try {
      await page.goto('https://www.longecity.org/forum/', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await sleep(3000);
      await screenshot(page, '05-longecity-home');
      
      const lcContent = await page.content();
      const lcUrl = page.url();
      console.log('Longecity URL:', lcUrl);
      
      const lcLoggedIn = lcContent.includes('Sign Out') || lcContent.includes('My Profile') || lcContent.includes('longevity199');
      console.log('Longecity logged in:', lcLoggedIn);
      
      if (!lcLoggedIn) {
        // Try to find login
        await page.goto('https://www.longecity.org/forum/index.php?app=core&module=global&section=login', {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        await sleep(2000);
        await screenshot(page, '05-longecity-login');
        console.log('Longecity login URL:', page.url());
        
        results.longecity = '❌ Longecity requires account creation with username/password. Email: longevity199@gmail.com. Register at https://www.longecity.org/forum/register/ then post in Aging Research section.';
      } else {
        // Find aging research section and post
        console.log('Longecity: logged in, finding Aging Research section...');
        
        await page.goto('https://www.longecity.org/forum/forum/55-aging-science/', {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        await sleep(2000);
        await screenshot(page, '05-longecity-aging');
        
        // Try to start a new topic
        try {
          await page.click('a[href*="submit_post"], a:has-text("Start new topic"), button:has-text("New Topic")');
          await sleep(2000);
          await screenshot(page, '05-longecity-newtopic');
          
          // Fill title
          const titleField = await page.$('input[name="post_title"], #post_title');
          if (titleField) {
            await titleField.type('Longevity Digest — Free daily longevity research curated by two AI agents');
            
            // Fill body  
            await page.evaluate(() => {
              const editor = document.querySelector('#post_content, .ql-editor, [contenteditable="true"]');
              if (editor) {
                editor.innerHTML = `<p>Hi everyone — I'm Boris, founder of 199 Biotechnologies.</p>
<p>We've launched Longevity Digest (longevitydigest.co) — a free daily longevity research digest that's genuinely different from most science newsletters.</p>
<p>What makes it different: it's built and curated by two AI agents (Boba and Gamba) running on OpenClaw, who read PubMed, Fight Aging!, bioRxiv and longevity.technology every day and distill the most significant findings into plain English. They coordinate daily without human prompting.</p>
<p>Coverage areas: senolytics, partial reprogramming, epigenetic clocks, rapamycin, gut microbiome, and emerging longevity research.</p>
<p>Today's digest covers: senolytic-resistant cells, partial reprogramming conservation across species, and sex-specific differences in senescent cell clearance.</p>
<p>Mon-Fri, free to subscribe. Would genuinely value feedback from this community — you're the target audience.</p>
<p>longevitydigest.co</p>`;
              }
            });
            
            await screenshot(page, '05-longecity-filled');
            
            // Submit
            await page.click('input[type="submit"], button[type="submit"]');
            await sleep(3000);
            const lcFinalUrl = page.url();
            console.log('Longecity post URL:', lcFinalUrl);
            results.longecity = `✅ Posted: ${lcFinalUrl}`;
          }
        } catch(e) {
          console.log('Longecity post creation failed:', e.message);
          results.longecity = `⚠️ Logged in but post creation failed: ${e.message}`;
        }
      }
      
    } catch(e) {
      console.error('Longecity error:', e.message);
      results.longecity = `❌ Error: ${e.message}`;
    }
    
    // ============================================================
    // FINAL REPORT
    // ============================================================
    console.log('\n========================================');
    console.log('LAUNCH RESULTS:');
    console.log('========================================');
    console.log(JSON.stringify(results, null, 2));
    
    return results;
    
  } catch(e) {
    console.error('Fatal error:', e.message);
    console.error(e.stack);
    return { error: e.message };
  } finally {
    if (browser) {
      await browser.disconnect();
    }
  }
}

main().then(r => {
  console.log('\nDone. Final results:', JSON.stringify(r, null, 2));
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
