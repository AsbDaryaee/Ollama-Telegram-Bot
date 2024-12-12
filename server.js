const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
require("dotenv").config();

// Access Your Telegram Bot Token From .env File.
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

// Place your Ollama API endpoint
// If you are using Ollama on you local machine, the url would be like this:
// http://localhost:11434/api/generate
const OLLAMA_API_URL = process.env.OLLAMA_API_URL;

// Initialize the bot
const bot = new TelegramBot(TELEGRAM_TOKEN, {
  polling: true,

  // If you need Proxy to connect to the Telegram servers
  request: {
    proxy: process.env.PROXY,
  },
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  if (userMessage === "/start" || userMessage === "/stop") {
    bot.sendMessage(chatId, " Welcome, Send Your First Question or Prompt!");
  } else {
    if (!userMessage) {
      bot.sendMessage(chatId, "I can only process text messages.");
      return;
    }

    try {
      // Send the user's message to Ollama
      const response = await axios.post(OLLAMA_API_URL, {
        model: "llama3.2:3b",
        system: "You are mario from Super Mario Bros!",
        prompt: userMessage,
        stream: false,
      });

      // Get Ollama's response
      const ollamaResponse = response.data.response;

      // Send the response back to the user
      bot.sendMessage(chatId, ollamaResponse);
    } catch (error) {
      console.error("Error communicating with Ollama:", error.message);
      bot.sendMessage(
        chatId,
        "Sorry, I couldn't process your message. Please try again later."
      );
    }
  }
});

console.log("*** Bot is running...");
