import {LedgerTransaction, TransactionDirection} from '../models/types';

export interface TransactionSummary {
  totalSentCents: number;
  totalReceivedCents: number;
  netCents: number;
}

export type TransactionPerspective = 'ADMIN' | 'COWORKER';

function emptySummary(): TransactionSummary {
  return {
    totalSentCents: 0,
    totalReceivedCents: 0,
    netCents: 0,
  };
}

export function invertDirection(
  direction: TransactionDirection,
): TransactionDirection {
  return direction === 'SENT' ? 'RECEIVED' : 'SENT';
}

export function directionForPerspective(
  direction: TransactionDirection,
  perspective: TransactionPerspective,
): TransactionDirection {
  if (perspective === 'COWORKER') {
    return invertDirection(direction);
  }
  return direction;
}

export function transactionsForPerspective(
  transactions: LedgerTransaction[],
  perspective: TransactionPerspective,
): LedgerTransaction[] {
  if (perspective === 'ADMIN') {
    return transactions;
  }
  return transactions.map(transaction => ({
    ...transaction,
    direction: directionForPerspective(transaction.direction, perspective),
  }));
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

export function summarizeTransactionsForPerspective(
  transactions: LedgerTransaction[],
  perspective: TransactionPerspective,
): TransactionSummary {
  if (perspective === 'ADMIN') {
    return summarizeTransactions(transactions);
  }

  const perspectiveTransactions = transactionsForPerspective(
    transactions,
    perspective,
  );
  const summary = summarizeTransactions(perspectiveTransactions);
  return {
    ...summary,
    netCents: summary.totalReceivedCents - summary.totalSentCents,
  };
}

export function summarizeByRecipient(
  transactions: LedgerTransaction[],
): Record<string, TransactionSummary> {
  const summaryMap: Record<string, TransactionSummary> = {};
  transactions.forEach(transaction => {
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
