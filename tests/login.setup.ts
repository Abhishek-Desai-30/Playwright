
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

    const pages = context.pages();
    for (let i = 1; i < pages.length; i++) {
        await pages[i].close();
    }
    const page = pages[0] || await context.newPage();


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

    const workQueue = page.locator('xpath=//*[text()="Work Queue"]').first();
    await workQueue.scrollIntoViewIfNeeded();
    await expect(workQueue).toBeVisible();

    await page.context().storageState({ path: '.auth/user.json' });
    await context.close();

});
