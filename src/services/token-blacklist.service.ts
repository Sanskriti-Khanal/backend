/**
 * In-memory token blacklist for logout/session invalidation.
 * When a user logs out, their token is added here; auth middleware rejects blacklisted tokens.
 * Note: Blacklist is cleared on server restart. For production at scale, use Redis.
 */
const blacklist = new Set<string>();

export function addToBlacklist(token: string): void {
  blacklist.add(token);
}

export function isBlacklisted(token: string): boolean {
  return blacklist.has(token);
}
