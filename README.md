# JESUS IAM BOT

🕊️ Telegram bot for controlling Valifi standalone trading bots

## Features

- ✅ **14 Trading Bot Control**: Manage all standalone trading bots remotely
- ✅ **Real-Time Monitoring**: Track performance, metrics, and execution
- ✅ **Multi-Bot Orchestration**: Execute commands across multiple bots
- ✅ **Performance Analytics**: Win rate, P&L, Sharpe ratio, and more
- ✅ **Notifications**: Real-time alerts for trades, errors, and performance
- ✅ **Rate Limiting**: Prevents command spam and abuse
- ✅ **Natural Language**: Simple commands like "start all bots"

## Installation

```bash
npm install
```

## Configuration

Create `.env` file:

```env
TELEGRAM_BOT_TOKEN=8525278301:AAHMNaMwcYkWKilz5P5hto_XI5fE0aK7Xbw
TELEGRAM_ADMIN_CHAT_ID=your_chat_id

# Bot Service URLs
GRID_BOT_URL=http://localhost:3001
DCA_BOT_URL=http://localhost:3002
# ... (see .env.example for all)
```

## Running

### Development (Polling)

```bash
npm run dev
```

### Production (Webhook)

```bash
# Build
npm run build

# Set webhook
WEBHOOK_URL=https://your-domain.com npm run webhook:set

# Start
npm start
```

## Commands

### Bot Management
- `/bots` - List all trading bots
- `/start_bot <name>` - Start a specific bot
- `/stop_bot <name>` - Stop a specific bot
- `/status` - System status overview

### Performance & Analytics
- `/metrics` - View all bots performance
- `/metrics <bot_name>` - Specific bot metrics
- `/history <bot_name>` - Execution history
- `/pnl` - Profit & Loss summary

### Trading Operations
- `/execute <bot_name>` - Execute bot manually
- `/reset <bot_name>` - Reset bot state
- `/config <bot_name> <param> <value>` - Update config

### Notifications
- `/notify on` - Enable notifications
- `/notify off` - Disable notifications
- `/alerts` - View active alerts

## Available Bots

1. **Grid Trading** - Price interval buy/sell orders
2. **DCA** - Dollar-cost averaging
3. **Arbitrage** - Cross-exchange opportunities
4. **Scalping** - Fast EMA/RSI trades
5. **Market Making** - Liquidity provision
6. **Momentum AI** - AI-powered pattern recognition
7. **MEV** - Mempool opportunities (with ethics)
8. **AMM** - Automated market maker
9. **Liquidity** - Multi-pool management
10. **DeFi** - Protocol automation
11. **Bridge** - Cross-chain bridging
12. **Lending** - Lending/borrowing automation
13. **Gas Optimizer** - Gas price optimization
14. **Mining** - Mining management

## Architecture

```
JESUS_CARTEL_BOT/
├── src/
│   ├── index.ts                 # Main bot server
│   ├── services/
│   │   ├── BotController.ts     # Manages bot communication
│   │   ├── NotificationService.ts
│   │   └── CommandHandler.ts
│   ├── middleware/
│   │   └── RateLimiter.ts
│   └── utils/
└── config/
```

## Integration with Standalone Bots

This bot communicates with standalone trading bots via HTTP API:

- Each bot runs on its own port (3001-3014)
- Bot Controller sends commands via REST API
- Real-time metrics fetched on demand
- Supports both local and remote bot instances

## Security

- Rate limiting (10 commands/minute)
- Admin chat ID verification
- Allowed user whitelist
- Secure token storage
- No credentials in logs

## Deployment

### Replit
1. Import repository
2. Set environment variables
3. Run `npm start`

### Docker
```bash
docker build -t jesus-cartel-bot .
docker run -d --env-file .env jesus-cartel-bot
```

### VPS
```bash
git clone git@github.com:ilabelagent/JESUS_IAM_BOT.git
cd JESUS_CARTEL_BOT
npm install
npm run build
npm start
```

## API Reference

### Get Bot Status
```typescript
const status = await botController.getAllBotsStatus();
// Returns: { bot_name: { isOnline, isActive, strategy, totalTrades, netPnL } }
```

### Execute Bot
```typescript
const result = await botController.executeBot('grid', marketData);
// Returns: { success, action, amount, price, reason, profitLoss }
```

### Get Metrics
```typescript
const metrics = await botController.getBotMetrics('dca');
// Returns: { totalTrades, winRate, netProfit, sharpeRatio, ... }
```

## Support

- Telegram: @JESUS_IAM_BOT
- Repository: github.com/ilabelagent/JESUS_IAM_BOT
- Issues: github.com/ilabelagent/JESUS_IAM_BOT/issues

## License

MIT License - Copyright (c) 2024 Valifi Kingdom

## Acknowledgments

Built with:
- Node.js + TypeScript
- node-telegram-bot-api
- Express.js
- Axios

🙏 May your trades be blessed with wisdom and prosperity!
