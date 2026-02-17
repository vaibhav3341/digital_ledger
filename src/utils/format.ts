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

type DateLike =
  | Date
  | string
  | number
  | { toDate: () => Date }
  | null
  | undefined;

function toDate(dateLike: DateLike): Date | null {
  if (!dateLike) {
    return null;
  }

  if (dateLike instanceof Date) {
    return Number.isNaN(dateLike.getTime()) ? null : dateLike;
  }

  if (typeof dateLike === 'object' && typeof dateLike.toDate === 'function') {
    const parsed = dateLike.toDate();
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof dateLike === 'string' || typeof dateLike === 'number') {
    const parsed = new Date(dateLike);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed;
  }

  return null;
}

export function formatDateDDMMYYYY(dateLike: DateLike) {
  const date = toDate(dateLike);
  if (!date) {
    return '';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function formatDate(dateLike: DateLike) {
  return formatDateDDMMYYYY(dateLike);
}

export function parseDateDDMMYYYY(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const parsed = new Date(year, month - 1, day, 12, 0, 0, 0);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getDate() !== day ||
    parsed.getMonth() !== month - 1 ||
    parsed.getFullYear() !== year
  ) {
    return null;
  }

  return parsed;
}
