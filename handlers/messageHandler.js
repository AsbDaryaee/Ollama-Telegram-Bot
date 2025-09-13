const axios = require("axios");
const config = require("../config/config");
const dataManager = require("../data/dataManager");
const {
  getMainMenuKeyboard,
  getMenuButton,
} = require("../keyboards/keyboards");

async function handleMessage(bot, msg) {
  if (!msg || !msg.chat || !msg.chat.id) {
    console.error("Invalid message object received");
    return;
  }

  const chatId = msg.chat.id;
  const userMessage = msg.text;

  // Skip if it's a command or callback or empty message
  if (!userMessage || userMessage.startsWith("/")) {
    return;
  }

  // Initialize user with safety check
  if (!dataManager.initializeUser(chatId)) {
    bot.sendMessage(
      chatId,
      "❌ Error initializing user data. Please try /start command."
    );
    return;
  }

  // Handle special inputs with safety checks
  const waitingFor = dataManager.getUserSetting(chatId, "waitingFor", null);
  if (waitingFor === "max_history") {
    const num = parseInt(userMessage);
    if (num >= 5 && num <= 50) {
      dataManager.setUserSetting(chatId, "maxHistory", num);
      dataManager.setUserSetting(chatId, "waitingFor", null);
      await dataManager.saveData();
      bot.sendMessage(
        chatId,
        `✅ Max history set to ${num}`,
        getMainMenuKeyboard()
      );
    } else {
      bot.sendMessage(chatId, "❌ Please enter a number between 5 and 50");
    }
    return;
  }

  try {
    // Send processing message
    const processingMsg = await bot.sendMessage(
      chatId,
      "🤖 Processing your message..."
    );

    // Add user message to conversation history with safety check
    if (!dataManager.addMessage(chatId, "user", userMessage)) {
      throw new Error("Failed to save user message");
    }

    // Trim conversation history
    dataManager.trimHistory(chatId);

    // Prepare conversation context for the API
    const conversationContext = dataManager.getConversationContext(chatId);
    const fullPrompt = conversationContext
      ? `Conversation history:\n${conversationContext}\n\nUser: ${userMessage}`
      : `User: ${userMessage}`;

    // Get current system prompt with fallback
    const currentSystemPromptKey = dataManager.getUserSetting(
      chatId,
      "currentSystemPrompt",
      "assistant"
    );
    const currentSystemPrompt =
      dataManager.systemPrompts[currentSystemPromptKey] ||
      dataManager.systemPrompts["assistant"] ||
      config.DEFAULT_SYSTEM_PROMPTS["assistant"];

    // Make API request with timeout
    const response = await axios.post(
      config.OLLAMA_API_URL,
      {
        model: config.OLLAMA_MODEL,
        system: currentSystemPrompt,
        prompt: fullPrompt,
        stream: false,
      },
      {
        timeout: 60000, // 60 second timeout
      }
    );

    // Validate API response
    if (!response.data || !response.data.response) {
      throw new Error("Invalid response from Ollama API");
    }

    const ollamaResponse = response.data.response;

    // Delete processing message
    try {
      await bot.deleteMessage(chatId, processingMsg.message_id);
    } catch (deleteError) {
      console.log("Could not delete processing message:", deleteError.message);
    }

    // Add AI response to conversation history with safety check
    if (!dataManager.addMessage(chatId, "assistant", ollamaResponse)) {
      console.error("Failed to save AI response");
    }

    // Save conversation data
    await dataManager.saveData();

    // Send response with menu option
    bot.sendMessage(chatId, ollamaResponse, getMenuButton());
  } catch (error) {
    console.error("Error in handleMessage:", error.message);

    // Delete processing message if it exists
    try {
      if (processingMsg && processingMsg.message_id) {
        await bot.deleteMessage(chatId, processingMsg.message_id);
      }
    } catch (deleteError) {
      console.log("Could not delete processing message after error");
    }

    // Send appropriate error message
    let errorMessage = "❌ Sorry, I couldn't process your message. ";
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      errorMessage += "The request timed out. Please try again.";
    } else if (error.code === "ECONNREFUSED") {
      errorMessage += "Cannot connect to AI service. Please try again later.";
    } else {
      errorMessage += "Please try again later.";
    }

    bot.sendMessage(chatId, errorMessage, getMenuButton());
  }
}

module.exports = {
  handleMessage,
};
