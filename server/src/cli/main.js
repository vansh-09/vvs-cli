#!/usr/bin/env node

import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import figlet from "figlet";

import { Command } from "commander";
import { login, logout, whoami } from "./commands/auth/login.js";
import { wakeUp } from "./commands/ai/wakeUp.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  quiet: true,
  path: path.join(__dirname, "..", "..", ".env"),
});
async function main() {
  //Display banner
  console.log(
    chalk.cyan(
      figlet.textSync("vvs CLI", {
        horizontalLayout: "default",
        verticalLayout: "default",
        font: "Standard",
      }),
    ),
  );
  console.log(chalk.red("A cli based AI tool \n"));

  const program = new Command("vvs");

  program
    .version("0.0.1")
    .addCommand(login)
    .addCommand(logout)
    .addCommand(whoami)
    .addCommand(wakeUp);

  program.action(() => {
    program.help();
  });

  program.parse();
}

main().catch((err) => {
  console.error(chalk.red("Error running the CLI: "), err);
  process.exit(1);
});
