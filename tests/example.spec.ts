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

test('print excel data', async () => {
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

test('Check mark inprogress rules', async ({ landingPage, page }) => {
  const mcarePage = await landingPage.gotoMcarePage();
  // await page.pause();
  await mcarePage.getByRole('button', { name: 'Rules Configuration' }).click();
  await expect(mcarePage.getByRole('heading', { name: 'Rule Master List' })).toBeVisible();
  await expect(mcarePage.locator("td.MuiTableCell-root div.MuiBox-root").first()).toBeVisible();

  // await mcarePage.locator('xpath=//p[contains(text(),"Rows per page:")]/following-sibling::div/input').click();
  await mcarePage.getByRole('combobox', { name: 'Rows per page:' }).click();
  await mcarePage.locator('xpath=//li[text()=100]').click();

  await mcarePage.getByRole('textbox', { name: 'Type value..' }).nth(1).fill('0.01');
  await mcarePage.getByRole('textbox', { name: 'Type value..' }).nth(1).press('Enter');
  await mcarePage.getByRole('textbox', { name: 'Type value..' }).nth(2).click();
  await mcarePage.getByRole('textbox', { name: 'Type value..' }).nth(2).fill('2027');
  await mcarePage.getByRole('textbox', { name: 'Type value..' }).nth(2).press('Enter');

  await mcarePage.locator('xpath=(//input[@placeholder="Type or select value.."])[8]').click();
  await mcarePage.getByRole('option', { name: 'In-Progress' }).click();
  await mcarePage.locator('xpath=(//input[@placeholder="Type or select value.."])[8]').press('Enter');

  await mcarePage.locator('xpath=(//input[@placeholder="Type or select value.."])[9]').click();
  await mcarePage.getByRole('option', { name: 'In-Progress' }).click();
  await mcarePage.locator('xpath=(//input[@placeholder="Type or select value.."])[9]').press('Enter');

  // 1. Enter bulk-edit mode (the pencil icon you clicked: css-pdr4f3)
  await mcarePage.locator('button [data-testid="DriveFileRenameOutlineIcon"]').click();

  // 2. Wait for editable dropdowns to render
  await mcarePage.waitForSelector('tbody tr', { state: 'visible' });

  const rows = mcarePage.locator('tbody.MuiTableBody-root tr.MuiTableRow-root');
  const rowCount = await rows.count();
  console.log(`Found ${rowCount} rules to approve`);

  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    const dropdowns = row.locator('input[role="combobox"]'); // target the input directly
    const ddCount = await dropdowns.count();

    for (let j = 0; j < ddCount; j++) {
      const dd = dropdowns.nth(j);
      const currentValue = await dd.inputValue(); // use inputValue, not textContent

      if (currentValue !== 'In-Progress') continue;

      // Open the dropdown
      await dd.click();
      // Some MUI autocompletes need focus + ArrowDown to open reliably
      await dd.press('ArrowDown');

      // Wait for the listbox portal to appear
      const listbox = mcarePage.locator('[role="listbox"]');
      await listbox.waitFor({ state: 'visible', timeout: 10000 });

      // Pick Approved from THIS listbox specifically
      await listbox.getByRole('option', { name: 'Approved', exact: true }).click();

      // Ensure it closed before moving on
      await listbox.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => { });
    }

    console.log(`Row ${i + 1}/${rowCount} approved`);
  }
  // 3. Save / exit edit mode (the same pencil or a Save button — adjust to your UI)
  await mcarePage.locator('button [data-testid="SaveOutlinedIcon"]').click();

});


