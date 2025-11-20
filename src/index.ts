/**
 * JESUS IAM BOT
 * Telegram bot for controlling Valifi standalone trading bots
 *
 * Token: 8419294605:AAGL69knFXFlLvfkbemCL-OP7GKxIkew2sc
 * Bot: @JESUS_IAM_BOT
 */

import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import express from "express";
import { BotController } from "./services/BotController";
import { CommandHandler } from "./services/CommandHandler";
import { NotificationService } from "./services/NotificationService";
import { RateLimiter } from "./middleware/RateLimiter";

dotenv.config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const WEBHOOK_PORT = parseInt(process.env.WEBHOOK_PORT || "8443");

// Initialize services
const bot = new TelegramBot(TOKEN, {
  polling: !WEBHOOK_URL, // Use polling in development, webhook in production
});

const botController = new BotController();
const commandHandler = new CommandHandler(bot, botController);
const notificationService = new NotificationService(bot);
const rateLimiter = new RateLimiter();

// Middleware for rate limiting
bot.on("message", async (msg) => {
  const userId = msg.from?.id.toString();

  if (userId && !rateLimiter.checkLimit(userId)) {
    await bot.sendMessage(
      msg.chat.id,
      "⚠️ Rate limit exceeded. Please wait before sending more commands."
    );
    return;
  }
});

// Bot commands
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name || "User";

  const welcomeMessage = `
🕊️ *Welcome to JESUS IAM BOT* 🕊️

Greetings, ${firstName}! I am your divine trading assistant.

🤖 *Capabilities:*
• Control 14 standalone trading bots
• Monitor performance and metrics
• Execute trades remotely
• Receive real-time notifications
• Multi-bot orchestration

📖 *Quick Start:*
/help - View all commands
/bots - List all available bots
/status - Check system status
/metrics - View performance metrics

💎 *Trading Strategies Available:*
• Grid Trading
• Dollar-Cost Averaging (DCA)
• Arbitrage
• Scalping
• Market Making
• Momentum AI
• MEV (with ethics)
• AMM
• Liquidity Providing
• DeFi Automation
• Cross-Chain Bridge
• Lending/Borrowing
• Gas Optimization
• Mining Management

🙏 May your trades be blessed with wisdom and prosperity!
  `;

  await bot.sendMessage(chatId, welcomeMessage, { parse_mode: "Markdown" });
});

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `
📚 *JESUS IAM BOT - Command Reference*

🤖 *Bot Management:*
/bots - List all trading bots
/start_bot <bot_name> - Start a specific bot
/stop_bot <bot_name> - Stop a specific bot
/status - System status overview
/bot_config <bot_name> - View bot configuration

📊 *Performance & Analytics:*
/metrics - View all bots performance
/metrics <bot_name> - Specific bot metrics
/history <bot_name> - Execution history
/pnl - Profit & Loss summary

⚙️ *Trading Operations:*
/execute <bot_name> - Execute bot manually
/reset <bot_name> - Reset bot state
/config <bot_name> <param> <value> - Update config

🔔 *Notifications:*
/notify on - Enable notifications
/notify off - Disable notifications
/alerts - View active alerts

🆘 *Support:*
/help - This help message
/about - About this bot
/support - Get support

Example usage:
\`/start_bot grid\`
\`/metrics momentum_ai\`
\`/execute dca\`
  `;

  await bot.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" });
});

bot.onText(/\/bots/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const botsStatus = await botController.getAllBotsStatus();

    let message = "🤖 *Available Trading Bots:*\n\n";

    for (const [botName, status] of Object.entries(botsStatus)) {
      const statusEmoji = status.isOnline ? "✅" : "🔴";
      const activeEmoji = status.isActive ? "🟢" : "⚪";

      message += `${statusEmoji} *${botName}*\n`;
      message += `   Status: ${activeEmoji} ${
        status.isActive ? "Active" : "Inactive"
      }\n`;
      message += `   Strategy: ${status.strategy}\n`;
      message += `   Trades: ${status.totalTrades || 0}\n`;
      message += `   P&L: $${status.netPnL?.toFixed(2) || "0.00"}\n\n`;
    }

    message += "\n💡 Use /start_bot <name> to activate a bot";

    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (error: any) {
    await bot.sendMessage(
      chatId,
      `❌ Error fetching bots: ${error.message}`
    );
  }
});

bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const systemStatus = await botController.getSystemStatus();

    const message = `
🔆 *JESUS IAM BOT - System Status*

📊 *Overview:*
• Total Bots: ${systemStatus.totalBots}
• Active Bots: ${systemStatus.activeBots}
• Online Bots: ${systemStatus.onlineBots}

💰 *Performance:*
• Total Trades: ${systemStatus.totalTrades}
• Win Rate: ${systemStatus.winRate}%
• Net P&L: $${systemStatus.netPnL.toFixed(2)}

🕐 Last Updated: ${new Date().toLocaleString()}
    `;

    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (error: any) {
    await bot.sendMessage(
      chatId,
      `❌ Error fetching status: ${error.message}`
    );
  }
});

