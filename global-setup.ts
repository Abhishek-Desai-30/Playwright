import { chromium, expect } from "@playwright/test";
import dotenv from 'dotenv';
import { channel } from "node:diagnostics_channel";
import path from "node:path";

async function globalSetup() {

    const env =
        process.env.TEST_ENV ||
        'optum.qa';

    dotenv.config({
      path: path.resolve(
        __dirname,
        `.env.${env}`
      ),
      override: true
    });

    console.log('ENV:', env);
    console.log('BASE_URL:', process.env.BASE_URL);

}

export default globalSetup;