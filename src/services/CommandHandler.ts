/**
 * Command Handler - Processes complex multi-step commands
 */

import TelegramBot from "node-telegram-bot-api";
import { BotController } from "./BotController";

export class CommandHandler {
  private bot: TelegramBot;
  private botController: BotController;

  constructor(bot: TelegramBot, botController: BotController) {
    this.bot = bot;
    this.botController = botController;
  }

  async handleMultiBotCommand(
    chatId: number,
    command: string,
    botNames: string[]
  ): Promise<void> {
    await this.bot.sendMessage(
      chatId,
      `Executing ${command} for ${botNames.length} bots...`
    );

    const results: Array<{ bot: string; success: boolean; message: string }> = [];

    for (const botName of botNames) {
      try {
        if (command === "start") {
          await this.botController.startBot(botName);
          results.push({ bot: botName, success: true, message: "Started" });
        } else if (command === "stop") {
          await this.botController.stopBot(botName);
          results.push({ bot: botName, success: true, message: "Stopped" });
        } else if (command === "execute") {
          await this.botController.executeBot(botName);
          results.push({ bot: botName, success: true, message: "Executed" });
        }
      } catch (error: any) {
        results.push({
          bot: botName,
          success: false,
          message: error.message,
        });
      }
    }

    let message = `*Multi-Bot ${command.toUpperCase()} Results:*\n\n`;

    for (const result of results) {
      const emoji = result.success ? "[OK]" : "[FAIL]";
      message += `${emoji} ${result.bot}: ${result.message}\n`;
    }

    await this.bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  }

  async handleNaturalLanguageCommand(
    chatId: number,
    text: string
  ): Promise<void> {
    const lowerText = text.toLowerCase();

    if (
      lowerText.includes("start all bots") ||
      lowerText.includes("activate all")
    ) {
      const botNames = this.botController.getBotList();
      await this.handleMultiBotCommand(chatId, "start", botNames);
    } else if (
      lowerText.includes("stop all bots") ||
      lowerText.includes("deactivate all")
    ) {
      const botNames = this.botController.getBotList();
      await this.handleMultiBotCommand(chatId, "stop", botNames);
    } else if (lowerText.includes("show me") && lowerText.includes("metrics")) {
      await this.bot.sendMessage(chatId, "Fetching all metrics...");
    } else {
      await this.bot.sendMessage(
        chatId,
        "I didn't understand that command. Try /help for available commands."
      );
    }
  }
}
