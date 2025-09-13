const fs = require("fs").promises;
const path = require("path");
const config = require("../config/config");

class DataManager {
  constructor() {
    this.conversations = {};
    this.userSettings = {};
    this.systemPrompts = {};
    this.saveInterval = null;
  }

  async initialize() {
    await this.loadData();
    this.startAutoSave();
  }

  async ensureDataDir() {
    try {
      await fs.access(config.DATA_DIR);
    } catch {
      await fs.mkdir(config.DATA_DIR, { recursive: true });
    }
  }

  async loadData() {
    try {
      await this.ensureDataDir();

      // Load conversations with fallback
      try {
        const conversationsData = await fs.readFile(
          config.CONVERSATIONS_FILE,
          "utf8"
        );
        const parsed = JSON.parse(conversationsData);
        this.conversations = parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        console.log("No existing conversations file found, starting fresh");
        this.conversations = {};
      }

      // Load system prompts with fallback
      try {
        const systemPromptsData = await fs.readFile(
          config.SYSTEM_PROMPTS_FILE,
          "utf8"
        );
        const parsed = JSON.parse(systemPromptsData);
        this.systemPrompts = {
          ...config.DEFAULT_SYSTEM_PROMPTS,
          ...(parsed && typeof parsed === "object" ? parsed : {}),
        };
      } catch {
        console.log("No existing system prompts file found, using defaults");
        this.systemPrompts = { ...config.DEFAULT_SYSTEM_PROMPTS };
      }
    } catch (error) {
      console.error("Error loading data:", error);
      // Ensure we have valid defaults even if everything fails
      this.conversations = {};
      this.userSettings = {};
      this.systemPrompts = { ...config.DEFAULT_SYSTEM_PROMPTS };
    }
  }

  async saveData() {
    try {
      await this.ensureDataDir();

      // Ensure we have valid objects before saving
      const conversationsToSave =
        this.conversations && typeof this.conversations === "object"
          ? this.conversations
          : {};
      const systemPromptsToSave =
        this.systemPrompts && typeof this.systemPrompts === "object"
          ? this.systemPrompts
          : config.DEFAULT_SYSTEM_PROMPTS;

      await fs.writeFile(
        config.CONVERSATIONS_FILE,
        JSON.stringify(conversationsToSave, null, 2)
      );
      await fs.writeFile(
        config.SYSTEM_PROMPTS_FILE,
        JSON.stringify(systemPromptsToSave, null, 2)
      );
    } catch (error) {
      console.error("Error saving data:", error);
    }
  }

