# Batch Payments Example

This example demonstrates extending the Stripe Agent Toolkit with batch payment capabilities using an additional MCP server.

## Overview

The Stripe Agent Toolkit supports connecting to additional MCP servers alongside the core Stripe tools. This example uses [Spraay Protocol](https://spraay.app)'s x402 batch payment infrastructure to enable agents to process multi-recipient payments in a single on-chain transaction on Base.

### What this enables

- **Payroll automation**: Pay multiple contractors in one transaction
- **Revenue sharing**: Split payments across multiple recipients
- **Multi-vendor payments**: Transfer funds to multiple suppliers simultaneously
- **Batch refunds**: Process refunds to multiple customers at once

### How it works

1. The toolkit connects to both `mcp.stripe.com` (core Stripe tools) and an additional MCP server for batch payments
2. Tools from both servers are merged into a single tool list
3. When the agent calls a batch payment tool, the toolkit automatically routes the call to the correct server
4. Batch payments settle on-chain via x402 protocol on Base

## Setup

```bash
npm install
```

Copy `.env.template` to `.env` and fill in:

```
STRIPE_SECRET_KEY=rk_test_...
OPENAI_API_KEY=sk-...
SPRAAY_MCP_URL=https://mcp.spraay.app
SPRAAY_API_KEY=        # optional
```

## Run

```bash
npx ts-node index.ts
```

## Configuration

Additional MCP servers are configured via the `additionalMcpServers` option:

```typescript
const toolkit = await createStripeAgentToolkit({
  secretKey: process.env.STRIPE_SECRET_KEY!,
  configuration: {
    additionalMcpServers: [
      {
        name: 'Spraay Protocol',
        url: 'https://mcp.spraay.app',
      },
    ],
  },
});
```

This pattern can be used to add tools from any MCP-compatible server alongside the core Stripe tools.
