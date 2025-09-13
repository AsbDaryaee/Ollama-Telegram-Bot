const TelegramBot = require("node-telegram-bot-api");
const config = require("./config/config");
const dataManager = require("./data/dataManager");
const messageHandler = require("./handlers/messageHandler");
const callbackHandler = require("./handlers/callbackHandler");
const { getMainMenuKeyboard } = require("./keyboards/keyboards");

// Initialize the bot with error handling
let bot;
try {
  bot = new TelegramBot(config.TELEGRAM_TOKEN, {
    polling: true,
    request: {
      proxy: config.PROXY,
    },
  });
} catch (error) {
  console.error("Failed to initialize bot:", error);
  process.exit(1);
}

// Initialize data manager
dataManager.initialize().catch((error) => {
  console.error("Failed to initialize data manager:", error);
});

// Handle start command
bot.onText(/\/start/, async (msg) => {
  if (!msg || !msg.chat || !msg.chat.id) {
    console.error("Invalid start message received");
    return;
  }

  const chatId = msg.chat.id;

  try {
    // Force initialize user
    if (!dataManager.initializeUser(chatId)) {
      throw new Error("Failed to initialize user data");
    }

    const welcomeMessage = `
🤖 **Welcome to Enhanced AI Assistant!**

I'm your intelligent companion with memory and multiple personas. Here's what I can do:

✨ **Features:**
• 🧠 Remember our conversation history
• 🎭 Switch between different AI personas
• 💾 Save and manage conversations
• ⚙️ Customizable settings
• 📊 View chat statistics

Choose an option below to get started!
`;

    await bot.sendMessage(chatId, welcomeMessage, {
      parse_mode: "Markdown",
      ...getMainMenuKeyboard(),
    });
  } catch (error) {
    console.error("Error in /start command:", error);
    try {
      await bot.sendMessage(
        chatId,
        "❌ Error starting bot. Please try again or contact support."
      );
    } catch (sendError) {
      console.error("Failed to send error message:", sendError);
    }
  }
});

// Handle menu command
bot.onText(/\/menu/, async (msg) => {
  if (!msg || !msg.chat || !msg.chat.id) {
    console.error("Invalid menu message received");
    return;
  }

  const chatId = msg.chat.id;

  try {
    if (!dataManager.initializeUser(chatId)) {
      throw new Error("Failed to initialize user data");
    }

    await bot.sendMessage(chatId, "🎛️ **Main Menu**\nChoose an option:", {
      parse_mode: "Markdown",
      ...getMainMenuKeyboard(),
    });
  } catch (error) {
    console.error("Error in /menu command:", error);
    try {
      await bot.sendMessage(
        chatId,
        "❌ Error loading menu. Please try /start command."
      );
    } catch (sendError) {
      console.error("Failed to send error message:", sendError);
    }
  }
});

// Handle messages with error catching
bot.on("message", (msg) => {
  try {
    messageHandler.handleMessage(bot, msg);
  } catch (error) {
    console.error("Error in message handler:", error);
  }
});

// Handle callback queries with error catching
bot.on("callback_query", (callbackQuery) => {
  try {
    callbackHandler.handleCallback(bot, callbackQuery);
  } catch (error) {
    console.error("Error in callback handler:", error);
  }
});

// Handle bot errors
bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});

bot.on("webhook_error", (error) => {
  console.error("Webhook error:", error);
});

// Graceful shutdown
async function gracefulShutdown() {
  console.log("Shutting down bot gracefully...");
  try {
    if (dataManager.saveInterval) {
      clearInterval(dataManager.saveInterval);
    }
    await dataManager.saveData();
    console.log("Data saved successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
}

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown();
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

console.log("*** Bot is running...");