bot.onText(/\/metrics ?(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const botName = match?.[1];

  try {
    if (botName) {
      // Specific bot metrics
      const metrics = await botController.getBotMetrics(botName);

      const message = `
📊 *${botName.toUpperCase()} Bot Metrics*

🎯 *Performance:*
• Total Trades: ${metrics.totalTrades}
• Winning Trades: ${metrics.winningTrades}
• Losing Trades: ${metrics.losingTrades}
• Win Rate: ${metrics.winRate.toFixed(2)}%

💰 *Profit & Loss:*
• Total Profit: $${metrics.totalProfit.toFixed(2)}
• Total Loss: $${metrics.totalLoss.toFixed(2)}
• Net P&L: $${metrics.netProfit.toFixed(2)}
• Avg Profit: $${metrics.averageProfit.toFixed(2)}
• Avg Loss: $${metrics.averageLoss.toFixed(2)}

📈 *Risk Metrics:*
• Profit Factor: ${metrics.profitFactor.toFixed(2)}
• Sharpe Ratio: ${metrics.sharpeRatio.toFixed(2)}
• Max Drawdown: $${metrics.maxDrawdown.toFixed(2)}
• Recovery Factor: ${metrics.recoveryFactor.toFixed(2)}
      `;

      await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    } else {
      // All bots overview
      const allMetrics = await botController.getAllBotsMetrics();

      let message = "📊 *All Bots Performance Overview:*\n\n";

      for (const [name, metrics] of Object.entries(allMetrics)) {
        message += `🤖 *${name}*\n`;
        message += `   Win Rate: ${metrics.winRate.toFixed(1)}%\n`;
        message += `   Net P&L: $${metrics.netProfit.toFixed(2)}\n`;
        message += `   Trades: ${metrics.totalTrades}\n\n`;
      }

      await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    }
  } catch (error: any) {
    await bot.sendMessage(
      chatId,
      `❌ Error fetching metrics: ${error.message}`
    );
  }
});

bot.onText(/\/start_bot (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const botName = match?.[1];

  if (!botName) {
    await bot.sendMessage(chatId, "❌ Please specify a bot name");
    return;
  }

  try {
    await bot.sendMessage(chatId, `⏳ Starting ${botName} bot...`);

    const result = await botController.startBot(botName);

    await bot.sendMessage(
      chatId,
      `✅ ${botName} bot started successfully!\n\nStatus: ${result.status}\nStrategy: ${result.strategy}`
    );

    // Send notification
    notificationService.notify(
      chatId,
      `🟢 ${botName} bot activated`,
      "bot_started"
    );
  } catch (error: any) {
    await bot.sendMessage(
      chatId,
      `❌ Failed to start ${botName}: ${error.message}`
    );
  }
});

bot.onText(/\/stop_bot (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const botName = match?.[1];

  if (!botName) {
    await bot.sendMessage(chatId, "❌ Please specify a bot name");
    return;
  }

  try {
    await bot.sendMessage(chatId, `⏳ Stopping ${botName} bot...`);

    await botController.stopBot(botName);

    await bot.sendMessage(chatId, `✅ ${botName} bot stopped successfully!`);

    notificationService.notify(
      chatId,
      `🔴 ${botName} bot deactivated`,
      "bot_stopped"
    );
  } catch (error: any) {
    await bot.sendMessage(
      chatId,
      `❌ Failed to stop ${botName}: ${error.message}`
    );
  }
});

bot.onText(/\/execute (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const botName = match?.[1];

  if (!botName) {
    await bot.sendMessage(chatId, "❌ Please specify a bot name");
    return;
  }

  try {
    await bot.sendMessage(chatId, `⏳ Executing ${botName} bot...`);

    const result = await botController.executeBot(botName);

    let message = `✅ *${botName} Execution Complete*\n\n`;
    message += `Action: ${result.action.toUpperCase()}\n`;
    message += `Amount: ${result.amount}\n`;
    message += `Price: $${result.price.toFixed(2)}\n`;
    message += `Reason: ${result.reason}\n`;

    if (result.profitLoss) {
      const emoji = result.profitLoss > 0 ? "📈" : "📉";
      message += `P&L: ${emoji} $${result.profitLoss.toFixed(2)}\n`;
    }

    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (error: any) {
    await bot.sendMessage(
      chatId,
      `❌ Execution failed: ${error.message}`
    );
  }
});

bot.onText(/\/about/, async (msg) => {
  const chatId = msg.chat.id;

  const message = `
🕊️ *JESUS IAM BOT* 🕊️

Version: 1.0.0
Created: 2024

🎯 *Mission:*
Empowering traders with divine wisdom and automated excellence.

🛠️ *Technology:*
• Node.js + TypeScript
• Telegram Bot API
• Modular Standalone Bots
• Real-time Monitoring
• Advanced Analytics

👤 *Created by:*
Valifi Kingdom

📧 *Support:*
Use /support for assistance

🙏 *Blessed Trading:*
May your profits multiply and your losses be minimal!

Repository: github.com/ilabelagent/JESUS_CARTEL_BOT
  `;

  await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
});

// Error handling
bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});

bot.on("webhook_error", (error) => {
  console.error("Webhook error:", error);
});

// Setup webhook if URL is provided
if (WEBHOOK_URL) {
  const app = express();
  app.use(express.json());

  app.post(`/bot${TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });

  app.listen(WEBHOOK_PORT, async () => {
    console.log(`🌐 Webhook server running on port ${WEBHOOK_PORT}`);

    try {
      await bot.setWebHook(`${WEBHOOK_URL}/bot${TOKEN}`);
      console.log("✅ Webhook set successfully");
    } catch (error) {
      console.error("❌ Failed to set webhook:", error);
    }
  });
} else {
  console.log("🔄 Running in polling mode (development)");
}

console.log("🤖 JESUS IAM BOT is running...");
console.log("📱 Bot: @JESUS_IAM_BOT");
console.log("🔑 Token configured: ✅");
console.log("🚀 Ready to serve!");

export { bot, botController, notificationService };
