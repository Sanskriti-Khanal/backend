/**
 * Normalize PEM key from env (e.g. Vercel stores with literal \n).
 * Replaces escaped newlines with real newlines so jsonwebtoken can parse.
 */
export function normalizePemFromEnv(pem: string): string {
  if (typeof pem !== 'string') return pem;
  return pem.replace(/\\n/g, '\n').trim();
}
