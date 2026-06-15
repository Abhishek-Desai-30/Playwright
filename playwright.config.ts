import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file based on ENV variable
const env = (process.env.ENV || 'qa').trim();
const envFile = `.env.${env}`;
const envPath = path.resolve(__dirname, envFile);

const dotenvResult = dotenv.config({
  path: envPath,
  override: false
});

if (dotenvResult.error) {
  if ((dotenvResult.error as { code?: string }).code === 'ENOENT') {
    console.warn(`Environment file not found: ${envPath}. Continuing with existing process.env values.`);
  } else {
    throw new Error(`Error loading environment file ${envPath}: ${dotenvResult.error.message}`);
  }
} else {
  console.log(`Loaded environment from: ${envPath}`);
}


console.log('process.env.ENV:', process.env.ENV);
console.log('playwright config file BASE_URL:', process.env.BASE_URL);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  timeout: 180000,
  expect: { timeout: 120000 },
  

  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  //retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  
  retries: 1,

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: process.env.BASE_URL,
    channel: 'msedge',
    headless: false,
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    screenshot:'only-on-failure',
    storageState: undefined,
    launchOptions: {
      timeout: 180000,
      args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled',
      ],
    }
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      use: {
        channel: 'msedge',
      },
      testMatch: '**/login\.setup\.ts',
      timeout: 180000,
    },

    {
      name: 'mcare-setup',
      use: {
        channel: 'msedge',
      },
      testMatch: '**/mcare-login\.setup\.ts',
      timeout: 180000,
    },

    {
      name: 'regress',
      use: {
        channel: 'msedge',
        headless: false,
        viewport: null,
        launchOptions:{
              args: [
                    '--start-maximized',
                    '--disable-blink-features=AutomationControlled',
                ],
        },
        storageState: '.auth/user.json',
        baseURL: process.env.BASE_URL || 'https://esync-shregress.optum.com/',
      },
      dependencies: ['mcare-setup','setup'],
      testMatch: '**/example.spec.ts',
      timeout: 180000,
    },

    {
      name: 'regress2',
      use: {
        channel: 'msedge',
        headless: false,
        viewport: null,
        launchOptions:{
              args: [
                    '--start-maximized',
                    '--disable-blink-features=AutomationControlled',
                ],
        },
        storageState: '.auth/user.json',
        baseURL: process.env.BASE_URL || 'https://esync-shregress.optum.com/',
      },
      // dependencies: ['mcare-setup','setup'],
      testMatch: '**/example.spec.ts',
      timeout: 180000,
    },
  ],
});
