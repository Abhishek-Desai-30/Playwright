/// <reference types="node" />
import { test } from '../fixture/base';
import { LandingPage } from '../page/LandingPage';


test('Navigate to module', async ({ landingPage }) => {

  await landingPage.gotoPage();
  await landingPage.navigateToPartfolio();
  await landingPage.navigateToExpansion();
  await landingPage.navigateToStructureUI();
  


  


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
