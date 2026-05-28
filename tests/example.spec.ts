/// <reference types="node" />
import { test, expect, Page } from '@playwright/test';
import fs from 'fs';

test('Navigate to module', async ({ page }) => {

  await page.goto(
    '/Dashboard/Index'
  );

  const portfolio = page.locator('#PortfolioSearch');

  await portfolio.isVisible();
  await portfolio.click();

  await expect(page.getByRole('heading', { name: 'Portfolio' })).toContainText('Portfolio');

  await page.pause();

  await page.getByText(' Expansion & Structure UI').click();
  await expect(page.locator('#jqgh_comparePlanGrid_Contract')).toBeVisible();


  await page.getByRole('link', { name: 'Structure UI' }).click();
  await expect(page.getByText('Crosswalk Activity')).toBeVisible();


/*
  await page.goto('https://esync-shqa.optum.com/FormDesign/Index');
  await expect(page.getByRole('heading', { name: 'Design' })).toBeVisible();

  await page.goto('https://esync-shqa.optum.com/RulesManager/Index');
  await expect(page.getByRole('heading', { name: 'Rules Manager' })).toBeVisible();


  await page.getByText(' Master List').click();
  await expect(page.getByRole('heading', { name: 'Master List Dashboard' })).toBeVisible();
  await page.getByText(' Group Benefits').click();


  await page.goto('https://esync-shqa.optum.com/ReportingCenter/Index');
  await expect(page.getByRole('gridcell', { name: 'Ancillary Vendor Report' })).toBeVisible();
  await page.getByText(' Collateral Engine').click();
  await page.goto('https://esync-shqa.optum.com/DocumentCollateral/ViewReportTemplate');
  await expect(page.getByRole('gridcell', { name: 'Medicare ANOC' })).toBeVisible();
  await page.getByText(' Settings').click();
  await page.goto('https://esync-shqa.optum.com/Settings/WorkFlowSettings');
  await expect(page.getByRole('link', { name: 'Team Mapping' })).toBeVisible();
  await page.getByRole('link', { name: 'language' }).click();
  await page.goto('https://esync-shqa.optum.com/GlobalDocumentSync/Index');
  await page.getByRole('link', { name: 'repeat' }).click();
  await page.goto('https://esync-shqa.optum.com/UWReconciliation/Index');
  await expect(page.getByRole('link', { name: 'Upload Document' })).toBeVisible();
  await page.getByText(' PBP Integration').click();
  await page.goto('https://esync-shqa.optum.com/PBPImport/Index');
  await expect(page.getByText('Import ID')).toBeVisible();
  await page.getByRole('link', { name: 'search' }).click();
  await expect(page.getByRole('heading', { name: 'Product Search' })).toBeVisible();
  await page.getByText(' Ranking and Prioritization').click();
  await page.goto('https://esync-shqa.optum.com/RankingAndPrioritization/Index');
  await expect(page.getByRole('heading', { name: 'Ranking and Prioritization -' })).toBeVisible();
  await page.getByRole('link', { name: 'extension' }).click();
  await page.goto('https://esync-shqa.optum.com/SBMException/Index');
  await expect(page.getByText('Benefit', { exact: true })).toBeVisible();
  */
  
});
