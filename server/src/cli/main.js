#!/usr/bin/env node

import dotenv from "dotenv";
import chalk from "chalk";
import figlet from "figlet";

import { Command } from "commander";
import { login } from "./commands/auth/login.js";

dotenv.config({ quiet: true });
async function main() {
  //Display banner
  console.log(
    chalk.cyan(
      figlet.textSync("vvs CLI", {
        horizontalLayout: "default",
        verticalLayout: "default",
        font: "Standard",
      })
    )
  );
  console.log(chalk.red("A cli based AI tool \n"));

  const program = new Command("vvs");

  program
    .version("0.0.1")
    .description("VVS CLI - A cli based AI tool")
    .addCommand(login);

  program.action(() => {
    program.help();
  });

  program.parse();
}

main().catch((err) => {
  console.error(chalk.red("Error running the CLI: "), err);
  process.exit(1);
});
