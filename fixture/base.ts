import { test as base, BrowserContext } from "@playwright/test";
import { LandingPage } from "../page/LandingPage";

type MyFixtures = {
    landingPage: LandingPage,
}


export const test = base.extend<MyFixtures>({

    landingPage: async ({ page, context }, use) => {

        await context.addInitScript(() => {
            document.addEventListener('DOMContentLoaded', ()=>{
                (document.body.style as any).zoom = '90%';
            })
        });

        const landingPage = new LandingPage(page,context);

        await use(landingPage);

        await landingPage.closeMcareContext();
    }

})

export { expect } from "@playwright/test";