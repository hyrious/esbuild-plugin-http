import type { Agent } from 'http';
import { tmpdir } from 'os'
import { join } from 'path'
import makeFetchHappen, { FetchOptions } from 'make-fetch-happen'

function noop() {}

const cachePath = /* @__PURE__ */ join(/* @__PURE__ */tmpdir(), '@hyrious/esbuild-plugin-http-cache')

export async function fetch(
  url: string,
  agent: Agent | null,
  cache: Map<string, string | Uint8Array>,
  onfetch: (url: string) => void = noop
): Promise<string | Uint8Array> {
  let contents = cache.get(url);
  if (contents) return contents;

  const options: FetchOptions = { cachePath }
  if (agent) options.agent = agent

  onfetch(url)
  contents = await makeFetchHappen(url, options).then(r => r.text())

  cache.set(url, contents!);

  return contents!;
}
