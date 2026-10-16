export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const proxy =
    process.env.https_proxy || process.env.HTTPS_PROXY ||
    process.env.http_proxy || process.env.HTTP_PROXY;

  if (proxy) {
    const { EnvHttpProxyAgent, RetryAgent, setGlobalDispatcher } = await import("undici");

    const agent = new EnvHttpProxyAgent({
      noProxy: process.env.no_proxy ?? process.env.NO_PROXY ?? "localhost,127.0.0.1,::1",
    });

    setGlobalDispatcher(new RetryAgent(agent, {
      // A proxy can reset an idle connection. Retry reads, never OAuth codes or writes.
      methods: ["GET", "HEAD"],
      maxRetries: 2,
      minTimeout: 300,
      maxTimeout: 1500,
      statusCodes: [429, 502, 503, 504],
    }));
  }
}
