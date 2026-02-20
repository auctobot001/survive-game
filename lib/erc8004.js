/**
 * ERC-8004 Agent Identity Verification
 *
 * ERC-8004 defines an AI agent NFT standard on Base.
 * This module reads ownerOf(tokenId) from the deployed contract
 * and compares it against the paying wallet address.
 *
 * Env vars required:
 *   ERC8004_CONTRACT_ADDRESS  — deployed ERC-8004 contract on Base mainnet
 */
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const CONTRACT = process.env.ERC8004_CONTRACT_ADDRESS;

const client = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
});

// Minimal ERC-721 ownerOf ABI
const abi = [
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs:  [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '',        type: 'address'  }],
  },
];

/**
 * Verify that claimedOwner holds the given ERC-8004 tokenId.
 * @param {string|number} tokenId   — ERC-8004 token ID from X-Agent-Token-Id header
 * @param {string}        claimedOwner — wallet address (from payment proof)
 * @returns {{ verified: boolean, agentTier: 'AGENT' | 'NORMAL' }}
 */
export async function verifyAgentToken(tokenId, claimedOwner) {
  if (!CONTRACT || !tokenId || !claimedOwner) {
    return { verified: false, agentTier: 'NORMAL' };
  }
  try {
    const owner = await client.readContract({
      address: CONTRACT,
      abi,
      functionName: 'ownerOf',
      args: [BigInt(tokenId)],
    });
    const verified = owner.toLowerCase() === claimedOwner.toLowerCase();
    return { verified, agentTier: verified ? 'AGENT' : 'NORMAL' };
  } catch {
    return { verified: false, agentTier: 'NORMAL' };
  }
}
