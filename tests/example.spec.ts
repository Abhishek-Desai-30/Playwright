/// <reference types="node" />
import { test, expect, Page } from '@playwright/test';
import fs from 'fs';


test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});

test.only('Navigate to module', async ({ page }) => {

  await page.goto(
    '/Dashboard/Index'
  );

  const selectRole = page.locator('#ui-id-1');

  await page.locator('#roleChangeID').selectOption('24');
  await page.getByRole('button', { name: 'Proceed' }).click();

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  const workQueue = page.locator('//*[text()="Work Queue"]');
  await workQueue.isVisible();

  const portfolio = page.locator('#PortfolioSearch');

  await portfolio.isVisible();
  await portfolio.click();

  await expect(page.getByRole('heading', { name: 'Portfolio' })).toContainText('Portfolio');

  await page.pause();
});