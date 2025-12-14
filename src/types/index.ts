/**
 * Type definitions for PLAIKE BOT
 */

export interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  bidPrice: number;
  askPrice: number;
  timestamp: Date;
}

export interface ExecutionResult {
  success: boolean;
  action: "buy" | "sell" | "hold";
  amount: number;
  price: number;
  reason: string;
  profitLoss?: number;
  metadata?: Record<string, any>;
}

export interface BotConfig {
  botId: string;
  userId: string;
  tradingPair: string;
  exchange: string;
  investmentAmount: number;
  isActive: boolean;
  config: Record<string, any>;
}

export interface BotMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  averageProfit: number;
  averageLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  recoveryFactor: number;
}

export interface BotStatus {
  isOnline: boolean;
  isActive: boolean;
  strategy: string;
  totalTrades: number;
  netPnL: number;
}

export interface SystemStatus {
  totalBots: number;
  activeBots: number;
  onlineBots: number;
  totalTrades: number;
  winRate: number;
  netPnL: number;
}

export interface BotExecution {
  id: string;
  botId: string;
  action?: string;
  strategy: string;
  status: string;
  entryPrice: string | null;
  exitPrice: string | null;
  amount: string;
  profit: string;
  fees: string;
  slippage: string;
  reason: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface LearningData {
  botId: string;
  action: string;
  inputData: Record<string, any>;
  outputData: Record<string, any>;
  outcome: string;
  reward: number;
  timestamp: Date;
}

export interface BotMemory {
  botId: string;
  category: string;
  key: string;
  value: Record<string, any>;
  confidence: number;
  timestamp: Date;
}

export abstract class BaseBot {
  protected botId: string;
  protected strategyName: string;
  protected active: boolean = false;
  protected executionHistory: BotExecution[] = [];
  protected memory: Map<string, BotMemory> = new Map();

  constructor(botId: string, strategyName: string) {
    this.botId = botId;
    this.strategyName = strategyName;
  }

  abstract execute(marketData: MarketData): Promise<ExecutionResult>;

  getStrategyName(): string {
    return this.strategyName;
  }

  isActive(): boolean {
    return this.active;
  }

  activate(): void {
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
  }

  getMetrics(): BotMetrics {
    const trades = this.executionHistory.filter(
      (e) => e.status === "filled" && e.action !== "hold"
    );

    const totalTrades = trades.length;
    const winningTrades = trades.filter((t) => parseFloat(t.profit) > 0).length;
    const losingTrades = trades.filter((t) => parseFloat(t.profit) < 0).length;

    const totalProfit = trades
      .filter((t) => parseFloat(t.profit) > 0)
      .reduce((sum, t) => sum + parseFloat(t.profit), 0);

    const totalLoss = Math.abs(
      trades
        .filter((t) => parseFloat(t.profit) < 0)
        .reduce((sum, t) => sum + parseFloat(t.profit), 0)
    );

    const netProfit = totalProfit - totalLoss;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const averageProfit = winningTrades > 0 ? totalProfit / winningTrades : 0;
    const averageLoss = losingTrades > 0 ? totalLoss / losingTrades : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;

    const returns = trades.map((t) => parseFloat(t.profit));
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const stdDev = returns.length > 0
      ? Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length) || 1
      : 1;
    const sharpeRatio = avgReturn / stdDev;

    let peak = 0;
    let maxDrawdown = 0;
    let runningProfit = 0;

    for (const trade of trades) {
      runningProfit += parseFloat(trade.profit);
      if (runningProfit > peak) {
        peak = runningProfit;
      }
      const drawdown = peak - runningProfit;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    const recoveryFactor = maxDrawdown > 0 ? netProfit / maxDrawdown : 0;

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      totalProfit,
      totalLoss,
      netProfit,
      averageProfit,
      averageLoss,
      profitFactor,
      sharpeRatio,
      maxDrawdown,
      recoveryFactor,
    };
  }

  protected recordExecution(result: ExecutionResult): void {
    const execution: BotExecution = {
      id: `${this.botId}_${Date.now()}`,
      botId: this.botId,
      action: result.action,
      strategy: this.strategyName,
      status: result.success ? "filled" : "error",
      entryPrice: result.action === "buy" ? result.price.toString() : null,
      exitPrice: result.action === "sell" ? result.price.toString() : null,
      amount: result.amount.toString(),
      profit: (result.profitLoss || 0).toString(),
      fees: "0",
      slippage: "0",
      reason: result.reason,
      metadata: result.metadata,
      createdAt: new Date(),
    };

    this.executionHistory.push(execution);
  }
}
