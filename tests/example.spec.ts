/// <reference types="node" />
import { test } from '../fixture/base';
import { LandingPage } from '../page/LandingPage';


test('Navigate to all module', async ({ landingPage }) => {

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
