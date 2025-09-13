# Telegram Ollama Bot

A sophisticated Telegram bot that seamlessly integrates with Ollama API to provide AI-powered conversations with multiple personas, conversation memory, and customizable settings.

## Features

- 🤖 **Multiple AI Personas**: Switch between different conversation styles (assistant, creative, technical, casual, uncensored)
- 💾 **Conversation Memory**: Maintains context throughout your chat session
- ⚙️ **Customizable Settings**: Adjust conversation history length and other parameters
- 🔄 **Data Persistence**: Automatically saves conversations and settings
- 🛡️ **Robust Error Handling**: Graceful handling of API errors and timeouts
- 🎯 **User-Friendly Interface**: Intuitive menu system with inline keyboards
- 🔧 **Modular Architecture**: Clean, maintainable codebase structure

## Prerequisites

- Node.js (v18 or higher)
- Ollama installed and running locally
- A Telegram bot token from [@BotFather](https://t.me/botfather)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd telegram-ollama-bot
```

2. Install dependencies:

```bash
npm install
```

3. Configure your environment:
   - edit `config/config.js` with your settings:

```javascript
module.exports = {
  BOT_TOKEN: "your-telegram-bot-token",
  OLLAMA_URL: "http://localhost:11434",
  MODEL_NAME: "llama2",
  MAX_HISTORY: 10,
  REQUEST_TIMEOUT: 30000,
};
```

4. Ensure Ollama is running:

```bash
ollama serve
```

5. Start the bot:

```bash
npm start
```

## Project Structure

telegram-ollama-bot/
├── index.js # Main entry point
├── config/
│ └── config.js # Configuration settings
├── data/
│ └── dataManager.js # Data persistence and management
├── handlers/
│ ├── messageHandler.js # Text message processing
│ └── callbackHandler.js # Callback query handling
├── keyboards/
│ └── keyboards.js # Inline keyboard generation
├── utils/
│ └── helpers.js # Utility functions
├── bot_data/
│ ├── conversations.json # Conversation history storage
│ └── system_prompts.json # AI personas and settings
├── package.json
└── README.md

## Usage

### Basic Commands

- `/start` - Initialize the bot and show the main menu
- `/stop` - Stop the current conversation and clear history
- `/menu` - Display the main menu at any time

### Main Menu Options

1. **💬 Chat with AI** - Start or continue a conversation
2. **🎭 Change Persona** - Switch between different AI personalities
3. **⚙️ Settings** - Adjust bot configuration
4. **ℹ️ Help** - Get usage instructions
5. **🚪 Exit** - Close the menu

### Available Personas

- **👨‍💼 Assistant**: Professional and helpful responses
- **🎨 Creative**: Imaginative and artistic responses
- **🔧 Technical**: Detailed technical explanations
- **😊 Casual**: Friendly and conversational tone
- **🔓 Uncensored**: Direct responses without content filtering

### Settings

- **Max History**: Control how many previous messages the AI remembers (1-50)
- **Model Selection**: Choose different Ollama models (if available)

## Example Interactions

User: /start
Bot: [Main Menu with options]

User: [Clicks "💬 Chat with AI"]
Bot: You're chatting with Assistant persona. What would you like to know?

User: Explain quantum computing
Bot: [Detailed explanation based on current persona...]

User: [Clicks "🎭 Change Persona"]
Bot: [Persona selection menu]

User: [Selects "🎨 Creative"]
Bot: Persona changed to Creative! 🎨

User: Write a poem about AI
Bot: [Creative poem about artificial intelligence...]

## Configuration

### Environment Variables

You can also use environment variables instead of editing the config file:

```bash
export BOT_TOKEN="your-telegram-bot-token"
export OLLAMA_URL="http://localhost:11434"
export MODEL_NAME="llama2"
export MAX_HISTORY="10"
```

### Ollama Models

The bot supports any model available in your Ollama installation. Popular options include:

- `llama2` - General purpose model
- `codellama` - Code-focused model
- `mistral` - Fast and efficient model
- `neural-chat` - Conversational model

To use a different model, update the `MODEL_NAME` in your configuration.

## Data Storage

The bot automatically manages data persistence:

- **Conversations**: Stored in `bot_data/conversations.json`
- **System Prompts**: Stored in `bot_data/system_prompts.json`
- **Auto-save**: Data is saved after each interaction
- **Graceful Shutdown**: Ensures data integrity when stopping the bot

## Error Handling

The bot includes comprehensive error handling for:

- **API Connection Issues**: Automatic retry with user notification
- **Model Loading**: Clear messages when models are unavailable
- **Timeout Handling**: Configurable request timeouts
- **Data Corruption**: Automatic recovery and backup creation
- **Network Issues**: Graceful degradation and user feedback

## Dependencies

```json
{
  "node-telegram-bot-api": "^0.64.0",
  "axios": "^1.6.0"
}
```

## Development

### Running in Development Mode

```bash
npm run dev
```

### Code Structure Guidelines

- **Handlers**: Process different types of Telegram updates
- **Keyboards**: Generate inline keyboard layouts
- **Utils**: Reusable utility functions
- **Data**: Manage persistent storage operations
- **Config**: Centralized configuration management

## Troubleshooting

### Common Issues

1. **Bot not responding**:

   - Verify Ollama is running: `curl http://localhost:11434/api/tags`
   - Check bot token validity
   - Review console logs for errors

2. **Memory issues**:

   - Reduce `MAX_HISTORY` setting
   - Clear conversation data: `/stop`

3. **API timeouts**:

   - Increase `REQUEST_TIMEOUT` in config
   - Check Ollama model performance

4. **Permission errors**:
   - Ensure write permissions for `bot_data/` directory
   - Check file ownership and access rights

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes following the existing code style
4. Test thoroughly with different personas and scenarios
5. Submit a pull request with a clear description

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:

- Check the troubleshooting section above
- Review the [Ollama documentation](https://ollama.ai/docs)
- Open an issue in the repository

---

**Note**: This bot requires a local Ollama installation. Make sure Ollama is properly configured and running before starting the bot.
