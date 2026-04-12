/** Returns Math.round(v) for any finite number; returns 0 for NaN, Infinity, null, or undefined */
export function safeRound(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
}