  startAutoSave() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
    this.saveInterval = setInterval(() => {
      this.saveData();
    }, config.SAVE_INTERVAL);
  }

  // Enhanced initialization with comprehensive checks
  initializeUser(chatId) {
    if (!chatId) {
      console.error("initializeUser called without chatId");
      return false;
    }

    // Ensure main objects exist
    if (!this.conversations || typeof this.conversations !== "object") {
      this.conversations = {};
    }
    if (!this.userSettings || typeof this.userSettings !== "object") {
      this.userSettings = {};
    }

    // Initialize user-specific data
    if (!Array.isArray(this.conversations[chatId])) {
      this.conversations[chatId] = [];
    }

    if (
      !this.userSettings[chatId] ||
      typeof this.userSettings[chatId] !== "object"
    ) {
      this.userSettings[chatId] = {
        currentSystemPrompt: "assistant",
        maxHistory: 10,
        waitingFor: null,
      };
    }

    // Ensure required properties exist
    if (!this.userSettings[chatId].currentSystemPrompt) {
      this.userSettings[chatId].currentSystemPrompt = "assistant";
    }
    if (
      !this.userSettings[chatId].maxHistory ||
      this.userSettings[chatId].maxHistory < 5
    ) {
      this.userSettings[chatId].maxHistory = 10;
    }

    return true;
  }

  // Safe user check
  isUserInitialized(chatId) {
    return (
      chatId &&
      this.conversations &&
      Array.isArray(this.conversations[chatId]) &&
      this.userSettings &&
      this.userSettings[chatId] &&
      typeof this.userSettings[chatId] === "object"
    );
  }

  addMessage(chatId, role, content) {
    if (!this.initializeUser(chatId)) {
      console.error("Failed to initialize user for addMessage");
      return false;
    }

    if (!role || !content) {
      console.error("Invalid role or content for addMessage");
      return false;
    }

    try {
      this.conversations[chatId].push({
        role: role.toString(),
        content: content.toString(),
        timestamp: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error("Error adding message:", error);
      return false;
    }
  }

  trimHistory(chatId) {
    if (!this.isUserInitialized(chatId)) {
      console.error("User not initialized for trimHistory");
      return false;
    }

    try {
      const maxHistory = this.userSettings[chatId].maxHistory || 10;
      if (this.conversations[chatId].length > maxHistory * 2) {
        this.conversations[chatId] = this.conversations[chatId].slice(
          -maxHistory * 2
        );
      }
      return true;
    } catch (error) {
      console.error("Error trimming history:", error);
      return false;
    }
  }

  getConversationContext(chatId) {
    if (!this.isUserInitialized(chatId)) {
      console.error("User not initialized for getConversationContext");
      return "";
    }

    try {
      const maxHistory = this.userSettings[chatId].maxHistory || 10;
      const messages = this.conversations[chatId] || [];

      return messages
        .slice(-maxHistory * 2)
        .filter((msg) => msg && msg.role && msg.content)
        .map(
          (msg) =>
            `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
        )
        .join("\n\n");
    } catch (error) {
      console.error("Error getting conversation context:", error);
      return "";
    }
  }

  clearConversation(chatId) {
    if (!this.initializeUser(chatId)) {
      console.error("Failed to initialize user for clearConversation");
      return false;
    }

    try {
      this.conversations[chatId] = [];
      return true;
    } catch (error) {
      console.error("Error clearing conversation:", error);
      return false;
    }
  }

  getStats(chatId) {
    if (!this.isUserInitialized(chatId)) {
      console.error("User not initialized for getStats");
      return {
        totalMessages: 0,
        userMessages: 0,
        aiMessages: 0,
        currentPersona: "assistant",
        maxHistory: 10,
      };
    }

    try {
      const conversations = this.conversations[chatId] || [];
      const settings = this.userSettings[chatId] || {};

      const totalMessages = conversations.length;
      const userMessages = conversations.filter(
        (msg) => msg && msg.role === "user"
      ).length;
      const aiMessages = totalMessages - userMessages;
      const currentPersona = settings.currentSystemPrompt || "assistant";
      const maxHistory = settings.maxHistory || 10;

      return {
        totalMessages,
        userMessages,
        aiMessages,
        currentPersona,
        maxHistory,
      };
    } catch (error) {
      console.error("Error getting stats:", error);
      return {
        totalMessages: 0,
        userMessages: 0,
        aiMessages: 0,
        currentPersona: "assistant",
        maxHistory: 10,
      };
    }
  }

  exportUserData(chatId) {
    if (!this.isUserInitialized(chatId)) {
      console.error("User not initialized for exportUserData");
      return {
        conversations: [],
        settings: { currentSystemPrompt: "assistant", maxHistory: 10 },
        exportDate: new Date().toISOString(),
        error: "User not initialized",
      };
    }

    try {
      return {
        conversations: this.conversations[chatId] || [],
        settings: this.userSettings[chatId] || {
          currentSystemPrompt: "assistant",
          maxHistory: 10,
        },
        exportDate: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error exporting user data:", error);
      return {
        conversations: [],
        settings: { currentSystemPrompt: "assistant", maxHistory: 10 },
        exportDate: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  // Safe getter for user settings
  getUserSetting(chatId, key, defaultValue = null) {
    if (!this.isUserInitialized(chatId)) {
      return defaultValue;
    }
    return this.userSettings[chatId][key] ?? defaultValue;
  }

  // Safe setter for user settings
  setUserSetting(chatId, key, value) {
    if (!this.initializeUser(chatId)) {
      return false;
    }
    try {
      this.userSettings[chatId][key] = value;
      return true;
    } catch (error) {
      console.error("Error setting user setting:", error);
      return false;
    }
  }
}

module.exports = new DataManager();
