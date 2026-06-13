
import { chromium, expect, test as setup } from '@playwright/test';


setup('login setup', async ({ }) => {

    const context =
        await chromium.launchPersistentContext(
            `C:/temp/edge-profile`,
            {
                baseURL: process.env.BASE_URL,
                channel: 'msedge',
                headless: false,
            }
        );

    const page = await context.pages()[0];

    await page.goto(
        '/'
    );


    if (await page.getByText("Pick an account").isVisible()) {
        const optumAccount = page.locator('xpath=//small[contains(text(), "@optum.com")]');
        const simplifyAccount = page.locator('xpath=//small[contains(text(), "SimplifyAlpha.com")]');

        if (await optumAccount.isVisible()) {
            await optumAccount.click();
        } else {
            await simplifyAccount.click();
        }
    }

    const selectRole = page.getByText("Select Role");

    try {
        await selectRole.waitFor({ state: 'visible', timeout: 120000 })
        if (await selectRole.isVisible()) {
        await page.locator('#roleChangeID').selectOption('24');
        await page.getByRole('button', { name: 'Proceed' }).click();
        }

    } catch (e) {
        console.log('Role selection failed:', e);
    }

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const workQueue = page.locator('xpath=//*[text()="Work Queue"]').first();
    await expect(workQueue).toBeVisible();

    await page.context().storageState({ path: '.auth/user.json' });
    await context.close();

});
