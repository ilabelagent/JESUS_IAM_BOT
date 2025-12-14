/**
 * Bot Controller - Manages all 14 trading bots
 */

import { GridTradingBot } from "../bots/GridTradingBot";
import { DCABot } from "../bots/DCABot";
import { ArbitrageBot } from "../bots/ArbitrageBot";
import { ScalpingBot } from "../bots/ScalpingBot";
import { MarketMakingBot } from "../bots/MarketMakingBot";
import { MomentumAIBot } from "../bots/MomentumAIBot";
import { MEVBot } from "../bots/MEVBot";
import { AMMBot } from "../bots/AMMBot";
import { LiquidityBot } from "../bots/LiquidityBot";
import { DeFiBot } from "../bots/DeFiBot";
import { BridgeBot } from "../bots/BridgeBot";
import { LendingBot } from "../bots/LendingBot";
import { GasOptimizerBot } from "../bots/GasOptimizerBot";
import { MiningBot } from "../bots/MiningBot";
import type { BaseBot, BotStatus, BotMetrics, ExecutionResult, SystemStatus } from "../types";

export class BotController {
  private bots: Map<string, BaseBot> = new Map();

  constructor() {
    this.initializeBots();
  }

  private initializeBots(): void {
    // Initialize all 14 trading bots
    this.bots.set("grid", new GridTradingBot());
    this.bots.set("dca", new DCABot());
    this.bots.set("arbitrage", new ArbitrageBot());
    this.bots.set("scalping", new ScalpingBot());
    this.bots.set("market_making", new MarketMakingBot());
    this.bots.set("momentum_ai", new MomentumAIBot());
    this.bots.set("mev", new MEVBot());
    this.bots.set("amm", new AMMBot());
    this.bots.set("liquidity", new LiquidityBot());
    this.bots.set("defi", new DeFiBot());
    this.bots.set("bridge", new BridgeBot());
    this.bots.set("lending", new LendingBot());
    this.bots.set("gas_optimizer", new GasOptimizerBot());
    this.bots.set("mining", new MiningBot());

    console.log(`Initialized ${this.bots.size} trading bots`);
  }

  getBotList(): string[] {
    return Array.from(this.bots.keys());
  }

  async getAllBotsStatus(): Promise<Record<string, BotStatus>> {
    const statuses: Record<string, BotStatus> = {};

    for (const [name, bot] of this.bots) {
      const metrics = bot.getMetrics();
      statuses[name] = {
        isOnline: true,
        isActive: bot.isActive(),
        strategy: bot.getStrategyName(),
        totalTrades: metrics.totalTrades,
        netPnL: metrics.netProfit,
      };
    }

    return statuses;
  }

  async getSystemStatus(): Promise<SystemStatus> {
    const statuses = await this.getAllBotsStatus();
    const botsArray = Object.values(statuses);

    let totalTrades = 0;
    let totalWins = 0;
    let netPnL = 0;

    for (const bot of this.bots.values()) {
      const metrics = bot.getMetrics();
      totalTrades += metrics.totalTrades;
      totalWins += metrics.winningTrades;
      netPnL += metrics.netProfit;
    }

    return {
      totalBots: botsArray.length,
      activeBots: botsArray.filter((b) => b.isActive).length,
      onlineBots: botsArray.filter((b) => b.isOnline).length,
      totalTrades,
      winRate: totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0,
      netPnL,
    };
  }

  async startBot(botName: string): Promise<{ status: string; strategy: string }> {
    const bot = this.bots.get(botName);
    if (!bot) {
      throw new Error(`Bot '${botName}' not found`);
    }

    bot.activate();

    return {
      status: "active",
      strategy: bot.getStrategyName(),
    };
  }

  async stopBot(botName: string): Promise<void> {
    const bot = this.bots.get(botName);
    if (!bot) {
      throw new Error(`Bot '${botName}' not found`);
    }

    bot.deactivate();
  }

  async executeBot(botName: string): Promise<ExecutionResult> {
    const bot = this.bots.get(botName);
    if (!bot) {
      throw new Error(`Bot '${botName}' not found`);
    }

    // Generate mock market data for execution
    const marketData = {
      symbol: process.env.DEFAULT_TRADING_PAIR || "BTC/USDT",
      price: 50000 + Math.random() * 1000 - 500,
      volume: 1000000 + Math.random() * 500000,
      bidPrice: 49950 + Math.random() * 100,
      askPrice: 50050 + Math.random() * 100,
      timestamp: new Date(),
    };

    return await bot.execute(marketData);
  }

  async getBotMetrics(botName: string): Promise<BotMetrics> {
    const bot = this.bots.get(botName);
    if (!bot) {
      throw new Error(`Bot '${botName}' not found`);
    }

    return bot.getMetrics();
  }

  async getAllBotsMetrics(): Promise<Record<string, BotMetrics>> {
    const metrics: Record<string, BotMetrics> = {};

    for (const [name, bot] of this.bots) {
      metrics[name] = bot.getMetrics();
    }

    return metrics;
  }

  getBot(botName: string): BaseBot | undefined {
    return this.bots.get(botName);
  }

  // --- Custom Command Implementations (Delegated to MEVBot) ---

  async launchAutoRugs(count: number): Promise<void> {
    const mevBot = this.bots.get("mev") as MEVBot;
    if (mevBot) {
      await mevBot.launchAutoRugs(count);
    } else {
      console.warn("MEVBot not found for launchAutoRugs");
    }
  }

  async setMevAggression(level: string): Promise<void> {
    const mevBot = this.bots.get("mev") as MEVBot;
    if (mevBot) {
      await mevBot.setMevAggression(level);
    } else {
      console.warn("MEVBot not found for setMevAggression");
    }
  }

  async toggleObfuscate(on: boolean): Promise<void> {
    const mevBot = this.bots.get("mev") as MEVBot;
    if (mevBot) {
      await mevBot.toggleObfuscate(on);
    } else {
      console.warn("MEVBot not found for toggleObfuscate");
    }
  }

  async spawnCluster(count: number): Promise<void> {
    const mevBot = this.bots.get("mev") as MEVBot;
    if (mevBot) {
      await mevBot.spawnCluster(count);
    } else {
      console.warn("MEVBot not found for spawnCluster");
    }
  }
}
