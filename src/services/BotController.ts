/**
 * Bot Controller - Manages communication with standalone trading bots
 */

import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

interface BotEndpoint {
  name: string;
  url: string;
  strategy: string;
}

export class BotController {
  private bots: Map<string, BotEndpoint>;

  constructor() {
    this.bots = new Map([
      [
        "grid",
        {
          name: "Grid Trading",
          url: process.env.GRID_BOT_URL || "http://localhost:3001",
          strategy: "grid_trading",
        },
      ],
      [
        "dca",
        {
          name: "DCA",
          url: process.env.DCA_BOT_URL || "http://localhost:3002",
          strategy: "dollar_cost_averaging",
        },
      ],
      [
        "arbitrage",
        {
          name: "Arbitrage",
          url: process.env.ARBITRAGE_BOT_URL || "http://localhost:3003",
          strategy: "arbitrage",
        },
      ],
      [
        "scalping",
        {
          name: "Scalping",
          url: process.env.SCALPING_BOT_URL || "http://localhost:3004",
          strategy: "scalping",
        },
      ],
      [
        "market_making",
        {
          name: "Market Making",
          url: process.env.MARKET_MAKING_BOT_URL || "http://localhost:3005",
          strategy: "market_making",
        },
      ],
      [
        "momentum_ai",
        {
          name: "Momentum AI",
          url: process.env.MOMENTUM_AI_BOT_URL || "http://localhost:3006",
          strategy: "momentum_ai",
        },
      ],
      [
        "mev",
        {
          name: "MEV",
          url: process.env.MEV_BOT_URL || "http://localhost:3007",
          strategy: "mev",
        },
      ],
      [
        "amm",
        {
          name: "AMM",
          url: process.env.AMM_BOT_URL || "http://localhost:3008",
          strategy: "automated_market_maker",
        },
      ],
      [
        "liquidity",
        {
          name: "Liquidity Provider",
          url: process.env.LIQUIDITY_BOT_URL || "http://localhost:3009",
          strategy: "liquidity_provider",
        },
      ],
      [
        "defi",
        {
          name: "DeFi",
          url: process.env.DEFI_BOT_URL || "http://localhost:3010",
          strategy: "defi_automation",
        },
      ],
      [
        "bridge",
        {
          name: "Bridge",
          url: process.env.BRIDGE_BOT_URL || "http://localhost:3011",
          strategy: "cross_chain_bridge",
        },
      ],
      [
        "lending",
        {
          name: "Lending",
          url: process.env.LENDING_BOT_URL || "http://localhost:3012",
          strategy: "defi_lending",
        },
      ],
      [
        "gas_optimizer",
        {
          name: "Gas Optimizer",
          url: process.env.GAS_OPTIMIZER_BOT_URL || "http://localhost:3013",
          strategy: "gas_optimization",
        },
      ],
      [
        "mining",
        {
          name: "Mining",
          url: process.env.MINING_BOT_URL || "http://localhost:3014",
          strategy: "mining_management",
        },
      ],
    ]);
  }

  async getAllBotsStatus(): Promise<
    Record<
      string,
      {
        isOnline: boolean;
        isActive: boolean;
        strategy: string;
        totalTrades?: number;
        netPnL?: number;
      }
    >
  > {
    const statuses: Record<string, any> = {};

    for (const [key, bot] of this.bots.entries()) {
      try {
        const response = await axios.get(`${bot.url}/status`, {
          timeout: 3000,
        });

        const metrics = await axios.get(`${bot.url}/metrics`, {
          timeout: 3000,
        });

        statuses[key] = {
          isOnline: true,
          isActive: response.data.isActive,
          strategy: bot.strategy,
          totalTrades: metrics.data.totalTrades,
          netPnL: metrics.data.netProfit,
        };
      } catch (error) {
        statuses[key] = {
          isOnline: false,
          isActive: false,
          strategy: bot.strategy,
        };
      }
    }

    return statuses;
  }

  async getSystemStatus(): Promise<{
    totalBots: number;
    activeBots: number;
    onlineBots: number;
    totalTrades: number;
    winRate: number;
    netPnL: number;
  }> {
    const statuses = await this.getAllBotsStatus();

    let totalTrades = 0;
    let netPnL = 0;
    let activeBots = 0;
    let onlineBots = 0;

    for (const status of Object.values(statuses)) {
      if (status.isOnline) onlineBots++;
      if (status.isActive) activeBots++;
      totalTrades += status.totalTrades || 0;
      netPnL += status.netPnL || 0;
    }

    const allMetrics = await this.getAllBotsMetrics();
    const avgWinRate =
      Object.values(allMetrics).reduce((sum, m) => sum + m.winRate, 0) /
      Object.keys(allMetrics).length;

    return {
      totalBots: this.bots.size,
      activeBots,
      onlineBots,
      totalTrades,
      winRate: avgWinRate || 0,
      netPnL,
    };
  }

  async getBotMetrics(botName: string): Promise<any> {
    const bot = this.bots.get(botName);

    if (!bot) {
      throw new Error(`Bot ${botName} not found`);
    }

    try {
      const response = await axios.get(`${bot.url}/metrics`, {
        timeout: 5000,
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch metrics for ${botName}: ${error.message}`);
    }
  }

  async getAllBotsMetrics(): Promise<Record<string, any>> {
    const metrics: Record<string, any> = {};

    for (const [key, bot] of this.bots.entries()) {
      try {
        const response = await axios.get(`${bot.url}/metrics`, {
          timeout: 3000,
        });

        metrics[key] = response.data;
      } catch (error) {
        metrics[key] = {
          totalTrades: 0,
          winRate: 0,
          netProfit: 0,
        };
      }
    }

    return metrics;
  }

  async startBot(botName: string): Promise<any> {
    const bot = this.bots.get(botName);

    if (!bot) {
      throw new Error(`Bot ${botName} not found`);
    }

    try {
      const response = await axios.post(`${bot.url}/activate`, {
        timeout: 5000,
      });

      return {
        success: true,
        status: "active",
        strategy: bot.strategy,
        ...response.data,
      };
    } catch (error: any) {
      throw new Error(`Failed to start ${botName}: ${error.message}`);
    }
  }

  async stopBot(botName: string): Promise<any> {
    const bot = this.bots.get(botName);

    if (!bot) {
      throw new Error(`Bot ${botName} not found`);
    }

    try {
      const response = await axios.post(`${bot.url}/deactivate`, {
        timeout: 5000,
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to stop ${botName}: ${error.message}`);
    }
  }

  async executeBot(botName: string, marketData?: any): Promise<any> {
    const bot = this.bots.get(botName);

    if (!bot) {
      throw new Error(`Bot ${botName} not found`);
    }

    // If no market data provided, fetch latest
    const data =
      marketData ||
      (await this.fetchMarketData("BTC/USDT"));

    try {
      const response = await axios.post(`${bot.url}/execute`, data, {
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to execute ${botName}: ${error.message}`);
    }
  }

  private async fetchMarketData(symbol: string): Promise<any> {
    // Simulated market data - in production, fetch from real exchange
    return {
      symbol,
      price: 50000 + Math.random() * 1000,
      volume: 1000000,
      bidPrice: 49950,
      askPrice: 50050,
      timestamp: new Date(),
    };
  }

  getBotList(): string[] {
    return Array.from(this.bots.keys());
  }

  getBotInfo(botName: string): BotEndpoint | undefined {
    return this.bots.get(botName);
  }
}
