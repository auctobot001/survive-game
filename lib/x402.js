/**
 * x402 Payment Protocol — manual implementation via viem
 *
 * Flow:
 *   1. Bot POSTs /api/game/action
 *   2. Server returns 402 with { x402: paymentRequirements() }
 *   3. Bot sends ETH to FEE_RECIPIENT on Base mainnet
 *   4. Bot retries with header: X-PAYMENT: <txHash>
 *   5. Server verifies tx and executes action
 *
 * To swap in the official Coinbase x402 npm package:
 *   npm install x402
 *   import { verifyPayment } from 'x402';
 *   Replace verifyX402() below with the package's verify function.
 */
import { createPublicClient, http, parseEther } from 'viem';
import { base } from 'viem/chains';

const FEE_ETH       = '0.0001';
const FEE_RECIPIENT = '0x697aAd779C93bDF0F33AC041085807e4BE162200';

const client = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
});

/** Payment requirement object returned in 402 responses. */
export function paymentRequirements() {
  return {
    amount:       FEE_ETH,
    currency:     'ETH',
    network:      'base',
    chainId:      8453,
    recipient:    FEE_RECIPIENT,
    memo:         'survive-action',
    instructions: `Send ${FEE_ETH} ETH to ${FEE_RECIPIENT} on Base mainnet, then retry with header: X-PAYMENT: <txHash>`,
  };
}

/**
 * Verify the X-PAYMENT header (expected: a Base mainnet tx hash).
 *
 * Supports two transfer modes:
 *  1. Direct EOA transfer: tx.to === FEE_RECIPIENT, tx.value >= FEE_ETH
 *  2. ERC-4337 Smart Account (e.g. Coinbase Smart Wallet / Bankr):
 *     tx.to === EntryPoint, ETH arrives at FEE_RECIPIENT via internal call.
 *     Verified by balance-diff on the recipient across the tx's block.
 *
 * @param {Request} req — Node.js IncomingMessage
 * @returns {{ ok: boolean, payer?: string, txHash?: string }}
 */
export async function verifyX402(req) {
  const payment = req.headers['x-payment'];
  if (!payment) return { ok: false };

  const txHash = payment.trim();
  if (!txHash.startsWith('0x') || txHash.length !== 66) return { ok: false };

  try {
    const [receipt, tx] = await Promise.all([
      client.getTransactionReceipt({ hash: txHash }),
      client.getTransaction({ hash: txHash }),
    ]);

    if (!receipt || receipt.status !== 'success') return { ok: false };

    const feeRecipientLower = FEE_RECIPIENT.toLowerCase();
    const minFee = parseEther(FEE_ETH);

    // ── Mode 1: direct EOA transfer ──────────────────────────────────────────
    if (tx.to?.toLowerCase() === feeRecipientLower && tx.value >= minFee) {
      return { ok: true, payer: tx.from, txHash };
    }

    // ── Mode 2: ERC-4337 smart account (EntryPoint route) ───────────────────
    // Verify via balance-diff: check FEE_RECIPIENT gained >= FEE_ETH in this block.
    const blockNum = receipt.blockNumber;
    const [balAfter, balBefore] = await Promise.all([
      client.getBalance({ address: FEE_RECIPIENT, blockNumber: blockNum }),
      client.getBalance({ address: FEE_RECIPIENT, blockNumber: blockNum - 1n }),
    ]);

    if (balAfter - balBefore >= minFee) {
      // payer is the smart account's outer sender
      return { ok: true, payer: tx.from, txHash };
    }

    return { ok: false };
  } catch {
    return { ok: false };
  }
}
