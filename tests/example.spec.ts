/// <reference types="node" />
import { expect, test } from '../fixture/base';
import { CustomHelpers } from '../Utility/CustomHelpers';


test('Navigate to all ems module', async ({ landingPage, page }) => {

  await landingPage.gotoPage();
  
  await landingPage.navigateToPartfolio();
  await landingPage.navigateToExpansion();
  await landingPage.navigateToStructureUI();
  await landingPage.navigateToDesign();
  await landingPage.navigateToRuleManager();
  await landingPage.navigateToMasterlist();
  await landingPage.navigateToGroupBenefitSearch();
  await landingPage.navigateToReportingCenter();
  await landingPage.navigateToCollateralEngine();
  await landingPage.navigateToSettings();
  await landingPage.navigateToGlobalUpdates();
  await landingPage.navigateToUWRecon();
  await landingPage.navigateToPBPIntegration();
  await landingPage.navigateToProductSearch();
  await landingPage.navigateToRankingAndPrioritization();
  await landingPage.navigateToSBM();
  
});

test('Navigate to all mcare module', async ({ landingPage, page }) => {
  await landingPage.gotoMcarePage();
});

test.only('print excel data', async () => {
  const helpers = new CustomHelpers();
  const testData = helpers.readExcelData(
    'MCARE Product QA Report_2026_12242025  01-40-13-126 by rule id.xlsx'
  );

  console.log(`Total rows: ${testData.length}`);
  // console.log(testData);

  // Or row by row if you want it readable:
  testData.forEach((row, i) => {
    console.log(`Row ${i + 1}:`, row);
  });

  console.log(`Rule ID: ${testData[0]['Rule ID']}`);

  testData.forEach((row, i) => {
    console.log(`Row ${i + 1}:`, row['Rule ID']);
  });


   // Find the row matching both Rule ID and Row Version
  const targetRow = testData.find(
    row => row['Rule ID'] === '20726' && row['Row Version'] === '2.0'
  );

  if (!targetRow) {
    throw new Error('No row found for Rule ID 20726 with Row Version 2.0');
  }

  console.log('Found row:', targetRow);
  console.log('English Content:', targetRow['English Content']);
  console.log('Spanish Content:', targetRow['Spanish Content']);
  console.log('Chinese Content:', targetRow['Chinese Content']);

  expect(targetRow, 'Row for Rule 20726 v2.0 should exist').toBeDefined();

  expect(targetRow!['English Content'], 'English content should not be empty').not.toBe('');
  expect(targetRow!['Spanish Content'], 'Spanish content should not be empty').not.toBe('');
  expect(targetRow!['Chinese Content'], 'Chinese content should not be empty').not.toBe('');
});