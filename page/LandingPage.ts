import { expect, Page } from "@playwright/test";
import { stat } from "node:fs";

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
                waitUntil: "domcontentloaded",
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

        await this.page.evaluate(()=>{
            document.body.style.zoom='90%';
        });
    }

    public async navigateToPartfolio() {

        const portfolio = this.page.locator('#PortfolioSearch');

        await portfolio.waitFor({state: 'visible', timeout: 120000 });
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

    async navigateToDesign() {
        const designModule = this.page.locator('#design');
        await designModule.click();
        await expect.soft(this.page.getByRole('heading', { name: 'Design'})).toBeVisible();
    }

    async navigateToRuleManager() {
        const RulesManagerModule = this.page.locator('#rulesmanager');
        await RulesManagerModule.click();
        await expect.soft(this.page.getByRole('heading', { name:'Rules Manager'})).toBeVisible();
    }

    async navigateToMasterlist() {
        const masterlistModule = this.page.locator('#masterList');
        await masterlistModule.click();
        await expect.soft(this.page.getByRole('heading', { name:'Master List Dashboard'})).toBeVisible();
    }

    async navigateToGroupBenefitSearch() {
        const groupBenefitSearch = this.page.locator('#GroupBenefitSearch');
        await groupBenefitSearch.click();
        await expect.soft(this.page.getByRole('heading', { name: /Group Benefits/i}).first()).toBeVisible();
    }

    async navigateToReportingCenter() {
        const reportingCenter = this.page.locator('#ReportingCenter');
        await reportingCenter.click();

        const reportName= this.page.locator('//td[contains(text(), "MCARE Product QA Report")]').first();
        await reportName.scrollIntoViewIfNeeded();
        await expect.soft(this.page.getByText(/MCARE Product QA Report/i).first()).toBeVisible();
    }

    async navigateToCollateralEngine() {
        const collateralEngine = this.page.locator('#Reporting');
        await collateralEngine.click();
        await expect.soft(this.page.getByText('Medicare ANOC').first()).toBeVisible();
    }

    async navigateToSettings() {
        const settings = this.page.locator('#settings');
        await settings.click();
        await expect.soft(this.page.getByText('Team Mapping').first()).toBeVisible();
    }

    async navigateToGlobalUpdates() {
        const compareSyncGlobal = this.page.locator('#compareSyncGlobal');
        await compareSyncGlobal.click();
        await expect.soft(this.page.getByRole('heading', { name:/Global Updates/i}).first()).toBeVisible();
    }

    async navigateToUWRecon() {
        const uwRecon = this.page.locator('#uwReconciliation');
        await uwRecon.click();
        await expect.soft(this.page.getByRole('heading', { name:/UnderWriting Recon Module/i}).first()).toBeVisible();
    }

     async navigateToPBPIntegration() {
        const pbpIntegration = this.page.locator('#pbp');
        await pbpIntegration.click();
        await expect.soft(this.page.getByRole('heading', { name:/PBP Integration/i}).first()).toBeVisible();
    }

     async navigateToProductSearch() {
        const productSearch = this.page.locator('#quoteSearch');
        await productSearch.click();
        await expect.soft(this.page.getByRole('heading', { name:/Product Search/i}).first()).toBeVisible();
    }

    async navigateToRankingAndPrioritization() {
        const rankingAndPrioritization = this.page.locator('#rankingandprioritizationui');
        await rankingAndPrioritization.click();
        await expect.soft(this.page.getByText('Plan LineUp Ranking').first()).toBeVisible();
    }

    async navigateToSBM() {
        await this.page.evaluate(()=>{document.body.style.zoom = '90%';});
        const sbmException = this.page.locator('#sbmexceptionui');
        await sbmException.click();
        await expect.soft(this.page.getByRole('heading', { name:/SBM Exception/i}).first()).toBeVisible();
    }




}