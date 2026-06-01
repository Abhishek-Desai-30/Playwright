import { test as base } from "@playwright/test";
import { LandingPage } from "../page/LandingPage";


type MyFixtures = {
    landingPage: LandingPage,
}



export const test = base.extend<MyFixtures>({

    landingPage: async ({ page }, use) => {
        await use(new LandingPage(page));
    }

})

export { expect } from "@playwright/test";