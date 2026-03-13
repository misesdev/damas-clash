export interface WalletResponse {
  balanceSats: number;
  lockedBalanceSats: number;
  availableBalanceSats: number;
}

export interface LedgerEntryResponse {
  id: string;
  type: string;
  amountSats: number;
  gameId: string | null;
  paymentId: string | null;
  createdAt: string;
}

export interface DepositInitiatedResponse {
  paymentId: string;
  invoice: string;
  rHash: string;
  expiresAt: number;
}

export interface DepositStatusResponse {
  status: string;
  amountSats: number;
  credited: boolean;
}

export interface WithdrawResponse {
  paymentHash: string;
  amountSats: number;
  feePaidSats: number;
}
