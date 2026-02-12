import { Transaction } from '../models/types';

export function calcBalance(transactions: Transaction[]) {
  return transactions.reduce((sum, txn) => {
    if (txn.isDeleted) {
      return sum;
    }
    const delta = txn.type === 'PAID_TO_COWORKER' ? txn.amount : -txn.amount;
    return sum + delta;
  }, 0);
}
