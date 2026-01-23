import chalk from "chalk";
import { Command } from "commander";
import yoctoSpinner from "yocto-spinner";
import { getStoredToken } from "../auth/login.js";
import prisma from "../../../lib/db.js";
import { select } from "@clack/prompts";

const wakeUpAction = async () => {
  const token = getStoredToken();
  if (!token) {
    console.log(chalk.red("Not Authenticated! Please login first."));
    return;
  }

  const spinner = yoctoSpinner({ text: "fetching user info..." });
  spinner.start();

  const user = await prisma.user.findFirst({
    where: { sessions: { some: { token: token.access_token } } },
    select: { id: true, name: true, email: true },
  });
  spinner.stop();

  if (!user) {
    console.log(chalk.red("User not found! Please login again."));
    return;
  }

  console.log(chalk.green(`Welcome back, ${user.name || user.email}!`));

  const choice = await select({
    message: "Select an option:",
    options: [
      { value: "chat", label: "Chat", hint: "Simple Chat with AI" },
      {
        value: "tool",
        label: "Tool calling",
        hint: "Chat with tools (Google Search, Code Execution)",
      },
      { value: "agent", label: "Agentic Mode", hint: "coming soon" },
    ],
  });

  switch (choice) {
    case "chat":
      console.log(chalk.yellow("Chat mode selected"));
      break;
    case "tool":
      console.log(chalk.yellow("Tool calling selected"));
      break;
    case "agent":
      console.log(chalk.yellow("Agentic mode coming soon"));
      break;
    default:
      console.log(chalk.red("Invalid choice"));
  }
};

export const wakeUp = new Command("wake-up")
  .description("Wake up the AI and choose a mode")
  .action(wakeUpAction);
