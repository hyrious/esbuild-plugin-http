import { build } from "esbuild";
import { default_schemes, http } from "../src";

build({
  entryPoints: ["esm:react"],
  bundle: true,
  plugins: [
    http({
      schemes: default_schemes,
      onfetch(url) {
        console.log("fetching", url);
      },
    }),
  ],
  outfile: "node_modules/.cache/dist.js",
  logLevel: "info",
}).catch(() => process.exit(1));
