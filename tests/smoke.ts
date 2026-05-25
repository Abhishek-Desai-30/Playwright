import {test,expect} from "@playwright/test";

test('Navigate to module', async ({ page }) => {

  await page.goto(
    '/Dashboard/Index'
);

await page.getByText('Portfolio').click();

await expect(page.getByRole('heading', { name: 'Portfolio' })).toContainText('Portfolio');

});