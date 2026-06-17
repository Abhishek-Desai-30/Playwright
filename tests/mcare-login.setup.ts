
import { chromium, expect, test as mcareSetup } from '@playwright/test';


mcareSetup('mcare login setup', async ({ }) => {

    const context =
        await chromium.launchPersistentContext(
            `C:/temp/edge-profile-mcare`,
            {
                baseURL: process.env.MCARE_URL,
                channel: 'msedge',
                headless: false,
                args: [
                    '--start-maximized',
                    '--disable-blink-features=AutomationControlled',
                ],
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

    // Wait briefly for JS to run and any cached token to load
    await page.waitForLoadState('domcontentloaded');


    if (await page.evaluate(() => localStorage.getItem('auth_token') == null)) {
        // Wait for the SSO-to-JWT exchange to complete
        await page.waitForResponse(
            resp => resp.url().includes('/api/sso/auth/get-token') && resp.status() === 200,
            { timeout: 10000 }
        );

        // Tiny buffer for React to write to localStorage after the response
        await page.waitForFunction(
            () => localStorage.getItem('auth_token') !== null,
            { timeout: 10000 }
        );
    }
    else {
        console.log('auth_token already exists in localStorage, skipping SSO login.');
    }

    if (await page.getByText("Sign in").isVisible()) {
        const optumAccount = page.locator('xpath=//small[contains(text(), "@optum.com")]');
        const simplifyAccount = page.locator('xpath=//input[@type="email"]');

        if (await optumAccount.isVisible()) {
            await optumAccount.click();
            await optumAccount.fill(process.env.LOGIN_EMAIL || 'Abhishek_desai@optum.com');
        } else {
            await simplifyAccount.click();
            await simplifyAccount.fill(process.env.LOGIN_EMAIL || 'Abhishek.desai@simplifyalpha.com');
        }
    }

    const selectRole = page.getByText("Simplify SuperUser");

    try {
        await selectRole.waitFor({ state: 'visible', timeout: 160000 })
        if (await selectRole.isVisible()) {
            await page.getByText("Simplify SuperUser").click();
        }

    } catch (e) {
        console.log('Role selection failed:', e);
    }

    await expect(page.getByText('Dashboard').first()).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Rules Configuration').first()).toBeVisible({ timeout: 30000 });

    await page.context().storageState({ path: '.auth/mcare-user.json' });
    await context.close();

});
