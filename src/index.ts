/**
 * jesus bot
 * Standalone Telegram trading bot with 14 bundled strategies
 *
 * Bot: @richthepluto_bot
 * Owner: DEBBY (@lxeCoo)
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
const PORT = parseInt(process.env.PORT || process.env.WEBHOOK_PORT || "8443");
const ADMIN_CHAT_ID = parseInt(process.env.TELEGRAM_ADMIN_CHAT_ID || "0");
const IS_CLOUD_RUN = process.env.K_SERVICE !== undefined;

// Initialize services - Use webhook for Cloud Run, polling otherwise
const bot = new TelegramBot(TOKEN, {
  polling: !WEBHOOK_URL && !IS_CLOUD_RUN,
});

const botController = new BotController();
const commandHandler = new CommandHandler(bot, botController);
const notificationService = new NotificationService(bot);
const rateLimiter = new RateLimiter();

// Admin validation
const isAdminUser = (msg: TelegramBot.Message): boolean => {
  return msg.chat.id === ADMIN_CHAT_ID || ADMIN_CHAT_ID === 0;
};

// Rate limiting middleware
bot.on("message", async (msg) => {
  const userId = msg.from?.id.toString();

  if (userId && !rateLimiter.checkLimit(userId)) {
    await bot.sendMessage(
      msg.chat.id,
      "Rate limit exceeded. Please wait before sending more commands."
    );
    return;
  }
});

// /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name || "User";

  const welcomeMessage = `
*Welcome to jesus bot*

Greetings, ${firstName}! I am your personal trading assistant.

*Capabilities:*
- Control 14 standalone trading bots
- Monitor performance and metrics
- Execute trades remotely
- Receive real-time notifications
- Multi-bot orchestration

*Quick Start:*
/help - View all commands
/bots - List all available bots
/status - Check system status
/metrics - View performance metrics

*Trading Strategies Available:*
- Grid Trading
- Dollar-Cost Averaging (DCA)
- Arbitrage
- Scalping
- Market Making
- Momentum AI
- MEV
- AMM
- Liquidity Providing
- DeFi Automation
- Cross-Chain Bridge
- Lending/Borrowing
- Gas Optimization
- Mining Management

Your Chat ID: \`${chatId}\`
  `;

  await bot.sendMessage(chatId, welcomeMessage, { parse_mode: "Markdown" });
});

// /help command
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `
*jesus bot - Command Reference*

*Bot Management:*
/bots - List all trading bots
/start_bot <bot_name> - Start a specific bot
/stop_bot <bot_name> - Stop a specific bot
/status - System status overview
/bot_config <bot_name> - View bot configuration

*Performance & Analytics:*
/metrics - View all bots performance
/metrics <bot_name> - Specific bot metrics
/history <bot_name> - Execution history
/pnl - Profit & Loss summary

*Trading Operations:*
/execute <bot_name> - Execute bot manually
/reset <bot_name> - Reset bot state
/config <bot_name> <param> <value> - Update config

*Notifications:*
/notify on - Enable notifications
/notify off - Disable notifications
/alerts - View active alerts

*System Control (Admin):*
/system_help - System control commands

*Support:*
/help - This help message
/about - About this bot

Example usage:
\`/start_bot grid\`
\`/metrics momentum_ai\`
\`/execute dca\`
  `;

  await bot.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" });
});

// /bots command
bot.onText(/\/bots/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const botsStatus = await botController.getAllBotsStatus();

    let message = "*Available Trading Bots:*\n\n";

    for (const [botName, status] of Object.entries(botsStatus)) {
      const statusEmoji = status.isOnline ? "+" : "-";
      const activeEmoji = status.isActive ? "[ON]" : "[OFF]";

      message += `${statusEmoji} *${botName}*\n`;
      message += `   Status: ${activeEmoji}\n`;
      message += `   Strategy: ${status.strategy}\n`;
      message += `   Trades: ${status.totalTrades || 0}\n`;
      message += `   P&L: $${status.netPnL?.toFixed(2) || "0.00"}\n\n`;
    }

    message += "\nUse /start_bot <name> to activate a bot";

    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (error: any) {
    await bot.sendMessage(
      chatId,
      `Error fetching bots: ${error.message}`
    );
  }
});

// /status command
bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const systemStatus = await botController.getSystemStatus();

    const message = `
*jesus bot - System Status*

*Overview:*
- Total Bots: ${systemStatus.totalBots}
- Active Bots: ${systemStatus.activeBots}
- Online Bots: ${systemStatus.onlineBots}

*Performance:*
- Total Trades: ${systemStatus.totalTrades}
- Win Rate: ${systemStatus.winRate}%
- Net P&L: $${systemStatus.netPnL.toFixed(2)}

Last Updated: ${new Date().toLocaleString()}
    `;

    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (error: any) {
    await bot.sendMessage(
      chatId,
      `Error fetching status: ${error.message}`
    );
  }
});

// /metrics command
bot.onText(/\/metrics ?(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const botName = match?.[1];

  try {
    if (botName) {
      const metrics = await botController.getBotMetrics(botName);

      const message = `
*${botName.toUpperCase()} Bot Metrics*

*Performance:*
- Total Trades: ${metrics.totalTrades}
- Winning Trades: ${metrics.winningTrades}
- Losing Trades: ${metrics.losingTrades}
- Win Rate: ${metrics.winRate.toFixed(2)}%

*Profit & Loss:*
- Total Profit: $${metrics.totalProfit.toFixed(2)}
- Total Loss: $${metrics.totalLoss.toFixed(2)}
- Net P&L: $${metrics.netProfit.toFixed(2)}
- Avg Profit: $${metrics.averageProfit.toFixed(2)}
- Avg Loss: $${metrics.averageLoss.toFixed(2)}

*Risk Metrics:*
- Profit Factor: ${metrics.profitFactor.toFixed(2)}
- Sharpe Ratio: ${metrics.sharpeRatio.toFixed(2)}
- Max Drawdown: $${metrics.maxDrawdown.toFixed(2)}
- Recovery Factor: ${metrics.recoveryFactor.toFixed(2)}
      `;

      await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    } else {
      const allMetrics = await botController.getAllBotsMetrics();

      let message = "*All Bots Performance Overview:*\n\n";

      for (const [name, metrics] of Object.entries(allMetrics)) {
        message += `*${name}*\n`;
        message += `   Win Rate: ${metrics.winRate.toFixed(1)}%\n`;
        message += `   Net P&L: $${metrics.netProfit.toFixed(2)}\n`;
        message += `   Trades: ${metrics.totalTrades}\n\n`;
      }

      await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    }
  } catch (error: any) {
    await bot.sendMessage(
      chatId,
      `Error fetching metrics: ${error.message}`
    );
  }
});

// /start_bot command
bot.onText(/\/start_bot (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const botName = match?.[1];

  if (!botName) {
    await bot.sendMessage(chatId, "Please specify a bot name");
    return;
  }

  try {
    await bot.sendMessage(chatId, `Starting ${botName} bot...`);

    const result = await botController.startBot(botName);

    await bot.sendMessage(
      chatId,
      `${botName} bot started successfully!\n\nStatus: ${result.status}\nStrategy: ${result.strategy}`
    );

    notificationService.notify(
      chatId,
      `${botName} bot activated`,
      "bot_started"
    );
  } catch (error: any) {
    await bot.sendMessage(
      chatId,
      `Failed to start ${botName}: ${error.message}`
    );
  }
});

// /stop_bot command
bot.onText(/\/stop_bot (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const botName = match?.[1];

  if (!botName) {
    await bot.sendMessage(chatId, "Please specify a bot name");
    return;
  }

  try {
    await bot.sendMessage(chatId, `Stopping ${botName} bot...`);

    await botController.stopBot(botName);

    await bot.sendMessage(chatId, `${botName} bot stopped successfully!`);

    notificationService.notify(
      chatId,
      `${botName} bot deactivated`,
      "bot_stopped"
    );
  } catch (error: any) {
    await bot.sendMessage(
      chatId,
      `Failed to stop ${botName}: ${error.message}`
    );
  }
});

// /execute command
bot.onText(/\/execute (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const botName = match?.[1];

  if (!botName) {
    await bot.sendMessage(chatId, "Please specify a bot name");
    return;
  }

  try {
    await bot.sendMessage(chatId, `Executing ${botName} bot...`);

    const result = await botController.executeBot(botName);

    let message = `*${botName} Execution Complete*\n\n`;
    message += `Action: ${result.action.toUpperCase()}\n`;
    message += `Amount: ${result.amount}\n`;
    message += `Price: $${result.price.toFixed(2)}\n`;
    message += `Reason: ${result.reason}\n`;

    if (result.profitLoss) {
      const emoji = result.profitLoss > 0 ? "+" : "";
      message += `P&L: ${emoji}$${result.profitLoss.toFixed(2)}\n`;
    }

    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (error: any) {
    await bot.sendMessage(
      chatId,
      `Execution failed: ${error.message}`
    );
  }
});

// /pnl command
bot.onText(/\/pnl/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const allMetrics = await botController.getAllBotsMetrics();

    let totalPnL = 0;
    let totalTrades = 0;
    let totalWins = 0;

    for (const metrics of Object.values(allMetrics)) {
      totalPnL += metrics.netProfit;
      totalTrades += metrics.totalTrades;
      totalWins += metrics.winningTrades;
    }

    const overallWinRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;

    const message = `
*jesus bot - P&L Summary*

*Overall Performance:*
- Total P&L: $${totalPnL.toFixed(2)}
- Total Trades: ${totalTrades}
- Overall Win Rate: ${overallWinRate.toFixed(1)}%

*Status:* ${totalPnL >= 0 ? "Profitable" : "In Loss"}
    `;

    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (error: any) {
    await bot.sendMessage(chatId, `Error: ${error.message}`);
  }
});

// /about command
bot.onText(/\/about/, async (msg) => {
  const chatId = msg.chat.id;

  const message = `
*jesus bot*

Version: 1.0.0
Created: 2024
Owner: DEBBY (@lxeCoo)

*Mission:*
Empowering traders with automated excellence.

*Technology:*
- Node.js + TypeScript
- Telegram Bot API
- 14 Trading Strategies
- Real-time Monitoring
- Advanced Analytics

*Features:*
- Grid Trading
- DCA (Dollar Cost Averaging)
- Arbitrage
- Scalping
- Market Making
- Momentum AI
- MEV Protection
- AMM Management
- Liquidity Providing
- DeFi Automation
- Cross-Chain Bridge
- Lending Optimization
- Gas Optimization
- Mining Management

*Bot:* @jesus_bot
  `;

  await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
});

// /system_help command (admin only)
bot.onText(/\/system_help/, async (msg) => {
  const chatId = msg.chat.id;

  if (!isAdminUser(msg)) {
    await bot.sendMessage(chatId, "Unauthorized: Admin only command.");
    return;
  }

  const helpMessage = `
*jesus bot - System Control*

*System Management Commands:*
/start_all - Start all bots
/stop_all - Stop all bots
/restart_all - Restart all bots
/system_status - Full system status
/health - Quick health check

*Individual Bot Control:*
/start_bot <name> - Start specific bot
/stop_bot <name> - Stop specific bot
/execute <name> - Execute bot once

*Available Bots:*
grid, dca, arbitrage, scalping, market_making, momentum_ai, mev, amm, liquidity, defi, bridge, lending, gas_optimizer, mining

Example usage:
\`/start_all\`
\`/start_bot grid\`
\`/execute momentum_ai\`
  `;

  await bot.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" });
});

// /start_all command
bot.onText(/\/start_all/, async (msg) => {
  const chatId = msg.chat.id;

  if (!isAdminUser(msg)) {
    await bot.sendMessage(chatId, "Unauthorized: Admin only command.");
    return;
  }

  try {
    await bot.sendMessage(chatId, "Starting all bots...");

    const botNames = botController.getBotList();
    let started = 0;
    let failed = 0;

    for (const botName of botNames) {
      try {
        await botController.startBot(botName);
        started++;
      } catch {
        failed++;
      }
    }

    await bot.sendMessage(
      chatId,
      `*All Bots Started*\n\nStarted: ${started}\nFailed: ${failed}`,
      { parse_mode: "Markdown" }
    );
  } catch (error: any) {
    await bot.sendMessage(chatId, `Error: ${error.message}`);
  }
});

// /stop_all command
bot.onText(/\/stop_all/, async (msg) => {
  const chatId = msg.chat.id;

  if (!isAdminUser(msg)) {
    await bot.sendMessage(chatId, "Unauthorized: Admin only command.");
    return;
  }

  try {
    await bot.sendMessage(chatId, "Stopping all bots...");

    const botNames = botController.getBotList();
    let stopped = 0;

    for (const botName of botNames) {
      try {
        await botController.stopBot(botName);
        stopped++;
      } catch {
        // Ignore errors
      }
    }

    await bot.sendMessage(
      chatId,
      `*All Bots Stopped*\n\nStopped: ${stopped}`,
      { parse_mode: "Markdown" }
    );
  } catch (error: any) {
    await bot.sendMessage(chatId, `Error: ${error.message}`);
  }
});

// /health command
bot.onText(/\/health/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const systemStatus = await botController.getSystemStatus();

    const isHealthy = systemStatus.onlineBots > 0;

    const message = `
*System Health Check*

Status: ${isHealthy ? "Healthy" : "Needs Attention"}

*Components:*
- Bot Controller: Online
- Trading Bots: ${systemStatus.onlineBots}/${systemStatus.totalBots} online
- Notifications: Active

Timestamp: ${new Date().toISOString()}
    `;

    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (error: any) {
    await bot.sendMessage(chatId, `Health check failed: ${error.message}`);
  }
});

// Error handling
bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});

bot.on("webhook_error", (error) => {
  console.error("Webhook error:", error);
});

// Always start web server for Cloud Run compatibility
const app = express();
app.use(express.json());

// Health check endpoint (required for Cloud Run)
app.get("/", (req, res) => {
  res.json({
    status: "healthy",
    bot: "@richthepluto_bot",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Telegram webhook endpoint
app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Alternative webhook path for easier setup
app.post("/webhook", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Start server
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Server running on port ${PORT}`);

  if (WEBHOOK_URL) {
    try {
      await bot.setWebHook(`${WEBHOOK_URL}/bot${TOKEN}`);
      console.log("Webhook set successfully");
    } catch (error) {
      console.error("Failed to set webhook:", error);
    }
  } else if (IS_CLOUD_RUN) {
    console.log("Running in Cloud Run - webhook will be set after deployment");
    console.log("Use polling mode locally for testing");
  } else {
    console.log("Running in polling mode (development)");
  }
});

console.log("jesus bot is running...");
console.log("Bot: @jesus_bot");
console.log("Owner: DEBBY (@lxeCoo)");
console.log("Token configured: Yes");
console.log("Ready to serve!");

export { bot, botController, notificationService };
