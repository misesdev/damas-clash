export interface WalletResponse {
  balanceSats: number;
  lockedBalanceSats: number;
  availableBalanceSats: number;
}

export interface DepositInitiatedResponse {
  paymentId: string;
  invoice: string;
  rHash: string;
  expiresAt: number; // unix timestamp (seconds)
}

export interface DepositStatusResponse {
  status: string;
  amountSats: number;
  credited: boolean;
}

export interface LedgerEntry {
  id: string;
  type: string;
  amountSats: number;
  gameId: string | null;
  paymentId: string | null;
  createdAt: string;
}

export interface WithdrawResponse {
  paymentHash: string;
  feeSats: number;
  amountSats: number;
}
