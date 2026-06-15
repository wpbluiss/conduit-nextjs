// Post-build: stamp public/sw.js with the Next.js BUILD_ID so each deploy
// gets a unique cache key, causing old caches to be purged on activate.
import { readFileSync, writeFileSync } from "fs";

try {
  const buildId = readFileSync(".next/BUILD_ID", "utf8").trim();
  const sw = readFileSync("public/sw.js", "utf8");
  const stamped = sw.replace("praxis-BUILD_STAMP", `praxis-${buildId}`);
  writeFileSync("public/sw.js", stamped);
  console.log(`[stamp-sw] Cache key: praxis-${buildId}`);
} catch (err) {
  // Non-fatal — dev builds don't have .next/BUILD_ID; the placeholder
  // string is a valid (if ugly) cache name that still works correctly.
  console.warn("[stamp-sw] Could not stamp sw.js:", err.message);
}
