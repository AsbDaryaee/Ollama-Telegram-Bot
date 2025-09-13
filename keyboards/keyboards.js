const dataManager = require("../data/dataManager");

function createGlassyKeyboard(buttons) {
  if (!Array.isArray(buttons)) {
    console.error("Invalid buttons array for keyboard");
    return { reply_markup: { inline_keyboard: [] } };
  }

  return {
    reply_markup: {
      inline_keyboard: buttons,
    },
  };
}

function getMainMenuKeyboard() {
  return createGlassyKeyboard([
    [
      { text: "🆕 New Conversation", callback_data: "new_conversation" },
      { text: "💬 View History", callback_data: "view_history" },
    ],
    [
      { text: "🎭 Change Persona", callback_data: "change_persona" },
      { text: "⚙️ Settings", callback_data: "settings" },
    ],
    [
      { text: "📊 Stats", callback_data: "stats" },
      { text: "❓ Help", callback_data: "help" },
    ],
  ]);
}

function getSystemPromptsKeyboard() {
  try {
    if (
      !dataManager.systemPrompts ||
      typeof dataManager.systemPrompts !== "object"
    ) {
      console.error("System prompts not available");
      return createGlassyKeyboard([
        [{ text: "❌ Error loading personas", callback_data: "main_menu" }],
        [{ text: "🔙 Back to Menu", callback_data: "main_menu" }],
      ]);
    }

    const buttons = [];
    const promptKeys = Object.keys(dataManager.systemPrompts);

    if (promptKeys.length === 0) {
      return createGlassyKeyboard([
        [{ text: "❌ No personas available", callback_data: "main_menu" }],
        [{ text: "🔙 Back to Menu", callback_data: "main_menu" }],
      ]);
    }

    for (let i = 0; i < promptKeys.length; i += 2) {
      const row = [];
      if (promptKeys[i]) {
        row.push({
          text: `🎭 ${promptKeys[i]}`,
          callback_data: `set_prompt_${promptKeys[i]}`,
        });
      }
      if (i + 1 < promptKeys.length && promptKeys[i + 1]) {
        row.push({
          text: `🎭 ${promptKeys[i + 1]}`,
          callback_data: `set_prompt_${promptKeys[i + 1]}`,
        });
      }
      if (row.length > 0) {
        buttons.push(row);
      }
    }

    buttons.push([{ text: "🔙 Back to Menu", callback_data: "main_menu" }]);

    return createGlassyKeyboard(buttons);
  } catch (error) {
    console.error("Error creating system prompts keyboard:", error);
    return createGlassyKeyboard([
      [{ text: "❌ Error loading personas", callback_data: "main_menu" }],
      [{ text: "🔙 Back to Menu", callback_data: "main_menu" }],
    ]);
  }
}

function getSettingsKeyboard(chatId) {
  try {
    if (!dataManager.isUserInitialized(chatId)) {
      return createGlassyKeyboard([
        [{ text: "❌ User data not found", callback_data: "main_menu" }],
        [{ text: "🔙 Back to Menu", callback_data: "main_menu" }],
      ]);
    }

    const maxHistory = dataManager.getUserSetting(chatId, "maxHistory", 10);

    return createGlassyKeyboard([
      [
        {
          text: `📝 Max History: ${maxHistory}`,
          callback_data: "change_max_history",
        },
      ],
      [
        { text: "🗑️ Clear All Data", callback_data: "clear_all_data" },
        { text: "💾 Export Data", callback_data: "export_data" },
      ],
      [{ text: "🔙 Back to Menu", callback_data: "main_menu" }],
    ]);
  } catch (error) {
    console.error("Error creating settings keyboard:", error);
    return createGlassyKeyboard([
      [{ text: "❌ Error loading settings", callback_data: "main_menu" }],
      [{ text: "🔙 Back to Menu", callback_data: "main_menu" }],
    ]);
  }
}

function getBackButton(callbackData = "main_menu") {
  return createGlassyKeyboard([
    [{ text: "🔙 Back to Menu", callback_data: callbackData }],
  ]);
}

function getMenuButton() {
  return createGlassyKeyboard([
    [{ text: "📱 Menu", callback_data: "main_menu" }],
  ]);
}

module.exports = {
  createGlassyKeyboard,
  getMainMenuKeyboard,
  getSystemPromptsKeyboard,
  getSettingsKeyboard,
  getBackButton,
  getMenuButton,
};
