import { expect, Page } from "@playwright/test";

export class LandingPage {

    readonly page: Page;
    url: string;

    constructor(page: Page) {
        console.log("LandingPage initialized");
        this.page = page;
        this.url = `${process.env.BASE_URL}/Dashboard/Index`;
    }

    async gotoPage() {
        console.log('got to page method')

        try {
            await this.page.goto(this.url, {
                waitUntil:"domcontentloaded",
                timeout: 180000
            });
            console.log('Navigation successful');
        }
        catch (e) {
            console.log('Navigation failed:', e);
            throw e;
        }

        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

        const workQueue = this.page.locator('xpath=//*[text()="Work Queue"]').first();
        await expect.soft(workQueue).toBeVisible();
    }

    public async navigateToPartfolio() {

        const portfolio = this.page.locator('#PortfolioSearch');

        await expect.soft(portfolio).toBe(true);
        await portfolio.click();

        await expect.soft(this.page.getByRole('heading', { name: 'Portfolio' })).toContainText('Portfolio');
    }

    async navigateToExpansion() {
        await this.page.getByText(' Expansion & Structure UI').click();
        await expect(this.page.locator('#jqgh_comparePlanGrid_Contract')).toBeVisible();
    }

    async navigateToStructureUI() {
        await this.page.getByRole('link', { name: 'Structure UI' }).click();
        await expect(this.page.getByText('Crosswalk Activity')).toBeVisible();
    }

}