const { chromium } = require('@playwright/test');
const dotenv = require('dotenv');
const path = require('path');

const env =
  process.env.TEST_ENV ||
  'optum.qa';

dotenv.config({
  path: path.resolve(
    __dirname,
    `.env.${env}`
  ),
  override: true
});


async function authsetup() {

  const context =
    await chromium.launchPersistentContext(
      `C:/temp/edge-profile`,
      {
        channel: 'msedge',
        headless: false,
        viewport: null,
        args: [
          '--start-maximized',
          '--disable-blink-features=AutomationControlled',
        ],
      }
    );

  const page = await context.pages()[0];

  await page.goto(
    process.env.BASE_URL || 
    'https://esync-shqa.optum.com/');

  console.log('Complete login + MFA manually');
  
  // await page.locator("//small[contains(text(), '@optum.com')]").click();
  //await expect(page.locator('#idDiv_SAOTCAS_Title')).toContainText('Approve sign in request');

    const selectRole = page.locator('#ui-id-1');

    await page.locator('#roleChangeID').selectOption('24');
    await page.getByRole('button', { name: 'Proceed' }).click();

    await context.storageState({ path: '.auth/user.json' });

    console.log('Auth saved to .auth/user.json');
    
    await context.close();

}

authsetup();
