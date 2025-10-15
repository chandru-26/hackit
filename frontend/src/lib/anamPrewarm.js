// Lightweight prewarm helper for Anam: fetch a session and import the SDK once per browser session
let prewarmed = false;
export function prewarmAnamOnce() {
  if (prewarmed) return;
  prewarmed = true;
  try {
    // warm the session
    fetch('/api/anam/session', { method: 'POST' }).catch(() => null);
    // start loading the SDK
    import('https://esm.sh/@anam-ai/js-sdk@latest').catch(() => null);
  } catch (e) {
    // ignore
  }
}
