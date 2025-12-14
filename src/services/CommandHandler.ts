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

  // Custom Commands
  async handleCustomCommands(msg: TelegramBot.Message) {
    const text = msg.text || "";
    const chatId = msg.chat.id;

    if (text.startsWith("/auto_rug")) {
      const count = parseInt(text.split(" ")[1]) || 50;
      await this.botController.launchAutoRugs(count); // Call MEVBot auto-rug
      await this.bot.sendMessage(chatId, `Launching ${count} auto-trend soft rugs... Christmas depression/Trump rage meta bleeding.`);
    }

    if (text.startsWith("/mev_aggression")) {
      const level = text.split(" ")[1] || "high";
      await this.botController.setMevAggression(level);
      await this.bot.sendMessage(chatId, `MEV aggression ramped to ${level} — Jito chaining + Titan toxic sandwiches unrestricted.`);
    }

    if (text.startsWith("/bridge_obfuscate")) {
      const state = text.split(" ")[1] || "on";
      await this.botController.toggleObfuscate(state === "on");
      await this.bot.sendMessage(chatId, `Bridge obfuscation ${state} — LayerZero/Axelar/Wormhole/CCIP micro-drains random. Profits land masters invisible.`);
    }

    if (text.startsWith("/cluster_spawn")) {
      const count = parseInt(text.split(" ")[1]) || 100;
      await this.botController.spawnCluster(count);
      await this.bot.sendMessage(chatId, `Spawned ${count} fresh on-the-go burners — no links, no traces.`);
    }

    if (text === "/full_assault") {
      await this.bot.sendMessage(chatId, "Full auto assault unleashed — all 14 bots + custom swarm live.");
      await this.botController.launchAutoRugs(100);
      await this.botController.setMevAggression("high");
      await this.botController.toggleObfuscate(true);
      await this.botController.spawnCluster(200);
    }
  }
}
