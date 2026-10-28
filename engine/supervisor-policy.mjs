// Supervisor policy, pure: decide on respawn and how long to wait.
// The backoff sequence ships as a default and is parameterized — the
// policy hardcodes nothing about the child itself.

export const DEFAULT_BACKOFF = [100, 1000, 5000, 30000];

export function decideRespawn({ shuttingDown }) {
  return !shuttingDown;
}

export function nextDelay(attempt, backoff = DEFAULT_BACKOFF) {
  const i = Math.max(0, attempt);
  return backoff[Math.min(i, backoff.length - 1)];
}