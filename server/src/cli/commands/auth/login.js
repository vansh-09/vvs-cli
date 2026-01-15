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
import prisma from "../../../lib/db.js";
import { is } from "zod/v4/locales";
import { Command } from "commander";

dotenv.config({ quiet: true });

const URL = "http://localhost:3005";
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CONFIG_DIR = path.join(os.homedir(), ".better-auth");
const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");

export async function loginAction(opts) {
  const options = z.object({
    serverUrl: z.string().optional(),
    cliendId: z.string().optional(),
  });
  const serverUrl = options.serverUrl || URL;
  const clientId = options.cliendId || CLIENT_ID;

  intro(chalk.bold("Auth CLI Login"));

  //TODO: change with token management utils
  const existingToken = false;
  const expired = false;

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
        `Failed to request device authorization:${error.error_description}`
      );
      process.exit(1);
    }

    const {
      device_code,
      user_code,
      verification_uri,
      verification_uri_complete,
      expires_in = 5,
      interval,
    } = data;

    console.log(chalk.cyanBright("Device Authorization Required"));

    console.log(
      `Please Visit " ${chalk.underline.blue(
        verification_uri || verification_uri_complete
      )}`

    );
    console.log(`Enter the Code: ${chalk.bold.yellow(user_code)}`);

    const shouldOpen = await confirm({
        message: "Open browser automatically?",
        initialValue: true, 
    })
    if (!isCancel(shouldOpen) && shouldOpen){
        const urlToOpen = verification_uri_complete || verification_uri;
        await open(urlToOpen);
    }
    console.log(chalk.gray(
        `Waiting for authorization (expires in ${Math.floor(expires_in / 60)} minutes)...`
    ))

  } catch (error) {}
}

//===========================================
//COMMANDER Setup
//===========================================

export const login = new Command("login")
  .description("Login to Better Auth")
  .option("--server-url <url>", "the better-auth server URL", URL)
  .option("--client-id <id>", "the oAuth client ID ", CLIENT_ID)
  .action(loginAction);
