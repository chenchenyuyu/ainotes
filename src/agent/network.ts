import { execFileSync } from "node:child_process";

import { EnvHttpProxyAgent, setGlobalDispatcher } from "undici";

type ProxyResolution = {
  source: "environment" | "macOS";
  url: string;
};

function resolveProxy(): ProxyResolution | undefined {
  const environmentProxy =
    process.env.OPENAI_PROXY_URL ??
    process.env.HTTPS_PROXY ??
    process.env.https_proxy ??
    process.env.HTTP_PROXY ??
    process.env.http_proxy;
  if (environmentProxy) {
    return { source: "environment", url: environmentProxy };
  }

  if (process.platform !== "darwin") return undefined;

  try {
    const configuration = execFileSync("scutil", ["--proxy"], {
      encoding: "utf8",
      timeout: 1_000,
    });
    if (!/HTTPSEnable\s*:\s*1/u.test(configuration)) return undefined;

    const host = configuration.match(/HTTPSProxy\s*:\s*(\S+)/u)?.[1];
    const port = configuration.match(/HTTPSPort\s*:\s*(\d+)/u)?.[1];
    if (!host || !port) return undefined;
    return { source: "macOS", url: `http://${host}:${port}` };
  } catch {
    return undefined;
  }
}

const globalState = globalThis as typeof globalThis & {
  __aiNotesProxyURL?: string;
};

const proxy = resolveProxy();
if (proxy && globalState.__aiNotesProxyURL !== proxy.url) {
  process.env.HTTP_PROXY = proxy.url;
  process.env.HTTPS_PROXY = proxy.url;
  process.env.NO_PROXY ??= "localhost,127.0.0.1";
  setGlobalDispatcher(
    new EnvHttpProxyAgent({
      httpProxy: proxy.url,
      httpsProxy: proxy.url,
      noProxy: process.env.NO_PROXY,
    }),
  );
  globalState.__aiNotesProxyURL = proxy.url;
}
