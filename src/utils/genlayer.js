import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

// Contract addresses - update these after deploying to Studionet
export const CONTRACTS = {
  CORE: "0x7FA5Ca03De15fC89673eD11d7b8cb1e22D560698",
  DISPUTE: "0x81e48d4547745C5650E559C4421229B73181574B",
  ESCROW: "0xe9fdA513bbB28efbe1b6670684090aEA0718e9Df",
};

// GenLayer client (Studionet = no gas needed)
export const glAccount = createAccount();
export const glClient = createClient({ chain: studionet, account: glAccount });

// Transaction status
export { TransactionStatus } from 'genlayer-js/types';

/**
 * Write to a contract and wait for finalization.
 * Returns the transaction receipt.
 */
export async function writeAndWait(address, functionName, args, onProgress) {
  if (address === "DEPLOY_ME") {
    throw new Error("Contract not deployed yet. Deploy to Studionet first.");
  }

  if (onProgress) onProgress("broadcasting");

  const txHash = await glClient.writeContract({
    address,
    functionName,
    args,
    value: 0n,
  });

  if (onProgress) onProgress("pending");

  // Wait for finalization with retry
  let finalized = false;
  let attempts = 0;
  while (!finalized && attempts < 60) {
    try {
      await glClient.waitForTransactionReceipt({
        hash: txHash,
        status: "FINALIZED",
      });
      finalized = true;
    } catch {
      attempts++;
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  if (!finalized) {
    throw new Error("Transaction did not finalize within timeout.");
  }

  if (onProgress) onProgress("finalized");
  return txHash;
}

/**
 * Read from a contract (view function).
 */
export async function readContract(address, functionName, args = []) {
  if (address === "DEPLOY_ME") {
    return null;
  }

  return glClient.readContract({
    address,
    functionName,
    args,
  });
}

/**
 * Check if contracts are deployed.
 */
export function isDeployed() {
  return Object.values(CONTRACTS).every(addr => addr !== "DEPLOY_ME");
}

/**
 * Check if a specific contract is deployed.
 */
export function isContractDeployed(contractKey) {
  return CONTRACTS[contractKey] !== "DEPLOY_ME";
}
