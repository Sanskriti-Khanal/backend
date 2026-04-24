type OtpAttemptState = {
  sendWindowStartedAtMs: number;
  sendCountInWindow: number;
  verifyFailCount: number;
  otpSessionExpiresAtMs: number;
};

const SEND_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_SEND_REQUESTS = 3;
const MAX_VERIFY_FAILURES = 3;
const OTP_SESSION_MS = 10 * 60 * 1000; // 10 minutes

/**
 * In-memory OTP anti-abuse tracker.
 * Resets on process restart; sufficient for single-instance deployments.
 */
export class OtpAttemptTrackerService {
  private readonly state = new Map<string, OtpAttemptState>();

  canRequestOtp(phoneKey: string): { allowed: boolean; retryAfterSec: number } {
    const now = Date.now();
    const entry = this.state.get(phoneKey);
    if (!entry) {
      return { allowed: true, retryAfterSec: 0 };
    }

    if (now - entry.sendWindowStartedAtMs >= SEND_WINDOW_MS) {
      return { allowed: true, retryAfterSec: 0 };
    }

    if (entry.sendCountInWindow >= MAX_SEND_REQUESTS) {
      const waitMs = SEND_WINDOW_MS - (now - entry.sendWindowStartedAtMs);
      return { allowed: false, retryAfterSec: Math.max(1, Math.ceil(waitMs / 1000)) };
    }

    return { allowed: true, retryAfterSec: 0 };
  }

  recordOtpSent(phoneKey: string): void {
    const now = Date.now();
    const entry = this.state.get(phoneKey);
    if (!entry || now - entry.sendWindowStartedAtMs >= SEND_WINDOW_MS) {
      this.state.set(phoneKey, {
        sendWindowStartedAtMs: now,
        sendCountInWindow: 1,
        verifyFailCount: 0,
        otpSessionExpiresAtMs: now + OTP_SESSION_MS,
      });
      return;
    }

    entry.sendCountInWindow += 1;
    entry.verifyFailCount = 0;
    entry.otpSessionExpiresAtMs = now + OTP_SESSION_MS;
    this.state.set(phoneKey, entry);
  }

  canVerifyOtp(phoneKey: string): { allowed: boolean } {
    const now = Date.now();
    const entry = this.state.get(phoneKey);
    if (!entry) {
      return { allowed: true };
    }

    if (now >= entry.otpSessionExpiresAtMs) {
      entry.verifyFailCount = 0;
      this.state.set(phoneKey, entry);
      return { allowed: true };
    }

    return { allowed: entry.verifyFailCount < MAX_VERIFY_FAILURES };
  }

  recordVerifyFailure(phoneKey: string): { exhausted: boolean; attemptsLeft: number } {
    const now = Date.now();
    const entry = this.state.get(phoneKey) ?? {
      sendWindowStartedAtMs: now,
      sendCountInWindow: 0,
      verifyFailCount: 0,
      otpSessionExpiresAtMs: now + OTP_SESSION_MS,
    };

    if (now >= entry.otpSessionExpiresAtMs) {
      entry.verifyFailCount = 0;
      entry.otpSessionExpiresAtMs = now + OTP_SESSION_MS;
    }

    entry.verifyFailCount += 1;
    this.state.set(phoneKey, entry);

    const exhausted = entry.verifyFailCount >= MAX_VERIFY_FAILURES;
    return {
      exhausted,
      attemptsLeft: Math.max(0, MAX_VERIFY_FAILURES - entry.verifyFailCount),
    };
  }

  clearVerifyFailures(phoneKey: string): void {
    const entry = this.state.get(phoneKey);
    if (!entry) {
      return;
    }
    entry.verifyFailCount = 0;
    this.state.set(phoneKey, entry);
  }
}