test.only('Release rules', async ({ landingPage, page }) => {
  
  test.setTimeout(0);
  const mcarePage = await landingPage.gotoMcarePage();
  // await page.pause();

  for(let i=0; i<5; i++){
  await mcarePage.getByRole('button', { name: 'Rules Configuration' }).click();
  await expect(mcarePage.getByRole('heading', { name: 'Rule Master List' })).toBeVisible();
  await expect(mcarePage.locator("td.MuiTableCell-root div.MuiBox-root").first()).toBeVisible();


  await mcarePage.getByRole('textbox', { name: 'Type value..' }).nth(1).fill('0.01');
  await mcarePage.getByRole('textbox', { name: 'Type value..' }).nth(2).fill('2027');
  // await mcarePage.locator('[placeholder="Type or select value.."]').nth(2).fill('Marketing');
  // await mcarePage.locator('button[aria-label="Contains"]').nth(4).click();

  // await mcarePage.locator('xpath=//li//p[contains(text(),"Not Equals")]').click();
  // await mcarePage.locator('[placeholder="Type or select value.."]').nth(3).press('Enter');

  await mcarePage.getByRole('textbox', { name: 'Type value..' }).nth(1).press('Enter');

  await expect(mcarePage.locator('tbody tr').nth(2)).toBeVisible();

  await mcarePage.locator('xpath=//input').first().click();

  await expect(mcarePage.locator('xpath=//p[contains(text(),"Rules")]')).toBeVisible();


  await mcarePage.locator('[data-testid="RocketLaunchOutlinedIcon"]').first().click();
  await mcarePage.locator('xpath=//button[text()="Yes"]').first().click();
  const popUP = mcarePage.locator('xpath=//h2[text()="Release Operation Results"]').first();
  await popUP.waitFor({timeout:2*60*1000});
  
  await expect(popUP).toBeVisible({timeout:2*60*1000});
  await mcarePage.locator('xpath=//button[text()="Close"]').first().click();

  await mcarePage.waitForTimeout(3 * 60 * 1000);
  }


})


test.only('Release rules 2', async ({ landingPage, page }) => {
  test.setTimeout(0);
  const mcarePage = await landingPage.gotoMcarePage();

  // --- Navigate + apply filters ONCE ---
  await mcarePage.getByRole('button', { name: 'Rules Configuration' }).click();
  await expect(mcarePage.getByRole('heading', { name: 'Rule Master List' })).toBeVisible();
  await expect(mcarePage.locator("td.MuiTableCell-root div.MuiBox-root").first()).toBeVisible();

  await mcarePage.getByRole('textbox', { name: 'Type value..' }).nth(1).fill('0.01');
  await mcarePage.getByRole('textbox', { name: 'Type value..' }).nth(2).fill('2027');
  // await mcarePage.locator('[placeholder="Type or select value.."]').nth(2).fill('Portals');
  await mcarePage.getByRole('textbox', { name: 'Type value..' }).nth(1).press('Enter');
  await expect(mcarePage.locator('tbody tr').nth(2)).toBeVisible();

  // Helper: first Rule Id link on the current page (numeric links in the table body)
  const getFirstRuleId = async () =>
    (await mcarePage.locator('tbody tr a').first().textContent())?.trim() ?? '';

  const MAX_PAGES = 200;

  for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
    console.log(`----- Page ${pageNum} -----`);

    try {
      // Select all rows on this page
      await mcarePage.locator('xpath=//input').first().click();
      await expect(mcarePage.locator('xpath=//p[contains(text(),"Rules")]')).toBeVisible();

      // Trigger release
      await mcarePage.locator('[data-testid="RocketLaunchOutlinedIcon"]').first().click();
      await mcarePage.locator('xpath=//button[text()="Yes"]').first().click();

      // Wait for the results popup
      const popUP = mcarePage.locator('xpath=//h2[text()="Release Operation Results"]').first();
      await popUP.waitFor({ timeout: 5 * 60 * 1000 });
      await expect(popUP).toBeVisible();

      // Log success vs failure (does NOT stop the loop)
      const failToast = mcarePage.locator('xpath=//*[contains(text(),"failed to release")]');
      if (await failToast.isVisible().catch(() => false)) {
        console.log(`Page ${pageNum}: some rules FAILED to release`);
      } else {
        console.log(`Page ${pageNum}: release OK`);
      }

      // Close popup
      await mcarePage.locator('xpath=//button[text()="Close"]').first().click();
    } catch (err) {
      // One page erroring shouldn't kill the whole run — log and continue
      console.log(`Page ${pageNum} errored: ${(err as Error).message}`);
    }

    // --- Move to next page ---
    const nextBtn = mcarePage.locator('button[aria-label="Go to next page"]');
    if (await nextBtn.isDisabled().catch(() => true)) {
      console.log('Reached the last page. Stopping.');
      break;
    }

    const before = await getFirstRuleId();
    await nextBtn.click();
    // Wait until the table actually shows a new page (first Rule Id changes)
    await expect
      .poll(getFirstRuleId, { timeout: 60_000 })
      .not.toBe(before);

    // await mcarePage.waitForTimeout(1 * 60 * 1000);
  }
});