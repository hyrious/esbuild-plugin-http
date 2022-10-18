import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/index.ts"],
  format: ["cjs", "esm"],
  sourcemap: true,
  clean: true,
  platform: "node",
  target: ["node14.18", "node16"],
  dts: true,
  treeshake: true,
});
