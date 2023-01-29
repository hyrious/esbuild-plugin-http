import { fetch } from "../src/fetch";

let cache = new Map();
await fetch("https://cdn.jsdelivr.net/npm/react@18.2.0/index.js", null, cache);

// JsDelivr has 304 cache, it should be very fast in the second try
console.log(cache);
