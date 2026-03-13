'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { useWalletScreen } from '../hooks/useWalletScreen';
import type { LoginResponse } from '../types/auth';
import type { DepositInitiatedResponse, LedgerEntry } from '../types/wallet';
import '../i18n';

interface Props {
  session: LoginResponse;
  onBack: () => void;
  onBalanceChanged: (sats: number) => void;
}

type WalletTab = 'deposit' | 'withdraw' | 'history';

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px 0',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        border: 'none',
        borderBottom: active ? '2px solid var(--text)' : '2px solid transparent',
        background: 'transparent',
        color: active ? 'var(--text)' : 'var(--text-muted)',
        transition: 'color 0.15s, border-color 0.15s',
      }}
    >
      {label}
    </button>
  );
}

function TxRow({ entry }: { entry: LedgerEntry }) {
  const { t } = useTranslation();
  const labelMap: Record<string, string> = {
    deposit: t('wallet_txDeposit'),
    withdraw: t('wallet_txWithdraw'),
    bet: t('wallet_txBet'),
    win: t('wallet_txWin'),
    refund: t('wallet_txRefund'),
  };
  const label = labelMap[entry.type] ?? entry.type;
  const isPositive = ['deposit', 'win', 'refund'].includes(entry.type.toLowerCase());
  const date = new Date(entry.createdAt).toLocaleDateString();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{label}</p>
        <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: '2px 0 0' }}>{date}</p>
      </div>
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: isPositive ? '#4CAF50' : 'var(--danger)',
        }}
      >
        {isPositive ? '+' : '-'}{Math.abs(entry.amountSats).toLocaleString()} sats
      </span>
    </div>
  );
}

export function WalletScreen({ session, onBack, onBalanceChanged }: Props) {
  const { t } = useTranslation();
  const {
    wallet,
    transactions,
    loadingWallet,
    depositStep,
    depositAmount,
    setDepositAmount,
    depositData,
    depositLoading,
    depositError,
    handleGenerateInvoice,
    handleResetDeposit,
    handleCopyInvoice,
    withdrawTab,
    setWithdrawTab,
    withdrawInvoice,
    setWithdrawInvoice,
    withdrawAmount,
    setWithdrawAmount,
    withdrawLoading,
    withdrawError,
    withdrawSuccess,
    handleWithdrawInvoice,
  } = useWalletScreen(session, onBalanceChanged);

  const [activeTab, setActiveTab] = useState<WalletTab>('deposit');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text)',
            fontSize: 20,
            lineHeight: 1,
            padding: '2px 6px',
          }}
          aria-label="back"
        >
          ‹
        </button>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          {t('wallet_title')}
        </h1>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px 48px' }}>

          {/* Balance card */}
          {loadingWallet ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
              <Spinner />
            </div>
          ) : wallet ? (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: '24px 20px',
                marginBottom: 24,
                display: 'flex',
                gap: 16,
              }}
            >
              <BalanceStat label={t('wallet_balance')} value={wallet.availableBalanceSats} highlight />
              <div style={{ width: 1, background: 'var(--border)' }} />
              <BalanceStat label={t('wallet_locked')} value={wallet.lockedBalanceSats} />
            </div>
          ) : null}

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--border)',
              marginBottom: 24,
            }}
          >
            <TabButton label={t('wallet_depositTab')} active={activeTab === 'deposit'} onClick={() => setActiveTab('deposit')} />
            <TabButton label={t('wallet_withdrawTab')} active={activeTab === 'withdraw'} onClick={() => setActiveTab('withdraw')} />
            <TabButton label={t('wallet_historyTab')} active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
          </div>

          {/* ── Deposit ── */}
          {activeTab === 'deposit' && (
            <DepositPanel
              depositStep={depositStep}
              depositAmount={depositAmount}
              setDepositAmount={setDepositAmount}
              depositData={depositData}
              depositLoading={depositLoading}
              depositError={depositError}
              onGenerate={handleGenerateInvoice}
              onCopy={handleCopyInvoice}
              onReset={handleResetDeposit}
            />
          )}

          {/* ── Withdraw ── */}
          {activeTab === 'withdraw' && (
            <WithdrawPanel
              withdrawTab={withdrawTab}
              setWithdrawTab={setWithdrawTab}
              withdrawInvoice={withdrawInvoice}
              setWithdrawInvoice={setWithdrawInvoice}
              withdrawAmount={withdrawAmount}
              setWithdrawAmount={setWithdrawAmount}
              withdrawLoading={withdrawLoading}
              withdrawError={withdrawError}
              withdrawSuccess={withdrawSuccess}
              onWithdrawInvoice={handleWithdrawInvoice}
            />
          )}

          {/* ── History ── */}
          {activeTab === 'history' && (
            <div>
              {loadingWallet ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}><Spinner /></div>
              ) : transactions.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 14, padding: '40px 0' }}>
                  {t('wallet_historyEmpty')}
                </p>
              ) : (
                transactions.map(tx => <TxRow key={tx.id} entry={tx} />)
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BalanceStat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
        {label}
      </p>
      <p style={{ fontSize: 22, fontWeight: 800, color: highlight ? 'var(--text)' : 'var(--text-muted)', margin: 0, lineHeight: 1 }}>
        {value.toLocaleString()}
        <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 4 }}>sats</span>
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.12)',
        borderTopColor: 'white',
        animation: 'spin 0.7s linear infinite',
      }}
    />
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {children}
    </p>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <p style={{ fontSize: 13, color: 'var(--danger)', margin: '10px 0 0', lineHeight: 1.4 }}>{msg}</p>
  );
}

function SuccessMsg({ msg }: { msg: string }) {
  return (
    <p style={{ fontSize: 13, color: '#4CAF50', margin: '10px 0 0', lineHeight: 1.4 }}>{msg}</p>
  );
}

