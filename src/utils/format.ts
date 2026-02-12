export function formatAmount(amount: number) {
  const fixed = amount.toFixed(2);
  return `₹${fixed}`;
}

export function formatAmountFromCents(amountCents: number) {
  return formatAmount(amountCents / 100);
}

export function formatSignedAmountFromCents(amountCents: number) {
  if (amountCents > 0) {
    return `+${formatAmountFromCents(amountCents)}`;
  }
  if (amountCents < 0) {
    return `-${formatAmountFromCents(Math.abs(amountCents))}`;
  }
  return formatAmountFromCents(0);
}

export function formatDate(date: Date) {
  return date.toLocaleDateString();
}
