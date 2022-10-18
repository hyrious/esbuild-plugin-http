import type { Loader, Plugin } from "esbuild";
import type { Agent } from "http";

import { make_regex } from "./scheme";
import { fetch } from "./fetch";

export interface HttpPluginOptions {
  /** Return `true` to filter in paths to be handled by this plugin. */
  filter?: RegExp | ((url: string) => boolean);
  /** Custom http.Agent. */
  agent?: Agent | null;
  /** Custom url scheme, example: `{ unpkg: 'https://unpkg.com/?module' }`. */
  schemes?: Record<string, string>;
  /** Cache request results. */
  cache?: Map<string, string | Uint8Array>;
  /** onfetch(console.log) */
  onfetch?: (url: string) => void;
}

/** https://esbuild.github.io/plugins/#http-plugin */
export function http({
  filter,
  agent = null,
  schemes = {},
  cache = new Map(),
  onfetch,
}: HttpPluginOptions = {}): Plugin {
  return {
    name: "http",
    setup({ onResolve, onLoad }) {
      let scheme_filter: RegExp | undefined;
      let scheme_keys = Object.keys(schemes);
      if (scheme_keys.length > 0) {
        scheme_filter = make_regex(scheme_keys);
      }

      let filter_func =
        filter === undefined
          ? function (url: string) {
              return true;
            }
          : typeof filter === "function"
          ? filter
          : function (url: string) {
              return filter.test(url);
            };

      let ext_to_loader: Record<string, Loader> = {
        ".js": "js",
        ".mjs": "js",
        ".cjs": "js",
        ".jsx": "jsx",
        ".ts": "ts",
        ".cts": "ts",
        ".mts": "ts",
        ".tsx": "tsx",
        ".css": "css",
        ".json": "json",
        ".txt": "text",
      };

      if (scheme_filter) {
        onResolve({ filter: scheme_filter }, ({ path }) => {
          // ! must can find because it has been matched by regex
          let key = scheme_keys.find((prefix) => path.startsWith(prefix + ":"))!;
          let prefix = schemes![key as any];
          let search = "";
          let idx = prefix.indexOf("?");
          if (idx !== -1) {
            search = prefix.slice(idx);
            prefix = prefix.slice(0, idx);
          }
          let url = prefix + path.slice(key.length + 1) + search;
          if (filter_func(url)) {
            return { path: url, namespace: "http-url" };
          }
        });
      }

      onResolve({ filter: /^https?:\/\// }, (args) => {
        if (filter_func(args.path)) {
          return { path: args.path, namespace: "http-url" };
        }
      });

      onResolve({ filter: /.*/, namespace: "http-url" }, (args) => ({
        path: new URL(args.path, args.importer).toString(),
        namespace: "http-url",
      }));

      onLoad({ filter: /.*/, namespace: "http-url" }, async (args) => {
        let loader: Loader = "js";
        let idx = args.path.lastIndexOf(".");
        if (idx !== -1) {
          let ext = args.path.slice(idx);
          loader = ext_to_loader[ext] || loader;
        }
        let contents = await fetch(args.path, agent, cache, onfetch);
        return { contents, loader };
      });
    },
  };
}

export const default_schemes: Record<string, string> = {
  unpkg: "https://unpkg.com/?module",
  jsdelivr: "https://esm.run/",
  esm: "https://esm.sh/?bundle",
};