// ── Deposit Panel ─────────────────────────────────────────────────────────────

interface DepositPanelProps {
  depositStep: 'idle' | 'invoice' | 'polling' | 'paid';
  depositAmount: string;
  setDepositAmount: (v: string) => void;
  depositData: DepositInitiatedResponse | null;
  depositLoading: boolean;
  depositError: string;
  onGenerate: () => void;
  onCopy: () => void;
  onReset: () => void;
}

function DepositPanel({
  depositStep,
  depositAmount,
  setDepositAmount,
  depositData,
  depositLoading,
  depositError,
  onGenerate,
  onCopy,
  onReset,
}: DepositPanelProps) {
  const { t } = useTranslation();

  if (depositStep === 'paid') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '32px 0' }}>
        <span style={{ fontSize: 56 }}>✅</span>
        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{t('wallet_paid')}</p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>{t('wallet_paidMsg')}</p>
        <button onClick={onReset} style={actionButtonStyle()}>{t('wallet_newDeposit')}</button>
      </div>
    );
  }

  if (depositStep === 'invoice' || depositStep === 'polling') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        {depositData?.invoice && (
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: 16,
              display: 'inline-block',
            }}
          >
            <QRCodeSVG value={depositData.invoice} size={220} />
          </div>
        )}

        <div style={{ width: '100%' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Invoice
          </p>
          <div
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 11,
              color: 'var(--text-muted)',
              wordBreak: 'break-all',
              lineHeight: 1.5,
              fontFamily: 'monospace',
            }}
          >
            {depositData?.invoice ?? ''}
          </div>
        </div>

        <button onClick={onCopy} style={actionButtonStyle()}>{t('wallet_copyInvoice')}</button>

        {depositStep === 'polling' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Spinner />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('wallet_waitingPayment')}</span>
          </div>
        )}

        <button
          onClick={onReset}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-faint)',
            fontSize: 13,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {t('wallet_newDeposit')}
        </button>
      </div>
    );
  }

  // idle
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <FieldLabel>{t('wallet_depositAmountLabel')}</FieldLabel>
        <input
          type="number"
          value={depositAmount}
          onChange={e => setDepositAmount(e.target.value)}
          placeholder={t('wallet_depositAmountPlaceholder')}
          min={1}
          style={inputStyle()}
        />
      </div>
      {depositError && <ErrorMsg msg={depositError} />}
      <button onClick={onGenerate} disabled={depositLoading} style={actionButtonStyle(depositLoading)}>
        {depositLoading ? t('wallet_generating') : t('wallet_generateInvoice')}
      </button>
    </div>
  );
}

// ── Withdraw Panel ────────────────────────────────────────────────────────────

interface WithdrawPanelProps {
  withdrawTab: 'invoice' | 'address';
  setWithdrawTab: (v: 'invoice' | 'address') => void;
  withdrawInvoice: string;
  setWithdrawInvoice: (v: string) => void;
  withdrawAmount: string;
  setWithdrawAmount: (v: string) => void;
  withdrawLoading: boolean;
  withdrawError: string;
  withdrawSuccess: string;
  onWithdrawInvoice: () => void;
}

function WithdrawPanel({
  withdrawTab,
  setWithdrawTab,
  withdrawInvoice,
  setWithdrawInvoice,
  withdrawAmount,
  setWithdrawAmount,
  withdrawLoading,
  withdrawError,
  withdrawSuccess,
  onWithdrawInvoice,
}: WithdrawPanelProps) {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Sub-tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          background: 'var(--surface2)',
          borderRadius: 12,
          padding: 4,
        }}
      >
        {(['invoice', 'address'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setWithdrawTab(tab)}
            style={{
              flex: 1,
              padding: '8px 0',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              borderRadius: 9,
              background: withdrawTab === tab ? 'var(--surface)' : 'transparent',
              color: withdrawTab === tab ? 'var(--text)' : 'var(--text-muted)',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {tab === 'invoice' ? t('wallet_withdrawInvoiceTab') : t('wallet_withdrawAddressTab')}
          </button>
        ))}
      </div>

      {withdrawTab === 'invoice' ? (
        <>
          <div>
            <FieldLabel>{t('wallet_invoiceLabel')}</FieldLabel>
            <textarea
              value={withdrawInvoice}
              onChange={e => setWithdrawInvoice(e.target.value)}
              placeholder={t('wallet_invoicePlaceholder')}
              rows={3}
              style={{ ...inputStyle(), resize: 'vertical', fontFamily: 'monospace', fontSize: 11 }}
            />
          </div>
          <div>
            <FieldLabel>{t('wallet_withdrawAmountLabel')}</FieldLabel>
            <input
              type="number"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              placeholder={t('wallet_withdrawAmountPlaceholder')}
              min={1}
              style={inputStyle()}
            />
          </div>
          {withdrawError && <ErrorMsg msg={withdrawError} />}
          {withdrawSuccess && <SuccessMsg msg={withdrawSuccess} />}
          <button onClick={onWithdrawInvoice} disabled={withdrawLoading} style={actionButtonStyle(withdrawLoading)}>
            {withdrawLoading ? t('wallet_withdrawing') : t('wallet_withdrawButton')}
          </button>
        </>
      ) : (
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>
            Lightning Address coming soon.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'var(--surface2)',
    color: 'var(--text)',
    fontSize: 14,
    outline: 'none',
  };
}

function actionButtonStyle(disabled = false): React.CSSProperties {
  return {
    width: '100%',
    padding: '13px 0',
    borderRadius: 12,
    border: 'none',
    background: 'var(--text)',
    color: 'var(--bg)',
    fontSize: 14,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'opacity 0.15s',
  };
}
