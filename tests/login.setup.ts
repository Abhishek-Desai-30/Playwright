
import { chromium, expect, test as setup } from '@playwright/test';
import fs from 'fs';


setup('login setup', async ({ }) => {

    const context =
        await chromium.launchPersistentContext(
            `C:/temp/edge-profile`,
            {
                channel: 'msedge',
                headless: false,
                args: [
                    '--start-maximized',
                    '--disable-blink-features=AutomationControlled',
                ],
            }
        );

    const page = await context.pages()[0];

    await page.goto(
        '/Dashboard/Index'
    );

    const selectRole = page.locator('#ui-id-1');

    if (await selectRole.isVisible()) {

        await page.locator('#roleChangeID').selectOption('24');
        await page.getByRole('button', { name: 'Proceed' }).click();
    }

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const workQueue = page.locator('xpath=//*[text()="Work Queue"]').first();
    await expect(workQueue).toBeVisible();

    await page.context().storageState({ path: '.auth/user.json' });

});