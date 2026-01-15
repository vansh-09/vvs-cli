import { cancel, confirm, intro, outro, isCancel } from "@clack/prompts";
import { logger } from "better-auth";
import { createAuthClient } from "better-auth/client";
import { deviceAuthorizationClient } from "better-auth/client/plugins";

import chalk from "chalk";
import os from "os";
import path from "path";
import fs from "node:fs/promises";
import yoctoSpinner from "yocto-spinner";
import * as z from "zod/v4";
import dotenv from "dotenv";
import { Command } from "commander";
import open from "open";
import { getStoredToken, isTokenExpired, storeToken } from "../../../lib/token.js";

dotenv.config({ quiet: true });

const URL = "http://localhost:3005";
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
export const CONFIG_DIR = path.join(os.homedir(), ".better-auth");
export const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");

//===========================================
// TOKEN MANAGEMENT
//===========================================

export async function loginAction(opts) {
  const options = z.object({
    serverUrl: z.string().optional(),
    clientId: z.string().optional(),
  });

  const parsed = options.parse(opts);

  const serverUrl = parsed.serverUrl || URL;
  const clientId = parsed.clientId || CLIENT_ID;

  intro(chalk.bold("Auth CLI Login"));

  const existingToken = await getStoredToken();
  const expired = isTokenExpired();

  if (existingToken && !expired) {
    const shouldReAuth = await confirm({
      message: "You are already logged in. Do you want to login again?",
      initialValue: false,
    });

    if (isCancel(shouldReAuth) || !shouldReAuth) {
      cancel("Login cancelled.");
      process.exit(0);
    }
  }

  const authClient = createAuthClient({
    baseURL: serverUrl,
    plugins: [deviceAuthorizationClient()],
  });

  const spinner = yoctoSpinner({
    text: "Requesting device authorization...",
  });

  spinner.start();

  try {
    const { data, error } = await authClient.device.code({
      client_id: clientId,
      scope: "openid profile email",
    });

    spinner.stop();

    if (error || !data) {
      logger.error(
        `Failed to request device authorization: ${error?.error_description}`
      );
      process.exit(1);
    }

    const {
      device_code,
      user_code,
      verification_uri,
      verification_uri_complete,
      expires_in,
      interval,
    } = data;

    console.log(chalk.cyanBright("Device Authorization Required"));
    console.log(
      `Please Visit "${chalk.underline.blue(
        verification_uri || verification_uri_complete
      )}"`
    );
    console.log(`Enter the Code: ${chalk.bold.yellow(user_code)}`);

    const shouldOpen = await confirm({
      message: "Open browser automatically?",
      initialValue: true,
    });

    if (!isCancel(shouldOpen) && shouldOpen) {
      const urlToOpen = verification_uri_complete || verification_uri;
      await open(urlToOpen);
    }

    console.log(
      chalk.gray(
        `Waiting for authorization (expires in ${Math.floor(
          expires_in / 60
        )} minutes)...`
      )
    );

    await pollForToken(authClient, device_code, clientId, interval);
    if (token) {
      const saved = await storeToken();
      if (!saved) {
        console.log(
          chalk.yellow("\n Warning: could not save authentication token")
        );
        console.log(chalk.yellow("You may need to login again on next use"));
      }

      //TODO: get user data
      outro(chalk.green("Login successful!"));
      console.log(chalk.gray(`\n Token saved to: ${TOKEN_FILE}`));
      console.log(
        chalk.gray(
          `You can now use the AI commands without logging in again . \n`
        )
      );
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red("\nLogin failed:"), error.message);
    process.exit(1);
  }
}

async function pollForToken(authClient, deviceCode, clientId, initialInterval) {
  let pollingInterval = initialInterval;
  const spinner = yoctoSpinner({ text: "", color: "cyan" });
  let dots = 0;

  return new Promise((resolve, reject) => {
    const poll = async () => {
      dots = (dots + 1) % 4;
      spinner.text(
        chalk.gray(
          `Polling for authorization ${".".repeat(dots)}${" ".repeat(3 - dots)}`
        )
      );

      if (!spinner.isSpinning) spinner.start();

      try {
        const { data, error } = await authClient.device.token({
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          device_code: deviceCode,
          client_id: clientId,
          fetchOptions: {
            headers: {
              "user-agent": "My CLI",
            },
          },
        });

        if (data?.access_token) {
          console.log(
            chalk.bold.yellow(`Your access token is: ${data.access_token}`)
          );
          spinner.stop();
          resolve(data);
          return;
        }

        if (error) {
          switch (error.error) {
            case "authorization_pending":
              break;
            case "slow_down":
              pollingInterval += 5;
              break;
            case "access_denied":
              spinner.stop();
              reject(new Error("Access denied"));
              return;
            case "expired_token":
              spinner.stop();
              reject(new Error("Device code expired"));
              return;
            default:
              spinner.stop();
              reject(new Error(error.error_description));
              return;
          }
        }
      } catch (error) {
        spinner.stop();
        reject(error);
        return;
      }

      setTimeout(poll, pollingInterval * 1000);
    };

    setTimeout(poll, pollingInterval * 1000);
  });
}

//===========================================
// COMMANDER Setup
//===========================================

export const login = new Command("login")
  .description("Login to Better Auth")
  .option("--server-url <url>", "the better-auth server URL", URL)
  .option("--client-id <id>", "the oAuth client ID", CLIENT_ID)
  .action(loginAction);
