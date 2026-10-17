import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const target = new URL("../artifacts/course-music/", import.meta.url);
const audioPath = new URL("we-never-remix-3443610299.mp3", target);
const manifestPath = new URL("source.json", target);
if (existsSync(audioPath) || existsSync(manifestPath)) {
  throw new Error("Course music already exists; nothing will be overwritten.");
}
const url = "https://music.163.com/song/media/outer/url?id=3443610299.mp3";
const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
const finalUrl = new URL(response.url);
if (!response.ok || !finalUrl.hostname.endsWith(".music.126.net") || !response.headers.get("content-type")?.startsWith("audio/")) {
  throw new Error(`Public music unavailable (${response.status}); do not bypass access restrictions.`);
}
const maximumBytes = 12 * 1024 * 1024;
const chunks = [];
let bytesRead = 0;
for await (const chunk of response.body) {
  bytesRead += chunk.length;
  if (bytesRead > maximumBytes) throw new Error("Audio exceeds the size limit");
  chunks.push(chunk);
}
const bytes = Buffer.concat(chunks);
if (bytes.length < 100000) throw new Error("Audio payload unexpectedly small");
mkdirSync(target, { recursive: true });
writeFileSync(audioPath, bytes, { flag: "wx" });
writeFileSync(manifestPath, JSON.stringify({
  title: "We Never (Remix)", creditedArtist: "我无记忆", userVersionNote: "若如初见",
  songId: "3443610299", sourcePage: "https://music.163.com/song?id=3443610299",
  access: "public provider audio endpoint, without cookies or credentials",
  retrievedAt: new Date().toISOString(), bytes: bytes.length,
  sha256: createHash("sha256").update(bytes).digest("hex"),
  publicRedistributionPermission: "not_reviewed", trackedInGit: false,
}, null, 2) + "\n", { flag: "wx" });
console.log(`Saved requested music locally (${bytes.length} bytes): ${fileURLToPath(audioPath)}`);
