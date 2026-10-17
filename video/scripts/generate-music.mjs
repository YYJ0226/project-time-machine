// Original deterministic synth sketch. No samples, external assets or API calls.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { encodePcmWav } from "./wav-info.mjs";

const folder = new URL("../public/audio/music-v1/", import.meta.url);
const output = new URL("evidence-pulse.wav", folder);
const provenance = new URL("provenance.json", folder);
if (existsSync(output) || existsSync(provenance))
  throw new Error("Music take already exists; nothing will be overwritten.");
const sampleRate = 44100;
const durationSeconds = 15;
const bpm = 128;
const beatSeconds = 60 / bpm;
const samples = new Float64Array(sampleRate * durationSeconds);
let seed = 117;
const noise = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 2147483648 - 1;
};
const noteHz = (midi) => 440 * 2 ** ((midi - 69) / 12);
const add = (start, duration, tone) => {
  const offset = Math.round(start * sampleRate);
  const length = Math.min(
    Math.ceil(duration * sampleRate),
    samples.length - offset,
  );
  for (let i = 0; i < length; i++) samples[offset + i] += tone(i / sampleRate);
};
const chords = [
  [52, 55, 59],
  [48, 52, 55],
  [43, 47, 50],
  [50, 54, 57],
];
for (let beat = 0; beat < 32; beat++) {
  const start = beat * beatSeconds;
  const chord = chords[Math.floor(beat / 8)];
  add(
    start,
    0.3,
    (t) =>
      0.22 *
      Math.exp(-t * 20) *
      Math.sin(2 * Math.PI * (48 * t + 4 * (1 - Math.exp(-t * 30)))),
  );
  add(
    start,
    0.44,
    (t) =>
      0.1 *
      Math.sin(2 * Math.PI * noteHz(chord[0] - 12) * t) *
      Math.exp(-t * 7),
  );
  for (let half = 0; half < 2; half++) {
    add(
      start + (half * beatSeconds) / 2,
      0.055,
      (t) => 0.022 * noise() * Math.exp(-t * 85),
    );
    const frequency = noteHz(chord[(beat + half) % 3] + 12);
    add(
      start + (half * beatSeconds) / 2,
      0.5,
      (t) =>
        0.047 *
        (Math.sin(2 * Math.PI * frequency * t) +
          0.2 * Math.sin(4 * Math.PI * frequency * t)) *
        Math.min(t / 0.012, 1) *
        Math.exp(-t * 9),
    );
  }
}
for (let section = 0; section < 4; section++) {
  for (const note of chords[section]) {
    add(section * 8 * beatSeconds, 8 * beatSeconds, (t) => {
      const duration = 8 * beatSeconds;
      const envelope = Math.min(t / 0.4, 1, (duration - t) / 0.6);
      return (
        0.027 * Math.sin(2 * Math.PI * noteHz(note) * t) * Math.max(0, envelope)
      );
    });
  }
}
let peak = 0;
for (let i = 0; i < samples.length; i++) {
  const t = i / sampleRate;
  samples[i] *= Math.max(0, Math.min(t / 0.35, 1, (durationSeconds - t) / 1.1));
  peak = Math.max(peak, Math.abs(samples[i]));
}
const pcm = Buffer.alloc(samples.length * 2);
for (let i = 0; i < samples.length; i++)
  pcm.writeInt16LE(Math.round((samples[i] / peak) * 0.58 * 32767), i * 2);
const wav = encodePcmWav(pcm, sampleRate);
mkdirSync(folder, { recursive: true });
writeFileSync(output, wav, { flag: "wx" });
writeFileSync(
  provenance,
  JSON.stringify(
    {
      title: "Evidence Pulse",
      purpose: "15-second no-narration concept audition",
      composition:
        "Original code-authored synthesizer sketch; no existing song intentionally reproduced",
      samplesUsed: false,
      externalAssets: false,
      networkCalls: 0,
      paidCalls: 0,
      bpm,
      beats: 32,
      durationSeconds,
      sampleRate,
      channels: 1,
      seed: 117,
      sha256: createHash("sha256").update(wav).digest("hex"),
    },
    null,
    2,
  ) + "\n",
  { flag: "wx" },
);
console.log(
  "Generated Evidence Pulse: 15s / 128 BPM / no speech, samples or network calls",
);
