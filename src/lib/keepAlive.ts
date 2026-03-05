/**
 * keepAlive.ts
 * Periodically pings the Render backend to prevent the free-tier instance
 * from spinning down due to inactivity (Render spins down after ~15 minutes).
 * We ping every 14 minutes to stay safely under that threshold.
 */

const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes
// Re-uses the existing /api/health endpoint – no extra backend route needed
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
const PING_URL = `${BASE_URL}/api/health`;

let intervalId: ReturnType<typeof setInterval> | null = null;

async function ping() {
  try {
    await fetch(PING_URL, { method: 'GET' });
  } catch {
    // Silently ignore – the server might be waking up or offline temporarily
  }
}

/**
 * Start the keep-alive pinger.
 * Sends an immediate ping on startup, then repeats every PING_INTERVAL_MS.
 * Safe to call multiple times – only one interval will run at a time.
 */
export function startKeepAlive() {
  if (intervalId !== null) return; // already running

  // Fire immediately so the server is warm on first load
  ping();

  intervalId = setInterval(ping, PING_INTERVAL_MS);
}

/**
 * Stop the keep-alive pinger (useful for tests or cleanup).
 */
export function stopKeepAlive() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
