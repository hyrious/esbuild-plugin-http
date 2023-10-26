## @hyrious/esbuild-plugin-http

The [HTTP plugin](https://esbuild.github.io/plugins/#http-plugin) as a standalone package.

## Usage

```js
import { http } from "@hyrious/esbuild-plugin-http";
import { build } from "esbuild";

build({
  entryPoints: ["main.js"],
  bundle: true,
  plugins: [http()],
}).catch(() => process.exit(1));
```

Or, with [@hyrious/esbuild-dev](https://github.com/hyrious/esbuild-dev):

```bash
$ esbuild-dev -p:@hyrious/esbuild-plugin-http main.ts
```

### Options

```js
http({
  filter: (url) => true,
  agent: null,
  schemes: {},
  cache: new Map(),
  onfetch: (url) => void 0,
  fetchOptions: {},
  onload: () => void 0,
});
```

- `filter` {RegExp|Function} Filter **in** URLs to be handled by this plugin. If the regex does not match, or the function returns `false`, the URL will be ignored.
- `agent` {Object} The [agent](https://nodejs.org/api/http.html#http_class_http_agent) to use for HTTP requests.
- `schemes` {Object} A map of custom schemes for shorter URL. For example, if you set it as `{ unpkg: 'https://unpkg.com/' }`, then `import "unpkg:react"` will be resolved to `https://unpkg.com/react`. More details see [schemes](#schemes).
- `cache` {Map&lang;String,String|Uint8Array&rang;} A map of `url -> contents` which can be reused during incremental or watch builds.
- `onfetch` {Function} A callback function that will be called before fetching each URL.
- `fetchOptions` {Object} Options passed to [`make-fetch-happen`](https://github.com/npm/make-fetch-happen).
- `onload` {Function} A callback function to customize the `onLoad` hooks of esbuild.

### Proxying

You can use [`hpagent`](https://github.com/delvedor/hpagent) to apply `http_proxy` in your environment:

```js
import { HttpProxyAgent } from "hpagent";

http({
  agent: new HttpProxyAgent({ proxy: process.env.http_proxy }),
});
```

Or, use [`global-agent`](https://github.com/gajus/global-agent) to configure a global proxy for all requests.

### Schemes

The custom schemes works by replacing prefixes in the import path, for example:

```js
const schemes = {
  unpkg: "https://unpkg.com/", // <- trailing '/'
};
```

is equivalent to:

```js
let url = args.path;
if (args.path.startsWith("unpkg:")) {
  url = "https://unpkg.com/" + args.path.slice("unpkg:".length);
}
```

Note that search params will be preserved to the end of the url,
which means you can write this instead:

```js
const schemes = {
  unpkg: "https://unpkg.com/?module",
};
```

This package includes some common schemes but does not use them by default,
you can import them when needed:

```js
import { http, default_schemes } from "@hyrious/esbuild-plugin-http";

console.log(default_schemes);
// => {
//   unpkg: 'https://unpkg.com/?module',
//   jsdelivr: 'https://esm.run/',
//   esm: 'https://esm.sh/?bundle'
// }

http({
  schemes: default_schemes,
});
```

### Caching

By default this plugin does not cache any requests, esbuild does cache contents
for the same resource path, so it won't request the same url more than once
during one build.

If you want to do some basic caching during watch builds, you can pass in a
map object to the `cache` option:

```js
let cacheMap = new Map();
// cacheMap stores { url => contents }, you can easily persist it in file system

http({
  cache: cacheMap,
});

// in another build...
// create a new plugin instance with the same cache
http({
  cache: cacheMap,
});
```

A bit more details: the keys of the cache map is the url that are **not** resolved,
which means if you're importing `"https://esm.sh/react"`, the key will just be
`"https://esm.sh/react"` instead of something like `"https://esm.sh/react@18.2.0"`.

The [schemes](#schemes) transformation is done before the cache lookup,
so the following URLs share the same cache:

```js
import "esm:react";
import "https://esm.sh/react";
```

### Custom Loader

By default this plugin uses `loader: "default"` in the `onLoad` hooks of esbuild,
which means it relies on the url to have a correct file extension to determine
the loader. If you want to use a custom loader, you can either use the
[`loader`](https://esbuild.github.io/api/#loader) option in esbuild for static extensions,
or use the `onload` option in this plugin to handle it by yourself.

```js
http({
  onload(url, contents) {
    if (!extname(url) && is_env_node(contents)) {
      return { contents, loader: 'js' }
    }
  }
})

function is_env_node(a) {
  if (typeof a === 'string')
    return a.startsWith('#!/usr/bin/env node')
  if (Object.prototype.toString.call(a) === '[object Uint8Array]') 
    return is_env_node(new TextDecoder().decode(a.subarray(0, 20)))
}
```

## Develop

Run [`npm link`](https://docs.npmjs.com/cli/v8/commands/npm-link) at
the root of this repo to create a symlink in your global node_modules.
This way, you can directly import this package from a global module (like the
`esbuild-dev` usage mentioned above).

When you're done, run `npm r -g @hyrious/esbuild-plugin-http` to remove it from
the global node_modules.

## Changelog

### 0.1.5

Add `fetchOptions` and `onload` options.

### 0.1.2

Use [make-fetch-happen](https://github.com/npm/make-fetch-happen) to make HTTP cache happy.

## License

MIT @ [hyrious](https://github.com/hyrious)
