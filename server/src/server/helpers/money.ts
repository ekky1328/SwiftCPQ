export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(amount: number): number {
  return amount / 100;
}
