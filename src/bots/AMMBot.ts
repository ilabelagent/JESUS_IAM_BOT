/**
 * AMM Bot - Automated Market Maker for liquidity pools
 */

import { BaseBot, MarketData, ExecutionResult } from "../types";

export class AMMBot extends BaseBot {
  private poolTokenA: number = 1000;
  private poolTokenB: number = 50000;
  private fee: number = 0.003; // 0.3%
  private totalFees: number = 0;

  constructor() {
    super("amm_bot", "AMM");
  }

  private getPrice(): number {
    return this.poolTokenB / this.poolTokenA;
  }

  private calculateOutput(inputAmount: number, isTokenA: boolean): number {
    const k = this.poolTokenA * this.poolTokenB;
    const inputAfterFee = inputAmount * (1 - this.fee);

    if (isTokenA) {
      const newTokenA = this.poolTokenA + inputAfterFee;
      const newTokenB = k / newTokenA;
      return this.poolTokenB - newTokenB;
    } else {
      const newTokenB = this.poolTokenB + inputAfterFee;
      const newTokenA = k / newTokenB;
      return this.poolTokenA - newTokenA;
    }
  }

  async execute(marketData: MarketData): Promise<ExecutionResult> {
    const currentPrice = marketData.price;
    const poolPrice = this.getPrice();

    // Simulate swap activity
    const random = Math.random();

    if (random > 0.7) {
      const isTokenAInput = Math.random() > 0.5;
      const inputAmount = isTokenAInput ? Math.random() * 10 : Math.random() * 5000;
      const outputAmount = this.calculateOutput(inputAmount, isTokenAInput);
      const feeCollected = inputAmount * this.fee;

      this.totalFees += feeCollected;

      // Update pools
      if (isTokenAInput) {
        this.poolTokenA += inputAmount;
        this.poolTokenB -= outputAmount;
      } else {
        this.poolTokenB += inputAmount;
        this.poolTokenA -= outputAmount;
      }

      const result: ExecutionResult = {
        success: true,
        action: isTokenAInput ? "buy" : "sell",
        amount: inputAmount,
        price: poolPrice,
        reason: `Swap executed: ${inputAmount.toFixed(4)} -> ${outputAmount.toFixed(4)}`,
        profitLoss: feeCollected,
        metadata: {
          poolTokenA: this.poolTokenA,
          poolTokenB: this.poolTokenB,
          poolPrice: this.getPrice(),
          totalFees: this.totalFees,
        },
      };

      this.recordExecution(result);
      return result;
    }

    return {
      success: true,
      action: "hold",
      amount: 0,
      price: poolPrice,
      reason: `Pool active. Price: $${poolPrice.toFixed(2)}, Fees: $${this.totalFees.toFixed(2)}`,
    };
  }
}
