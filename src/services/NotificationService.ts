/**
 * Notification Service - Sends trading alerts and notifications
 */

import TelegramBot from "node-telegram-bot-api";

interface NotificationPreferences {
  enabled: boolean;
  botStarted: boolean;
  botStopped: boolean;
  tradeExecuted: boolean;
  profitAlert: boolean;
  lossAlert: boolean;
  errorAlert: boolean;
}

export class NotificationService {
  private bot: TelegramBot;
  private preferences: Map<number, NotificationPreferences> = new Map();

  constructor(bot: TelegramBot) {
    this.bot = bot;
  }

  private getPreferences(chatId: number): NotificationPreferences {
    if (!this.preferences.has(chatId)) {
      this.preferences.set(chatId, {
        enabled: true,
        botStarted: true,
        botStopped: true,
        tradeExecuted: true,
        profitAlert: true,
        lossAlert: true,
        errorAlert: true,
      });
    }
    return this.preferences.get(chatId)!;
  }

  setEnabled(chatId: number, enabled: boolean): void {
    const prefs = this.getPreferences(chatId);
    prefs.enabled = enabled;
    this.preferences.set(chatId, prefs);
  }

  isEnabled(chatId: number): boolean {
    return this.getPreferences(chatId).enabled;
  }

  async notify(
    chatId: number,
    message: string,
    type: string
  ): Promise<void> {
    const prefs = this.getPreferences(chatId);

    if (!prefs.enabled) {
      return;
    }

    // Check if this type of notification is enabled
    const shouldSend =
      (type === "bot_started" && prefs.botStarted) ||
      (type === "bot_stopped" && prefs.botStopped) ||
      (type === "trade_executed" && prefs.tradeExecuted) ||
      (type === "profit" && prefs.profitAlert) ||
      (type === "loss" && prefs.lossAlert) ||
      (type === "error" && prefs.errorAlert) ||
      type === "general";

    if (shouldSend) {
      try {
        await this.bot.sendMessage(chatId, message);
      } catch (error) {
        console.error("Failed to send notification:", error);
      }
    }
  }

  async notifyTrade(
    chatId: number,
    botName: string,
    action: string,
    amount: number,
    price: number,
    pnl?: number
  ): Promise<void> {
    if (!this.isEnabled(chatId)) {
      return;
    }

    let message = `*Trade Alert*\n\n`;
    message += `Bot: ${botName}\n`;
    message += `Action: ${action.toUpperCase()}\n`;
    message += `Amount: ${amount}\n`;
    message += `Price: $${price.toFixed(2)}\n`;

    if (pnl !== undefined) {
      const emoji = pnl >= 0 ? "+" : "";
      message += `P&L: ${emoji}$${pnl.toFixed(2)}\n`;
    }

    message += `\nTime: ${new Date().toLocaleString()}`;

    const type = pnl !== undefined && pnl >= 0 ? "profit" : "loss";
    await this.notify(chatId, message, type);
  }

  async notifyError(chatId: number, botName: string, error: string): Promise<void> {
    const message = `*Error Alert*\n\nBot: ${botName}\nError: ${error}\n\nTime: ${new Date().toLocaleString()}`;
    await this.notify(chatId, message, "error");
  }

  async notifySystemEvent(chatId: number, event: string, details: string): Promise<void> {
    const message = `*System Event*\n\n${event}\n\n${details}\n\nTime: ${new Date().toLocaleString()}`;
    await this.notify(chatId, message, "general");
  }
}
