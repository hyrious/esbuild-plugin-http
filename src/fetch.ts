import type { Agent } from 'http';
import { tmpdir } from 'os'
import { join } from 'path'
import makeFetchHappen, { FetchOptions } from 'make-fetch-happen'

function noop() {}

const cachePath = /* @__PURE__ */ join(/* @__PURE__ */tmpdir(), '@hyrious/esbuild-plugin-http-cache')

export type Response = Awaited<ReturnType<typeof makeFetchHappen>>

export async function fetch(
  url: string,
  agent: Agent | null,
  cache: Map<string, string | Uint8Array>,
  fetchOptions?: FetchOptions,
  onfetch: (url: string) => void = noop
): Promise<{ response: Response | null, body: string | Uint8Array }> {
  let body = cache.get(url);
  if (body) return { response: null, body };

  const options: FetchOptions = { cachePath, ...fetchOptions }
  if (agent) options.agent = agent

  onfetch(url)
  const response = await makeFetchHappen(url, options)
  body = new Uint8Array(await response.arrayBuffer())

  cache.set(url, body);

  return { response, body };
}
