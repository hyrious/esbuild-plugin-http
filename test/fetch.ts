import { fetch } from "../src/fetch";

let cache = new Map();
let content = await fetch("https://esm.sh/react", null, cache);

console.log(cache, new TextDecoder().decode(content as Uint8Array));
