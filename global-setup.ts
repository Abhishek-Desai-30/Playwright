import dotenv from 'dotenv';
import path from "node:path";

async function globalSetup() {

    const env: string =
        process.env.TEST_ENV ||
        process.env.ENV ||
        '';

    const envName = env.trim();

    const dotenvResult = dotenv.config({
      path: path.resolve(
        __dirname,
        `.env.${envName}`
      ),
      override: true
    });

    if (dotenvResult.error) {
      throw dotenvResult.error;
    }

    console.log('ENV:', envName);
    console.log('BASE_URL:', process.env.BASE_URL);

}

export default globalSetup;
