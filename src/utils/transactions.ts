import { LedgerTransaction } from '../models/types';

export interface TransactionSummary {
  totalSentCents: number;
  totalReceivedCents: number;
  netCents: number;
}

function emptySummary(): TransactionSummary {
  return {
    totalSentCents: 0,
    totalReceivedCents: 0,
    netCents: 0,
  };
}

export function summarizeTransactions(
  transactions: LedgerTransaction[],
): TransactionSummary {
  return transactions.reduce((summary, transaction) => {
    if (transaction.direction === 'SENT') {
      summary.totalSentCents += transaction.amountCents;
      summary.netCents += transaction.amountCents;
      return summary;
    }
    summary.totalReceivedCents += transaction.amountCents;
    summary.netCents -= transaction.amountCents;
    return summary;
  }, emptySummary());
}

export function summarizeByRecipient(
  transactions: LedgerTransaction[],
): Record<string, TransactionSummary> {
  const summaryMap: Record<string, TransactionSummary> = {};
  transactions.forEach((transaction) => {
    const current = summaryMap[transaction.recipientId] || emptySummary();
    if (transaction.direction === 'SENT') {
      current.totalSentCents += transaction.amountCents;
      current.netCents += transaction.amountCents;
    } else {
      current.totalReceivedCents += transaction.amountCents;
      current.netCents -= transaction.amountCents;
    }
    summaryMap[transaction.recipientId] = current;
  });
  return summaryMap;
}
