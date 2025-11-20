/**
 * Notification Service - Sends alerts and notifications
 */

import TelegramBot from "node-telegram-bot-api";

export type NotificationType =
  | "bot_started"
  | "bot_stopped"
  | "trade_executed"
  | "error"
  | "alert"
  | "performance";

export class NotificationService {
  private bot: TelegramBot;
  private subscribers: Map<number, Set<NotificationType>>;

  constructor(bot: TelegramBot) {
    this.bot = bot;
    this.subscribers = new Map();
  }

  subscribe(chatId: number, types: NotificationType[] = ["all" as any]): void {
    if (!this.subscribers.has(chatId)) {
      this.subscribers.set(chatId, new Set());
    }

    const subscriptions = this.subscribers.get(chatId)!;

    if (types.includes("all" as any)) {
      subscriptions.add("bot_started");
      subscriptions.add("bot_stopped");
      subscriptions.add("trade_executed");
      subscriptions.add("error");
      subscriptions.add("alert");
      subscriptions.add("performance");
    } else {
      types.forEach((type) => subscriptions.add(type));
    }
  }

  unsubscribe(
    chatId: number,
    types: NotificationType[] = ["all" as any]
  ): void {
    if (!this.subscribers.has(chatId)) return;

    const subscriptions = this.subscribers.get(chatId)!;

    if (types.includes("all" as any)) {
      this.subscribers.delete(chatId);
    } else {
      types.forEach((type) => subscriptions.delete(type));
    }
  }

  async notify(
    chatId: number,
    message: string,
    type: NotificationType
  ): Promise<void> {
    const subscriptions = this.subscribers.get(chatId);

    if (!subscriptions || !subscriptions.has(type)) {
      return;
    }

    const emoji = this.getEmojiForType(type);

    try {
      await this.bot.sendMessage(chatId, `${emoji} ${message}`);
    } catch (error) {
      console.error(`Failed to send notification to ${chatId}:`, error);
    }
  }

  async broadcast(message: string, type: NotificationType): Promise<void> {
    for (const [chatId, subscriptions] of this.subscribers.entries()) {
      if (subscriptions.has(type)) {
        await this.notify(chatId, message, type);
      }
    }
  }

  private getEmojiForType(type: NotificationType): string {
    const emojiMap: Record<NotificationType, string> = {
      bot_started: "🟢",
      bot_stopped: "🔴",
      trade_executed: "💰",
      error: "❌",
      alert: "⚠️",
      performance: "📊",
    };

    return emojiMap[type] || "📢";
  }

  getSubscribers(): number {
    return this.subscribers.size;
  }

  isSubscribed(chatId: number, type: NotificationType): boolean {
    const subscriptions = this.subscribers.get(chatId);
    return subscriptions ? subscriptions.has(type) : false;
  }
}
