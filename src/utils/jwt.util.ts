/**
 * Normalize PEM key from env (e.g. Vercel stores with literal \n).
 * - Replaces escaped \\n with real newlines.
 * - Fixes single-line .env pastes where BEGIN/END headers are glued to base64
 *   (required for RS256: Node/jsonwebtoken expect a real newline after BEGIN and before END).
 */
export function normalizePemFromEnv(pem: string): string {
  if (typeof pem !== 'string') return pem;
  let s = pem.replace(/\\n/g, '\n').trim();
  // Missing newline immediately after BEGIN line (e.g. ...BEGIN...-----MII...)
  s = s.replace(/(-----BEGIN [A-Z0-9 -]+-----)([^\r\n])/g, '$1\n$2');
  // Missing newline before END line (e.g. ...Ikg=-----END...)
  s = s.replace(/([A-Za-z0-9+/=])(-----END [A-Z0-9 -]+-----)/g, '$1\n$2');
  return s.trim();
}
