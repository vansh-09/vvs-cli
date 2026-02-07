import { create } from "ts-node";
import { CONFIG_DIR, TOKEN_FILE } from "../cli/commands/auth/login.js";
import chalk from "chalk";
import { log } from "@clack/prompts";

export async function getStoredToken() {
  try {
    const data = await fs.readFile(TOKEN_FILE, "utf-8");
    const token = JSON.parse(data);
    return token;
  } catch (error) {
    //file does not exist or cannot be read
    return null;
  }
}

export async function storeToken(token) {
  try {
    //check if config dir exists, if not create it
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    //storing tokens with metadata
    const tokenData = {
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      token_type: token.token_type || "Bearer",
      scope: token.scope,
      expires_at: token.expires_in
        ? new Date(Date.now() + token.expires_in * 1000).toISOString()
        : null,
      created_at: new Date().toISOString(),
    };
    await fs.writeFile(TOKEN_FILE, JSON.stringify(tokenData, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error(chalk.red("Failed to store token:"), error.message);
    return false;
  }
}

export async function clearStoredToken() {
  try {
    await fs.unlink(TOKEN_FILE);
    return true;
  } catch (error) {
    //file does not exist or cannot be deleted
    return false;
  }
}

export async function isTokenExpired() {
  const token = await getStoredToken();
  if (!token || !token.expires_at) {
    return true;
  }

  const expiresAt = new Date(token.expires_at);
  const now = new Date();

  //considering expired if less than 5 minutes remaining
  return expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;
}

export async function requireAuth() {
  const token = await getStoredToken();

  if (!token) {
    console.log(
      chalk.red("Not Authenticated. Please run 'vvs login' first.")
    );
    process.exit(1);

    if (await isTokenExpired(token)) {
      console.log(chalk.yellow("Session expired. Please login again."));
      console.log(chalk.gray("run  login \n"));
      process.exit(1);
    }
  }
}
