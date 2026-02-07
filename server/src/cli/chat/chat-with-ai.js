import chalk from "chalk";
import boxen from "boxen";
import { text, isCancel, cancel, intro, outro } from "@clack/prompts";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import { AIService } from "../ai/google-service.js";
import { ChatService } from "../../service/chat-service.js";
import { getStoredToken } from "../commands/auth/login.js";
import prisma from "../../lib/db.js";
import yoctoSpinner from "yocto-spinner";

marked.use(
  markedTerminal({
    // Styling options for markedTerminal
    code: chalk.cyan,
    blockquote: chalk.gray.italic,
    heading: chalk.green.bold,
    firstHeading: chalk.magenta.underline.bold,
    hr: chalk.reset,
    listitem: chalk.reset,
    list: chalk.reset,
    paragraph: chalk.reset,
    strong: chalk.bold,
    em: chalk.italic,
    codespan: chalk.yellow.bgBlack,
    del: chalk.dim.gray.strikethrough,
    link: chalk.blue.underline,
    href: chalk.blue.underline,
  }),
);

const aiService = new AIService();
const chatService = new ChatService();

async function getUserFromToken() {
  const token = await getStoredToken();
  if (!token?.access_token) {
    throw new Error("Not Authenticated. Please run 'vvs login' first");
  }

  const spinner = yoctoSpinner({ text: "Authenticating..." }).start();

  const user = await prisma.user.findUnique({
    where: { sessions: { some: { token: token.access_token } } },
  });

  if (!user) {
    spinner.error("User not found");
    throw new Error("User not found. Please log in again.");
  }

  spinner.success(`Welcome back, ${user.name}!`);
  return user;
}

async function initConversation(userId, conversationId = null, mode = "chat") {
  const spinner = yoctoSpinner({
    text: "Loading conversation...",
  }).start();

  const conversation = await chatService.getOrCreateConversation({
    userId,
    conversationId,
    mode,
  });
  spinner.success("Conversation loaded!");

  const conversationInfo = boxen(
    `${chalk.bold("Conversation")}: ${conversation.title}\n${chalk.gray(
      "ID: " + conversation.id,
    )}\n${chalk.gray("Mode: " + conversation.mode)}`,
    {
      padding: 1,
      margin: { bottom: 1, top: 1 },
      borderColor: "cyan",
      borderStyle: "round",
      title: chalk.cyan.bold("Conversation Info"),
      titleAlignment: "center",
    },
  );

  console.log(conversationInfo);

  if (conversation.messages?.length > 0) {
    console.log(chalk.yellow("Previous messages:"));
    displayMessages(conversation.messages);
  }

  return conversation;
}

function displayMessages(messages) {
  messages.forEach((msg) => {
    if (msg.role === "user") {
      const userBox = boxen(chalk.white(msg.content), {
        padding: 1,
        margin: { left: 2, bottom: 1 },
        borderStyle: "round",
        borderColor: "blue",
        title: "👤 You",
        titleAlignment: "left",
      });
      console.log(userBox);
    } else {
      // Render markdown for assistant messages
      const renderedContent = marked.parse(msg.content);
      const assistantBox = boxen(renderedContent.trim(), {
        padding: 1,
        margin: { left: 2, bottom: 1 },
        borderStyle: "round",
        borderColor: "green",
        title: "🤖 Assistant",
        titleAlignment: "left",
      });
      console.log(assistantBox);
    }
  });
}

async function saveMessage(conversationId, role, content) {
  return await chatService.addMessageToConversation({
    conversationId,
    role,
    content,
  });
}

async function getAIResponse(messages) {
  const spinner = yoctoSpinner({
    text: "AI is thinking...",
    color: "cyan",
  }).start();

  const dbMessages = await chatService.getMessages(conversationId);
  const aiResponse = await aiService.getChatCompletion(dbMessages);

  let fullResponse = "";

  let isFirstChunk = true;

  try {
    const result = await aiService.getChatCompletionStream(
      dbMessages,
      (chunk) => {
        if (isFirstChunk) {
          spinner.stop();
          console.log("\n");
          const header = chalk.green.bold("Assistant: ");
          console.log(header);
          console.log("-".repeat(60));
          isFirstChunk = false;
        }
        fullResponse += chunk;
      },
    );
    console.log("\n");
    const renderedMarkdown = marked.parse(fullResponse);
    console.log(renderedMarkdown);
    console.log(chalk.gray("-".repeat(60)));
    console.log("\n");

    return result.content
  } catch (error) {
    spinner.error("Error getting AI response");
    throw error;
  }
}



async function updateConversationTitle(conversationId, title) {
  if (messageCount === 1) {
    const title =
      parseUserInput.slice(0, 50) + (userInput.length > 50 ? "..." : "");
    await chatService.updateTitle(conversationId, title);
  }
}

async function chatLoop(conversation) {
  const helpBox = boxen(
    `${chalk.gray("• Type your message and press Enter")}\n${chalk.gray(
      "• Markdown formatting is supported in responses",
    )}\n${chalk.gray('• Type "exit" to end conversation')}\n${chalk.gray(
      "• Press Ctrl+C to quit anytime",
    )}`,
    {
      padding: 1,
      margin: { bottom: 1 },
      borderStyle: "round",
      borderColor: "gray",
      dimBorder: true,
    },
  );
  console.log(helpBox);

  while (true) {
    const userInput = await text({
      message: chalk.blue("Your message:"),
      placeholder: "Type your message here...",
      validate(value) {
        if (value || value.trim().length === 0) {
          return "Message cannot be empty";
        }
      },
    });
    if (isCancel(userInput)) {
      const exitBox = boxen(chalk.yellow("Chat Session Ended. ciao"), {
        padding: 1,
        margin: 1,
        borderColor: "yellow",
        borderStyle: "round",
      });
      console.log(exitBox);
      process.exit(0);
    }
    if (userInput.toLowerCase() === "exit") {
      const exitBox = boxen(chalk.yellow("Chat Session Ended. ciao"), {
        padding: 1,
        margin: 1,
        borderColor: "yellow",
        borderStyle: "round",
      });
      console.log(exitBox);
      process.exit(0);
    }

    await saveMessage(conversation.id, "user", userInput);

    const message = await chatService.getMessages(conversation.id);

    const aiResponse = await getAIResponse(messages);

    const savedMessage = await saveMessage(
      conversation.id,
      "assistant",
      aiResponse,
    );
    await updateConversationTitle(conversation.id, userInput, message.length);
  }
}

export async function startChat(mode = "chat", conversationId = null) {
  try {
    intro(
      boxen(chalk.cyan.bold("VVS AI Chat!"), {
        padding: 1,
        borderColor: "cyan",
        borderStyle: "double",
      }),
    );

    const user = await getUserFromToken();
    const conversation = await initConversation(user.id, conversationId, mode);
    await chatLoop(user, conversation);

    outro(chalk.green("Thanks for chatting!"));
  } catch (error) {
    const errorBox = boxen(chalk.red(error.message), {
      padding: 1,
      margin: 1,
      borderColor: "red",
      borderStyle: "round",
    });
    console.error(errorBox);
    process.exit(1);
  }
}
