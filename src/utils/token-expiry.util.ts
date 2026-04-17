/**
 * Parse JWT-style expiresIn strings (e.g. 15m, 7d) to milliseconds.
 * Falls back to 15 minutes if the format is unrecognized.
 */
export function parseExpiresInToMs(expiresIn: string): number {
  const s = expiresIn.trim();
  const match = /^(\d+)\s*(seconds?|s|minutes?|m|hours?|h|days?|d|weeks?|w|years?|y)$/i.exec(s);
  if (!match) {
    return 15 * 60 * 1000;
  }
  const n = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  if (unit.startsWith('s')) return n * 1000;
  if (unit.startsWith('m')) return n * 60 * 1000;
  if (unit.startsWith('h')) return n * 60 * 60 * 1000;
  if (unit.startsWith('d')) return n * 24 * 60 * 60 * 1000;
  if (unit.startsWith('w')) return n * 7 * 24 * 60 * 60 * 1000;
  if (unit.startsWith('y')) return n * 365.25 * 24 * 60 * 60 * 1000;
  return n * 60 * 1000;
}
