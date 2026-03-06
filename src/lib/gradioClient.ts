import { Client } from '@gradio/client';

// Singleton Gradio client — reused across all messages to avoid
// re-establishing the WebSocket on every send (saves ~1-2s per message)
let clientPromise: Promise<Client> | null = null;

export function getGradioClient(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = Client.connect('Spoidermon29/lms-ai-assistant').catch((err) => {
      // Reset so next attempt retries a fresh connection
      clientPromise = null;
      throw err;
    }) as Promise<Client>;
  }
  return clientPromise;
}

/** Call this on ChatbotPage mount to pre-warm the connection eagerly */
export function warmGradioClient(): void {
  getGradioClient().catch(() => {
    // Ignore — will retry when the user actually sends a message
  });
}
