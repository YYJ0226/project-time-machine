import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { readPcmWav, encodePcmWav } from "./wav-info.mjs";

const root = new URL("../", import.meta.url);
const folder = new URL("public/audio/offline-v2/", root);
const output = new URL("opening.wav", folder);
const metadataPath = new URL("timing.json", folder);
if (existsSync(output) || existsSync(metadataPath))
  throw new Error(
    "Audio already prepared; existing files are never overwritten. Run checks instead.",
  );
const provenance = JSON.parse(
  readFileSync(new URL("provenance.json", folder), "utf8"),
);
const starts = [500, 4100, 9400];
if (provenance.segments.length !== starts.length)
  throw new Error("Expected three phrases");
const audio = provenance.segments.map((entry, index) => {
  if (entry.file !== `audio/offline-v2/phrase-0${index + 1}.wav`)
    throw new Error("Unexpected source path");
  const bytes = readFileSync(new URL(`public/${entry.file}`, root));
  if (createHash("sha256").update(bytes).digest("hex") !== entry.sha256)
    throw new Error("Source hash mismatch");
  return readPcmWav(bytes);
});
const sampleRate = audio[0].sampleRate;
const pcm = Buffer.alloc(sampleRate * 2 * 15);
const segments = audio.map((wav, index) => {
  if (wav.sampleRate !== sampleRate || wav.peak === 0)
    throw new Error("Inconsistent or silent source");
  const startMs = starts[index];
  const endMs = startMs + wav.durationMs;
  if (endMs > (starts[index + 1] ?? 14500))
    throw new Error("Phrase would overlap or be truncated");
  wav.pcm.copy(pcm, Math.round((startMs * sampleRate) / 1000) * 2);
  return {
    text: provenance.segments[index].text,
    startMs,
    endMs,
    timestampMs: null,
    confidence: null,
    pageBreakAfter: true,
  };
});
const bytes = encodePcmWav(pcm, sampleRate);
writeFileSync(output, bytes, { flag: "wx" });
writeFileSync(
  metadataPath,
  JSON.stringify(
    {
      durationMs: 15000,
      sampleRate,
      provider: provenance.provider,
      finalVoiceAccepted: false,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      segments,
    },
    null,
    2,
  ) + "\n",
  { flag: "wx" },
);
console.log(
  `Prepared 15-second offline scratch narration: ${fileURLToPath(output)}`,
);
