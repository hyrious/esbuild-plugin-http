import { get as http_get, RequestOptions, Agent } from "http";
import { get as https_get } from "https";

export async function fetch(
  url: string,
  agent: Agent | null,
  cache: Map<string, string | Uint8Array>,
  onfetch: (url: string) => void = function noop() {}
): Promise<string | Uint8Array> {
  let contents = cache.get(url);
  if (contents) return contents;

  let options: RequestOptions = agent ? { agent } : {};
  contents = await new Promise<string | Uint8Array>((resolve, reject) => {
    function fetch_recur() {
      onfetch(url);
      let get = url.startsWith("https") ? https_get : http_get;
      let req = get(url, options, (res) => {
        if (([301, 302, 307] as Array<number | undefined>).includes(res.statusCode)) {
          url = new URL(res.headers.location!, url).toString();
          fetch_recur();
          req.destroy();
        } else if (res.statusCode === 200) {
          let chunks: Uint8Array[] = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => resolve(Buffer.concat(chunks)));
        } else {
          reject(new Error(`GET ${url} failed: status ${res.statusCode}`));
        }
      }).on("error", reject);
    }
    fetch_recur();
  });
  cache.set(url, contents);

  return contents;
}
