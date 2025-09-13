const dataManager = require("../data/dataManager");
const {
  getMainMenuKeyboard,
  getSystemPromptsKeyboard,
  getSettingsKeyboard,
  getBackButton,
} = require("../keyboards/keyboards");

async function handleCallback(bot, callbackQuery) {
  if (!callbackQuery || !callbackQuery.message || !callbackQuery.message.chat) {
    console.error("Invalid callback query received");
    return;
  }

  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const messageId = callbackQuery.message.message_id;

  // Initialize user with safety check
  if (!dataManager.initializeUser(chatId)) {
    try {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Error: Please restart with /start",
      });
    } catch (error) {
      console.error("Error answering callback query:", error);
    }
    return;
  }

  try {
    switch (data) {
      case "main_menu":
        await bot.editMessageText("🎛️ **Main Menu**\nChoose an option:", {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "Markdown",
          ...getMainMenuKeyboard(),
        });
        break;

      case "new_conversation":
        if (dataManager.clearConversation(chatId)) {
          await dataManager.saveData();
          await bot.editMessageText(
            "🆕 **New conversation started!**\n\nYour conversation history has been cleared. You can now start fresh!",
            {
              chat_id: chatId,
              message_id: messageId,
              parse_mode: "Markdown",
              ...getBackButton(),
            }
          );
        } else {
          await bot.editMessageText(
            "❌ Error clearing conversation. Please try again.",
            {
              chat_id: chatId,
              message_id: messageId,
              parse_mode: "Markdown",
              ...getBackButton(),
            }
          );
        }
        break;

      case "view_history":
        await handleViewHistory(bot, chatId, messageId);
        break;

      case "change_persona":
        await handleChangePersona(bot, chatId, messageId);
        break;

      case "settings":
        await bot.editMessageText(
          "⚙️ **Settings**\n\nCustomize your experience:",
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown",
            ...getSettingsKeyboard(chatId),
          }
        );
        break;

      case "stats":
        await handleStats(bot, chatId, messageId);
        break;

      case "help":
        await handleHelp(bot, chatId, messageId);
        break;

      case "change_max_history":
        await bot.editMessageText(
          "📝 **Change Max History**\n\nSend a number (5-50) for maximum conversation history:",
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown",
            ...getBackButton("settings"),
          }
        );
        dataManager.setUserSetting(chatId, "waitingFor", "max_history");
        break;

      case "clear_all_data":
        if (dataManager.clearConversation(chatId)) {
          await dataManager.saveData();
          await bot.editMessageText(
            "🗑️ **All data cleared!**\n\nYour conversation history has been permanently deleted.",
            {
              chat_id: chatId,
              message_id: messageId,
              parse_mode: "Markdown",
              ...getBackButton(),
            }
          );
        } else {
          await bot.editMessageText(
            "❌ Error clearing data. Please try again.",
            {
              chat_id: chatId,
              message_id: messageId,
              parse_mode: "Markdown",
              ...getBackButton(),
            }
          );
        }
        break;

      case "export_data":
        await handleExportData(bot, chatId);
        break;

      default:
        // Handle system prompt changes
        if (data.startsWith("set_prompt_")) {
          await handleSetPrompt(bot, chatId, messageId, data);
        } else {
          console.log("Unknown callback data:", data);
        }
        break;
    }

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    console.error("Error handling callback query:", error);
    try {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "An error occurred! Please try again.",
      });
    } catch (answerError) {
      console.error("Error answering callback query after error:", answerError);
    }
  }
}

async function handleViewHistory(bot, chatId, messageId) {
  try {
    if (!dataManager.isUserInitialized(chatId)) {
      await bot.editMessageText(
        "❌ No user data found. Please restart with /start",
        {
          chat_id: chatId,
          message_id: messageId,
          ...getBackButton(),
        }
      );
      return;
    }

    const history = dataManager.conversations[chatId] || [];
    let historyText = "📜 **Conversation History**\n\n";

    if (history.length === 0) {
      historyText += "No conversations yet. Start chatting!";
    } else {
      const recentHistory = history.slice(-5);
      recentHistory.forEach((msg, index) => {
        if (msg && msg.role && msg.content) {
          const role = msg.role === "user" ? "👤" : "🤖";
          const content =
            msg.content.length > 100
              ? msg.content.substring(0, 100) + "..."
              : msg.content;
          historyText += `${role} ${content}\n\n`;
        }
      });
      historyText += `\n📊 Total messages: ${history.length}`;
    }

    await bot.editMessageText(historyText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "Markdown",
      ...getBackButton(),
    });
  } catch (error) {
    console.error("Error in handleViewHistory:", error);
    await bot.editMessageText("❌ Error loading history. Please try again.", {
      chat_id: chatId,
      message_id: messageId,
      ...getBackButton(),
    });
  }
}

