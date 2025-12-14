/**
 * Gas Optimizer Bot - Gas price optimization and transaction batching
 */

import { BaseBot, MarketData, ExecutionResult } from "../types";

interface PendingTransaction {
  id: string;
  type: string;
  gasEstimate: number;
  priority: "low" | "medium" | "high";
  createdAt: Date;
}

export class GasOptimizerBot extends BaseBot {
  private pendingTxs: PendingTransaction[] = [];
  private gasPriceHistory: number[] = [];
  private maxGasPrice: number = 50; // gwei
  private totalGasSaved: number = 0;

  constructor() {
    super("gas_optimizer_bot", "Gas Optimizer");
  }

  private getAverageGasPrice(): number {
    if (this.gasPriceHistory.length === 0) return 30;
    return this.gasPriceHistory.reduce((a, b) => a + b, 0) / this.gasPriceHistory.length;
  }

  private shouldExecute(currentGasPrice: number): boolean {
    const avgGas = this.getAverageGasPrice();
    return currentGasPrice < avgGas * 0.8 || currentGasPrice < this.maxGasPrice * 0.5;
  }

  private addPendingTransaction(): void {
    const types = ["swap", "transfer", "stake", "unstake"];
    const priorities: Array<"low" | "medium" | "high"> = ["low", "medium", "high"];

    this.pendingTxs.push({
      id: `tx_${Date.now()}`,
      type: types[Math.floor(Math.random() * types.length)],
      gasEstimate: Math.floor(Math.random() * 100000) + 21000,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      createdAt: new Date(),
    });
  }

  async execute(marketData: MarketData): Promise<ExecutionResult> {
    const currentPrice = marketData.price;

    // Simulate current gas price
    const currentGasPrice = 20 + Math.random() * 60; // 20-80 gwei
    this.gasPriceHistory.push(currentGasPrice);

    if (this.gasPriceHistory.length > 100) {
      this.gasPriceHistory = this.gasPriceHistory.slice(-100);
    }

    // Randomly add pending transactions
    if (Math.random() > 0.7) {
      this.addPendingTransaction();
    }

    // Check if we should batch execute
    if (this.shouldExecute(currentGasPrice) && this.pendingTxs.length > 0) {
      const batchSize = Math.min(this.pendingTxs.length, 5);
      const batch = this.pendingTxs.splice(0, batchSize);

      const totalGas = batch.reduce((sum, tx) => sum + tx.gasEstimate, 0);
      const avgGas = this.getAverageGasPrice();
      const gasSaved = (avgGas - currentGasPrice) * totalGas / 1e9 * currentPrice;
      this.totalGasSaved += Math.max(0, gasSaved);

      const result: ExecutionResult = {
        success: true,
        action: "buy",
        amount: batchSize,
        price: currentGasPrice,
        reason: `Batched ${batchSize} txs at ${currentGasPrice.toFixed(1)} gwei (avg: ${avgGas.toFixed(1)})`,
        profitLoss: gasSaved,
        metadata: {
          batchSize,
          gasPrice: currentGasPrice,
          avgGasPrice: avgGas,
          totalGasSaved: this.totalGasSaved,
        },
      };

      this.recordExecution(result);
      return result;
    }

    return {
      success: true,
      action: "hold",
      amount: 0,
      price: currentGasPrice,
      reason: `Gas: ${currentGasPrice.toFixed(1)} gwei. Pending: ${this.pendingTxs.length} txs. Saved: $${this.totalGasSaved.toFixed(2)}`,
    };
  }
}
