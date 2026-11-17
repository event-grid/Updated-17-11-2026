import { storeVersion } from "@/lib/store";

/**
 * Live updates (Server-Sent Events). Sends the current data version when a page connects and again whenever a provider is added or edited in any of the three
 * websites, so open pages can refresh themselves. Prototype: it watches the shared development file.
 */
const POLL_MS = 1000;
const HEARTBEAT_MS = 20_000;

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      let last = await storeVersion();
      let quiet = 0;
      const send = (text: string) => {
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          stop();
        }
      };
      const stop = () => {
        if (timer) clearInterval(timer);
        timer = undefined;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      send("retry: 3000\n\n");
      send(`event: version\ndata: ${last}\n\n`);
      timer = setInterval(async () => {
        const now = await storeVersion();
        if (now !== last) {
          last = now;
          quiet = 0;
          send(`event: version\ndata: ${now}\n\n`);
        } else if ((quiet += POLL_MS) >= HEARTBEAT_MS) {
          quiet = 0;
          send(": keep-alive\n\n");
        }
      }, POLL_MS);
      request.signal.addEventListener("abort", stop);
    },
    cancel() {
      if (timer) clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