async function handleChangePersona(bot, chatId, messageId) {
  try {
    const currentPersona = dataManager.getUserSetting(
      chatId,
      "currentSystemPrompt",
      "assistant"
    );
    await bot.editMessageText(
      `🎭 **Choose AI Persona**\n\nCurrent: **${currentPersona}**\n\nSelect a new persona:`,
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        ...getSystemPromptsKeyboard(),
      }
    );
  } catch (error) {
    console.error("Error in handleChangePersona:", error);
    await bot.editMessageText("❌ Error loading personas. Please try again.", {
      chat_id: chatId,
      message_id: messageId,
      ...getBackButton(),
    });
  }
}

async function handleStats(bot, chatId, messageId) {
  try {
    const stats = dataManager.getStats(chatId);

    const statsText = `📊 **Your Statistics**
    
💬 Total messages: ${stats.totalMessages}
👤 Your messages: ${stats.userMessages}
🤖 AI responses: ${stats.aiMessages}
🎭 Current persona: **${stats.currentPersona}**
📝 Max history: ${stats.maxHistory}`;

    await bot.editMessageText(statsText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "Markdown",
      ...getBackButton(),
    });
  } catch (error) {
    console.error("Error in handleStats:", error);
    await bot.editMessageText(
      "❌ Error loading statistics. Please try again.",
      {
        chat_id: chatId,
        message_id: messageId,
        ...getBackButton(),
      }
    );
  }
}

async function handleHelp(bot, chatId, messageId) {
  try {
    const helpText = `❓ **Help & Instructions**

**Commands:**
• /start - Show welcome message
• /menu - Show main menu
• Just send any message to chat with AI

**Features:**
🧠 **Memory**: I remember our conversation
🎭 **Personas**: Different AI personalities
💾 **History**: View past conversations
⚙️ **Settings**: Customize your experience

**Tips:**
• Use "New Conversation" to start fresh
• Change personas for different response styles
• Adjust max history in settings for performance

**Troubleshooting:**
• If bot stops working, use /start to reset
• Contact support if issues persist`;

    await bot.editMessageText(helpText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "Markdown",
      ...getBackButton(),
    });
  } catch (error) {
    console.error("Error in handleHelp:", error);
    await bot.editMessageText("❌ Error loading help. Please try again.", {
      chat_id: chatId,
      message_id: messageId,
      ...getBackButton(),
    });
  }
}

async function handleExportData(bot, chatId) {
  try {
    const exportData = dataManager.exportUserData(chatId);
    const exportText = JSON.stringify(exportData, null, 2);

    await bot.sendDocument(chatId, Buffer.from(exportText), {
      filename: `conversation_export_${chatId}_${Date.now()}.json`,
    });
  } catch (error) {
    console.error("Error in handleExportData:", error);
    bot.sendMessage(chatId, "❌ Error exporting data. Please try again later.");
  }
}

async function handleSetPrompt(bot, chatId, messageId, data) {
  try {
    const promptKey = data.replace("set_prompt_", "");

    // Validate prompt exists
    if (!dataManager.systemPrompts[promptKey]) {
      await bot.editMessageText(
        "❌ Invalid persona selected. Please try again.",
        {
          chat_id: chatId,
          message_id: messageId,
          ...getBackButton(),
        }
      );
      return;
    }

    if (dataManager.setUserSetting(chatId, "currentSystemPrompt", promptKey)) {
      await dataManager.saveData();

      await bot.editMessageText(
        `🎭 **Persona Changed!**\n\nNow using: **${promptKey}**\n\n${dataManager.systemPrompts[promptKey]}`,
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "Markdown",
          ...getBackButton(),
        }
      );
    } else {
      await bot.editMessageText(
        "❌ Error changing persona. Please try again.",
        {
          chat_id: chatId,
          message_id: messageId,
          ...getBackButton(),
        }
      );
    }
  } catch (error) {
    console.error("Error in handleSetPrompt:", error);
    await bot.editMessageText("❌ Error changing persona. Please try again.", {
      chat_id: chatId,
      message_id: messageId,
      ...getBackButton(),
    });
  }
}

module.exports = {
  handleCallback,
};
